-- LunaDine Admin Panel Database Schema
-- This script adds tables for role-based access control and populates them with initial data.
-- Passwords are hashed using PHP's password_hash() with BCRYPT.
-- The sample password for all users is 'password123'.

--
-- Table structure for table `roles`
--
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `role_name` TEXT NOT NULL UNIQUE
);

--
-- Dumping data for table `roles`
--
INSERT INTO `roles` (`id`, `role_name`) VALUES
(1, 'superadmin'),
(2, 'owner'),
(3, 'manager'),
(4, 'branch_manager'),
(5, 'chef'),
(6, 'waiter');

--
-- Table structure for table `users`
--
CREATE TABLE IF NOT EXISTS `users` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `username` TEXT NOT NULL UNIQUE,
  `password` TEXT NOT NULL,
  `role_id` INTEGER NOT NULL,
  `branch_id` INTEGER DEFAULT NULL,
  `is_active` INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL
);

--
-- Dumping data for table `users`
-- Note: The password for all users is 'password123'
-- The hash is generated using: password_hash('password123', PASSWORD_BCRYPT)
--
INSERT INTO `users` (`id`, `username`, `password`, `role_id`, `branch_id`) VALUES
-- High-level users
(1, 'superadmin', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 1, NULL),
(2, 'main_owner', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 2, NULL),
(3, 'regional_manager', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 3, NULL),

-- Branch Managers for all branches
(4, 'bm_gulshan', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 4, 1),
(5, 'bm_dhanmondi', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 4, 2),
(6, 'bm_banani', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 4, 3),
(7, 'bm_chittagong', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 4, 4),
(8, 'bm_sylhet', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 4, 5),

-- Chefs for all branches
(9, 'chef_gulshan', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 5, 1),
(10, 'chef_dhanmondi', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 5, 2),
(11, 'chef_banani', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 5, 3),
(12, 'chef_chittagong', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 5, 4),
(13, 'chef_sylhet', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 5, 5),

-- Waiters for all branches
(14, 'waiter_gulshan', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 6, 1),
(15, 'waiter_dhanmondi', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 6, 2),
(16, 'waiter_banani', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 6, 3),
(17, 'waiter_chittagong', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 6, 4),
(18, 'waiter_sylhet', '$2y$10$N9.XtSLF1xAL.O3yXDVoUO.A30yA.H672z.JgaXVnC5bBmeWp3/Iu', 6, 5);


--
-- Table structure for table `permissions`
--
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `permission_name` TEXT NOT NULL UNIQUE,
  `description` TEXT
);

--
-- Dumping data for table `permissions`
--
INSERT INTO `permissions` (`id`, `permission_name`, `description`) VALUES
(1, 'manage_users', 'Create, read, update, and delete all users.'),
(2, 'manage_roles', 'Create, read, update, and delete roles and their permissions.'),
(3, 'manage_branches', 'Create, read, update, and delete restaurant branches.'),
(4, 'manage_branch_staff', 'Manage staff (Branch Managers, Chefs, Waiters) for assigned branches.'),
(5, 'view_global_analytics', 'View aggregated analytics for all branches.'),
(6, 'view_branch_analytics', 'View analytics for a specific branch.'),
(7, 'manage_global_settings', 'Manage site-wide settings and feature toggles.'),
(8, 'manage_branch_menu', 'Manage menu items and categories for an assigned branch.'),
(9, 'view_all_orders', 'View all orders for an assigned branch.'),
(10, 'update_order_status_full', 'Update order status through its full lifecycle.'),
(11, 'update_order_status_kitchen', 'Update order status from placed to ready.'),
(12, 'update_order_status_serving', 'Update order status from ready to completed/served.'),
(13, 'view_kitchen_display', 'Access the real-time kitchen display view.'),
(14, 'view_table_management', 'Access the table management view for waiters.'),
(15, 'manage_service_requests', 'View and fulfill service requests.');

--
-- Table structure for table `role_permissions`
--
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` INTEGER NOT NULL,
  `permission_id` INTEGER NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
);

--
-- Dumping data for table `role_permissions`
--

-- Superadmin (all permissions)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15);

-- Owner
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(2, 3), -- manage_branches
(2, 4), -- manage_branch_staff (can hire managers)
(2, 5); -- view_global_analytics

-- Manager
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(3, 4), -- manage_branch_staff (can hire branch managers)
(3, 6), -- view_branch_analytics
(3, 8); -- manage_branch_menu

-- Branch Manager
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(4, 4), -- manage_branch_staff (chefs, waiters)
(4, 6), -- view_branch_analytics
(4, 8), -- manage_branch_menu
(4, 9), -- view_all_orders
(4, 10); -- update_order_status_full

-- Chef
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(5, 11), -- update_order_status_kitchen
(5, 13); -- view_kitchen_display

-- Waiter
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(6, 12), -- update_order_status_serving
(6, 14), -- view_table_management
(6, 15); -- manage_service_requests

--
-- Add indexes for performance
--
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);

