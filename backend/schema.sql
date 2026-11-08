-- WorkerCare database schema (MySQL 8+)
-- Run once in MySQL Workbench or the MySQL command line.
CREATE DATABASE IF NOT EXISTS workercare
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE workercare;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('supervisor','family','worker') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sites (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  address VARCHAR(255),
  created_by BIGINT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sites_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS workers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED UNIQUE,
  worker_code VARCHAR(40) NOT NULL UNIQUE,
  worker_type ENUM('construction','street_vendor','other') NOT NULL,
  phone VARCHAR(30),
  emergency_contact_name VARCHAR(120),
  emergency_contact_phone VARCHAR(30),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_workers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS worker_assignments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  worker_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  assignment_role ENUM('supervisor','family') NOT NULL,
  site_id BIGINT UNSIGNED,
  can_view_history BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_worker_user_role (worker_id, user_id, assignment_role),
  CONSTRAINT fk_assignment_worker FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS devices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  worker_id BIGINT UNSIGNED NOT NULL,
  device_code VARCHAR(60) NOT NULL UNIQUE,
  firmware_version VARCHAR(40),
  last_seen_at DATETIME,
  battery_percent TINYINT UNSIGNED,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_device_battery CHECK (battery_percent IS NULL OR battery_percent <= 100),
  CONSTRAINT fk_devices_worker FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sensor_readings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_id BIGINT UNSIGNED NOT NULL,
  ambient_temperature_c DECIMAL(5,2),
  relative_humidity_percent DECIMAL(5,2),
  acceleration_x DECIMAL(9,4),
  acceleration_y DECIMAL(9,4),
  acceleration_z DECIMAL(9,4),
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_readings_device_time (device_id, recorded_at),
  CONSTRAINT chk_humidity CHECK (relative_humidity_percent IS NULL OR relative_humidity_percent BETWEEN 0 AND 100),
  CONSTRAINT fk_readings_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  worker_id BIGINT UNSIGNED NOT NULL,
  device_id BIGINT UNSIGNED,
  alert_type ENUM('sos','heat','fall','inactivity','device','reminder','other') NOT NULL,
  severity ENUM('info','warning','critical') NOT NULL DEFAULT 'warning',
  message VARCHAR(500) NOT NULL,
  status ENUM('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
  triggered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acknowledged_by BIGINT UNSIGNED,
  acknowledged_at DATETIME,
  resolved_at DATETIME,
  INDEX idx_alerts_worker_time (worker_id, triggered_at),
  CONSTRAINT fk_alerts_worker FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
  CONSTRAINT fk_alerts_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL,
  CONSTRAINT fk_alerts_ack_user FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS break_schedules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  worker_id BIGINT UNSIGNED NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  break_type ENUM('hydration','lunch','rest','custom') NOT NULL,
  label VARCHAR(100) NOT NULL,
  interval_minutes SMALLINT UNSIGNED,
  scheduled_time TIME,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_break_worker FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
  CONSTRAINT fk_break_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS worker_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  worker_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('login','sos','fall','heat_warning','break_reminder','status_change','device_update','other') NOT NULL,
  description VARCHAR(500) NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_history_worker_time (worker_id, recorded_at),
  CONSTRAINT fk_history_worker FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
) ENGINE=InnoDB;
