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
 * Sincroniza datos de Udemy Business en:
 *  - paths
 *  - users
 *  - path_users
 *
 * Usa el endpoint /analytics/user-path-activity/
 */
function sync_user_paths(PDO $pdo): array
{
    $pathsUpdated     = 0;
    $usersUpdated     = 0;
    $pathUsersUpdated = 0;

    $endpoint   = "/api-2.0/organizations/" . UDEMY_ORG_ID . "/analytics/user-path-activity/";
    $params     = ['page_size' => 100];
    $pageNumber = 1;

    // Preparar statements
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
            // Mapear campos posibles (la estructura puede variar un poco entre cuentas)
            $pathId          = $row['path_id']              ?? $row['path']['id']       ?? null;
            $pathTitle       = $row['path_title']           ?? $row['path']['title']    ?? ($row['path_name'] ?? null);
            $pathTotalSteps  = $row['path_total_steps']     ?? $row['path_items']       ?? null;

            $email           = $row['user_email']           ?? $row['email']            ?? ($row['user']['email'] ?? null);
            $userFirstName   = $row['user_first_name']      ?? $row['first_name']       ?? null;
            $userLastName    = $row['user_last_name']       ?? $row['last_name']        ?? null;
            $userName        = trim(($userFirstName ?? '') . ' ' . ($userLastName ?? '')) ?: ($row['user_name'] ?? $row['name'] ?? $email ?? 'Usuario');

            // Ratio 0–1 o 0–100
            $ratio           = $row['ratio']                ?? $row['progress']         ?? 0;
            if ($ratio <= 1) {
                $ratio = $ratio * 100;
            }

            $completedItems  = $row['completed_items']      ?? $row['items_completed']   ?? ($row['completed_steps'] ?? 0);
            $inProgressItems = $row['in_progress_items']    ?? $row['items_in_progress'] ?? ($row['started_steps'] ?? 0);

            $lastActivity    = $row['last_activity']        ?? $row['last_activity_at'] ?? ($row['path_last_activity'] ?? null);

            if (!$pathId || !$email) {
                continue;
            }

            if ($lastActivity) {
                $ts = strtotime($lastActivity);
                if ($ts !== false) {
                    $lastActivity = date('Y-m-d H:i:s', $ts);
                } else {
                    $lastActivity = null;
                }
            }

            // Upsert PATH
            $stmtPath->execute([
                ':id'            => $pathId,
                ':title'         => $pathTitle ?? ('Path #' . $pathId),
                ':total_courses' => $pathTotalSteps,
            ]);
            $pathsUpdated++;

            // Upsert USER
            $stmtUser->execute([
                ':email'         => $email,
                ':name'          => $userName,
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

        // Paginación
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
            break;
        }

    } while ($pageNumber < 50);

    return [
        'paths'      => $pathsUpdated,
        'users'      => $usersUpdated,
        'path_users' => $pathUsersUpdated,
    ];
}
