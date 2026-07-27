-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 26, 2026 at 08:25 PM
-- Server version: 12.2.2-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `papertech`
--

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `sender_role` enum('admin','customer','vendor') NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_role` enum('admin','customer','vendor') NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `company_id`, `sender_role`, `sender_id`, `receiver_role`, `receiver_id`, `message`, `is_read`, `created_at`) VALUES
(1, 1, 'customer', 2, 'admin', 2, 'assalamualaiku', 1, '2026-06-10 15:34:52'),
(2, 1, 'admin', 2, 'vendor', 2, 'walaikum assalam', 1, '2026-06-10 15:35:18'),
(3, 1, 'admin', 2, 'vendor', 2, 'walaikumassalam', 1, '2026-06-10 15:39:54'),
(4, 5, 'admin', 3, 'vendor', 3, 'Assalamualaikum', 1, '2026-06-30 16:35:34'),
(5, 5, 'admin', 3, 'vendor', 3, 'bhai kia hal hai apkay may toa thk hu', 0, '2026-06-30 17:15:00'),
(6, 1, 'admin', 2, 'vendor', 2, 'hhhh5', 1, '2026-07-03 19:33:39');

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int(11) NOT NULL,
  `name` varchar(180) NOT NULL,
  `code` varchar(80) NOT NULL,
  `field_type` enum('paper','autos','karyana','computers') NOT NULL DEFAULT 'paper',
  `address` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `code`, `field_type`, `address`, `phone`, `status`, `created_at`, `updated_at`) VALUES
(1, 'AAR Paper Mart', 'PTM-001', 'paper', 'Karachi', '03123811269', 'active', '2026-05-23 13:37:56', '2026-07-24 14:23:51'),
(5, 'PMGT', 'PTM-002', 'paper', 'KARACHI', '03123718888', 'active', '2026-05-23 14:03:32', '2026-07-04 00:05:25'),
(6, 'aptech', '1001', 'paper', 'karachi', '03123811669', 'active', '2026-07-03 20:44:22', '2026-07-19 00:14:11'),
(7, 'fest', '1002', 'autos', 'karachi', '03138247824782', 'active', '2026-07-03 23:36:46', '2026-07-19 00:14:07');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `shop_name` varchar(150) NOT NULL,
  `address` text DEFAULT NULL,
  `cnic` varchar(30) DEFAULT NULL,
  `customer_type` enum('star','local') NOT NULL DEFAULT 'local',
  `credit_limit` decimal(12,2) NOT NULL DEFAULT 0.00,
  `current_balance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `company_id`, `full_name`, `phone`, `shop_name`, `address`, `cnic`, `customer_type`, `credit_limit`, `current_balance`, `username`, `password`, `created_at`, `updated_at`) VALUES
(2, 1, 'Adil Owaise', '03053253529', 'Owaise Graphics', 'khokhar muhallah hyd', '4130385943220', 'star', 50000.00, 8500.00, 'adil', '$2b$10$zGbnOjzEvMLleAhqs8C4ouGic9aNG4F0GW6MXe9CS.4R7TrOIY4H6', '2026-05-23 14:37:17', '2026-05-23 14:37:17'),
(4, 5, 'Adil Owaise', '03129989898', 'Owaise Graphics', 'khokhar muhallah hyd', '7878395738573', 'star', 50000.00, 30000.00, 'adil-pmgt', '$2b$10$pQGsmS5iKTYMt8x90Nm8DeXFCNegdeWU6oZVqBEZcGLd/nh1C9DIO', '2026-05-23 14:52:40', '2026-05-23 14:52:40');

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `invoice_number` varchar(80) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(12,2) NOT NULL,
  `payment_received` decimal(12,2) NOT NULL DEFAULT 0.00,
  `remaining_balance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sale_type` enum('cash','credit') NOT NULL DEFAULT 'cash',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `company_id`, `sale_id`, `invoice_number`, `customer_id`, `user_id`, `total_amount`, `discount`, `grand_total`, `payment_received`, `remaining_balance`, `sale_type`, `created_at`, `updated_at`) VALUES
(16, 1, 16, 'INV-1779529220713', 2, 2, 42500.00, 0.00, 42500.00, 42500.00, 0.00, 'credit', '2026-05-23 14:40:20', '2026-05-23 14:40:20'),
(17, 1, 17, 'INV-1781083414726', 2, 2, 34000.00, 0.00, 34000.00, 34000.00, 0.00, 'credit', '2026-06-10 14:23:34', '2026-06-10 14:23:34'),
(18, 1, 18, 'INV-1781083498921', 2, 2, 8500.00, 0.00, 8500.00, 8500.00, 0.00, 'credit', '2026-06-10 14:24:58', '2026-06-10 14:24:58'),
(19, 1, 19, 'INV-1781085915703', 2, 2, 17000.00, 0.00, 17000.00, 17000.00, 0.00, 'credit', '2026-06-10 15:05:15', '2026-06-10 15:05:15'),
(20, 5, 20, 'INV-1782819811679', 4, 3, 30000.00, 0.00, 30000.00, 0.00, 30000.00, 'credit', '2026-06-30 16:43:31', '2026-06-30 16:43:31'),
(23, 1, 23, 'INV-1784892813807', 2, 2, 8500.00, 0.00, 8500.00, 0.00, 8500.00, 'credit', '2026-07-24 16:33:33', '2026-07-24 16:33:33');

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `invoice_items`
--

INSERT INTO `invoice_items` (`id`, `invoice_id`, `product_id`, `quantity`, `unit_price`, `subtotal`, `created_at`) VALUES
(1, 16, 3, 2500, 17.00, 42500.00, '2026-05-23 14:40:20'),
(2, 17, 3, 2000, 17.00, 34000.00, '2026-06-10 14:23:34'),
(3, 18, 3, 500, 17.00, 8500.00, '2026-06-10 14:24:58'),
(4, 19, 3, 1000, 17.00, 17000.00, '2026-06-10 15:05:15'),
(5, 20, 4, 10000, 3.00, 30000.00, '2026-06-30 16:43:31'),
(8, 23, 3, 500, 17.00, 8500.00, '2026-07-24 16:33:33');

-- --------------------------------------------------------

--
-- Table structure for table `ledger_entries`
--

CREATE TABLE `ledger_entries` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `sale_id` int(11) DEFAULT NULL,
  `payment_id` int(11) DEFAULT NULL,
  `transaction_type` enum('sale','payment','adjustment') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `previous_balance` decimal(12,2) NOT NULL,
  `current_balance` decimal(12,2) NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `ledger_entries`
--

INSERT INTO `ledger_entries` (`id`, `company_id`, `customer_id`, `sale_id`, `payment_id`, `transaction_type`, `amount`, `previous_balance`, `current_balance`, `remarks`, `created_at`) VALUES
(1, 1, 2, 16, NULL, 'sale', 42500.00, 0.00, 42500.00, 'Sale INV-1779529220713', '2026-05-23 14:40:20'),
(2, 1, 2, 17, NULL, 'sale', 34000.00, 42500.00, 76500.00, 'Sale INV-1781083414726', '2026-06-10 14:23:34'),
(3, 1, 2, 18, NULL, 'sale', 8500.00, 76500.00, 85000.00, 'Sale INV-1781083498921', '2026-06-10 14:24:58'),
(4, 1, 2, NULL, 1, 'payment', 5000.00, 85000.00, 80000.00, 'Payment collected', '2026-06-10 14:30:34'),
(5, 1, 2, NULL, 2, 'payment', 30000.00, 80000.00, 50000.00, 'Payment collected', '2026-06-10 14:31:19'),
(6, 1, 2, NULL, 3, 'payment', 5000.00, 50000.00, 45000.00, 'Payment collected', '2026-06-10 14:56:44'),
(7, 1, 2, NULL, 4, 'payment', 2500.00, 45000.00, 42500.00, 'Payment collected', '2026-06-10 14:58:47'),
(8, 1, 2, NULL, 5, 'payment', 30000.00, 42500.00, 12500.00, 'Payment collected', '2026-06-10 14:59:05'),
(9, 1, 2, NULL, 6, 'payment', 1500.00, 12500.00, 11000.00, 'Payment collected', '2026-06-10 14:59:29'),
(10, 1, 2, NULL, 7, 'payment', 2500.00, 11000.00, 8500.00, 'Payment collected', '2026-06-10 14:59:53'),
(11, 1, 2, NULL, 8, 'payment', 8400.00, 8500.00, 100.00, 'Payment collected', '2026-06-10 15:00:54'),
(12, 1, 2, NULL, 9, 'payment', 100.00, 100.00, 0.00, 'Payment collected', '2026-06-10 15:01:11'),
(13, 1, 2, 19, NULL, 'sale', 17000.00, 0.00, 17000.00, 'Sale INV-1781085915703', '2026-06-10 15:05:15'),
(14, 1, 2, NULL, 10, 'payment', 17000.00, 17000.00, 0.00, 'Payment collected', '2026-06-10 15:06:04'),
(15, 5, 4, 20, NULL, 'sale', 30000.00, 0.00, 30000.00, 'Sale INV-1782819811679', '2026-06-30 16:43:31'),
(16, 1, 2, 23, NULL, 'sale', 8500.00, 0.00, 8500.00, 'Sale INV-1784892813807', '2026-07-24 16:33:33');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `sale_id` int(11) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` varchar(80) NOT NULL DEFAULT 'cash',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `company_id`, `customer_id`, `user_id`, `sale_id`, `amount`, `payment_method`, `notes`, `created_at`) VALUES
(1, 1, 2, 2, 16, 5000.00, 'cash', NULL, '2026-06-10 14:30:34'),
(2, 1, 2, 2, 16, 30000.00, 'cash', NULL, '2026-06-10 14:31:19'),
(3, 1, 2, 2, 16, 5000.00, 'cash', NULL, '2026-06-10 14:56:44'),
(4, 1, 2, 2, 16, 2500.00, 'cash', NULL, '2026-06-10 14:58:47'),
(5, 1, 2, 2, 17, 30000.00, 'cash', NULL, '2026-06-10 14:59:05'),
(6, 1, 2, 2, 17, 1500.00, 'cash', NULL, '2026-06-10 14:59:29'),
(7, 1, 2, 2, 17, 2500.00, 'cash', NULL, '2026-06-10 14:59:53'),
(8, 1, 2, 2, 18, 8400.00, 'cash', NULL, '2026-06-10 15:00:54'),
(9, 1, 2, 2, 18, 100.00, 'cash', NULL, '2026-06-10 15:01:11'),
(10, 1, 2, 2, 19, 17000.00, 'cash', NULL, '2026-06-10 15:06:04');

-- --------------------------------------------------------

--
-- Table structure for table `policies`
--

CREATE TABLE `policies` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `allowed_modules` text NOT NULL,
  `company_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `policies`
--

INSERT INTO `policies` (`id`, `name`, `description`, `allowed_modules`, `company_id`, `created_at`, `updated_at`) VALUES
(1, 'Full Admin Access', 'All modules with full CRUD for company admin', '[\"dashboard.view\",\"users.view\",\"users.create\",\"users.update\",\"users.delete\",\"customers.view\",\"customers.create\",\"customers.update\",\"customers.delete\",\"vendors.view\",\"vendors.create\",\"vendors.update\",\"vendors.delete\",\"purchases.view\",\"purchases.create\",\"purchases.update\",\"purchases.delete\",\"products.view\",\"products.create\",\"products.update\",\"products.delete\",\"sales.view\",\"sales.create\",\"sales.update\",\"sales.delete\",\"invoices.view\",\"invoices.create\",\"invoices.update\",\"invoices.delete\",\"payments.view\",\"payments.create\",\"payments.update\",\"payments.delete\",\"reports.view\",\"chat.view\"]', NULL, '2026-07-04 00:00:49', '2026-07-04 00:00:49'),
(2, 'Sales Staff', 'Sales, customers, invoices and reports access', '[\"dashboard.view\",\"customers.view\",\"customers.create\",\"customers.update\",\"sales.view\",\"sales.create\",\"invoices.view\",\"reports.view\",\"chat.view\"]', NULL, '2026-07-04 00:00:49', '2026-07-04 00:05:41'),
(3, 'Inventory Staff', 'Products, purchases and vendors access', '[\"dashboard.view\",\"products.view\",\"products.create\",\"products.update\",\"purchases.view\",\"purchases.create\",\"vendors.view\",\"vendors.create\",\"chat.view\"]', NULL, '2026-07-04 00:00:49', '2026-07-04 00:00:49'),
(4, 'emp', 'Minimum', '[\"dashboard.view\",\"products.view\",\"sales.view\",\"invoices.view\",\"chat.view\"]', NULL, '2026-07-04 00:05:03', '2026-07-04 00:05:03'),
(5, 'user', 'user', '[\"users.view\",\"customers.view\",\"vendors.view\"]', NULL, '2026-07-04 00:05:58', '2026-07-04 00:05:58'),
(6, 'Full Admin Access', 'All modules with full access for company admin', '[\"dashboard.view\",\"users.view\",\"users.create\",\"users.update\",\"users.delete\",\"customers.view\",\"customers.create\",\"customers.update\",\"customers.delete\",\"vendors.view\",\"vendors.create\",\"vendors.update\",\"vendors.delete\",\"purchases.view\",\"purchases.create\",\"purchases.update\",\"purchases.delete\",\"products.view\",\"products.create\",\"products.update\",\"products.delete\",\"sales.view\",\"sales.create\",\"sales.update\",\"sales.delete\",\"invoices.view\",\"invoices.create\",\"invoices.update\",\"invoices.delete\",\"payments.view\",\"payments.create\",\"payments.update\",\"payments.delete\",\"reports.view\",\"chat.view\"]', NULL, '2026-07-04 00:10:49', '2026-07-04 00:10:49'),
(7, 'Sales Staff', 'Sales, customers, invoices and reports access', '[\"dashboard.view\",\"customers.view\",\"customers.create\",\"customers.update\",\"sales.view\",\"sales.create\",\"invoices.view\",\"reports.view\",\"chat.view\"]', NULL, '2026-07-04 00:10:49', '2026-07-04 00:10:49'),
(8, 'Inventory Staff', 'Products, purchases and vendors access', '[\"dashboard.view\",\"products.view\",\"products.create\",\"products.update\",\"purchases.view\",\"purchases.create\",\"vendors.view\",\"vendors.create\",\"chat.view\"]', NULL, '2026-07-04 00:10:49', '2026-07-04 00:10:49'),
(9, 'staff', 'staff', '[\"customers.view\",\"customers.create\",\"vendors.view\",\"vendors.create\"]', 1, '2026-07-04 01:23:13', '2026-07-04 01:23:13');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `product_type` varchar(120) NOT NULL,
  `size` varchar(50) DEFAULT NULL,
  `gram` int(11) DEFAULT 0,
  `unit_type` varchar(80) NOT NULL,
  `sheets_per_pack` int(11) DEFAULT 0,
  `product_specs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`product_specs`)),
  `cost_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sale_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `current_stock` int(11) NOT NULL DEFAULT 0,
  `min_stock_alert` int(11) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `company_id`, `name`, `product_type`, `size`, `gram`, `unit_type`, `sheets_per_pack`, `product_specs`, `cost_price`, `sale_price`, `current_stock`, `min_stock_alert`, `description`, `created_at`, `updated_at`) VALUES
(3, 1, 'IK 70', 'Indonesia', '23x36', 70, 'Paper', 500, '{}', 16.00, 8500.00, 3500, 0, NULL, '2026-05-23 14:38:58', '2026-07-24 16:33:33'),
(4, 5, 'IK', 'Indonesia', '23x36', 70, 'Paper', 500, '{}', 2.00, 1500.00, 0, 5, NULL, '2026-06-30 16:20:01', '2026-06-30 16:43:31');

-- --------------------------------------------------------

--
-- Table structure for table `purchases`
--

CREATE TABLE `purchases` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `purchase_number` varchar(80) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(12,2) NOT NULL,
  `payment_paid` decimal(12,2) NOT NULL DEFAULT 0.00,
  `remaining_balance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `purchase_type` enum('cash','credit') NOT NULL DEFAULT 'cash',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `purchases`
--

INSERT INTO `purchases` (`id`, `company_id`, `purchase_number`, `vendor_id`, `user_id`, `total_amount`, `discount`, `grand_total`, `payment_paid`, `remaining_balance`, `purchase_type`, `created_at`, `updated_at`) VALUES
(2, 1, 'PUR-1779529166479', 2, 2, 80000.00, 0.00, 80000.00, 80000.00, 0.00, 'credit', '2026-05-23 14:39:26', '2026-06-10 15:03:26'),
(3, 1, 'PUR-1781085879939', 2, 2, 80000.00, 0.00, 80000.00, 80000.00, 0.00, 'credit', '2026-06-10 15:04:39', '2026-07-24 15:40:22'),
(4, 5, 'PUR-1782818555053', 3, 3, 20000.00, 0.00, 20000.00, 0.00, 20000.00, 'credit', '2026-06-30 16:22:35', '2026-06-30 16:22:35');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_items`
--

CREATE TABLE `purchase_items` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `purchase_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `purchase_items`
--

INSERT INTO `purchase_items` (`id`, `company_id`, `purchase_id`, `product_id`, `quantity`, `unit_price`, `subtotal`, `created_at`) VALUES
(2, 1, 2, 3, 5000, 16.00, 80000.00, '2026-05-23 14:39:26'),
(3, 1, 3, 3, 5000, 16.00, 80000.00, '2026-06-10 15:04:39'),
(4, 5, 4, 4, 10000, 2.00, 20000.00, '2026-06-30 16:22:35');

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `invoice_number` varchar(80) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(12,2) NOT NULL,
  `payment_received` decimal(12,2) NOT NULL DEFAULT 0.00,
  `remaining_balance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sale_type` enum('cash','credit') NOT NULL DEFAULT 'cash',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `company_id`, `invoice_number`, `customer_id`, `user_id`, `total_amount`, `discount`, `grand_total`, `payment_received`, `remaining_balance`, `sale_type`, `created_at`, `updated_at`) VALUES
(16, 1, 'INV-1779529220713', 2, 2, 42500.00, 0.00, 42500.00, 42500.00, 0.00, 'credit', '2026-05-23 14:40:20', '2026-05-23 14:40:20'),
(17, 1, 'INV-1781083414726', 2, 2, 34000.00, 0.00, 34000.00, 34000.00, 0.00, 'credit', '2026-06-10 14:23:34', '2026-06-10 14:23:34'),
(18, 1, 'INV-1781083498921', 2, 2, 8500.00, 0.00, 8500.00, 8500.00, 0.00, 'credit', '2026-06-10 14:24:58', '2026-06-10 14:24:58'),
(19, 1, 'INV-1781085915703', 2, 2, 17000.00, 0.00, 17000.00, 17000.00, 0.00, 'credit', '2026-06-10 15:05:15', '2026-06-10 15:05:15'),
(20, 5, 'INV-1782819811679', 4, 3, 30000.00, 0.00, 30000.00, 0.00, 30000.00, 'credit', '2026-06-30 16:43:31', '2026-06-30 16:43:31'),
(23, 1, 'INV-1784892813807', 2, 2, 8500.00, 0.00, 8500.00, 0.00, 8500.00, 'credit', '2026-07-24 16:33:33', '2026-07-24 16:33:33');

-- --------------------------------------------------------

--
-- Table structure for table `sale_items`
--

CREATE TABLE `sale_items` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `sale_items`
--

INSERT INTO `sale_items` (`id`, `company_id`, `sale_id`, `product_id`, `quantity`, `unit_price`, `subtotal`, `created_at`) VALUES
(1, 1, 16, 3, 2500, 17.00, 42500.00, '2026-05-23 14:40:20'),
(2, 1, 17, 3, 2000, 17.00, 34000.00, '2026-06-10 14:23:34'),
(3, 1, 18, 3, 500, 17.00, 8500.00, '2026-06-10 14:24:58'),
(4, 1, 19, 3, 1000, 17.00, 17000.00, '2026-06-10 15:05:15'),
(5, 5, 20, 4, 10000, 3.00, 30000.00, '2026-06-30 16:43:31'),
(8, 1, 23, 3, 500, 17.00, 8500.00, '2026-07-24 16:33:33');

-- --------------------------------------------------------

--
-- Table structure for table `stock_history`
--

CREATE TABLE `stock_history` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `change_type` varchar(80) NOT NULL,
  `quantity` int(11) NOT NULL,
  `balance_after` int(11) NOT NULL,
  `reference_type` varchar(80) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `stock_history`
--

INSERT INTO `stock_history` (`id`, `company_id`, `product_id`, `change_type`, `quantity`, `balance_after`, `reference_type`, `reference_id`, `notes`, `created_at`) VALUES
(2, 1, 3, 'purchase', 5000, 5000, 'purchase', 2, 'Purchase PUR-1779529166479', '2026-05-23 14:39:26'),
(3, 1, 3, 'sale', 2500, 2500, 'sale', 16, 'Sale INV-1779529220713', '2026-05-23 14:40:20'),
(4, 1, 3, 'sale', 2000, 500, 'sale', 17, 'Sale INV-1781083414726', '2026-06-10 14:23:34'),
(5, 1, 3, 'sale', 500, 0, 'sale', 18, 'Sale INV-1781083498921', '2026-06-10 14:24:58'),
(6, 1, 3, 'purchase', 5000, 5000, 'purchase', 3, 'Purchase PUR-1781085879939', '2026-06-10 15:04:39'),
(7, 1, 3, 'sale', 1000, 4000, 'sale', 19, 'Sale INV-1781085915703', '2026-06-10 15:05:15'),
(8, 5, 4, 'purchase', 10000, 10000, 'purchase', 4, 'Purchase PUR-1782818555053', '2026-06-30 16:22:35'),
(9, 5, 4, 'sale', 10000, 0, 'sale', 20, 'Sale INV-1782819811679', '2026-06-30 16:43:31'),
(10, 1, 3, 'sale', 500, 3500, 'sale', 23, 'Sale INV-1784892813807', '2026-07-24 16:33:33');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `cnic` varchar(30) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('super_admin','admin','company_user','customer','vendor') NOT NULL DEFAULT 'admin',
  `company_id` int(11) DEFAULT NULL,
  `allowed_modules` text DEFAULT NULL,
  `policy_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `cnic`, `address`, `username`, `password`, `role`, `company_id`, `allowed_modules`, `policy_id`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', NULL, NULL, NULL, 'super', '$2a$12$XCwoQ0tjRb0M9mqNyFRc4eJmEdiv0QV6d1Lj05CmkH8rl5Qu.LoDG', 'super_admin', NULL, NULL, NULL, '2026-05-23 13:39:47', '2026-05-23 13:39:47'),
(2, 'Company Admin', NULL, NULL, NULL, 'aar', '$2a$12$XCwoQ0tjRb0M9mqNyFRc4eJmEdiv0QV6d1Lj05CmkH8rl5Qu.LoDG', 'admin', 1, '[\"dashboard.view\",\"users.view\",\"users.create\",\"users.update\",\"users.delete\",\"customers.view\",\"customers.create\",\"customers.update\",\"customers.delete\",\"vendors.view\",\"vendors.create\",\"vendors.update\",\"vendors.delete\",\"purchases.view\",\"purchases.create\",\"purchases.update\",\"purchases.delete\",\"products.view\",\"products.create\",\"products.update\",\"products.delete\",\"sales.view\",\"sales.create\",\"sales.update\",\"sales.delete\",\"invoices.view\",\"invoices.create\",\"invoices.update\",\"invoices.delete\",\"payments.view\",\"payments.create\",\"payments.update\",\"payments.delete\",\"reports.view\",\"chat.view\"]', 1, '2026-05-23 13:39:47', '2026-07-24 14:23:51'),
(3, 'Armash', NULL, NULL, NULL, 'pmgt', '$2a$12$XCwoQ0tjRb0M9mqNyFRc4eJmEdiv0QV6d1Lj05CmkH8rl5Qu.LoDG', 'admin', 5, '[\"dashboard.view\",\"users.view\",\"users.create\",\"users.update\",\"users.delete\",\"customers.view\",\"customers.create\",\"customers.update\",\"customers.delete\",\"vendors.view\",\"vendors.create\",\"vendors.update\",\"vendors.delete\",\"purchases.view\",\"purchases.create\",\"purchases.update\",\"purchases.delete\",\"products.view\",\"products.create\",\"products.update\",\"products.delete\",\"sales.view\",\"sales.create\",\"sales.update\",\"sales.delete\",\"invoices.view\",\"invoices.create\",\"invoices.update\",\"invoices.delete\",\"payments.view\",\"payments.create\",\"payments.update\",\"payments.delete\",\"reports.view\",\"chat.view\"]', 1, '2026-05-23 14:03:32', '2026-07-04 00:05:25'),
(4, 'aptech', NULL, NULL, NULL, 'aptech', '$2b$10$9R2gkCyPCUrNpFlbY65FA.yrRUlTXs1PLZJ56T8aWa4gxE4qqb.Zq', 'admin', 6, '[\"dashboard.view\",\"customers.view\",\"customers.create\",\"customers.update\",\"sales.view\",\"sales.create\",\"invoices.view\",\"reports.view\",\"chat.view\"]', 2, '2026-07-03 20:44:22', '2026-07-19 00:14:11'),
(5, 'Hussain', NULL, NULL, NULL, 'fest', '$2b$10$hF5u9qVvzO50FQ/jbeEZV.ShOrSeUvc48IueO4NOqHRhyx0Xy1EK6', 'admin', 7, '[\"dashboard.view\",\"users.view\",\"users.create\",\"users.update\",\"users.delete\",\"customers.view\",\"customers.create\",\"customers.update\",\"customers.delete\",\"vendors.view\",\"vendors.create\",\"vendors.update\",\"vendors.delete\",\"purchases.view\",\"purchases.create\",\"purchases.update\",\"purchases.delete\",\"products.view\",\"products.create\",\"products.update\",\"products.delete\",\"sales.view\",\"sales.create\",\"sales.update\",\"sales.delete\",\"invoices.view\",\"invoices.create\",\"invoices.update\",\"invoices.delete\",\"payments.view\",\"payments.create\",\"payments.update\",\"payments.delete\",\"reports.view\",\"chat.view\"]', 6, '2026-07-03 23:36:46', '2026-07-19 00:14:07'),
(6, 'safi', 'safi@gmail.com', '2034820482094', 'karachi', 'safi', '$2a$12$XCwoQ0tjRb0M9mqNyFRc4eJmEdiv0QV6d1Lj05CmkH8rl5Qu.LoDG', 'company_user', 1, '[\"customers.view\",\"customers.create\",\"vendors.view\",\"vendors.create\"]', 9, '2026-07-03 23:38:21', '2026-07-04 01:23:35');

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `company_name` varchar(150) NOT NULL,
  `address` text DEFAULT NULL,
  `cnic` varchar(30) DEFAULT NULL,
  `opening_balance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `current_balance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `company_id`, `full_name`, `phone`, `company_name`, `address`, `cnic`, `opening_balance`, `current_balance`, `username`, `password`, `created_at`, `updated_at`) VALUES
(2, 1, 'mannan', '03123811269', 'Al-haram', 'karachi', '7878395738573', 0.00, 0.00, 'mannan', '$2b$10$gM1ysqENdpB7aRvYDU.IQ.iHIdcmgGwhhKGJTC/sHrvoax7biiR5G', '2026-05-23 14:37:59', '2026-05-23 14:37:59'),
(3, 5, 'Saad Khalid', '03123811267', 'Al-haram', 'Pakistan Chowk Karachi', '4130493483942', 0.00, 20000.00, 'alharam', '$2b$10$5WKcLFYg3SrKM./TAe4vq.MomibGhbWNdjcSGaXRj3Brgmwc0mpkq', '2026-06-30 16:21:28', '2026-06-30 16:21:28');

-- --------------------------------------------------------

--
-- Table structure for table `vendor_ledger_entries`
--

CREATE TABLE `vendor_ledger_entries` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `purchase_id` int(11) DEFAULT NULL,
  `payment_id` int(11) DEFAULT NULL,
  `transaction_type` enum('purchase','payment','adjustment') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `previous_balance` decimal(12,2) NOT NULL,
  `current_balance` decimal(12,2) NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `vendor_ledger_entries`
--

INSERT INTO `vendor_ledger_entries` (`id`, `company_id`, `vendor_id`, `purchase_id`, `payment_id`, `transaction_type`, `amount`, `previous_balance`, `current_balance`, `remarks`, `created_at`) VALUES
(4, 1, 2, 2, NULL, 'purchase', 80000.00, 0.00, 80000.00, 'Purchase PUR-1779529166479', '2026-05-23 14:39:26'),
(5, 1, 2, NULL, 3, 'payment', 80000.00, 80000.00, 0.00, 'Vendor payment paid', '2026-06-10 15:03:26'),
(6, 1, 2, 3, NULL, 'purchase', 80000.00, 0.00, 80000.00, 'Purchase PUR-1781085879939', '2026-06-10 15:04:39'),
(7, 5, 3, 4, NULL, 'purchase', 20000.00, 0.00, 20000.00, 'Purchase PUR-1782818555053', '2026-06-30 16:22:35'),
(8, 1, 2, NULL, 4, 'payment', 50000.00, 80000.00, 30000.00, 'Vendor payment paid', '2026-07-04 01:20:44'),
(9, 1, 2, NULL, 5, 'payment', 25000.00, 30000.00, 5000.00, 'ckldsmcksd', '2026-07-24 15:40:15'),
(10, 1, 2, NULL, 6, 'payment', 5000.00, 5000.00, 0.00, 'Vendor payment paid', '2026-07-24 15:40:22');

-- --------------------------------------------------------

--
-- Table structure for table `vendor_payments`
--

CREATE TABLE `vendor_payments` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `purchase_id` int(11) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` varchar(80) NOT NULL DEFAULT 'cash',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `vendor_payments`
--

INSERT INTO `vendor_payments` (`id`, `company_id`, `vendor_id`, `user_id`, `purchase_id`, `amount`, `payment_method`, `notes`, `created_at`) VALUES
(3, 1, 2, 2, 2, 80000.00, 'cash', NULL, '2026-06-10 15:03:26'),
(4, 1, 2, 2, 3, 50000.00, 'cash', NULL, '2026-07-04 01:20:44'),
(5, 1, 2, 2, 3, 25000.00, 'cash', 'ckldsmcksd', '2026-07-24 15:40:15'),
(6, 1, 2, 2, 3, 5000.00, 'cash', NULL, '2026-07-24 15:40:22');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_chat_company_id` (`company_id`),
  ADD KEY `idx_chat_participants` (`sender_role`,`sender_id`,`receiver_role`,`receiver_id`),
  ADD KEY `idx_chat_created_at` (`created_at`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_companies_name` (`name`),
  ADD UNIQUE KEY `uq_companies_code` (`code`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_customers_company_phone` (`company_id`,`phone`),
  ADD UNIQUE KEY `uq_customers_company_username` (`company_id`,`username`),
  ADD KEY `idx_customers_company_id` (`company_id`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_invoices_sale_id` (`sale_id`),
  ADD UNIQUE KEY `uq_invoices_company_invoice` (`company_id`,`invoice_number`),
  ADD KEY `idx_invoices_company_id` (`company_id`),
  ADD KEY `fk_invoices_customer_id` (`customer_id`),
  ADD KEY `fk_invoices_user_id` (`user_id`);

--
-- Indexes for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_invoice_items_invoice_id` (`invoice_id`),
  ADD KEY `fk_invoice_items_product_id` (`product_id`);

--
-- Indexes for table `ledger_entries`
--
ALTER TABLE `ledger_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ledger_entries_company_id` (`company_id`),
  ADD KEY `fk_ledger_entries_customer_id` (`customer_id`),
  ADD KEY `fk_ledger_entries_sale_id` (`sale_id`),
  ADD KEY `fk_ledger_entries_payment_id` (`payment_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_payments_company_id` (`company_id`),
  ADD KEY `fk_payments_customer_id` (`customer_id`),
  ADD KEY `fk_payments_user_id` (`user_id`),
  ADD KEY `fk_payments_sale_id` (`sale_id`);

--
-- Indexes for table `policies`
--
ALTER TABLE `policies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_policy_name_company` (`name`,`company_id`),
  ADD KEY `fk_policies_company` (`company_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_products_company_name` (`company_id`,`name`),
  ADD KEY `idx_products_company_id` (`company_id`);

--
-- Indexes for table `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_purchases_company_number` (`company_id`,`purchase_number`),
  ADD KEY `idx_purchases_company_id` (`company_id`),
  ADD KEY `fk_purchases_vendor_id` (`vendor_id`),
  ADD KEY `fk_purchases_user_id` (`user_id`);

--
-- Indexes for table `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_purchase_items_purchase_id` (`purchase_id`),
  ADD KEY `fk_purchase_items_product_id` (`product_id`),
  ADD KEY `idx_purchase_items_company_id` (`company_id`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sales_company_invoice` (`company_id`,`invoice_number`),
  ADD KEY `idx_sales_company_id` (`company_id`),
  ADD KEY `fk_sales_customer_id` (`customer_id`),
  ADD KEY `fk_sales_user_id` (`user_id`);

--
-- Indexes for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sale_items_sale_id` (`sale_id`),
  ADD KEY `fk_sale_items_product_id` (`product_id`),
  ADD KEY `idx_sale_items_company_id` (`company_id`);

--
-- Indexes for table `stock_history`
--
ALTER TABLE `stock_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_stock_company_id` (`company_id`),
  ADD KEY `fk_stock_product` (`product_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_users_company_id` (`company_id`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_vendors_company_phone` (`company_id`,`phone`),
  ADD UNIQUE KEY `uq_vendors_company_username` (`company_id`,`username`),
  ADD KEY `idx_vendors_company_id` (`company_id`);

--
-- Indexes for table `vendor_ledger_entries`
--
ALTER TABLE `vendor_ledger_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vendor_ledger_company_id` (`company_id`),
  ADD KEY `fk_vendor_ledger_vendor` (`vendor_id`),
  ADD KEY `fk_vendor_ledger_purchase` (`purchase_id`),
  ADD KEY `fk_vendor_ledger_payment` (`payment_id`);

--
-- Indexes for table `vendor_payments`
--
ALTER TABLE `vendor_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vendor_payments_company_id` (`company_id`),
  ADD KEY `fk_vendor_payments_vendor_id` (`vendor_id`),
  ADD KEY `fk_vendor_payments_user_id` (`user_id`),
  ADD KEY `fk_vendor_payments_purchase_id` (`purchase_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `ledger_entries`
--
ALTER TABLE `ledger_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `policies`
--
ALTER TABLE `policies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `purchase_items`
--
ALTER TABLE `purchase_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `stock_history`
--
ALTER TABLE `stock_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `vendor_ledger_entries`
--
ALTER TABLE `vendor_ledger_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `vendor_payments`
--
ALTER TABLE `vendor_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `fk_chat_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `fk_customers_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `fk_invoices_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `fk_invoices_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_invoices_sale_id` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_invoices_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `fk_invoice_items_invoice_id` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_invoice_items_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ledger_entries`
--
ALTER TABLE `ledger_entries`
  ADD CONSTRAINT `fk_ledger_entries_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `fk_ledger_entries_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ledger_entries_payment_id` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ledger_entries_sale_id` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `fk_payments_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_payments_sale_id` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_payments_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `policies`
--
ALTER TABLE `policies`
  ADD CONSTRAINT `fk_policies_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `purchases`
--
ALTER TABLE `purchases`
  ADD CONSTRAINT `fk_purchases_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `fk_purchases_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_purchases_vendor_id` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD CONSTRAINT `fk_purchase_items_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `fk_purchase_items_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_purchase_items_purchase_id` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `fk_sales_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `fk_sales_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sales_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD CONSTRAINT `fk_sale_items_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `fk_sale_items_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sale_items_sale_id` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_history`
--
ALTER TABLE `stock_history`
  ADD CONSTRAINT `fk_stock_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `fk_stock_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `vendors`
--
ALTER TABLE `vendors`
  ADD CONSTRAINT `fk_vendors_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `vendor_ledger_entries`
--
ALTER TABLE `vendor_ledger_entries`
  ADD CONSTRAINT `fk_vendor_ledger_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `fk_vendor_ledger_payment` FOREIGN KEY (`payment_id`) REFERENCES `vendor_payments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_vendor_ledger_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_vendor_ledger_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vendor_payments`
--
ALTER TABLE `vendor_payments`
  ADD CONSTRAINT `fk_vendor_payments_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `fk_vendor_payments_purchase_id` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_vendor_payments_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_vendor_payments_vendor_id` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
