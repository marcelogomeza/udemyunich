<?php
require __DIR__ . '/config.php';

header('Content-Type: text/plain; charset=utf-8');

echo "PHP OK\n\n";

try {
    $pdo = get_pdo();
    $stmt = $pdo->query("SELECT COUNT(*) AS users FROM users");
    $row = $stmt->fetch();
    echo "Usuarios en tabla users: " . ($row['users'] ?? 0) . "\n";
} catch (Throwable $e) {
    echo "Error DB: " . $e->getMessage() . "\n";
}
