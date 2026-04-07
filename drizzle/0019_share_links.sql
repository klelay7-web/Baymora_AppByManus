CREATE TABLE IF NOT EXISTS shareLinks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(64) NOT NULL UNIQUE,
  type ENUM('trip', 'offer', 'destination') NOT NULL DEFAULT 'trip',
  resourceId INT NOT NULL,
  userId INT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  coverImage VARCHAR(512),
  viewCount INT DEFAULT 0,
  expiresAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_userId (userId)
);
