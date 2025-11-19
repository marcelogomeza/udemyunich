<?php
// backend/sync.php

declare(strict_types=1);

require __DIR__ . '/config.php';

$pdo = get_pdo();

try {
    $summary = sync_user_paths($pdo);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Sincronización completada.\n";
    echo "Paths actualizados: {$summary['paths']}\n";
    echo "Usuarios actualizados: {$summary['users']}\n";
    echo "Relaciones path-usuario actualizadas: {$summary['path_users']}\n";
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Error en la sincronización: " . $e->getMessage() . "\n";
}

/**
 * Sincroniza datos de la API de Udemy en tablas:
 *  - paths
 *  - users
 *  - path_users
 *
 * NOTA: usamos sólo user-path-activity (nivel agregado por path).
 * Para detalle por curso se puede extender más adelante.
 */
function sync_user_paths(PDO $pdo): array
{
    $pathsUpdated      = 0;
    $usersUpdated      = 0;
    $pathUsersUpdated  = 0;

    // Endpoint basado en el que ya has usado en Node:
    // /api-2.0/organizations/{ORG_ID}/analytics/user-path-activity/
    $endpoint   = "/api-2.0/organizations/" . UDEMY_ORG_ID . "/analytics/user-path-activity/";
    $params     = ['page_size' => 100];
    $pageNumber = 1;

    // Preparar statements (reutilizamos para rendimiento)
    $stmtUser = $pdo->prepare("
        INSERT INTO users (email, name, last_activity)
        VALUES (:email, :name, :last_activity)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            last_activity = GREATEST(COALESCE(last_activity, '1970-01-01'), VALUES(last_activity)),
            updated_at = CURRENT_TIMESTAMP
    ");

    $stmtPath = $pdo->prepare("
        INSERT INTO paths (id, title, total_courses)
        VALUES (:id, :title, :total_courses)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            total_courses = COALESCE(VALUES(total_courses), total_courses),
            updated_at = CURRENT_TIMESTAMP
    ");

    $stmtPathUser = $pdo->prepare("
        INSERT INTO path_users (path_id, user_email, total_progress, courses_completed, courses_in_progress, last_activity)
        VALUES (:path_id, :email, :total_progress, :completed, :in_progress, :last_activity)
        ON DUPLICATE KEY UPDATE
            total_progress = VALUES(total_progress),
            courses_completed = VALUES(courses_completed),
            courses_in_progress = VALUES(courses_in_progress),
            last_activity = GREATEST(COALESCE(last_activity, '1970-01-01'), VALUES(last_activity)),
            updated_at = CURRENT_TIMESTAMP
    ");

    do {
        $data = udemy_get($endpoint, $params);

        if (!isset($data['results']) || !is_array($data['results'])) {
            break;
        }

        foreach ($data['results'] as $row) {
            /**
             * OJO:
             * La estructura exacta del JSON de Udemy puede variar.
             * Aquí hago un mapeo "defensivo" usando varios nombres
             * posibles de campos. Si algo no macha, sólo hay que
             * ajustar estos índices.
             */

            // Datos de path
            $pathId = $row['path_id']              ?? $row['path']['id']       ?? null;
            $pathTitle = $row['path_title']        ?? $row['path']['title']    ?? ($row['path_name'] ?? null);
            $pathTotalCourses = $row['path_items'] ?? $row['path']['items']    ?? null;

            // Datos de usuario
            $email = $row['user_email']            ?? $row['user']['email']    ?? $row['email'] ?? null;
            $name  = $row['user_name']             ?? $row['user']['name']     ?? $row['user']['display_name'] ?? $row['name'] ?? 'Usuario';

            // Estadísticas
            $ratio = $row['ratio']                 ?? $row['progress']         ?? 0;
            if ($ratio <= 1) {
                // Udemy suele devolver ratio 0–1, lo pasamos a porcentaje
                $ratio = $ratio * 100;
            }

            $completedItems  = $row['completed_items']   ?? $row['items_completed']   ?? 0;
            $inProgressItems = $row['in_progress_items'] ?? $row['items_in_progress'] ?? 0;

            $lastActivity = $row['last_activity']        ?? $row['last_activity_at']  ?? null;

            if (!$pathId || !$email) {
                // Si faltan campos clave, saltamos
                continue;
            }

            // Normalizar fecha a formato DATETIME
            if ($lastActivity) {
                // Si viene como ISO 8601 lo convertimos
                $ts = strtotime($lastActivity);
                if ($ts !== false) {
                    $lastActivity = date('Y-m-d H:i:s', $ts);
                }
            }

            // Upsert PATH
            $stmtPath->execute([
                ':id'            => $pathId,
                ':title'         => $pathTitle ?? ('Path #' . $pathId),
                ':total_courses' => $pathTotalCourses,
            ]);
            $pathsUpdated++;

            // Upsert USER
            $stmtUser->execute([
                ':email'         => $email,
                ':name'          => $name,
                ':last_activity' => $lastActivity,
            ]);
            $usersUpdated++;

            // Upsert PATH_USERS
            $stmtPathUser->execute([
                ':path_id'       => $pathId,
                ':email'         => $email,
                ':total_progress'=> $ratio,
                ':completed'     => $completedItems,
                ':in_progress'   => $inProgressItems,
                ':last_activity' => $lastActivity,
            ]);
            $pathUsersUpdated++;
        }

        // Paginación: API suele devolver campo "next" con la URL de la siguiente página
        if (!empty($data['next'])) {
            $nextUrl = $data['next'];
            $parsed  = parse_url($nextUrl);
            $endpoint = $parsed['path'] ?? $endpoint;
            $params   = [];
            if (!empty($parsed['query'])) {
                parse_str($parsed['query'], $params);
            }
            $pageNumber++;
        } else {
            // Sin más páginas
            break;
        }
    } while ($pageNumber < 50); // hard-limit anti-bucle

    return [
        'paths'      => $pathsUpdated,
        'users'      => $usersUpdated,
        'path_users' => $pathUsersUpdated,
    ];
}
