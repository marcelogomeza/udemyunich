<?php
require __DIR__.'/config.php';
try {
  $pdo = get_pdo();
  echo "OK DB\n";
} catch (Throwable $e) {
  echo "DB ERROR: ".$e->getMessage();
}