<?php
// backend/config.php

declare(strict_types=1);

// Ajusta tu zona horaria
date_default_timezone_set('America/Mexico_City');

/**
 * CONFIGURACIÓN BASE DE DATOS
 * ---------------------------
 * Crea antes la BD con database.sql
 */

define('DB_HOST', ${{MySQL.MYSQLHOST}});
define('DB_NAME', ${{MySQL.MYSQL_DATABASE}});
define('DB_USER', 'root');
define('DB_PASS', ${{MySQL.MYSQL_ROOT_PASSWORD}});
define('DB_CHARSET', 'utf8mb4')

/**
define('DB_HOST', 'metro.proxy.rlwy.net:28567');
define('DB_NAME', 'ascensus_db');
define('DB_USER', 'root');
define('DB_PASS', 'rpdBMwwHcUxllKzzNZNOfOMYYvaFoyQI');
define('DB_CHARSET', 'utf8mb4');
 */

/**
 * CONFIGURACIÓN UDEMY BUSINESS
 * ----------------------------
 * Sustituye los valores por los de tu cuenta.
 * Importante: no subas este archivo a GitHub.
 */
define('UDEMY_SUBDOMAIN', 'unich');  // nombre de cuenta/subdominio
define('UDEMY_ORG_ID', 403457);      // ID de cuenta/organización

// Pega aquí TUS credenciales reales
define('UDEMY_CLIENT_ID',    'FW9dc6eSqr5ilPhcnyFTiB6sIcgjF479ZPdI6t2r');
define('UDEMY_CLIENT_SECRET','D5yMYzQsDwmIocv2F0eyRgPIiVOrfsLF74e9AExW573VY8zYnI0GSMNZL5ntYNsduu7pCVYA5DDch80HjXecreynvZWgW3oIfO4bcNBO3rfyzm5CE0O8sK9EKjGHFNZW');

/**
 * Conexión PDO compartida
 */
function get_pdo(): PDO {
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}

/**
 * Llamada GET a la API de Udemy Business (Reporting / Analytics)
 * Usa autenticación Basic con client_id:client_secret
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
    // Si lo sirves desde el mismo dominio no es estrictamente necesario:
    header('Access-Control-Allow-Origin: *');

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}






