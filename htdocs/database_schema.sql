-- Luna Dine Database Schema
-- SQLite database schema for digital menu system with multi-language support
-- Languages table - Stores supported languages
CREATE TABLE languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,  -- e.g., 'en', 'es', 'fr'
    name TEXT NOT NULL,         -- e.g., 'English', 'Spanish', 'French'
    is_active INTEGER NOT NULL DEFAULT 1
);
-- Branches table - Stores each restaurant location and its specific settings
CREATE TABLE branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('open', 'closed')),
    phone TEXT NOT NULL,
    default_language_id INTEGER NOT NULL DEFAULT 1,
    settings TEXT DEFAULT '{"currency":"৳","vat_percentage":15,"currency_symbol":"৳"}',
    FOREIGN KEY (default_language_id) REFERENCES languages(id)
);
-- Master menu items table - Central catalog of all possible food and drink items
CREATE TABLE master_menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT,
    tags TEXT DEFAULT '[]'
);
-- Menu item translations table
CREATE TABLE menu_item_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    language_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    FOREIGN KEY (item_id) REFERENCES master_menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    UNIQUE(item_id, language_id)
);
-- Menu categories table - Branch-specific categories to organize the menu
CREATE TABLE menu_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);
-- Menu category translations table
CREATE TABLE menu_category_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    language_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    UNIQUE(category_id, language_id)
);
-- Branch menu items table - Link between master item and branch with pricing
CREATE TABLE branch_menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    master_item_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    price REAL NOT NULL,
    is_available INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (master_item_id) REFERENCES master_menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
);
-- Customization groups table - Defines types of customization for items
CREATE TABLE customization_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    master_item_id INTEGER NOT NULL,
    selection_type TEXT NOT NULL CHECK(selection_type IN ('single', 'multiple')),
    FOREIGN KEY (master_item_id) REFERENCES master_menu_items(id) ON DELETE CASCADE
);
-- Customization group translations table
CREATE TABLE customization_group_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    language_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES customization_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    UNIQUE(group_id, language_id)
);
-- Customization options table - Defines specific choices within groups
CREATE TABLE customization_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    additional_price REAL DEFAULT 0.0,
    FOREIGN KEY (group_id) REFERENCES customization_groups(id) ON DELETE CASCADE
);
-- Customization option translations table
CREATE TABLE customization_option_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    option_id INTEGER NOT NULL,
    language_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (option_id) REFERENCES customization_options(id) ON DELETE CASCADE,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    UNIQUE(option_id, language_id)
);
-- Restaurant tables table - Physical tables for dine-in orders
CREATE TABLE restaurant_tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    table_identifier TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);
-- Promo codes table - Stores valid promotional codes
CREATE TABLE promo_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('percentage', 'fixed')),
    value REAL NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    min_order_amount REAL DEFAULT 0.0
);
-- Orders table - Captures core details of customer orders
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_uid TEXT NOT NULL UNIQUE,
    branch_id INTEGER NOT NULL,
    table_id INTEGER,
    order_type TEXT NOT NULL CHECK(order_type IN ('dine-in', 'takeaway', 'delivery')),
    status TEXT NOT NULL DEFAULT 'placed' CHECK(status IN ('placed', 'in_kitchen', 'ready', 'completed', 'cancelled')),
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    language_id INTEGER NOT NULL,
    subtotal REAL NOT NULL DEFAULT 0.0,
    vat_amount REAL NOT NULL DEFAULT 0.0,
    discount_amount REAL NOT NULL DEFAULT 0.0,
    total_amount REAL NOT NULL DEFAULT 0.0,
    promo_code_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    estimated_completion_time TEXT,
    completed_at TEXT,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
    FOREIGN KEY (language_id) REFERENCES languages(id),
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id)
);
-- Order items table - Records each specific item within an order
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    branch_menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    customizations TEXT DEFAULT '[]',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_menu_item_id) REFERENCES branch_menu_items(id)
);
-- Feedback table - Stores detailed customer feedback
CREATE TABLE feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    overall_rating INTEGER CHECK(overall_rating BETWEEN 1 AND 5),
    food_rating INTEGER CHECK(food_rating BETWEEN 1 AND 5),
    service_rating INTEGER CHECK(service_rating BETWEEN 1 AND 5),
    item_feedback TEXT DEFAULT '[]',
    comment TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
-- Service requests table - Logs dine-in service requests
CREATE TABLE service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    request_type TEXT NOT NULL CHECK(request_type IN ('assistance', 'water', 'bill')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'fulfilled', 'cancelled')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TEXT,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id)
);
-- Service request translations table
CREATE TABLE service_request_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_type TEXT NOT NULL,
    language_id INTEGER NOT NULL,
    display_text TEXT NOT NULL,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    UNIQUE(request_type, language_id)
);
-- Indexes for performance optimization
CREATE INDEX idx_menu_categories_branch_id ON menu_categories(branch_id);
CREATE INDEX idx_branch_menu_items_branch_id ON branch_menu_items(branch_id);
CREATE INDEX idx_branch_menu_items_master_item_id ON branch_menu_items(master_item_id);
CREATE INDEX idx_branch_menu_items_category_id ON branch_menu_items(category_id);
CREATE INDEX idx_customization_groups_master_item_id ON customization_groups(master_item_id);
CREATE INDEX idx_customization_options_group_id ON customization_options(group_id);
CREATE INDEX idx_orders_branch_id ON orders(branch_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_uid ON orders(order_uid);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_restaurant_tables_branch_id ON restaurant_tables(branch_id);
CREATE UNIQUE INDEX idx_table_identifier_unique ON restaurant_tables(branch_id, table_identifier);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_is_active ON promo_codes(is_active);
CREATE INDEX idx_feedback_order_id ON feedback(order_id);
CREATE INDEX idx_service_requests_table_id ON service_requests(table_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
-- Translation indexes
CREATE INDEX idx_menu_item_translations_item_id ON menu_item_translations(item_id);
CREATE INDEX idx_menu_item_translations_language_id ON menu_item_translations(language_id);
CREATE INDEX idx_menu_category_translations_category_id ON menu_category_translations(category_id);
CREATE INDEX idx_menu_category_translations_language_id ON menu_category_translations(language_id);
CREATE INDEX idx_customization_group_translations_group_id ON customization_group_translations(group_id);
CREATE INDEX idx_customization_group_translations_language_id ON customization_group_translations(language_id);
CREATE INDEX idx_customization_option_translations_option_id ON customization_option_translations(option_id);
CREATE INDEX idx_customization_option_translations_language_id ON customization_option_translations(language_id);
CREATE INDEX idx_service_request_translations_request_type ON service_request_translations(request_type);
CREATE INDEX idx_service_request_translations_language_id ON service_request_translations(language_id);

-- DEMO DATA FOR LUNA DINE BANGLADESH

-- Languages
INSERT INTO languages (id, code, name, is_active) VALUES 
(1, 'en', 'English', 1),
(2, 'bn', 'Bengali', 1),
(3, 'hi', 'Hindi', 0),
(4, 'ar', 'Arabic', 0),
(5, 'es', 'Spanish', 0);

-- Service request translations
INSERT INTO service_request_translations (request_type, language_id, display_text) VALUES 
('assistance', 1, 'Assistance'),
('water', 1, 'Water'),
('bill', 1, 'Bill'),
('assistance', 2, 'সহায়তা'),
('water', 2, 'জল'),
('bill', 2, 'বিল'),
('assistance', 3, 'Ayuda'),
('water', 3, 'Agua'),
('bill', 3, 'Cuenta'),
('assistance', 4, 'مساعدة'),
('water', 4, 'ماء'),
('bill', 4, 'فاتورة'),
('assistance', 5, 'Ayuda'),
('water', 5, 'Agua'),
('bill', 5, 'Cuenta');

-- Branches - Luna Dine locations in Bangladesh
INSERT INTO branches (id, name, address, status, phone, default_language_id, settings) VALUES 
(1, 'Luna Dine - Gulshan', '123 Gulshan Avenue, Dhaka 1212', 'open', '+8801712345678', 1, '{"currency":"৳","vat_percentage":15,"currency_symbol":"৳"}'),
(2, 'Luna Dine - Dhanmondi', '456 Satmasjid Road, Dhanmondi, Dhaka 1209', 'open', '+8801812345679', 1, '{"currency":"৳","vat_percentage":15,"currency_symbol":"৳"}'),
(3, 'Luna Dine - Banani', '789 Kemal Ataturk Avenue, Banani, Dhaka 1213', 'open', '+8801912345680', 1, '{"currency":"৳","vat_percentage":15,"currency_symbol":"৳"}'),
(4, 'Luna Dine - Chittagong', '653 GEC Circle, Chittagong 4202', 'open', '+8801612345682', 1, '{"currency":"৳","vat_percentage":15,"currency_symbol":"৳"}'),
(5, 'Luna Dine - Sylhet', '321 Zindabazar, Sylhet 3100', 'open', '+8801512345681', 1, '{"currency":"৳","vat_percentage":15,"currency_symbol":"৳"}');

-- Master menu items with proper image paths
INSERT INTO master_menu_items (id, image_url, tags) VALUES 
(1, 'assets/images/biryani.jpg', '["rice", "meat", "spicy", "popular"]'),
(2, 'assets/images/hilsha.jpg', '["fish", "national", "spicy", "traditional"]'),
(3, 'assets/images/kacchi.jpg', '["rice", "meat", "traditional", "festive"]'),
(4, 'assets/images/tehari.jpg', '["rice", "meat", "spicy", "dhaka-special"]'),
(5, 'assets/images/fuchka.jpg', '["street", "snack", "spicy", "popular"]'),
(6, 'assets/images/chotpoti.jpg', '["street", "snack", "spicy", "chickpea"]'),
(7, 'assets/images/morogpolao.jpg', '["rice", "chicken", "traditional", "festive"]'),
(8, 'assets/images/rui-fish.jpg', '["fish", "curry", "traditional", "freshwater"]'),
(9, 'assets/images/bhuna-khichuri.jpg', '["rice", "lentil", "spicy", "comfort"]'),
(10, 'assets/images/misti-doi.jpg', '["dessert", "sweet", "traditional", "yogurt"]'),
(11, 'assets/images/roshmalai.jpg', '["dessert", "sweet", "traditional", "cheese"]'),
(12, 'assets/images/pitha.jpg', '["dessert", "traditional", "rice", "winter"]'),
(13, 'assets/images/kebab.jpg', '["meat", "grill", "spicy", "appetizer"]'),
(14, 'assets/images/paratha.jpg', '["bread", "traditional", "breakfast"]'),
(15, 'assets/images/vegetable-curry.jpg', '["vegetarian", "curry", "traditional", "healthy"]'),
(16, 'assets/images/mutton-korma.jpg', '["meat", "curry", "traditional", "royal"]'),
(17, 'assets/images/chicken-rezala.jpg', '["chicken", "curry", "creamy", "mughlai"]'),
(18, 'assets/images/luchi-alurdom.jpg', '["bread", "potato", "breakfast", "traditional"]'),
(19, 'assets/images/shingara.jpg', '["snack", "fried", "vegetarian", "popular"]'),
(20, 'assets/images/daal.jpg', '["lentil", "curry", "vegetarian", "essential"]'),
(21, 'assets/images/egg-curry.jpg', '["egg", "curry", "vegetarian", "popular"]'),
(22, 'assets/images/beef-bhuna.jpg', '["beef", "spicy", "traditional", "onion"]'),
(23, 'assets/images/paneer-tikka.jpg', '["paneer", "grill", "vegetarian", "indian"]'),
(24, 'assets/images/fried-rice.jpg', '["rice", "chinese", "fusion", "vegetable"]'),
(25, 'assets/images/chicken-noodles.jpg', '["chicken", "noodles", "fusion", "chinese"]'),
(26, 'assets/images/soup.jpg', '["soup", "chinese", "appetizer", "hot"]'),
(27, 'assets/images/salad.jpg', '["salad", "healthy", "fresh", "vegetarian"]'),
(28, 'assets/images/fresh-juice.jpg', '["juice", "fresh", "healthy", "fruit"]'),
(29, 'assets/images/soft-drinks.jpg', '["drinks", "cold", "beverage", "carbonated"]'),
(30, 'assets/images/hot-tea.jpg', '["tea", "hot", "beverage", "traditional"]'),
(31, 'assets/images/coffee.jpg', '["coffee", "hot", "beverage", "international"]'),
(32, 'assets/images/lassi.jpg', '["yogurt", "drink", "traditional", "cold"]'),
(33, 'assets/images/ice-cream.jpg', '["dessert", "cold", "sweet", "international"]'),
(34, 'assets/images/cake.jpg', '["dessert", "sweet", "bakery", "international"]'),
(35, 'assets/images/pastry.jpg', '["dessert", "sweet", "bakery", "international"]');

-- Menu item translations
-- Biryani
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(1, 1, 'Biryani', 'Fragrant rice dish with meat and spices, a signature dish of Luna Dine'),
(1, 2, 'বিরিয়ানি', 'মসলা দেওয়া সুগন্ধি চালের পদ, লুনা ডাইনের স্বাক্ষর পদ');

-- Hilsha Fish
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(2, 1, 'Hilsha Fish', 'National fish of Bangladesh, cooked in mustard sauce with traditional spices'),
(2, 2, 'ইলিশ মাছ', 'বাংলাদেশের জাতীয় মাছ, সরিষার তেলে ঐতিহ্যবাহী মসলা দিয়ে রান্না');

-- Kacchi Biryani
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(3, 1, 'Kacchi Biryani', 'Traditional biryani with raw meat and rice, slow-cooked to perfection'),
(3, 2, 'কাচ্চি বিরিয়ানি', 'কাঁচা মাংস এবং চাল দিয়ে ঐতিহ্যবাহী বিরিয়ানি, নিখুঁতভাবে ধীরে রান্না');

-- Tehari
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(4, 1, 'Tehari', 'Yellow rice with meat, a Dhaka specialty with aromatic spices'),
(4, 2, 'তেহারি', 'মাংস সহ হলুদ চাল, সুগন্ধি মসলা সহ ঢাকার বিশেষত্ব');

-- Fuchka
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(5, 1, 'Fuchka', 'Crispy hollow spheres filled with spicy tamarind water, popular street food'),
(5, 2, 'ফুচকা', 'ঝাল টকজলে ভরা কুড়মুড়ি, জনপ্রিয় স্ট্রিট ফুড');

-- Chotpoti
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(6, 1, 'Chotpoti', 'Spicy chickpea and potato curry, tangy and flavorful street food'),
(6, 2, 'চটপটি', 'ঝাল ছোলা এবং আলুর ঝোল, টক এবং স্বাদযুক্ত স্ট্রিট ফুড');

-- Morog Polao
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(7, 1, 'Morog Polao', 'Festive rice dish with chicken, aromatic and rich in flavor'),
(7, 2, 'মোরগ পোলাও', 'মুরগি দিয়ে উৎসবের চালের পদ, সুগন্ধি এবং স্বাদে সমৃদ্ধ');

-- Rui Fish Curry
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(8, 1, 'Rui Fish Curry', 'Freshwater fish in traditional curry with authentic Bengali spices'),
(8, 2, 'রুই মাছের ঝোল', 'ঐতিহ্যবাহী ঝোলে তাজা পানির মাছ, প্রামাণিক বাঙালি মসলা সহ');

-- Bhuna Khichuri
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(9, 1, 'Bhuna Khichuri', 'Spiced rice and lentil dish, perfect comfort food for rainy days'),
(9, 2, 'ভুনা খিচুড়ি', 'মসলা দেওয়া চাল এবং ডালের পদ, বৃষ্টির দিনের জন্য নিখুঁত আরামদায়ক খাবার');

-- Misti Doi
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(10, 1, 'Misti Doi', 'Sweetened yogurt in clay pots, a traditional Bengali dessert'),
(10, 2, 'মিষ্টি দই', 'মাটির পাত্রে মিষ্টি দই, একটি ঐতিহ্যবাহী বাঙালি মিষ্টি');

-- Roshmalai
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(11, 1, 'Roshmalai', 'Cheese dumplings in sweet milk, a beloved Bengali sweet'),
(11, 2, 'রসমালাই', 'মিষ্টি দুধে পনিরের বল, একটি প্রিয় বাঙালি মিষ্টি');

-- Pitha
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(12, 1, 'Pitha', 'Traditional rice cakes, winter delicacy with various fillings'),
(12, 2, 'পিঠা', 'ঐতিহ্যবাহী চালের কেক, বিভিন্ন পূরণ সহ শীতকালীন খাবার');

-- Kebab
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(13, 1, 'Kebab', 'Grilled meat skewers with aromatic spices, perfect appetizer'),
(13, 2, 'কাবাব', 'সুগন্ধি মসলা সহ গ্রিল করা মাংসের স্কিউয়ার, নিখুঁত অ্যাপিটাইজার');

-- Paratha
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(14, 1, 'Paratha', 'Flaky flatbread, perfect with curries or for breakfast'),
(14, 2, 'পরোটা', 'ফ্লেকি ফ্ল্যাটব্রেড, ঝোল বা নাস্তার সাথে নিখুঁত');

-- Vegetable Curry
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(15, 1, 'Vegetable Curry', 'Mixed seasonal vegetables in aromatic curry sauce'),
(15, 2, 'সবজির ঝোল', 'সুগন্ধি কারি সসে মৌসুমি মিশ্র সবজি');

-- Mutton Korma
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(16, 1, 'Mutton Korma', 'Tender mutton in rich creamy gravy, royal Mughlai dish'),
(16, 2, 'মাটন কোরমা', 'সমৃদ্ধ ক্রিমি গ্রেভিতে নরম মাংস, রাজকীয় মোগলাই পদ');

-- Chicken Rezala
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(17, 1, 'Chicken Rezala', 'Creamy chicken curry with yogurt, mild and flavorful'),
(17, 2, 'চিকেন রেজালা', 'দই দিয়ে ক্রিমি চিকেন কারি, হালকা এবং স্বাদযুক্ত');

-- Luchi Alur Dom
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(18, 1, 'Luchi Alur Dom', 'Fluffy bread with spicy potato curry, traditional breakfast'),
(18, 2, 'লুচি আলুর দম', 'মসৃণ রুটি ঝাল আলুর ঝোল সহ, ঐতিহ্যবাহী নাস্তা');

-- Shingara
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(19, 1, 'Shingara', 'Triangular pastry with vegetable filling, popular snack'),
(19, 2, 'সিঙাড়া', 'ত্রিকোণাকার পেস্ট্রি সবজি দিয়ে ভরা, জনপ্রিয় নাস্তা');

-- Daal
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(20, 1, 'Daal', 'Lentil curry with spices, essential part of Bengali cuisine'),
(20, 2, 'ডাল', 'মসলা দিয়ে ডালের ঝোল, বাঙালি রন্ধনশৈলীর অপরিহার্য অংশ');

-- Egg Curry
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(21, 1, 'Egg Curry', 'Hard boiled eggs in spicy gravy, comfort food'),
(21, 2, 'ডিমের ঝোল', 'ঝাল গ্রেভিতে সেদ্ধ ডিম, আরামদায়ক খাবার');

-- Beef Bhuna
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(22, 1, 'Beef Bhuna', 'Spicy beef curry with onions, flavorful and aromatic'),
(22, 2, 'বিফ ভুনা', 'পেঁয়াজ দিয়ে ঝাল গরুর মাংস, স্বাদযুক্ত এবং সুগন্ধি');

-- Paneer Tikka
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(23, 1, 'Paneer Tikka', 'Grilled cottage cheese with spices, vegetarian delight'),
(23, 2, 'পনির টিক্কা', 'মসলা দিয়ে গ্রিল করা পনির, নিরামিষ আনন্দ');

-- Fried Rice
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(24, 1, 'Fried Rice', 'Stir fried rice with vegetables, Chinese fusion dish'),
(24, 2, 'ভাজা ভাত', 'সবজি দিয়ে ভাজা চাল, চাইনিজ ফিউশন পদ');

-- Chicken Noodles
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(25, 1, 'Chicken Noodles', 'Stir fried noodles with chicken, popular fusion dish'),
(25, 2, 'চিকেন নুডলস', 'চিকেন দিয়ে ভাজা নুডলস, জনপ্রিয় ফিউশন পদ');

-- Soup
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(26, 1, 'Soup', 'Hot and sour soup with vegetables, Chinese style appetizer'),
(26, 2, 'স্যুপ', 'সবজি দিয়ে গরম এবং টক স্যুপ, চাইনিজ স্টাইল অ্যাপিটাইজার');

-- Salad
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(27, 1, 'Salad', 'Fresh garden salad with dressing, healthy option'),
(27, 2, 'সালাদ', 'ড্রেসিং সহ তাজা বাগানের সালাদ, স্বাস্থ্যকর অপশন');

-- Fresh Juice
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(28, 1, 'Fresh Juice', 'Freshly squeezed fruit juice, refreshing beverage'),
(28, 2, 'তাজা রস', 'তাজা ফলের রস, সতেজ পানীয়');

-- Soft Drinks
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(29, 1, 'Soft Drinks', 'Carbonated beverages, cold and refreshing'),
(29, 2, 'সফট ড্রিংকস', 'কার্বনেটেড পানীয়, ঠান্ডা এবং সতেজ');

-- Hot Tea
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(30, 1, 'Hot Tea', 'Traditional Bengali tea with milk and sugar, hot beverage'),
(30, 2, 'গরম চা', 'দুধ এবং চিনি সহ ঐতিহ্যবাহী বাঙালি চা, গরম পানীয়');

-- Coffee
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(31, 1, 'Coffee', 'Freshly brewed coffee, international hot beverage'),
(31, 2, 'কফি', 'তাজা তৈরি কফি, আন্তর্জাতিক গরম পানীয়');

-- Lassi
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(32, 1, 'Lassi', 'Yogurt based drink, traditional cold beverage'),
(32, 2, 'লস্যি', 'দই ভিত্তিক পানীয়, ঐতিহ্যবাহী ঠান্ডা পানীয়');

-- Ice Cream
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(33, 1, 'Ice Cream', 'Frozen dessert with various flavors, sweet treat'),
(33, 2, 'আইসক্রিম', 'বিভিন্ন স্বাদের জমাট মিষ্টি, মিষ্টি খাবার');

-- Cake
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(34, 1, 'Cake', 'Freshly baked cake with cream, sweet dessert'),
(34, 2, 'কেক', 'ক্রিম সহ তাজা বেকড কেক, মিষ্টি ডেজার্ট');

-- Pastry
INSERT INTO menu_item_translations (item_id, language_id, name, description) VALUES 
(35, 1, 'Pastry', 'Sweet baked goods with various fillings, bakery item'),
(35, 2, 'পেস্ট্রি', 'বিভিন্ন পূরণ সহ মিষ্টি বেকড পণ্য, বেকারি আইটেম');

-- Menu categories for each branch (6 categories per branch)
INSERT INTO menu_categories (id, branch_id, display_order) VALUES 
-- Gulshan branch
(1, 1, 1), (2, 1, 2), (3, 1, 3), (4, 1, 4), (5, 1, 5), (6, 1, 6),
-- Dhanmondi branch
(7, 2, 1), (8, 2, 2), (9, 2, 3), (10, 2, 4), (11, 2, 5), (12, 2, 6),
-- Banani branch
(13, 3, 1), (14, 3, 2), (15, 3, 3), (16, 3, 4), (17, 3, 5), (18, 3, 6),
-- Chittagong branch
(19, 4, 1), (20, 4, 2), (21, 4, 3), (22, 4, 4), (23, 4, 5), (24, 4, 6),
-- Sylhet branch
(25, 5, 1), (26, 5, 2), (27, 5, 3), (28, 5, 4), (29, 5, 5), (30, 5, 6);

-- Menu category translations
INSERT INTO menu_category_translations (category_id, language_id, name) VALUES 
-- English translations
(1, 1, 'Signature Rice'), (2, 1, 'Traditional Curries'), (3, 1, 'Street Food'), (4, 1, 'Desserts'), (5, 1, 'Beverages'), (6, 1, 'Fusion Cuisine'),
(7, 1, 'Biryani Special'), (8, 1, 'Fish Delicacies'), (9, 1, 'Appetizers'), (10, 1, 'Sweets'), (11, 1, 'Drinks'), (12, 1, 'Continental'),
(13, 1, 'Royal Feast'), (14, 1, 'Curry House'), (15, 1, 'Snacks'), (16, 1, 'Bakery'), (17, 1, 'Fresh Juices'), (18, 1, 'Chinese'),
(19, 1, 'Coastal Special'), (20, 1, 'Spicy Delights'), (21, 1, 'Local Favorites'), (22, 1, 'Ice Cream'), (23, 1, 'Cold Drinks'), (24, 1, 'BBQ'),
(25, 1, 'Sylheti Special'), (26, 1, 'Tea Garden'), (27, 1, 'Hill Tracts'), (28, 1, 'Traditional Sweets'), (29, 1, 'Hot Beverages'), (30, 1, 'Riverside'),

-- Bengali translations
(1, 2, 'স্বাক্ষর ভাত'), (2, 2, 'ঐতিহ্যবাহী ঝোল'), (3, 2, 'স্ট্রিট ফুড'), (4, 2, 'মিষ্টি'), (5, 2, 'পানীয়'), (6, 2, 'ফিউশন কুইজিন'),
(7, 2, 'বিরিয়ানি স্পেশাল'), (8, 2, 'মাছের সুস্বাদু'), (9, 2, 'খাবারের পূর্বপান'), (10, 2, 'মিষ্টি'), (11, 2, 'পানীয়'), (12, 2, 'কন্টিনেন্টাল'),
(13, 2, 'রাজকীয় ভোজ'), (14, 2, 'ঝোল হাউস'), (15, 2, 'নাস্তা'), (16, 2, 'বেকারি'), (17, 2, 'তাজা রস'), (18, 2, 'চাইনিজ'),
(19, 2, 'উপকূলীয় বিশেষ'), (20, 2, 'ঝাল সুস্বাদু'), (21, 2, 'স্থানীয় প্রিয়'), (22, 2, 'আইসক্রিম'), (23, 2, 'ঠান্ডা পানীয়'), (24, 2, 'বিবিকিউ'),
(25, 2, 'সিলেটি বিশেষ'), (26, 2, 'চা বাগান'), (27, 2, 'পাহাড়ি এলাকা'), (28, 2, 'ঐতিহ্যবাহী মিষ্টি'), (29, 2, 'গরম পানীয়'), (30, 2, 'নদীর তীর');

-- Branch menu items
INSERT INTO branch_menu_items (branch_id, master_item_id, category_id, price, is_available) VALUES 
-- Luna Dine - Gulshan (Branch 1)
(1, 1, 1, 280.00, 1), (1, 3, 1, 320.00, 1), (1, 4, 1, 250.00, 1), (1, 7, 1, 300.00, 1),
(1, 16, 2, 380.00, 1), (1, 17, 2, 280.00, 1), (1, 8, 2, 350.00, 1), (1, 22, 2, 320.00, 1),
(1, 5, 3, 30.00, 1), (1, 6, 3, 40.00, 1), (1, 19, 3, 25.00, 1), (1, 18, 3, 35.00, 1),
(1, 10, 4, 60.00, 1), (1, 11, 4, 80.00, 1), (1, 12, 4, 50.00, 1), (1, 33, 4, 120.00, 1),
(1, 28, 5, 80.00, 1), (1, 29, 5, 40.00, 1), (1, 30, 5, 30.00, 1), (1, 32, 5, 60.00, 1),
(1, 24, 6, 180.00, 1), (1, 25, 6, 200.00, 1), (1, 26, 6, 120.00, 1), (1, 23, 6, 220.00, 1),

-- Luna Dine - Dhanmondi (Branch 2)
(2, 1, 7, 280.00, 1), (2, 3, 7, 320.00, 1), (2, 4, 7, 250.00, 1), (2, 9, 7, 180.00, 1),
(2, 2, 8, 450.00, 1), (2, 8, 8, 320.00, 1), (2, 21, 8, 150.00, 1), (2, 15, 8, 180.00, 1),
(2, 19, 9, 25.00, 1), (2, 18, 9, 35.00, 1), (2, 27, 9, 100.00, 1), (2, 20, 9, 120.00, 1),
(2, 10, 10, 60.00, 1), (2, 11, 10, 80.00, 1), (2, 12, 10, 50.00, 1), (2, 34, 10, 150.00, 1),
(2, 28, 11, 80.00, 1), (2, 29, 11, 40.00, 1), (2, 31, 11, 70.00, 1), (2, 32, 11, 60.00, 1),
(2, 13, 12, 200.00, 1), (2, 14, 12, 20.00, 1), (2, 23, 12, 220.00, 1), (2, 27, 12, 100.00, 1),

-- Luna Dine - Banani (Branch 3)
(3, 3, 13, 320.00, 1), (3, 7, 13, 300.00, 1), (3, 9, 13, 180.00, 1), (3, 16, 13, 380.00, 1),
(3, 17, 14, 280.00, 1), (3, 22, 14, 320.00, 1), (3, 8, 14, 320.00, 1), (3, 21, 14, 150.00, 1),
(3, 5, 15, 30.00, 1), (3, 6, 15, 40.00, 1), (3, 19, 15, 25.00, 1), (3, 14, 15, 20.00, 1),
(3, 33, 16, 120.00, 1), (3, 34, 16, 150.00, 1), (3, 35, 16, 80.00, 1), (3, 10, 16, 60.00, 1),
(3, 28, 17, 80.00, 1), (3, 32, 17, 60.00, 1), (3, 26, 17, 120.00, 1), (3, 27, 17, 100.00, 1),
(3, 24, 18, 180.00, 1), (3, 25, 18, 200.00, 1), (3, 26, 18, 120.00, 1), (3, 23, 18, 220.00, 1),

-- Luna Dine - Chittagong (Branch 4)
(4, 2, 19, 450.00, 1), (4, 8, 19, 320.00, 1), (4, 13, 19, 200.00, 1), (4, 22, 19, 320.00, 1),
(4, 16, 20, 380.00, 1), (4, 17, 20, 280.00, 1), (4, 22, 20, 320.00, 1), (4, 9, 20, 180.00, 1),
(4, 5, 21, 30.00, 1), (4, 6, 21, 40.00, 1), (4, 19, 21, 25.00, 1), (4, 14, 21, 20.00, 1),
(4, 33, 22, 120.00, 1), (4, 34, 22, 150.00, 1), (4, 35, 22, 80.00, 1), (4, 11, 22, 80.00, 1),
(4, 28, 23, 80.00, 1), (4, 29, 23, 40.00, 1), (4, 32, 23, 60.00, 1), (4, 26, 23, 120.00, 1),
(4, 13, 24, 200.00, 1), (4, 16, 24, 380.00, 1), (4, 22, 24, 320.00, 1), (4, 17, 24, 280.00, 1),

-- Luna Dine - Sylhet (Branch 5)
(5, 1, 25, 280.00, 1), (5, 3, 25, 320.00, 1), (5, 4, 25, 250.00, 1), (5, 7, 25, 300.00, 1),
(5, 15, 26, 180.00, 1), (5, 20, 26, 120.00, 1), (5, 21, 26, 150.00, 1), (5, 23, 26, 220.00, 1),
(5, 5, 27, 30.00, 1), (5, 6, 27, 40.00, 1), (5, 19, 27, 25.00, 1), (5, 18, 27, 35.00, 1),
(5, 10, 28, 60.00, 1), (5, 11, 28, 80.00, 1), (5, 12, 28, 50.00, 1), (5, 35, 28, 80.00, 1),
(5, 30, 29, 30.00, 1), (5, 31, 29, 70.00, 1), (5, 32, 29, 60.00, 1), (5, 28, 29, 80.00, 1),
(5, 2, 30, 450.00, 1), (5, 8, 30, 320.00, 1), (5, 13, 30, 200.00, 1), (5, 16, 30, 380.00, 1);

-- Customization groups
INSERT INTO customization_groups (id, master_item_id, selection_type) VALUES 
(1, 1, 'single'), (2, 1, 'multiple'),
(3, 3, 'single'), (4, 3, 'multiple'),
(5, 5, 'multiple'),
(6, 7, 'single'),
(7, 13, 'multiple'),
(8, 14, 'multiple'),
(9, 16, 'single'),
(10, 17, 'multiple'),
(11, 24, 'multiple'),
(12, 25, 'multiple');

-- Customization group translations
INSERT INTO customization_group_translations (group_id, language_id, name) VALUES 
-- English translations
(1, 1, 'Meat Type'), (2, 1, 'Spice Level'),
(3, 1, 'Serving Size'), (4, 1, 'Extra Toppings'),
(5, 1, 'Fillings'),
(6, 1, 'Chicken Type'),
(7, 1, 'Kebab Type'),
(8, 1, 'Bread Type'),
(9, 1, 'Meat Cut'),
(10, 1, 'Creaminess Level'),
(11, 1, 'Vegetable Mix'),
(12, 1, 'Protein Choice'),

-- Bengali translations
(1, 2, 'মাংসের ধরন'), (2, 2, 'মশলার মাত্রা'),
(3, 2, 'পরিবেশনের আকার'), (4, 2, 'অতিরিক্ত টপিংস'),
(5, 2, 'ভরাট'),
(6, 2, 'মুরগির ধরন'),
(7, 2, 'কাবাবের ধরন'),
(8, 2, 'রুটির ধরন'),
(9, 2, 'মাংসের টুকরা'),
(10, 2, 'ক্রিমের মাত্রা'),
(11, 2, 'সবজি মিশ্রণ'),
(12, 2, 'প্রোটিন পছন্দ');

-- Customization options
INSERT INTO customization_options (id, group_id, additional_price) VALUES 
-- Meat Type options
(1, 1, 0), (2, 1, 30), (3, 1, 50),
-- Spice Level options
(4, 2, 0), (5, 2, 0), (6, 2, 0),
-- Serving Size options
(7, 3, 0), (8, 3, 100), (9, 3, 200),
-- Extra Toppings options
(10, 4, 20), (11, 4, 30), (12, 4, 25),
-- Fillings options
(13, 5, 10), (14, 5, 15), (15, 5, 20),
-- Chicken Type options
(16, 6, 0), (17, 6, 40), (18, 6, 60),
-- Kebab Type options
(19, 7, 0), (20, 7, 30), (21, 7, 50),
-- Bread Type options
(22, 8, 0), (23, 8, 10), (24, 8, 15),
-- Meat Cut options
(25, 9, 0), (26, 9, 40), (27, 9, 60),
-- Creaminess Level options
(28, 10, 0), (29, 10, 0), (30, 10, 0),
-- Vegetable Mix options
(31, 11, 0), (32, 11, 20), (33, 11, 30),
-- Protein Choice options
(34, 12, 0), (35, 12, 40), (36, 12, 60);

-- Customization option translations
INSERT INTO customization_option_translations (option_id, language_id, name) VALUES 
-- Meat Type
(1, 1, 'Beef'), (1, 2, 'গরুর মাংস'),
(2, 1, 'Mutton'), (2, 2, 'খাসির মাংস'),
(3, 1, 'Chicken'), (3, 2, 'মুরগি'),
-- Spice Level
(4, 1, 'Mild'), (4, 2, 'হালকা'),
(5, 1, 'Medium'), (5, 2, 'মাঝারি'),
(6, 1, 'Hot'), (6, 2, 'ঝাল'),
-- Serving Size
(7, 1, 'Regular'), (7, 2, 'নিয়মিত'),
(8, 1, 'Large'), (8, 2, 'বড়'),
(9, 1, 'Family'), (9, 2, 'পারিবারিক'),
-- Extra Toppings
(10, 1, 'Extra Cheese'), (10, 2, 'অতিরিক্ত পনির'),
(11, 1, 'Egg'), (11, 2, 'ডিম'),
(12, 1, 'Nuts'), (12, 2, 'বাদাম'),
-- Fillings
(13, 1, 'Potato'), (13, 2, 'আলু'),
(14, 1, 'Chickpea'), (14, 2, 'ছোলা'),
(15, 1, 'Onion'), (15, 2, 'পেঁয়াজ'),
-- Chicken Type
(16, 1, 'Regular'), (16, 2, 'নিয়মিত'),
(17, 1, 'Free Range'), (17, 2, 'মুক্ত পরিসরে'),
(18, 1, 'Organic'), (18, 2, 'জৈব'),
-- Kebab Type
(19, 1, 'Seekh'), (19, 2, 'শিক'),
(20, 1, 'Shami'), (20, 2, 'শামি'),
(21, 1, 'Boti'), (21, 2, 'বোটি'),
-- Bread Type
(22, 1, 'Regular'), (22, 2, 'নিয়মিত'),
(23, 1, 'Butter'), (23, 2, 'মাখন'),
(24, 1, 'Garlic'), (24, 2, 'রসুন'),
-- Meat Cut
(25, 1, 'Regular'), (25, 2, 'নিয়মিত'),
(26, 1, 'Premium'), (26, 2, 'প্রিমিয়াম'),
(27, 1, 'Lean'), (27, 2, 'চর্বিহীন'),
-- Creaminess Level
(28, 1, 'Light'), (28, 2, 'হালকা'),
(29, 1, 'Medium'), (29, 2, 'মাঝারি'),
(30, 1, 'Rich'), (30, 2, 'ঘন'),
-- Vegetable Mix
(31, 1, 'Regular'), (31, 2, 'নিয়মিত'),
(32, 1, 'Premium'), (32, 2, 'প্রিমিয়াম'),
(33, 1, 'Organic'), (33, 2, 'জৈব'),
-- Protein Choice
(34, 1, 'Chicken'), (34, 2, 'মুরগি'),
(35, 1, 'Beef'), (35, 2, 'গরুর মাংস'),
(36, 1, 'Fish'), (36, 2, 'মাছ');

-- Restaurant tables for each branch
INSERT INTO restaurant_tables (id, branch_id, table_identifier, capacity) VALUES 
-- Gulshan branch tables
(1, 1, 'G01', 2), (2, 1, 'G02', 2), (3, 1, 'G03', 4), (4, 1, 'G04', 4), (5, 1, 'G05', 6), (6, 1, 'G06', 6),
-- Dhanmondi branch tables
(7, 2, 'D01', 2), (8, 2, 'D02', 4), (9, 2, 'D03', 4), (10, 2, 'D04', 6), (11, 2, 'D05', 8),
-- Banani branch tables
(12, 3, 'B01', 2), (13, 3, 'B02', 2), (14, 3, 'B03', 4), (15, 3, 'B04', 4), (16, 3, 'B05', 6),
-- Chittagong branch tables
(17, 4, 'C01', 2), (18, 4, 'C02', 4), (19, 4, 'C03', 4), (20, 4, 'C04', 6), (21, 4, 'C05', 8),
-- Sylhet branch tables
(22, 5, 'S01', 2), (23, 5, 'S02', 2), (24, 5, 'S03', 4), (25, 5, 'S04', 4), (26, 5, 'S05', 6);

-- Promo codes
INSERT INTO promo_codes (id, code, type, value, is_active, min_order_amount) VALUES 
(1, 'WELCOME10', 'percentage', 10.0, 1, 200.0),
(2, 'LUNA20', 'percentage', 20.0, 1, 300.0),
(3, 'BD50', 'fixed', 50.0, 1, 250.0),
(4, 'FESTIVAL15', 'percentage', 15.0, 1, 150.0),
(5, 'STUDENT10', 'percentage', 10.0, 1, 100.0),
(6, 'FAMILY30', 'fixed', 30.0, 1, 400.0),
(7, 'DELIVERYFREE', 'fixed', 40.0, 1, 300.0),
(8, 'BIRYANI20', 'percentage', 20.0, 1, 300.0),
(9, 'LUNCH10', 'percentage', 10.0, 1, 150.0),
(10, 'DINNER15', 'percentage', 15.0, 1, 200.0);

-- Sample orders
INSERT INTO orders (id, order_uid, branch_id, table_id, order_type, status, customer_name, customer_phone, language_id, subtotal, vat_amount, discount_amount, total_amount, promo_code_id, estimated_completion_time) VALUES 
(1, 'ORD2023001', 1, 1, 'dine-in', 'completed', 'Rahim Khan', '+8801712345678', 1, 580.00, 87.00, 58.00, 609.00, 1, '2023-06-15 13:30:00'),
(2, 'ORD2023002', 2, 7, 'dine-in', 'completed', 'Fatema Akter', '+8801812345679', 2, 420.00, 63.00, 84.00, 399.00, 2, '2023-06-15 19:45:00'),
(3, 'ORD2023003', 3, 12, 'takeaway', 'completed', 'Karim Uddin', '+8801912345680', 1, 380.00, 57.00, 0.00, 437.00, NULL, '2023-06-16 12:15:00'),
(4, 'ORD2023004', 4, 17, 'dine-in', 'ready', 'Shamima Islam', '+8801612345682', 1, 770.00, 115.50, 115.50, 770.00, 3, '2023-06-16 19:20:00'),
(5, 'ORD2023005', 5, 22, 'delivery', 'in_kitchen', 'Abdul Malek', '+8801512345681', 2, 540.00, 81.00, 54.00, 567.00, 4, '2023-06-17 20:10:00');

-- Order items
-- Order 1: Biryani and Kebab
INSERT INTO order_items (id, order_id, branch_menu_item_id, quantity, unit_price, customizations) VALUES 
(1, 1, 1, 1, 280.00, '[{"group_id":1,"option_id":1},{"group_id":2,"option_id":5}]'),
(2, 1, 13, 1, 200.00, '[{"group_id":7,"option_id":19}]');

-- Order 2: Fish and Rice
INSERT INTO order_items (id, order_id, branch_menu_item_id, quantity, unit_price, customizations) VALUES 
(3, 2, 8, 1, 320.00, '[]'),
(4, 2, 9, 1, 180.00, '[]');

-- Order 3: Takeaway items
INSERT INTO order_items (id, order_id, branch_menu_item_id, quantity, unit_price, customizations) VALUES 
(5, 3, 3, 1, 320.00, '[{"group_id":3,"option_id":7}]'),
(6, 3, 5, 2, 30.00, '[{"group_id":5,"option_id":13}]');

-- Order 4: Family meal
INSERT INTO order_items (id, order_id, branch_menu_item_id, quantity, unit_price, customizations) VALUES 
(7, 4, 2, 1, 450.00, '[]'),
(8, 4, 16, 1, 380.00, '[{"group_id":9,"option_id":25}]'),
(9, 4, 22, 1, 320.00, '[]');

-- Order 5: Delivery items
INSERT INTO order_items (id, order_id, branch_menu_item_id, quantity, unit_price, customizations) VALUES 
(10, 5, 1, 1, 280.00, '[]'),
(11, 5, 17, 1, 280.00, '[{"group_id":10,"option_id":28}]'),
(12, 5, 32, 2, 60.00, '[]');

-- Feedback
INSERT INTO feedback (id, order_id, overall_rating, food_rating, service_rating, item_feedback, comment) VALUES 
(1, 1, 5, 5, 4, '[{"item_id":1,"rating":5}]', 'Excellent food and service! Will visit again.'),
(2, 2, 4, 4, 4, '[{"item_id":8,"rating":4},{"item_id":9,"rating":4}]', 'Good quality food, friendly staff.'),
(3, 3, 3, 3, 4, '[{"item_id":3,"rating":3},{"item_id":5,"rating":3}]', 'Average food but quick service.'),
(4, 4, 5, 5, 5, '[{"item_id":2,"rating":5},{"item_id":16,"rating":5}]', 'Amazing taste! Best in town.'),
(5, 5, 2, 2, 3, '[{"item_id":1,"rating":2},{"item_id":17,"rating":2}]', 'Food was not fresh enough.');

-- Service requests
INSERT INTO service_requests (id, table_id, request_type, status, created_at, fulfilled_at) VALUES 
(1, 1, 'water', 'fulfilled', '2023-06-15 13:35:00', '2023-06-15 13:37:00'),
(2, 3, 'assistance', 'fulfilled', '2023-06-15 19:25:00', '2023-06-15 19:28:00'),
(3, 7, 'bill', 'fulfilled', '2023-06-15 20:15:00', '2023-06-15 20:20:00'),
(4, 9, 'water', 'pending', '2023-06-16 19:25:00', NULL),
(5, 12, 'assistance', 'fulfilled', '2023-06-16 12:20:00', '2023-06-16 12:22:00');