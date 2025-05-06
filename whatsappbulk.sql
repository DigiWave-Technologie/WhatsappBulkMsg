-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 07, 2024 at 11:22 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `whatsappbulk`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'electrnoic'),
(2, 'clothing');

-- --------------------------------------------------------

--
-- Table structure for table `credittype`
--

CREATE TABLE `credittype` (
  `id` int(11) NOT NULL,
  `TypeName` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credittype`
--

INSERT INTO `credittype` (`id`, `TypeName`) VALUES
(1, 'virtual_credit'),
(2, 'dp_virtual_credit'),
(3, 'virtual_button_credit'),
(4, 'personal_credit'),
(5, 'personal_poll_credit'),
(6, 'personal_professional_credit'),
(7, 'international_personal_credit'),
(8, 'international_virtual_credit'),
(9, 'branch_name_credit');

-- --------------------------------------------------------

--
-- Table structure for table `credit_transactions`
--

CREATE TABLE `credit_transactions` (
  `id` int(11) NOT NULL,
  `from_user_id` int(11) NOT NULL,
  `to_user_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `credit_type` varchar(255) NOT NULL,
  `credit` decimal(10,2) NOT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credit_transactions`
--

INSERT INTO `credit_transactions` (`id`, `from_user_id`, `to_user_id`, `category_id`, `credit_type`, `credit`, `transaction_date`) VALUES
(6, 1, 3, 1, 'credit', 100.00, '2024-12-07 06:52:01'),
(7, 3, 4, 1, 'credit', 10.00, '2024-12-07 06:58:33'),
(8, 1, 4, 1, 'credit', 10.00, '2024-12-07 06:59:10'),
(9, 4, 5, 1, 'credit', 5.00, '2024-12-07 07:03:11'),
(10, 1, 5, 1, 'credit', 5.00, '2024-12-07 07:11:23'),
(11, 1, 5, 2, 'credit', 5.00, '2024-12-07 07:15:50'),
(12, 4, 3, 1, 'debit', 1.00, '2024-12-07 07:43:49'),
(13, 5, 4, 1, 'debit', 2.00, '2024-12-07 07:48:30'),
(14, 4, 3, 1, 'debit', 2.00, '2024-12-07 08:02:17');

-- --------------------------------------------------------

--
-- Table structure for table `msggroup`
--

CREATE TABLE `msggroup` (
  `groupId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `group_name` varchar(255) NOT NULL,
  `group_number` longtext NOT NULL,
  `createAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updateAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `msggroup`
--

INSERT INTO `msggroup` (`groupId`, `userId`, `group_name`, `group_number`, `createAt`, `updateAt`) VALUES
(1, 1, 'Updated Team Alpha', '[\"1234567890\", \"5555555555\"]', '2024-11-23 12:19:36', '2024-11-23 12:23:46');

-- --------------------------------------------------------

--
-- Table structure for table `msgtemplate`
--

CREATE TABLE `msgtemplate` (
  `templateId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `template_msg` text NOT NULL,
  `createAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updateAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `msgtemplate`
--

INSERT INTO `msgtemplate` (`templateId`, `userId`, `template_name`, `template_msg`, `createAt`, `updateAt`) VALUES
(1, 1, 'Updated Welcome Message', 'Hi there! This is an updated welcome message.', '2024-11-23 11:54:23', '2024-11-23 11:56:04'),
(2, 1, 'Welcome Message from Tks Freelance', 'Hello, welcome to our service!', '2024-11-23 11:55:05', '2024-11-23 11:55:05');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `role_name`, `created_at`, `updated_at`) VALUES
(1, 'SuperAdmin', '2024-12-02 07:08:44', '2024-12-02 07:08:44'),
(2, 'Admin', '2024-12-02 07:08:44', '2024-12-02 07:08:44'),
(3, 'Reseller', '2024-12-02 07:08:44', '2024-12-02 07:08:44'),
(4, 'User', '2024-12-02 07:08:44', '2024-12-02 07:08:44');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `userid` int(11) NOT NULL,
  `parentuser_id` int(11) NOT NULL,
  `userName` varchar(255) NOT NULL,
  `roleId` varchar(11) NOT NULL,
  `password` varchar(255) NOT NULL,
  `status` enum('active','inactive') NOT NULL,
  `permission` longtext NOT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `createAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`userid`, `userName`, `roleId`, `password`, `status`, `permission`, `logo`, `createAt`) VALUES
(1, 'JohnDoe', '1', '$2a$10$g1SUNe3wBHufGfHc3globu1L0Q5ueH.MRvIi7PAjeOksQ2eUk79ga', 'active', 'permission', '/uploads/logo/1732280038278-949494918.jpg', '2024-11-22 11:25:53'),
(3, 'drashti', '2', '$2a$10$mjT6nsHO5M1ECRojdJ2V0edNfveB.wukQiyucsTokFjUYJR1JehZ.', 'active', '[\"read\",\"write\",\"update\"]', NULL, '2024-12-02 11:16:14'),
(4, 'jayesh', '3', '$2a$10$LsvIQOshu9PIpztx5u4SrOqfzOaQPrRHGuYy3fyyJEalqWmUn5QHG', 'active', '[\"read\",\"write\",\"update\"]', NULL, '2024-12-06 06:42:39'),
(5, 'palla', '4', '$2a$10$XDea8WP4WGc0pXb.9fLRteqjH4cEenBnoeJWQXufTpiGFblZz1yJu', 'active', '[\"read\",\"write\",\"update\"]', NULL, '2024-12-06 07:26:42');

-- --------------------------------------------------------

--
-- Table structure for table `user_credits`
--

CREATE TABLE `user_credits` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `credit` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- --------------------------------------------------------

--
-- Table structure for table `InternaitionaCampaign`
--

CREATE TABLE InternaitionaCampaign (
  campaignId INT NOT NULL AUTO_INCREMENT,
  campaignTitle VARCHAR(255) DEFAULT NULL,
  selectedGroup VARCHAR(255) DEFAULT NULL,
  whatsAppNumbers TEXT NOT NULL,
  userMessage TEXT NOT NULL, 
  selectedTemplate VARCHAR(100) DEFAULT NULL,
  userprofile VARCHAR(255) DEFAULT NULL,
  button1Text VARCHAR(255) DEFAULT NULL,
  button1Number VARCHAR(255) DEFAULT NULL,
  button2Text VARCHAR(255) DEFAULT NULL,
  button2Url VARCHAR(500) DEFAULT NULL,
  image1 VARCHAR(500) DEFAULT NULL,
  image2 VARCHAR(500) DEFAULT NULL,
  image3 VARCHAR(500) DEFAULT NULL,
  image4 VARCHAR(500) DEFAULT NULL,
  pdf VARCHAR(500) DEFAULT NULL,
  video VARCHAR(500) DEFAULT NULL,
  excellsheet VARCHAR(500) DEFAULT NULL, 
  image1Caption VARCHAR(255) DEFAULT NULL,
  image2Caption VARCHAR(255) DEFAULT NULL,
  image3Caption VARCHAR(255) DEFAULT NULL,
  image4Caption VARCHAR(255) DEFAULT NULL,
  pdfCaption VARCHAR(255) DEFAULT NULL,
  videoCaption VARCHAR(255) DEFAULT NULL,
  countryCode VARCHAR(10) NOT NULL, 
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (campaignId)
);

-- --------------------------------------------------------

--
-- Table structure for table `Campaign`
--

CREATE TABLE Campaign (
  campaignId INT NOT NULL AUTO_INCREMENT,
  campaignTitle VARCHAR(255) DEFAULT NULL,
  selectedGroup VARCHAR(255) DEFAULT NULL,
  whatsAppNumbers VARCHAR(255) DEFAULT NULL,
  userMessage TEXT NOT NULL, 
  selectedTemplate VARCHAR(100) DEFAULT NULL,
  userprofile VARCHAR(255) DEFAULT NULL,
  button1Text VARCHAR(255) DEFAULT NULL,
  button1Number VARCHAR(255) DEFAULT NULL,
  button2Text VARCHAR(255) DEFAULT NULL,
  button2Url VARCHAR(500) DEFAULT NULL,
  image1 VARCHAR(500) DEFAULT NULL,
  image2 VARCHAR(500) DEFAULT NULL,
  image3 VARCHAR(500) DEFAULT NULL,
  image4 VARCHAR(500) DEFAULT NULL,
  pdf VARCHAR(500) DEFAULT NULL,
  video VARCHAR(500) DEFAULT NULL,
  excellsheet VARCHAR(500) DEFAULT NULL,
  image1Caption VARCHAR(255) DEFAULT NULL,
  image2Caption VARCHAR(255) DEFAULT NULL,
  image3Caption VARCHAR(255) DEFAULT NULL,
  image4Caption VARCHAR(255) DEFAULT NULL,
  pdfCaption VARCHAR(255) DEFAULT NULL,
  videoCaption VARCHAR(255) DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (campaignId)
);

-- --------------------------------------------------------

--
-- Table structure for table `personalCampaigns`
--

CREATE TABLE personalCampaigns (
  campaignId INT AUTO_INCREMENT PRIMARY KEY,
  campaignTitle VARCHAR(255) DEFAULT NULL,
  selectedGroup VARCHAR(255) DEFAULT NULL,
  whatsAppNumbers VARCHAR(255) DEFAULT NULL, 
  userMessage TEXT DEFAULT NULL,
  selectedTemplate VARCHAR(255) DEFAULT NULL,
  BetweenMessages INT DEFAULT NULL, -- Delay in seconds
  userprofile VARCHAR(255) DEFAULT NULL,
  button1Text VARCHAR(255) DEFAULT NULL,
  button1Number VARCHAR(50) DEFAULT NULL,
  button2Text VARCHAR(255) DEFAULT NULL,
  button2Url VARCHAR(255) DEFAULT NULL,
  image1 VARCHAR(255) DEFAULT NULL,
  image2 VARCHAR(255) DEFAULT NULL,
  image3 VARCHAR(255) DEFAULT NULL,
  image4 VARCHAR(255) DEFAULT NULL,
  pdf VARCHAR(255) DEFAULT NULL,
  video VARCHAR(255) DEFAULT NULL,
  excellsheet VARCHAR(255) DEFAULT NULL,
  image1Caption TEXT DEFAULT NULL,
  image2Caption TEXT DEFAULT NULL,
  image3Caption TEXT DEFAULT NULL,
  image4Caption TEXT DEFAULT NULL,
  pdfCaption TEXT DEFAULT NULL,
  videoCaption TEXT DEFAULT NULL,
  pollQuestion TEXT DEFAULT NULL,
  pollOptions JSON DEFAULT NULL,  -- Stores all options as a JSON array (or use TEXT if JSON is not supported)
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table `InternaitionapersonalCampaigns`
--

CREATE TABLE InternaitionapersonalCampaigns (
  campaignId INT AUTO_INCREMENT PRIMARY KEY,
  campaignTitle VARCHAR(255) DEFAULT NULL,
  selectedGroup VARCHAR(255) DEFAULT NULL,
  whatsAppNumbers VARCHAR(255) DEFAULT NULL, 
  userMessage TEXT DEFAULT NULL,
  selectedTemplate VARCHAR(255) DEFAULT NULL,
  countryCode VARCHAR(255) DEFAULT NULL,
  BetweenMessages INT DEFAULT NULL, -- Delay in seconds
  userprofile VARCHAR(255) DEFAULT NULL,
  button1Text VARCHAR(255) DEFAULT NULL,
  button1Number VARCHAR(50) DEFAULT NULL,
  button2Text VARCHAR(255) DEFAULT NULL,
  button2Url VARCHAR(255) DEFAULT NULL,
  image1 VARCHAR(255) DEFAULT NULL,
  image2 VARCHAR(255) DEFAULT NULL,
  image3 VARCHAR(255) DEFAULT NULL,
  image4 VARCHAR(255) DEFAULT NULL,
  pdf VARCHAR(255) DEFAULT NULL,
  video VARCHAR(255) DEFAULT NULL,
  excellsheet VARCHAR(255) DEFAULT NULL,
  image1Caption TEXT DEFAULT NULL,
  image2Caption TEXT DEFAULT NULL,
  image3Caption TEXT DEFAULT NULL,
  image4Caption TEXT DEFAULT NULL,
  pdfCaption TEXT DEFAULT NULL,
  videoCaption TEXT DEFAULT NULL,
  pollQuestion TEXT DEFAULT NULL,
  pollOptions JSON DEFAULT NULL,  -- Stores all options as a JSON array (or use TEXT if JSON is not supported)
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--
-- Dumping data for table `user_credits`
--

INSERT INTO `user_credits` (`id`, `user_id`, `category_id`, `credit`) VALUES
(6, 3, 1, 93.00),
(7, 4, 1, 12.00),
(9, 5, 1, 8.00),
(11, 5, 2, 5.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `credittype`
--
ALTER TABLE `credittype`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `credit_transactions`
--
ALTER TABLE `credit_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `from_user_id` (`from_user_id`),
  ADD KEY `to_user_id` (`to_user_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `msggroup`
--
ALTER TABLE `msggroup`
  ADD PRIMARY KEY (`groupId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `msgtemplate`
--
ALTER TABLE `msgtemplate`
  ADD PRIMARY KEY (`templateId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`userid`),
  ADD UNIQUE KEY `userName` (`userName`);

--
-- Indexes for table `user_credits`
--
ALTER TABLE `user_credits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`category_id`),
  ADD KEY `category_id` (`category_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `credittype`
--
ALTER TABLE `credittype`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `credit_transactions`
--
ALTER TABLE `credit_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `msggroup`
--
ALTER TABLE `msggroup`
  MODIFY `groupId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `msgtemplate`
--
ALTER TABLE `msgtemplate`
  MODIFY `templateId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `userid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `user_credits`
--
ALTER TABLE `user_credits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `credit_transactions`
--
ALTER TABLE `credit_transactions`
  ADD CONSTRAINT `credit_transactions_ibfk_1` FOREIGN KEY (`from_user_id`) REFERENCES `user` (`userid`),
  ADD CONSTRAINT `credit_transactions_ibfk_2` FOREIGN KEY (`to_user_id`) REFERENCES `user` (`userid`),
  ADD CONSTRAINT `credit_transactions_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Constraints for table `msggroup`
--
ALTER TABLE `msggroup`
  ADD CONSTRAINT `msggroup_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userid`) ON DELETE CASCADE;

--
-- Constraints for table `msgtemplate`
--
ALTER TABLE `msgtemplate`
  ADD CONSTRAINT `msgtemplate_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userid`) ON DELETE CASCADE;

--
-- Constraints for table `user_credits`
--
ALTER TABLE `user_credits`
  ADD CONSTRAINT `user_credits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`userid`),
  ADD CONSTRAINT `user_credits_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


-- WA Virtual campaigns






