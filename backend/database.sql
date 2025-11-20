-- backend/database.sql

CREATE DATABASE IF NOT EXISTS ascensus_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ascensus_db;

-- Usuarios (referenciados por email)
CREATE TABLE IF NOT EXISTS users (
  email         VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  last_activity DATETIME NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vías / Paths
CREATE TABLE IF NOT EXISTS paths (
  id            BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT NULL,
  total_courses INT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relación usuario <-> path con estadísticas agregadas
CREATE TABLE IF NOT EXISTS path_users (
  path_id             BIGINT UNSIGNED NOT NULL,
  user_email          VARCHAR(255) NOT NULL,
  total_progress      DECIMAL(5,2) NOT NULL DEFAULT 0.00,   -- 0–100
  courses_completed   INT UNSIGNED NOT NULL DEFAULT 0,
  courses_in_progress INT UNSIGNED NOT NULL DEFAULT 0,
  last_activity       DATETIME NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (path_id, user_email),
  KEY idx_path_users_email (user_email),
  CONSTRAINT fk_path_users_path
    FOREIGN KEY (path_id) REFERENCES paths (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_path_users_user
    FOREIGN KEY (user_email) REFERENCES users (email)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
