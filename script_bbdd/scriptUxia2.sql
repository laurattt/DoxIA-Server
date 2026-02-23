-- SCRIPT BBDD UXIA2

CREATE DATABASE uxiaG2;

CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  nickname VARCHAR(100) DEFAULT 'nicknameUser' ,
  email VARCHAR(255) DEFAULT 'user@example.com',
  telefon VARCHAR(20) DEFAULT '604556677',
  password VARCHAR(255), -- pa admins 
  validat BOOLEAN DEFAULT FALSE,
  role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
  api_key VARCHAR(255) UNIQUE, -- token de acceso 
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE requests (
  request_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  prompt TEXT NOT NULL,
  model VARCHAR(100) DEFAULT 'qwen2.5vl:7b',
  stream BOOLEAN DEFAULT FALSE,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  processing_time FLOAT, -- en segundos
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE images (
  image_id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL,
  image_base64 LONGTEXT NOT NULL, -- o ruta (?)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(request_id)
);

CREATE TABLE responses (
  response_id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL,
  description TEXT,
  tags JSON, -- array de tags en format JSON
  model_used VARCHAR(100),
  processing_time FLOAT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(request_id)
);

CREATE TABLE sms (
  id_sms INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  telefon INT,
  sms INT,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);