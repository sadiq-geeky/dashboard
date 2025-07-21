-- Database setup for CRM Dashboard
-- Run these commands in your MySQL database

USE setcrmuis;

-- Your existing recording_heartbeat table (as mentioned in your requirements)
-- CREATE TABLE IF NOT EXISTS `recording_heartbeat` (
--   `uuid` varchar(250) NOT NULL,
--   `ip_address` varchar(45) NOT NULL,
--   `created_on` datetime DEFAULT CURRENT_TIMESTAMP,
--   PRIMARY KEY (`uuid`, `created_on`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Your existing recording_history table (as mentioned in your requirements)
-- CREATE TABLE IF NOT EXISTS `recording_history` (
--   `id` varchar(250) NOT NULL,
--   `cnic` varchar(45) DEFAULT NULL,
--   `start_time` datetime DEFAULT NULL,
--   `end_time` datetime DEFAULT NULL,
--   `file_name` varchar(250) DEFAULT NULL,
--   `CREATED_ON` datetime DEFAULT NULL,
--   `ip_address` varchar(45) DEFAULT NULL,
--   PRIMARY KEY (`id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Additional table for device name mapping (NEW)
CREATE TABLE IF NOT EXISTS `device_mappings` (
  `id` varchar(50) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `device_name` varchar(255) NOT NULL,
  `created_on` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ip` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Sample data for testing (optional)
INSERT IGNORE INTO `device_mappings` (`id`, `ip_address`, `device_name`) VALUES
('dev_1', '192.168.1.101', 'Reception Camera'),
('dev_2', '192.168.1.102', 'Main Hall Recorder'),
('dev_3', '192.168.1.103', 'Security Camera 1');

-- Sample heartbeat data for testing (optional)
INSERT IGNORE INTO `recording_heartbeat` (`uuid`, `ip_address`, `created_on`) VALUES
('device-001', '192.168.1.101', NOW() - INTERVAL 2 MINUTE),
('device-002', '192.168.1.102', NOW() - INTERVAL 8 MINUTE),
('device-003', '192.168.1.103', NOW() - INTERVAL 17 MINUTE);

-- Sample recording data for testing (optional)
INSERT IGNORE INTO `recording_history` (`id`, `cnic`, `start_time`, `end_time`, `file_name`, `CREATED_ON`, `ip_address`) VALUES
('rec-001', '12345-6789012-3', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY + INTERVAL 45 MINUTE, 'recording_001.mp4', NOW() - INTERVAL 2 DAY, '192.168.1.101'),
('rec-002', '98765-4321098-7', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 30 MINUTE, 'recording_002.mp4', NOW() - INTERVAL 1 DAY, '192.168.1.102'),
('rec-003', '11111-2222233-4', NOW() - INTERVAL 2 HOUR, NULL, 'recording_003.mp4', NOW() - INTERVAL 2 HOUR, '192.168.1.103');
