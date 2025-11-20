<?php
// backend/config.php
declare(strict_types=1);

date_default_timezone_set('America/Mexico_City');

/**
 * Helper sencillo para leer variables de entorno
 */
function envv(string $key, $default = null) {
    $v = getenv($key);
    return $v === false ? $default : $v;
}

/* ============================================================
 *  UDEMY BUSINESS
 * ============================================================ */

define('UDEMY_SUBDOMAIN', 'unich');   // portal/subdominio
define('UDEMY_ORG_ID', 403457);       // Account / Organization ID

// Variables compartidas en Railway
define('UDEMY_CLIENT_ID',     envv('UDEMY_CLIENT_ID_CONS', ''));
define('UDEMY_CLIENT_SECRET', envv('UDEMY_CLIENT_SECRET_CONST', ''));

/* ============================================================
 *  BASE DE DATOS (Railway MySQL)
 *  Vars: MYSQL_DATABASE, MYSQL_ROOT_PASSWORD, MYSQL_URL, MYSQLHOST
 * ============================================================ */

$mysqlDatabase     = envv('MYSQL_DATABASE', 'ascensus_db');
$mysqlRootPassword = envv('MYSQL_ROOT_PASSWORD', '');
$mysqlHost         = envv('MYSQLHOST', '127.0.0.1');
$mysqlUrl          = envv('MYSQL_URL', null);

// Valores por defecto
$dbHost = $mysqlHost;
$dbPort = 3306;
$dbUser = 'root';
$dbPass = $mysqlRootPassword;
$dbName = $mysqlDatabase;

// Si existe MYSQL_URL, tiene prioridad
if ($mysqlUrl) {
    $parts = parse_url($mysqlUrl);
    if ($parts !== false) {
        if (!empty($parts['host'])) $dbHost = $parts['host'];
        if (!empty($parts['port'])) $dbPort = (int) $parts['port'];
        if (!empty($parts['user'])) $dbUser = $parts['user'];
        if (!empty($parts['pass'])) $dbPass = $parts['pass'];
        if (!empty($parts['path']) && $parts['path'] !== '/') {
            $dbName = ltrim($parts['path'], '/');
        }
    }
}

define('DB_HOST', $dbHost);
define('DB_PORT', $dbPort);
define('DB_NAME', $dbName);
define('DB_USER', $dbUser);
define('DB_PASS', $dbPass);
define('DB_CHARSET', 'utf8mb4');

/**
 * Conexión PDO compartida
 */
function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $port = DB_PORT ? ';port=' . DB_PORT : '';
    $dsn  = 'mysql:host=' . DB_HOST . $port . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;

    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}

/**
 * Llamada GET a la API de Udemy Business (Reporting)
 */
function udemy_get(string $endpoint, array $params = []): array
{
    $base  = 'https://' . UDEMY_SUBDOMAIN . '.udemy.com';
    $query = $params ? ('?' . http_build_query($params)) : '';
    $url   = $base . $endpoint . $query;

    $ch = curl_init($url);
    if (!$ch) {
        throw new RuntimeException('No se pudo inicializar curl');
    }

    $headers = [
        'Accept: application/json',
        'Authorization: Basic ' . base64_encode(UDEMY_CLIENT_ID . ':' . UDEMY_CLIENT_SECRET),
    ];

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 45,
    ]);

    $body = curl_exec($ch);
    if ($body === false) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new RuntimeException('Error en llamada a Udemy: ' . $error);
    }

    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    $data = json_decode($body, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('Respuesta Udemy no es JSON válido: ' . json_last_error_msg());
        throw new RuntimeException('Respuesta Udemy inválida');
    }

    if ($status < 200 || $status >= 300) {
        error_log("Udemy API error {$status} para {$url}: " . substr($body, 0, 500));
        throw new RuntimeException("Udemy API devolvió código {$status}");
    }

    return $data;
}

/**
 * Helper para respuestas JSON
 */
function json_response($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
