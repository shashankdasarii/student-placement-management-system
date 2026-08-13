-- ============================================================
-- Student Placement Management System - Database Schema (Phase 2)
-- ============================================================

-- Create database if it doesn't already exist
CREATE DATABASE IF NOT EXISTS placement_db;
USE placement_db;

-- Disable foreign key checks while dropping tables for a clean setup
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS recruiters;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- Table 1: users
-- Stores authentication & role details for all user types
-- ------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'recruiter', 'admin') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table 2: students
-- Stores profile details for student users
-- ------------------------------------------------------------
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    cgpa DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    branch VARCHAR(50) NOT NULL,
    resume_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table 3: recruiters
-- Stores profile & company details for recruiter users
-- ------------------------------------------------------------
CREATE TABLE recruiters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    company_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recruiters_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table 4: jobs
-- Stores job postings created by recruiters
-- ------------------------------------------------------------
CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    min_cgpa DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    deadline DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jobs_recruiter 
        FOREIGN KEY (company_id) REFERENCES recruiters(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table 5: applications
-- Stores job applications submitted by students
-- ------------------------------------------------------------
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    job_id INT NOT NULL,
    status ENUM('Applied', 'Shortlisted', 'Interviewing', 'Accepted', 'Rejected') NOT NULL DEFAULT 'Applied',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_applications_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_applications_job 
        FOREIGN KEY (job_id) REFERENCES jobs(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT unique_student_job_application 
        UNIQUE (student_id, job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Optional Sample Seed Data for Testing
-- ============================================================

-- Insert sample users (Passwords are mock hashes for demonstration)
INSERT INTO users (username, password, role) VALUES
('john_student', '$2a$10$wE13...samplehashstudent', 'student'),
('techcorp_hr', '$2a$10$wE13...samplehashrecruiter', 'recruiter'),
('admin_user', '$2a$10$wE13...samplehashadmin', 'admin');

-- Insert sample student linked to user_id = 1
INSERT INTO students (user_id, name, email, cgpa, branch, resume_url) VALUES
(1, 'John Doe', 'john.doe@example.com', 8.75, 'Computer Science', 'https://example.com/resumes/john_doe.pdf');

-- Insert sample recruiter linked to user_id = 2
INSERT INTO recruiters (user_id, company_name) VALUES
(2, 'TechCorp Solutions');

-- Insert sample job linked to company_id = 1
INSERT INTO jobs (company_id, title, description, min_cgpa, deadline) VALUES
(1, 'Software Engineer - Frontend', 'Build modern web applications with React and Node.js.', 7.50, '2026-12-31 23:59:59');

-- Insert sample job application (student_id = 1 applied to job_id = 1)
INSERT INTO applications (student_id, job_id, status) VALUES
(1, 1, 'Applied');
