-- MySQL dump 10.13  Distrib 9.7.1, for macos26.6 (arm64)
--
-- Host: localhost    Database: placement_db
-- ------------------------------------------------------
-- Server version	9.7.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `job_id` int NOT NULL,
  `status` enum('Applied','Shortlisted','Interviewing','Accepted','Rejected') NOT NULL DEFAULT 'Applied',
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_job_application` (`student_id`,`job_id`),
  KEY `fk_applications_job` (`job_id`),
  CONSTRAINT `fk_applications_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_applications_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
INSERT INTO `applications` VALUES (1,1,1,'Applied','2026-08-13 09:13:13'),(2,2,2,'Accepted','2026-08-13 09:28:22'),(3,5,4,'Applied','2026-08-18 06:29:54'),(4,5,5,'Accepted','2026-08-18 06:35:07');
/*!40000 ALTER TABLE `applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `min_cgpa` decimal(3,2) NOT NULL DEFAULT '0.00',
  `deadline` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_jobs_recruiter` (`company_id`),
  CONSTRAINT `fk_jobs_recruiter` FOREIGN KEY (`company_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
INSERT INTO `jobs` VALUES (1,1,'Software Engineer - Frontend','Build modern web applications with React and Node.js.',7.50,'2026-12-31 23:59:59','2026-08-13 09:13:13'),(2,2,'Full Stack Software Engineer','Build scalable backend microservices and modern React components.',8.00,'2026-12-31 18:29:59','2026-08-13 09:28:06'),(3,2,'AI Systems Research Scientist','Design novel deep learning models for high-throughput distributed systems.',9.50,'2026-12-31 18:29:59','2026-08-13 09:28:06'),(4,2,'Associate Software Engineer','Develop full-stack web applications and APIs using React, Node.js, and SQL.',7.00,'2026-12-31 18:29:59','2026-08-18 06:27:26'),(5,3,'Graduate Software Engineer','Work on modern React frontend interfaces, Node.js backend services, and relational MySQL schemas.',7.00,'2026-12-12 10:30:00','2026-08-18 06:34:26'),(6,3,'Frontend Engineer','Build responsive web interfaces using React and modern CSS.',7.00,'2026-10-21 00:00:00','2026-08-18 08:12:29');
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recruiters`
--

DROP TABLE IF EXISTS `recruiters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recruiters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `company_name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_recruiters_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recruiters`
--

LOCK TABLES `recruiters` WRITE;
/*!40000 ALTER TABLE `recruiters` DISABLE KEYS */;
INSERT INTO `recruiters` VALUES (1,2,'TechCorp Solutions','2026-08-13 09:13:13'),(2,5,'Google','2026-08-13 09:21:01'),(3,9,'Vishnu Tech','2026-08-18 06:31:40');
/*!40000 ALTER TABLE `recruiters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `cgpa` decimal(3,2) NOT NULL DEFAULT '0.00',
  `branch` varchar(50) NOT NULL,
  `resume_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,1,'John Doe','john.doe@example.com',8.75,'Computer Science','https://example.com/resumes/john_doe.pdf','2026-08-13 09:13:13'),(2,4,'Alex Smith','alex.smith@example.com',9.10,'Computer Science','http://localhost:5001/uploads/resumes/resume-user4-1786613643887-232558491.pdf','2026-08-13 09:20:18'),(3,6,'Shashank','shashankdasari.it@gmail.com',8.00,'Information Technology',NULL,'2026-08-13 09:41:44'),(4,7,'Shashank Dasari','24pa5a1207@vishnu.edu.in',7.34,'Information Technology',NULL,'2026-08-18 06:16:03'),(5,8,'Shashank Dasari1','sasichow9999@gmail.com',7.34,'Information Technology','http://localhost:5001/uploads/resumes/resume-user8-1787034576117-942866477.pdf','2026-08-18 06:21:17');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','recruiter','admin') NOT NULL DEFAULT 'student',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'john_student','$2a$10$wE13...samplehashstudent','student','2026-08-13 09:13:13'),(2,'techcorp_hr','$2a$10$wE13...samplehashrecruiter','recruiter','2026-08-13 09:13:13'),(3,'admin_user','$2a$10$wE13...samplehashadmin','admin','2026-08-13 09:13:13'),(4,'alex_student','$2b$10$zoAlbeP5fNZLA/yqz1ScB.Q0/RSyZ/4zgGbt/6HW37zzRx.MX9cq6','student','2026-08-13 09:20:18'),(5,'google_recruiter','$2b$10$olT9riKx80PPSxW9m.JjTOJV8cuBy/JlJAhDs0wlO4Uy6VFdnpyj6','recruiter','2026-08-13 09:21:01'),(6,'Sasi','$2b$10$PDpur4TAmzTR8gBvJgmAAOKrv/MlMNkhW7/NT9o9kIDENvvBU5f.G','student','2026-08-13 09:41:44'),(7,'Shashank ','$2b$10$PHy3WWdBJX.O0BATP24r8.QVca45QezhhyzovNKyp/d0pblDTtKt2','student','2026-08-18 06:16:03'),(8,'Shashank123','$2b$10$4sWdzBCsguwKN5HeydUa5eUI9.67KhfQXRJA7/We55BNI1O1FezVO','student','2026-08-18 06:21:17'),(9,'Shashank','$2b$10$0J0qamQWuCaMlcfn4MHrQ.k22ecOI/qNFbwpDW79ybTC0lbt3MEpW','recruiter','2026-08-18 06:31:40');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-18 14:52:48
