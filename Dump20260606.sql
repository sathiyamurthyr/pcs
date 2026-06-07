-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: pooja_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_messages`
--

DROP TABLE IF EXISTS `admin_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `user_type` enum('member','guest') DEFAULT 'member',
  `user_name` varchar(100) DEFAULT NULL,
  `user_mobile` varchar(15) DEFAULT NULL,
  `user_email` varchar(100) DEFAULT NULL,
  `message` text NOT NULL,
  `admin_reply` text,
  `status` enum('unread','read','replied') DEFAULT 'unread',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `replied_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `user_mobile` (`user_mobile`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_messages`
--

LOCK TABLES `admin_messages` WRITE;
/*!40000 ALTER TABLE `admin_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'admin',
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (1,'admin','admin123',NULL,'super_admin',1,'2026-06-04 21:45:01','2026-05-27 16:15:58');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `service_type` varchar(100) DEFAULT NULL,
  `appointment_date` date DEFAULT NULL,
  `preferred_time` varchar(50) DEFAULT NULL,
  `address` text,
  `remarks` text,
  `status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_appointment_phone` (`phone`),
  KEY `idx_appointment_status` (`status`),
  KEY `idx_appointment_date` (`appointment_date`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `astrology_consultations`
--

DROP TABLE IF EXISTS `astrology_consultations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `astrology_consultations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `req_id` varchar(20) NOT NULL,
  `subject_name` varchar(100) NOT NULL,
  `gender` enum('male','female') DEFAULT 'male',
  `report_language` enum('tamil','english') DEFAULT 'english',
  `birth_date` date NOT NULL,
  `birth_time` time NOT NULL,
  `time_period` enum('standard','am','pm') DEFAULT 'standard',
  `birth_place` varchar(255) NOT NULL,
  `consultation_notes` text,
  `member_id` varchar(20) DEFAULT NULL,
  `status` enum('pending','scheduled','completed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `admin_viewed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `req_id` (`req_id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_req_id` (`req_id`),
  KEY `idx_status` (`status`),
  KEY `idx_birth_date` (`birth_date`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `astrology_consultations`
--

LOCK TABLES `astrology_consultations` WRITE;
/*!40000 ALTER TABLE `astrology_consultations` DISABLE KEYS */;
INSERT INTO `astrology_consultations` VALUES (1,'AST-2026-00001','dfdsfsd','male','english','2026-06-01','12:28:00','standard','chennai',NULL,'PJA0001','pending','2026-06-01 17:58:24','2026-06-01 17:58:24',0);
/*!40000 ALTER TABLE `astrology_consultations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `astrology_horoscope_matching`
--

DROP TABLE IF EXISTS `astrology_horoscope_matching`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `astrology_horoscope_matching` (
  `id` int NOT NULL AUTO_INCREMENT,
  `req_id` varchar(20) NOT NULL,
  `upload_remarks` text,
  `attachment_count` int DEFAULT '0',
  `attachment_filenames` json DEFAULT NULL,
  `member_id` varchar(20) DEFAULT NULL,
  `status` enum('pending','in_review','completed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `admin_viewed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `req_id` (`req_id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_req_id` (`req_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `astrology_horoscope_matching`
--

LOCK TABLES `astrology_horoscope_matching` WRITE;
/*!40000 ALTER TABLE `astrology_horoscope_matching` DISABLE KEYS */;
INSERT INTO `astrology_horoscope_matching` VALUES (1,'AST-2026-00001','good',1,'[\"AST-2026-00001+1.pdf\"]','PJA0001','pending','2026-06-01 18:02:01','2026-06-01 18:02:01',0);
/*!40000 ALTER TABLE `astrology_horoscope_matching` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `construction_projects`
--

DROP TABLE IF EXISTS `construction_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `construction_projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `req_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line1` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state_province` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_zip` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `completion_date` date NOT NULL,
  `project_budget` decimal(15,2) NOT NULL,
  `project_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','in_review','approved','in_progress','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `admin_viewed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `req_id` (`req_id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_req_id` (`req_id`),
  KEY `idx_status` (`status`),
  KEY `idx_start_date` (`start_date`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `construction_projects`
--

LOCK TABLES `construction_projects` WRITE;
/*!40000 ALTER TABLE `construction_projects` DISABLE KEYS */;
INSERT INTO `construction_projects` VALUES (1,'CON-2026-00001','home construction','No 3/66, Karumari Amman Kovil Street','Chinna Mathur','Chennai','Tamil Nadu','6000068','2026-06-15','2026-07-07',200000.00,'asdfgh','Selena Jazel','S','09786811197','PJA0001','pending','2026-06-01 15:33:40','2026-06-01 15:33:40',0),(2,'CON-2026-00002','home construction','No 3/66, Karumari Amman Kovil Street','Chinna Mathur','Chennai','Tamil Nadu','6000068','2026-06-04','2026-06-10',299998.00,'type as dfjsdfa','Selena Jazel','S','09786811197','PJA0001','pending','2026-06-02 14:58:17','2026-06-02 14:58:17',0),(3,'CON-2026-00003','mall construction','Thirumulaivoyal','Chinna Mathur','Chennai','Tamil Nadu','6000063','2026-06-03','2026-06-18',199998.00,'apple banana custerd ','Selena Jazel','Jenifa','09786811197','PJA0001','pending','2026-06-02 16:28:52','2026-06-02 16:28:52',0),(4,'CON-2026-00004','home construction','No 3/66, Karumari Amman Kovil Street','Chinna Mathur','Chennai','Tamil Nadu','6000068','2026-06-05','2027-04-08',349999.00,'Construct building with Provide blue print','Selena Jazel','S','09786811197','PJA0004','pending','2026-06-03 14:39:33','2026-06-03 14:39:33',0);
/*!40000 ALTER TABLE `construction_projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gallery`
--

DROP TABLE IF EXISTS `gallery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) DEFAULT NULL,
  `description` text,
  `image_url` varchar(500) NOT NULL,
  `category` enum('catering','astrology','wedding','matrimony','temple','construction') NOT NULL,
  `uploaded_by` int DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gallery`
--

LOCK TABLES `gallery` WRITE;
/*!40000 ALTER TABLE `gallery` DISABLE KEYS */;
INSERT INTO `gallery` VALUES (1,'LIG','Economy Food','/uploads/catering/1779953548845-938378717.jpg','catering',1,'2026-05-28 07:32:28'),(2,NULL,NULL,'/uploads/catering/1779957727608-404746343.jpg','catering',1,'2026-05-28 08:42:07'),(3,NULL,NULL,'/uploads/catering/1779957740750-870679371.jpg','catering',1,'2026-05-28 08:42:20'),(4,NULL,NULL,'/uploads/catering/1779957749461-489280315.jpg','catering',1,'2026-05-28 08:42:29'),(5,NULL,NULL,'/uploads/astrology/1779957802499-393597576.jpg','astrology',1,'2026-05-28 08:43:22'),(6,NULL,NULL,'/uploads/astrology/1779957809100-284662404.jpg','astrology',1,'2026-05-28 08:43:29'),(7,NULL,NULL,'/uploads/wedding/1779958202098-665590945.jpg','wedding',1,'2026-05-28 08:50:02'),(8,NULL,NULL,'/uploads/wedding/1779958214377-232174140.jpg','wedding',1,'2026-05-28 08:50:14'),(9,NULL,NULL,'/uploads/wedding/1779958224371-568279147.jpg','wedding',1,'2026-05-28 08:50:24'),(10,NULL,NULL,'/uploads/wedding/1779958232409-108711087.jpg','wedding',1,'2026-05-28 08:50:32'),(11,NULL,NULL,'/uploads/matrimony/1779958560169-978382998.jpg','matrimony',1,'2026-05-28 08:56:00'),(12,NULL,NULL,'/uploads/matrimony/1779958569454-555277638.jpg','matrimony',1,'2026-05-28 08:56:09'),(13,NULL,NULL,'/uploads/matrimony/1779958620349-657251818.jpg','matrimony',1,'2026-05-28 08:57:00'),(14,NULL,NULL,'/uploads/temple/1779959085353-670618242.jpg','temple',1,'2026-05-28 09:04:45'),(15,NULL,NULL,'/uploads/temple/1779959099320-70788034.jpg','temple',1,'2026-05-28 09:04:59'),(16,NULL,NULL,'/uploads/temple/1779959108570-274621844.jpg','temple',1,'2026-05-28 09:05:08'),(17,NULL,NULL,'/uploads/temple/1779959118057-257964145.jpg','temple',1,'2026-05-28 09:05:18'),(18,NULL,NULL,'/uploads/construction/1779960106401-127938049.jpg','construction',1,'2026-05-28 09:21:46'),(19,NULL,NULL,'/uploads/construction/1779960116721-217675249.jpg','construction',1,'2026-05-28 09:21:56'),(20,NULL,NULL,'/uploads/construction/1779960125387-877835270.jpg','construction',1,'2026-05-28 09:22:05');
/*!40000 ALTER TABLE `gallery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `general_enquiries`
--

DROP TABLE IF EXISTS `general_enquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `general_enquiries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `service_interest` varchar(100) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('new','read','replied') DEFAULT 'new',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_enquiry_phone` (`phone`),
  KEY `idx_enquiry_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `general_enquiries`
--

LOCK TABLES `general_enquiries` WRITE;
/*!40000 ALTER TABLE `general_enquiries` DISABLE KEYS */;
/*!40000 ALTER TABLE `general_enquiries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matrimony_profiles`
--

DROP TABLE IF EXISTS `matrimony_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matrimony_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `req_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_for` enum('bride','groom') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bride',
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dob` date NOT NULL,
  `marital_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `height` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `education` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profession` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `income` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_location` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `religion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caste` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `star` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rasi` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `family_details` text COLLATE utf8mb4_unicode_ci,
  `contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner_preferences` text COLLATE utf8mb4_unicode_ci,
  `photo_filename` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `horoscope_filename` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','pending') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `admin_viewed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `req_id` (`req_id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_req_id` (`req_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matrimony_profiles`
--

LOCK TABLES `matrimony_profiles` WRITE;
/*!40000 ALTER TABLE `matrimony_profiles` DISABLE KEYS */;
INSERT INTO `matrimony_profiles` VALUES (1,'MAT-2026-00001','bride','adsf','2026-06-10','Never Married','6.4','msc','developer','5 lpa','bangalore','hindu','Nadar',NULL,NULL,NULL,'1234564789','jenifa.bala9@gmail.com','matching','TEMP+1.jpg','TEMP+2.pdf','PJA0001','active','2026-05-30 13:10:42','2026-06-03 08:21:12',0),(2,'MAT-2026-00002','bride','Jenifa','2005-02-25','Never Married','5.4','mba','developer','5 lpa','bangalore','hindu','Nadar','hkjgkj','fdfd',NULL,'09786811197','jenifa.bala9@gmail.com',NULL,'MAT-2026-00002+1.jpg','MAT-2026-00002+2.pdf','PJA0004','active','2026-06-03 14:46:44','2026-06-03 14:46:44',0);
/*!40000 ALTER TABLE `matrimony_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `members`
--

DROP TABLE IF EXISTS `members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text,
  `member_id` varchar(20) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `payment_method` varchar(50) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `unread_messages` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile` (`mobile`),
  UNIQUE KEY `member_id` (`member_id`),
  KEY `idx_mobile` (`mobile`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `members`
--

LOCK TABLES `members` WRITE;
/*!40000 ALTER TABLE `members` DISABLE KEYS */;
INSERT INTO `members` VALUES (1,'Test User','9876543210','test123','test@email.com','Test Address','PJA0002','approved','UPI','2026-06-02 23:45:29','2026-05-28 03:15:46',0),(2,'Selena Jazel S','9786811197','pass@123','jenifa.bala9@gmail.com','No 3/66, Karumari Amman Kovil Street\nChinna Mathur','PJA0001','approved','UPI','2026-06-04 21:35:41','2026-05-28 03:18:49',0),(3,'abc','9884263022','123456','jenifa.bala9@gmail.com','Thirumulaivoyal','PJA0004','approved','UPI','2026-06-03 20:06:36','2026-06-01 13:55:20',0),(4,'Krishnan','9790992608','pass@123','sam_2ksha@yahoo.co.in','No 3/66, Karumari Amman Kovil Street\nChinna Mathur','PJA0005','approved','UPI',NULL,'2026-06-03 16:29:43',0),(5,'Rajesh','9804321982','pass@123','rajesh_1987@gmail.com','No 3/66, Karumari Amman Kovil Street\nChinna Mathur','PJA0007','approved','UPI',NULL,'2026-06-04 08:58:51',0);
/*!40000 ALTER TABLE `members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `temple_seva_bookings`
--

DROP TABLE IF EXISTS `temple_seva_bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `temple_seva_bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `req_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `devotee_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seva_date` date NOT NULL,
  `gothram` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nakshatram` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rasi` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sevas` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `special_notes` text COLLATE utf8mb4_unicode_ci,
  `member_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','confirmed','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `admin_viewed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `req_id` (`req_id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_req_id` (`req_id`),
  KEY `idx_status` (`status`),
  KEY `idx_seva_date` (`seva_date`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `temple_seva_bookings`
--

LOCK TABLES `temple_seva_bookings` WRITE;
/*!40000 ALTER TABLE `temple_seva_bookings` DISABLE KEYS */;
INSERT INTO `temple_seva_bookings` VALUES (1,'SEV-2026-00001','cde','09786811197','2026-06-04','sss','aaa','fdfd','Sahasranamam,Kalyanam',NULL,'PJA0001','pending','2026-06-01 16:46:44','2026-06-01 16:46:44',0),(2,'SEV-2026-00002','lo,k','09786811197','2026-06-06','popopop','aaa','fdfd','Abhishekam,Homam,VehiclePooja',NULL,'PJA0001','pending','2026-06-02 18:02:44','2026-06-02 18:02:44',0),(3,'SEV-2026-00003','Perumal','09786811197','2026-06-18','shiva','ashwini','mesham','Homam',NULL,'PJA0001','pending','2026-06-03 13:53:44','2026-06-03 13:53:44',0),(4,'SEV-2026-00004','Perumal','09786811197','2026-06-18','shiva','ashwini','mesham','Homam',NULL,'PJA0004','pending','2026-06-03 14:37:04','2026-06-03 14:37:04',0);
/*!40000 ALTER TABLE `temple_seva_bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wedding_events`
--

DROP TABLE IF EXISTS `wedding_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wedding_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `req_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `event_location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `venue_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `num_guests` int DEFAULT NULL,
  `environment` enum('Indoor','Outdoor') COLLATE utf8mb4_unicode_ci DEFAULT 'Indoor',
  `has_theme` enum('Yes','No') COLLATE utf8mb4_unicode_ci DEFAULT 'No',
  `theme_description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `has_purpose` enum('Yes','No') COLLATE utf8mb4_unicode_ci DEFAULT 'No',
  `purpose_explanation` text COLLATE utf8mb4_unicode_ci,
  `estimated_budget` decimal(12,2) DEFAULT NULL,
  `other_details` text COLLATE utf8mb4_unicode_ci,
  `service_type` enum('Full','Specific') COLLATE utf8mb4_unicode_ci DEFAULT 'Specific',
  `specific_services` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `has_arranged` enum('Yes','No') COLLATE utf8mb4_unicode_ci DEFAULT 'No',
  `arranged_explanation` text COLLATE utf8mb4_unicode_ci,
  `discussion_points` text COLLATE utf8mb4_unicode_ci,
  `member_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','confirmed','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `admin_viewed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `req_id` (`req_id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_req_id` (`req_id`),
  KEY `idx_status` (`status`),
  KEY `idx_event_date` (`event_date`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wedding_events`
--

LOCK TABLES `wedding_events` WRITE;
/*!40000 ALTER TABLE `wedding_events` DISABLE KEYS */;
INSERT INTO `wedding_events` VALUES (1,'WED-2026-00001','reception','2026-06-24','09:08:00','05:08:00','xyz street, chennai','hall',200,'Indoor','No',NULL,'No',NULL,5000.00,NULL,'Specific','catering','No',NULL,NULL,'PJA0001','pending','2026-06-01 14:40:04','2026-06-01 14:40:04',0),(2,'WED-2026-00002','reception','2026-06-11','18:00:00','20:00:00','xyz street, chennai','hall',2000,'Indoor','No',NULL,'No',NULL,400000.00,NULL,'Specific',NULL,'No',NULL,NULL,'PJA0001','pending','2026-06-02 16:27:02','2026-06-02 16:27:02',0),(3,'WED-2026-00003','wedding','2026-06-10','06:13:00','22:13:00','adfdfsf street','qwe',20000,'Indoor','No',NULL,'No',NULL,200000.00,'gj ggtrt','Specific',NULL,'No',NULL,NULL,'PJA0001','pending','2026-06-02 16:43:37','2026-06-02 16:43:37',0);
/*!40000 ALTER TABLE `wedding_events` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-06 20:57:50
