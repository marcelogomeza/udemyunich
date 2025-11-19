<?php
// backend/api.php

declare(strict_types=1);

require __DIR__ . '/config.php';

$pdo    = get_pdo();
$action = $_GET['action'] ?? '';

try {
    switch ($action) {

        case 'get_paths':
            $paths = api_get_paths($pdo);
            json_response($paths);
            break;

        case 'get_path_users':
            $pathId = isset($_GET['path_id']) ? (int) $_GET['path_id'] : 0;
            if ($pathId <= 0) {
                json_response(['error' => 'Parámetro path_id es obligatorio'], 400);
            }
            $users = api_get_path_users($pdo, $pathId);
            json_response($users);
            break;

        case 'get_user_stats':
            $email  = $_GET['email']   ?? '';
            $pathId = isset($_GET['path_id']) ? (int) $_GET['path_id'] : 0;

            if (!$email) {
                json_response(['error' => 'Parámetro email es obligatorio'], 400);
            }
            $data = api_get_user_stats($pdo, $email, $pathId);
            json_response($data);
            break;

        default:
            json_response(['error' => 'Acción no soportada'], 400);
    }

} catch (Throwable $e) {
    error_log('API error: ' . $e->getMessage());
    json_response(['error' => 'Error interno del servidor'], 500);
}

/**
 * Devuelve listado de paths para el selector del Admin.
 * Estructura compatible con interfaz LearningPath del front.
 */
function api_get_paths(PDO $pdo): array
{
    $sql = "SELECT id, title, COALESCE(total_courses, 0) AS total_courses, COALESCE(description, '') AS description
            FROM paths
            ORDER BY title";

    $stmt = $pdo->query($sql);

    $paths = [];
    while ($row = $stmt->fetch()) {
        $paths[] = [
            'id'           => (int) $row['id'],
            'title'        => $row['title'],
            'totalCourses' => (int) $row['total_courses'],
            // De momento no enviamos cursos reales; el front no los usa aquí
            'courses'      => [],
            'description'  => $row['description'],
        ];
    }

    return $paths;
}

/**
 * Devuelve usuarios de un path con sus stats agregadas.
 * La respuesta se ajusta a lo que espera AdminDashboard:
 *  - user.name
 *  - user.email
 *  - user.stats.totalProgress / lastActivity / coursesCompleted / coursesInProgress
 */
function api_get_path_users(PDO $pdo, int $pathId): array
{
    $sql = "SELECT 
                u.email,
                u.name,
                pu.total_progress,
                pu.last_activity,
                pu.courses_completed,
                pu.courses_in_progress
            FROM path_users pu
            INNER JOIN users u ON u.email = pu.user_email
            WHERE pu.path_id = :path_id
            ORDER BY pu.total_progress DESC, u.name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':path_id' => $pathId]);

    $users = [];
    while ($row = $stmt->fetch()) {
        $lastActivity = $row['last_activity']
            ? date('Y-m-d', strtotime($row['last_activity']))
            : '-';

        $users[] = [
            'email' => $row['email'],
            'name'  => $row['name'],
            'stats' => [
                'totalProgress'    => (float) $row['total_progress'],
                'lastActivity'     => $lastActivity,
                'coursesCompleted' => (int) $row['courses_completed'],
                'coursesInProgress'=> (int) $row['courses_in_progress'],
            ],
        ];
    }

    return $users;
}

/**
 * Devuelve la ficha de un usuario + stats para un path concreto.
 * Estructura compatible con getUserDetails() del front.
 *
 * Por ahora no devolvemos path_courses (detalle por curso),
 * así que el front usará los MOCK_PATHS como fallback para la lista
 * de cursos, pero las estadísticas serán reales.
 */
function api_get_user_stats(PDO $pdo, string $email, int $pathId = 0): array
{
    // Datos básicos del usuario
    $stmt = $pdo->prepare("SELECT email, name, last_activity FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if (!$user) {
        // Podrías devolver 404, pero para el front es más cómodo así:
        return [
            'email'       => $email,
            'name'        => $email,
            'enrolledPaths' => [],
            'stats'       => [
                'totalProgress'    => 0,
                'lastActivity'     => '-',
                'coursesCompleted' => 0,
                'coursesInProgress'=> 0,
            ],
            'path_courses' => [],
        ];
    }

    // Paths donde está inscrito el usuario
    $stmt = $pdo->prepare("SELECT path_id FROM path_users WHERE user_email = :email");
    $stmt->execute([':email' => $email]);
    $paths = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $enrolledPaths = array_map('intval', $paths);

    // Stats del path seleccionado (si se proporcionó pathId)
    $stats = [
        'totalProgress'    => 0,
        'lastActivity'     => $user['last_activity'] ? date('Y-m-d', strtotime($user['last_activity'])) : '-',
        'coursesCompleted' => 0,
        'coursesInProgress'=> 0,
    ];

    if ($pathId > 0) {
        $stmt = $pdo->prepare("
            SELECT total_progress, last_activity, courses_completed, courses_in_progress
            FROM path_users
            WHERE user_email = :email AND path_id = :path_id
            LIMIT 1
        ");
        $stmt->execute([
            ':email'   => $email,
            ':path_id' => $pathId,
        ]);
        $row = $stmt->fetch();

        if ($row) {
            $stats['totalProgress']     = (float) $row['total_progress'];
            $stats['lastActivity']      = $row['last_activity']
                                            ? date('Y-m-d', strtotime($row['last_activity']))
                                            : $stats['lastActivity'];
            $stats['coursesCompleted']  = (int) $row['courses_completed'];
            $stats['coursesInProgress'] = (int) $row['courses_in_progress'];
        }
    }

    return [
        'email'        => $user['email'],
        'name'         => $user['name'],
        'enrolledPaths'=> $enrolledPaths,
        'stats'        => $stats,
        // De momento vacío: el front rellena cursos con MOCK_PATHS
        'path_courses' => [],
    ];
}
