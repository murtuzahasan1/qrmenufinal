<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LunaDine - Order Food Online</title>
    <meta name="description" content="Order delicious food from your favorite restaurants with LunaDine">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="assets/images/favicon.ico">
    
    <!-- CSS -->
    <link rel="stylesheet" href="assets/css/main.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="assets/css/components.css?v=<?php echo time(); ?>">
    
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#ff6b35">
    
    <!-- Meta tags for PWA -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="LunaDine">
</head>
<body>
    <!-- Loading Spinner -->
    <div id="loading-spinner" class="loading-overlay">
        <div class="spinner">
            <div class="bounce1"></div>
            <div class="bounce2"></div>
            <div class="bounce3"></div>
        </div>
        <p>Loading delicious food...</p>
    </div>

    <!-- Header -->
    <header class="header" id="header">
        <div class="container">
            <div class="header-content">
                <!-- Logo -->
                <div class="logo">
                    <i class="fas fa-utensils"></i>
                    <span>LunaDine</span>
                </div>

                <!-- Navigation -->
                <nav class="nav-menu" id="nav-menu">
                    <ul>
                        <li><a href="#home" class="nav-link active" onclick="showSection('home')">Home</a></li>
                        <li><a href="#menu" class="nav-link" onclick="showSection('menu')">Menu</a></li>
                        <li><a href="#popular" class="nav-link" onclick="showPopularItems()">Popular</a></li>
                        <li><a href="#offers" class="nav-link" onclick="showOffers()">Offers</a></li>
                        <li><a href="#contact" class="nav-link" onclick="showSection('contact')">Contact</a></li>
                    </ul>
                </nav>

                <!-- Header Actions -->
                <div class="header-actions">
                    <!-- Language Selector -->
                    <div class="language-selector">
                        <select id="language-select" onchange="changeLanguage(this.value)">
                            <option value="en">English</option>
                            <option value="bn">বাংলা</option>
                        </select>
                    </div>

                    <!-- User Menu -->
                    <div class="user-menu">
                        <button class="user-btn" onclick="toggleUserMenu()" aria-label="User menu">
                            <i class="fas fa-user"></i>
                        </button>
                        <div class="user-dropdown" id="user-dropdown">
                            <a href="#" onclick="showOrderHistory()"><i class="fas fa-history"></i> Order History</a>
                            <a href="#" onclick="showFavorites()"><i class="fas fa-heart"></i> Favorites</a>
                            <a href="#" onclick="showProfile()"><i class="fas fa-user-edit"></i> Profile</a>
                        </div>
                    </div>

                    <!-- Mobile Menu Toggle -->
                    <button class="mobile-menu-toggle" onclick="toggleMobileMenu()" aria-label="Toggle menu">
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile Navigation Overlay -->
        <div class="mobile-nav-overlay" id="mobile-nav-overlay">
            <div class="mobile-nav-content">
                <div class="mobile-nav-header">
                    <div class="mobile-logo">
                        <i class="fas fa-utensils"></i>
                        <span>LunaDine</span>
                    </div>
                    <button class="mobile-nav-close" onclick="closeMobileNav()" aria-label="Close menu">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mobile-nav-menu">
                    <ul>
                        <li><a href="#home" class="mobile-nav-link" onclick="mobileNavLink('home')"><i class="fas fa-home"></i> Home</a></li>
                        <li><a href="#menu" class="mobile-nav-link" onclick="mobileNavLink('menu')"><i class="fas fa-utensils"></i> Menu</a></li>
                        <li><a href="#popular" class="mobile-nav-link" onclick="mobileNavLink('popular')"><i class="fas fa-fire"></i> Popular</a></li>
                        <li><a href="#offers" class="mobile-nav-link" onclick="mobileNavLink('offers')"><i class="fas fa-tag"></i> Offers</a></li>
                        <li><a href="#contact" class="mobile-nav-link" onclick="mobileNavLink('contact')"><i class="fas fa-envelope"></i> Contact</a></li>
                    </ul>
                </div>
                
                <div class="mobile-nav-actions">
                    <button class="mobile-action-btn" onclick="showOrderHistory(); closeMobileNav();">
                        <i class="fas fa-history"></i> Order History
                    </button>
                    <button class="mobile-action-btn" onclick="showFavorites(); closeMobileNav();">
                        <i class="fas fa-heart"></i> Favorites
                    </button>
                    <button class="mobile-action-btn" onclick="showProfile(); closeMobileNav();">
                        <i class="fas fa-user-edit"></i> Profile
                    </button>
                </div>
            </div>
        </div>
                        <span class="hamburger-line"></span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile Navigation Overlay -->
        <div class="mobile-nav-overlay" id="mobile-nav-overlay">
            <div class="mobile-nav-content">
                <div class="mobile-nav-header">
                    <div class="mobile-logo">
                        <i class="fas fa-utensils"></i>
                        <span>LunaDine</span>
                    </div>
                    <button class="mobile-nav-close" onclick="toggleMobileMenu()" aria-label="Close menu">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <nav class="mobile-nav-menu">
                    <ul>
                        <li><a href="#home" class="mobile-nav-link" onclick="showSection('home'); toggleMobileMenu();">
                            <i class="fas fa-home"></i> Home
                        </a></li>
                        <li><a href="#menu" class="mobile-nav-link" onclick="showSection('menu'); toggleMobileMenu();">
                            <i class="fas fa-utensils"></i> Menu
                        </a></li>
                        <li><a href="#popular" class="mobile-nav-link" onclick="showPopularItems(); toggleMobileMenu();">
                            <i class="fas fa-fire"></i> Popular
                        </a></li>
                        <li><a href="#offers" class="mobile-nav-link" onclick="showOffers(); toggleMobileMenu();">
                            <i class="fas fa-percent"></i> Offers
                        </a></li>
                        <li><a href="#contact" class="mobile-nav-link" onclick="showSection('contact'); toggleMobileMenu();">
                            <i class="fas fa-envelope"></i> Contact
                        </a></li>
                    </ul>
                </nav>

                <div class="mobile-nav-actions">
                    <button class="mobile-action-btn" onclick="showOrderHistory(); toggleMobileMenu();">
                        <i class="fas fa-history"></i>
                        <span>Order History</span>
                    </button>
                    <button class="mobile-action-btn" onclick="showFavorites(); toggleMobileMenu();">
                        <i class="fas fa-heart"></i>
                        <span>Favorites</span>
                    </button>
                    <button class="mobile-action-btn" onclick="showProfile(); toggleMobileMenu();">
                        <i class="fas fa-user-edit"></i>
                        <span>Profile</span>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Hero Section -->
        <section class="hero" id="home">
            <div class="hero-background">
                <div class="hero-overlay"></div>
            </div>
            <div class="container">
                <!-- Default Hero Content -->
                <div class="hero-content" id="default-hero">
                    <h1 class="hero-title">Digital Menu, <span class="highlight">Order Smart</span></h1>
                    <p class="hero-subtitle">Browse our digital menu and place your order for dine-in, takeaway or delivery</p>
                    
                    <!-- Quick Actions -->
                    <div class="quick-actions">
                        <button class="quick-btn" onclick="showNearbyBranches()">
                            <i class="fas fa-utensils"></i>
                            Browse Restaurants
                        </button>
                        <button class="quick-btn" onclick="showPopularItems()">
                            <i class="fas fa-fire"></i>
                            Popular Items
                        </button>
                        <button class="quick-btn" onclick="showOffers()">
                            <i class="fas fa-percent"></i>
                            Special Offers
                        </button>
                    </div>
                </div>

                <!-- Branch Selected Hero Content -->
                <div class="hero-content branch-hero" id="branch-hero" style="display: none;">
                    <div class="branch-hero-container">
                        <div class="branch-card">
                            <!-- Main Branch Info Row -->
                            <div class="branch-info-row">
                                <div class="branch-avatar-wrapper">
                                    <div class="branch-avatar" id="branch-hero-image"></div>
                                </div>
                                <div class="branch-text-info">
                                    <h2 class="branch-title" id="branch-hero-title">Restaurant Name</h2>
                                    <div class="branch-meta-row">
                                        <span class="status-indicator" id="branch-status">Open</span>
                                        <span class="rating-info" id="branch-rating">
                                            <i class="fas fa-star"></i> 4.5
                                        </span>
                                        <span class="delivery-info" id="branch-delivery">30-45 min</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Action Buttons Row -->
                            <div class="branch-actions-row">
                                <button class="branch-action-btn primary-action" onclick="scrollToMenu()" aria-label="View Menu">
                                    <i class="fas fa-utensils"></i>
                                    <span class="action-text">Menu</span>
                                </button>
                                <button class="branch-action-btn secondary-action" onclick="goBackToBranches()" aria-label="Back to Restaurants">
                                    <i class="fas fa-arrow-left"></i>
                                    <span class="action-text">Back</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- QR Code Detection Banner -->
        <div class="qr-banner" id="qr-banner" style="display: none;">
            <div class="container">
                <div class="qr-content">
                    <i class="fas fa-qrcode"></i>
                    <div class="qr-text">
                        <h3>Welcome to <span id="branch-name"></span>!</h3>
                        <p>Table <span id="table-number"></span> • Continue with your order</p>
                    </div>
                    <button class="qr-continue-btn" onclick="proceedFromQR()">
                        View Menu <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Branch Selection Section -->
        <section class="branches-section" id="branches-section">
            <div class="container">
                <div class="section-header">
                    <h2>Choose Your Restaurant</h2>
                    <p>Select from our partner restaurants</p>
                </div>
                
                <!-- Filter Tabs -->
                <div class="filter-tabs">
                    <button class="filter-tab active" data-filter="all">All Restaurants</button>
                    <button class="filter-tab" data-filter="open">Open Now</button>
                    <button class="filter-tab" data-filter="delivery">Delivery Available</button>
                    <button class="filter-tab" data-filter="popular">Popular</button>
                </div>

                <!-- Branch Grid -->
                <div class="branches-grid" id="branches-grid">
                    <!-- Branches will be loaded here -->
                </div>
            </div>
        </section>

        <!-- Menu Section -->
        <section class="menu-section" id="menu-section" style="display: none;">
            <div class="container">
                <!-- Menu Search and Filters -->
                <div class="menu-search-section">
                    <!-- Compact Search Bar -->
                    <div class="compact-search-container">
                        <div class="search-input-wrapper">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" id="menu-search" placeholder="Search menu..." autocomplete="off">
                            <button class="clear-search" id="clear-search" onclick="clearMenuSearch()" style="display: none;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <!-- Filter Toggle Button (Mobile) -->
                        <button class="filters-toggle-btn" onclick="toggleFilters()" aria-label="Toggle filters">
                            <i class="fas fa-filter"></i>
                            <span class="filter-count" id="filter-count" style="display: none;">3</span>
                        </button>
                    </div>

                    <!-- Collapsible Filter Options -->
                    <div class="filters-panel" id="filters-panel">
                        <div class="filters-grid">
                            <select id="category-filter" onchange="filterByCategory()" class="compact-filter">
                                <option value="all">All Categories</option>
                                <!-- Categories will be populated dynamically -->
                            </select>

                            <select id="price-filter" onchange="filterByPrice()" class="compact-filter">
                                <option value="all">All Prices</option>
                                <option value="low">Under ৳200</option>
                                <option value="medium">৳200-৳500</option>
                                <option value="high">Above ৳500</option>
                            </select>

                            <select id="dietary-filter" onchange="filterByDietary()" class="compact-filter">
                                <option value="all">All Items</option>
                                <option value="vegetarian">Vegetarian</option>
                                <option value="vegan">Vegan</option>
                                <option value="spicy">Spicy</option>
                            </select>

                            <button class="filter-reset-btn compact" onclick="resetAllFilters()" title="Reset filters">
                                <i class="fas fa-times"></i>
                                <span class="btn-text">Reset</span>
                            </button>
                        </div>
                    </div>

                    <!-- Active Filters Tags -->
                    <div class="active-filters-compact" id="active-filters" style="display: none;">
                        <div class="filter-tags-scroll" id="filter-tags"></div>
                    </div>
                </div>

                <!-- Menu Content -->
                <div class="menu-content-grid">
                    <!-- Category Navigation (Mobile/Tablet) -->
                    <div class="category-nav-mobile">
                        <div class="category-nav-scroll" id="category-nav-scroll">
                            <!-- Category navigation will be loaded here -->
                        </div>
                    </div>

                    <!-- Menu Grid Layout -->
                    <div class="menu-grid-layout">
                        <!-- Category Sidebar (Desktop) -->
                        <div class="category-sidebar-desktop">
                            <div class="category-list-desktop" id="category-list-desktop">
                                <!-- Categories will be loaded here -->
                            </div>
                        </div>

                        <!-- Menu Items Grid -->
                        <div class="menu-items-grid">
                            <div class="menu-items-container" id="menu-items-container">
                                <!-- Search results info -->
                                <div class="search-results-info" id="search-results-info" style="display: none;">
                                    <span id="results-count">0</span> items found
                                </div>

                                <!-- Menu items grid -->
                                <div class="menu-items-grid-content" id="menu-items-grid">
                                    <!-- Menu items will be loaded here -->
                                </div>

                                <!-- No results message -->
                                <div class="no-results" id="no-results" style="display: none;">
                                    <i class="fas fa-search"></i>
                                    <h3>No items found</h3>
                                    <p>Try adjusting your search or filters</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Order History Section -->
        <section class="order-history-section" id="order-history-section" style="display: none;">
            <div class="container">
                <div class="section-header">
                    <h2>Your Order History</h2>
                    <p>Track your past orders and reorder your favorites</p>
                </div>
                <div class="order-history-list" id="order-history-list">
                    <!-- Order history will be loaded here -->
                </div>
            </div>
        </section>

        <!-- Favorites Section -->
        <section class="favorites-section" id="favorites-section" style="display: none;">
            <div class="container">
                <div class="section-header">
                    <h2>Your Favorite Items</h2>
                    <p>Your most loved dishes, ready to order again</p>
                </div>
                <div class="favorites-grid" id="favorites-grid">
                    <!-- Favorite items will be loaded here -->
                </div>
            </div>
        </section>

        <!-- Popular Items Section -->
        <section class="popular-section" id="popular-section" style="display: none;">
            <div class="container">
                <div class="section-header">
                    <h2>Popular Items</h2>
                    <p>Most loved dishes across all our restaurants</p>
                </div>
                
                <!-- Filter Options -->
                <div class="popular-filters">
                    <button class="filter-btn active" data-filter="all">All Items</button>
                    <button class="filter-btn" data-filter="appetizers">Appetizers</button>
                    <button class="filter-btn" data-filter="mains">Main Course</button>
                    <button class="filter-btn" data-filter="desserts">Desserts</button>
                    <button class="filter-btn" data-filter="beverages">Beverages</button>
                </div>

                <div class="popular-grid" id="popular-grid">
                    <!-- Popular items will be loaded here -->
                </div>
            </div>
        </section>

        <!-- Offers Section -->
        <section class="offers-section" id="offers-section" style="display: none;">
            <div class="container">
                <div class="section-header">
                    <h2>Special Offers</h2>
                    <p>Save more with our exclusive deals and promotions</p>
                </div>
                
                <div class="offers-grid" id="offers-grid">
                    <!-- Offer cards will be loaded here -->
                </div>
            </div>
        </section>

        <!-- Contact Section -->
        <section class="contact-section" id="contact-section" style="display: none;">
            <div class="container">
                <div class="section-header">
                    <h2>Contact Us</h2>
                    <p>Get in touch with us for any queries or feedback</p>
                </div>
                
                <div class="contact-content">
                    <div class="contact-info">
                        <div class="contact-card">
                            <div class="contact-icon">
                                <i class="fas fa-phone"></i>
                            </div>
                            <div class="contact-details">
                                <h3>Phone</h3>
                                <p>+880 1234-567890</p>
                                <p>Available 24/7</p>
                            </div>
                        </div>
                        
                        <div class="contact-card">
                            <div class="contact-icon">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <div class="contact-details">
                                <h3>Email</h3>
                                <p>info@lunadine.com</p>
                                <p>support@lunadine.com</p>
                            </div>
                        </div>
                        
                        <div class="contact-card">
                            <div class="contact-icon">
                                <i class="fas fa-map-marker-alt"></i>
                            </div>
                            <div class="contact-details">
                                <h3>Address</h3>
                                <p>123 Food Street</p>
                                <p>Dhaka, Bangladesh</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="contact-form">
                        <h3>Send us a Message</h3>
                        <form id="contact-form">
                            <div class="form-group">
                                <label for="contact-name">Your Name</label>
                                <input type="text" id="contact-name" required>
                            </div>
                            <div class="form-group">
                                <label for="contact-email">Your Email</label>
                                <input type="email" id="contact-email" required>
                            </div>
                            <div class="form-group">
                                <label for="contact-subject">Subject</label>
                                <input type="text" id="contact-subject" required>
                            </div>
                            <div class="form-group">
                                <label for="contact-message">Message</label>
                                <textarea id="contact-message" rows="5" required></textarea>
                            </div>
                            <button type="submit" class="submit-btn">Send Message</button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Floating Cart -->
    <div class="floating-cart" id="floating-cart" style="display: none;">
        <div class="cart-summary" onclick="toggleCart()">
            <div class="cart-info">
                <span class="cart-count" id="cart-count">0</span>
                <span class="cart-text">View Cart</span>
            </div>
            <div class="cart-total" id="cart-total">৳0</div>
            <i class="fas fa-shopping-cart cart-icon"></i>
        </div>
        
        <!-- Cart Details -->
        <div class="cart-details" id="cart-details">
            <div class="cart-header">
                <h3>Your Order</h3>
                <button class="close-cart" onclick="toggleCart()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="cart-items" id="cart-items">
                <!-- Cart items will be loaded here -->
            </div>
            <div class="cart-footer">
                <div class="cart-totals">
                    <div class="subtotal">
                        <span>Subtotal:</span>
                        <span id="cart-subtotal">৳0</span>
                    </div>
                    <div class="vat">
                        <span>VAT:</span>
                        <span id="cart-vat">৳0</span>
                    </div>
                    <div class="total">
                        <span>Total:</span>
                        <span id="cart-final-total">৳0</span>
                    </div>
                </div>
                <button class="checkout-btn" onclick="proceedToCheckout()">
                    Proceed to Checkout
                </button>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <div id="modal-overlay" class="modal-overlay">
        <!-- Item Customization Modal -->
        <div class="modal item-modal" id="item-modal">
            <div class="modal-header">
                <h3 id="item-modal-title">Item Name</h3>
                <button class="modal-close" onclick="closeModal('item-modal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="item-image">
                    <img id="item-modal-image" src="" alt="Item Image">
                    <div class="placeholder-icon" style="display: none;">
                        <i class="fas fa-image"></i>
                    </div>
                </div>
                <div class="content-area">
                    <div class="item-details">
                        <p id="item-modal-description">Item description</p>
                    </div>
                    <div class="price-section">
                        <div class="item-price">
                            <span id="item-modal-price">৳0</span>
                        </div>
                    </div>
                    <div class="customizations" id="item-customizations">
                        <!-- Customizations will be loaded here -->
                    </div>
                    <div class="quantity-section">
                        <label class="quantity-label">Quantity</label>
                        <div class="quantity-controls">
                            <button class="qty-btn" onclick="updateQuantity(-1)">-</button>
                            <span class="qty-value" id="item-quantity">1</span>
                            <button class="qty-btn" onclick="updateQuantity(1)">+</button>
                        </div>
                    </div>
                    <button class="add-to-cart-btn" onclick="addToCart()">
                        Add to Cart • <span id="item-total-price">৳0</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Checkout Modal -->
        <div class="modal checkout-modal" id="checkout-modal">
            <div class="modal-header">
                <h3>Checkout</h3>
                <button class="modal-close" onclick="closeModal('checkout-modal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="checkout-steps">
                    <div class="step active" data-step="1">
                        <span class="step-number">1</span>
                        <span class="step-title">Order Details</span>
                    </div>
                    <div class="step" data-step="2">
                        <span class="step-number">2</span>
                        <span class="step-title">Customer Info</span>
                    </div>
                    <div class="step" data-step="3">
                        <span class="step-number">3</span>
                        <span class="step-title">Payment</span>
                    </div>
                </div>

                <div class="checkout-content">
                    <!-- Step 1: Order Details -->
                    <div class="checkout-step" id="checkout-step-1">
                        <!-- Order Type Selector -->
                        <div class="order-type-selection">
                            <h4>Select Order Type</h4>
                            <div class="order-type-selector">
                                <button class="order-type-btn active" data-type="dine-in">
                                    <i class="fas fa-utensils"></i>
                                    Dine In
                                </button>
                                <button class="order-type-btn" data-type="takeaway">
                                    <i class="fas fa-shopping-bag"></i>
                                    Takeaway
                                </button>
                                <button class="order-type-btn" data-type="delivery">
                                    <i class="fas fa-motorcycle"></i>
                                    Delivery
                                </button>
                            </div>
                        </div>

                        <div class="order-summary">
                            <h4>Order Summary</h4>
                            <div id="checkout-items"></div>
                            
                            <!-- Table Selection for Dine-in -->
                            <div class="table-selection" id="table-selection" style="display: none;">
                                <h4>Select Table</h4>
                                <div class="tables-grid" id="tables-grid">
                                    <!-- Tables will be loaded here -->
                                </div>
                            </div>

                            <!-- Promo Code -->
                            <div class="promo-section">
                                <div class="promo-input-group">
                                    <input type="text" id="promo-code" placeholder="Enter promo code">
                                    <button onclick="applyPromoCode()">Apply</button>
                                </div>
                                <div class="promo-message" id="promo-message"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 2: Customer Information -->
                    <div class="checkout-step" id="checkout-step-2" style="display: none;">
                        <div class="customer-form">
                            <h4>Customer Information</h4>
                            <form id="customer-form">
                                <div class="form-group">
                                    <label for="customer-name">Full Name *</label>
                                    <input type="text" id="customer-name" required>
                                </div>
                                <div class="form-group">
                                    <label for="customer-phone">Phone Number *</label>
                                    <input type="tel" id="customer-phone" required>
                                </div>
                                
                                <!-- Delivery Address (shown only for delivery) -->
                                <div class="delivery-address" id="delivery-address" style="display: none;">
                                    <div class="form-group">
                                        <label for="customer-address">Delivery Address *</label>
                                        <textarea id="customer-address" rows="3" placeholder="Enter your complete address with landmarks"></textarea>
                                    </div>
                                </div>

                                <!-- Special Instructions -->
                                <div class="form-group">
                                    <label for="special-instructions">Special Instructions (Optional)</label>
                                    <textarea id="special-instructions" rows="2" placeholder="Any special requests for your order..."></textarea>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Step 3: Payment -->
                    <div class="checkout-step" id="checkout-step-3" style="display: none;">
                        <div class="payment-section">
                            <h4>Payment Method</h4>
                            <div class="payment-methods">
                                <div class="payment-method active" data-method="cash">
                                    <i class="fas fa-money-bill-wave"></i>
                                    <span>Cash on Delivery/Pickup</span>
                                </div>
                                <div class="payment-method" data-method="card">
                                    <i class="fas fa-credit-card"></i>
                                    <span>Credit/Debit Card</span>
                                </div>
                                <div class="payment-method" data-method="bkash">
                                    <i class="fas fa-mobile-alt"></i>
                                    <span>bKash</span>
                                </div>
                            </div>

                            <!-- Order Summary -->
                            <div class="final-order-summary">
                                <h4>Final Order Summary</h4>
                                <div class="summary-line">
                                    <span>Subtotal:</span>
                                    <span id="final-subtotal">৳0</span>
                                </div>
                                <div class="summary-line">
                                    <span>VAT (15%):</span>
                                    <span id="final-vat">৳0</span>
                                </div>
                                <div class="summary-line discount" id="final-discount-line" style="display: none;">
                                    <span>Discount:</span>
                                    <span id="final-discount">-৳0</span>
                                </div>
                                <div class="summary-line total">
                                    <span>Total:</span>
                                    <span id="final-total">৳0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="checkout-back-btn" onclick="previousCheckoutStep()" style="display: none;">
                    Back
                </button>
                <button class="btn-primary" id="checkout-next-btn" onclick="nextCheckoutStep()">
                    Continue
                </button>
                <button class="btn-primary" id="place-order-btn" onclick="placeOrder()" style="display: none;">
                    Place Order
                </button>
            </div>
        </div>

        <!-- Order Tracking Modal -->
        <div class="modal tracking-modal" id="tracking-modal">
            <div class="modal-header">
                <h3>Order Tracking</h3>
                <button class="modal-close" onclick="closeModal('tracking-modal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="order-tracking">
                    <div class="order-id">
                        <span>Order ID: </span>
                        <strong id="tracking-order-id">#ORD123456</strong>
                        <span class="order-type-badge" id="order-type-badge">Delivery</span>
                    </div>
                    
                    <div class="tracking-status">
                        <!-- Dynamic Status Timeline Based on Order Type -->
                        <div class="status-timeline" id="status-timeline">
                            <!-- Timeline content will be dynamically generated by JavaScript -->
                        </div>
                    </div>

                    <div class="estimated-time" id="estimated-time-section">
                        <i class="fas fa-clock"></i>
                        <span id="estimated-time-text">Estimated delivery: <strong id="estimated-time">25-30 mins</strong></span>
                    </div>

                    <div class="tracking-actions" id="tracking-actions">
                        <!-- Dynamic Actions Based on Order Type -->
                        <div class="delivery-actions action-group active" data-order-type="delivery">
                            <button class="btn-secondary" onclick="callRestaurant()">
                                <i class="fas fa-phone"></i>
                                Call Restaurant
                            </button>
                            <button class="btn-secondary" onclick="callDeliveryPerson()">
                                <i class="fas fa-motorcycle"></i>
                                Call Driver
                            </button>
                            <button class="btn-secondary" onclick="shareLocation()">
                                <i class="fas fa-map-marker-alt"></i>
                                Share Location
                            </button>
                            <button class="btn-secondary" onclick="trackOnMap()">
                                <i class="fas fa-map"></i>
                                Track on Map
                            </button>
                        </div>

                        <div class="takeaway-actions action-group" data-order-type="takeaway">
                            <button class="btn-secondary" onclick="callRestaurant()">
                                <i class="fas fa-phone"></i>
                                Call Restaurant
                            </button>
                            <button class="btn-secondary" onclick="getDirections()">
                                <i class="fas fa-directions"></i>
                                Get Directions
                            </button>
                            <button class="btn-secondary" onclick="viewPickupDetails()">
                                <i class="fas fa-info-circle"></i>
                                Pickup Details
                            </button>
                        </div>

                        <div class="dinein-actions action-group" data-order-type="dine-in">
                            <button class="btn-secondary" onclick="callWaiter()">
                                <i class="fas fa-hand-paper"></i>
                                Call Waiter
                            </button>
                            <button class="btn-secondary" onclick="requestWater()">
                                <i class="fas fa-tint"></i>
                                Request Water
                            </button>
                            <button class="btn-secondary" onclick="requestBill()">
                                <i class="fas fa-receipt"></i>
                                Request Bill
                            </button>
                            <button class="btn-secondary" onclick="addMoreItems()">
                                <i class="fas fa-plus"></i>
                                Add More Items
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Service Request Modal -->
        <div class="modal service-modal" id="service-modal">
            <div class="modal-header">
                <h3>Request Service</h3>
                <button class="modal-close" onclick="closeModal('service-modal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="service-options">
                    <button class="service-option" onclick="requestService('assistance')">
                        <i class="fas fa-hand-paper"></i>
                        <span>Call Waiter</span>
                    </button>
                    <button class="service-option" onclick="requestService('water')">
                        <i class="fas fa-tint"></i>
                        <span>Request Water</span>
                    </button>
                    <button class="service-option" onclick="requestService('bill')">
                        <i class="fas fa-receipt"></i>
                        <span>Request Bill</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Order History Modal -->
        <div class="modal history-modal" id="history-modal">
            <div class="modal-header">
                <h3>Your Order History</h3>
                <button class="modal-close" onclick="closeModal('history-modal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="history-filters">
                    <button class="filter-btn active" data-filter="all">All Orders</button>
                    <button class="filter-btn" data-filter="delivered">Delivered</button>
                    <button class="filter-btn" data-filter="cancelled">Cancelled</button>
                </div>
                <div class="history-list" id="history-list">
                    <!-- Order history items will be loaded here -->
                </div>
            </div>
        </div>

        <!-- Favorites Modal -->
        <div class="modal favorites-modal" id="favorites-modal">
            <div class="modal-header">
                <h3>Your Favorite Items</h3>
                <button class="modal-close" onclick="closeModal('favorites-modal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="favorites-content">
                    <div class="favorites-header">
                        <p>Your most loved dishes, ready to order again</p>
                        <button class="clear-favorites-btn" onclick="clearAllFavorites()">
                            <i class="fas fa-trash"></i>
                            Clear All
                        </button>
                    </div>
                    <div class="favorites-grid" id="favorites-modal-grid">
                        <!-- Favorite items will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Notifications -->
    <div class="notifications-container" id="notifications">
        <!-- Notifications will appear here -->
    </div>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <div class="footer-logo">
                        <i class="fas fa-utensils"></i>
                        <span>LunaDine</span>
                    </div>
                    <p>Browse our digital menu and place your order for dine-in, takeaway or delivery</p>
                </div>
                
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="#home" onclick="showSection('home')">Home</a></li>
                        <li><a href="#menu" onclick="showSection('menu')">Menu</a></li>
                        <li><a href="#popular" onclick="showPopularItems()">Popular Items</a></li>
                        <li><a href="#offers" onclick="showOffers()">Offers</a></li>
                        <li><a href="#contact" onclick="showSection('contact')">Contact</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h4>Contact Info</h4>
                    <ul>
                        <li><a href="tel:+8801234567890"><i class="fas fa-phone"></i> +880 1234-567890</a></li>
                        <li><a href="mailto:info@lunadine.com"><i class="fas fa-envelope"></i> info@lunadine.com</a></li>
                        <li><span><i class="fas fa-map-marker-alt"></i> Dhaka, Bangladesh</span></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h4>Follow Us</h4>
                    <div class="social-links">
                        <a href="#" aria-label="Facebook"><i class="fab fa-facebook"></i></a>
                        <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                        <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2025 LunaDine. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- JavaScript -->
    <script src="assets/js/app.js"></script>
    <script src="assets/js/menu.js"></script>
    <script src="assets/js/cart.js"></script>
    <script src="assets/js/orders.js"></script>
    
    <!-- Initialize Application -->
    <script>
        // Global app instance
        let app;
        
        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            try {
                app = new LunaDineApp();
                window.app = app; // Make globally accessible
                
                // Initialize menu manager
                window.menu = new MenuManager();
                console.log('Menu manager initialized:', window.menu);
                
                console.log('LunaDine app initialized successfully', app);
                
                // Add mobile touch support for cart
                const cartSummary = document.querySelector('.cart-summary');
                if (cartSummary) {
                    cartSummary.addEventListener('touchstart', function(e) {
                        console.log('Cart touched on mobile');
                    });
                    cartSummary.addEventListener('touchend', function(e) {
                        e.preventDefault();
                        console.log('Cart touch ended, calling toggleCart');
                        toggleCart();
                    });
                }
                
                // Test cart functionality
                setTimeout(() => {
                    console.log('Cart object:', app.cart);
                    console.log('Cart toggle function:', typeof app.cart.toggle);
                }, 1000);
                
            } catch (error) {
                console.error('Failed to initialize app:', error);
            }
        });
        
        // Global functions for onclick handlers
        function toggleCart() {
            console.log('toggleCart called');
            if (window.app && window.app.cart) {
                console.log('Calling cart toggle');
                window.app.cart.toggle();
            } else {
                console.error('Cart function called but app not ready');
            }
        }
        
        // Filter toggle function for mobile
        function toggleFilters() {
            const filtersPanel = document.getElementById('filters-panel');
            const toggleBtn = document.querySelector('.filters-toggle-btn');
            
            if (filtersPanel.style.display === 'none' || filtersPanel.style.display === '') {
                filtersPanel.style.display = 'block';
                toggleBtn.classList.add('active');
            } else {
                filtersPanel.style.display = 'none';
                toggleBtn.classList.remove('active');
            }
        }
        
        // Update filter count display
        function updateFilterCount() {
            const categoryFilter = document.getElementById('category-filter');
            const priceFilter = document.getElementById('price-filter');
            const dietaryFilter = document.getElementById('dietary-filter');
            const filterCountEl = document.getElementById('filter-count');
            
            let activeCount = 0;
            if (categoryFilter && categoryFilter.value !== 'all') activeCount++;
            if (priceFilter && priceFilter.value !== 'all') activeCount++;
            if (dietaryFilter && dietaryFilter.value !== 'all') activeCount++;
            
            if (activeCount > 0) {
                filterCountEl.textContent = activeCount;
                filterCountEl.style.display = 'inline';
            } else {
                filterCountEl.style.display = 'none';
            }
        }
        
        // Global filter functions
        function filterByCategory() {
            if (window.app && window.app.filterByCategory) {
                window.app.filterByCategory();
                updateFilterCount();
            }
        }
        
        function filterByPrice() {
            if (window.app && window.app.filterByPrice) {
                window.app.filterByPrice();
                updateFilterCount();
            }
        }
        
        function filterByDietary() {
            if (window.app && window.app.filterByDietary) {
                window.app.filterByDietary();
                updateFilterCount();
            }
        }
        
        function clearMenuSearch() {
            if (window.app && window.app.clearMenuSearch) {
                window.app.clearMenuSearch();
                updateFilterCount();
            }
        }
        
        function resetAllFilters() {
            if (window.app && window.app.resetAllFilters) {
                window.app.resetAllFilters();
                updateFilterCount();
                
                // Also hide the filters panel on mobile
                const filtersPanel = document.getElementById('filters-panel');
                const toggleBtn = document.querySelector('.filters-toggle-btn');
                if (window.innerWidth <= 768) {
                    filtersPanel.style.display = 'none';
                    toggleBtn.classList.remove('active');
                }
            }
        }
        
        function proceedToCheckout() {
            console.log('proceedToCheckout called');
            if (window.app && window.app.cart) {
                console.log('Calling cart proceedToCheckout');
                window.app.cart.proceedToCheckout();
            } else {
                console.error('Checkout function called but app not ready');
            }
        }
        
        function nextCheckoutStep() {
            console.log('nextCheckoutStep called');
            if (window.app && window.app.cart) {
                console.log('Calling cart nextCheckoutStep');
                window.app.cart.nextCheckoutStep();
            } else {
                console.error('nextCheckoutStep function called but app not ready');
            }
        }
        
        function previousCheckoutStep() {
            console.log('previousCheckoutStep called');
            if (window.app && window.app.cart) {
                console.log('Calling cart previousCheckoutStep');
                window.app.cart.previousCheckoutStep();
            } else {
                console.error('previousCheckoutStep function called but app not ready');
            }
        }
        
        function closeModal(modalId) {
            if (window.app) {
                window.app.closeModal(modalId);
            }
        }
        
        function openItemModal(item) {
            if (window.menu) {
                window.menu.openItemModal(item);
            }
        }
        
        // Simple global functions for menu interactions
        function toggleItemFavorite(itemId, button) {
            console.log('Toggle favorite called for item:', itemId);
            console.log('Button element:', button);
            console.log('Button current classes:', button.className);
            
            if (window.app && window.app.toggleFavorite) {
                window.app.toggleFavorite(itemId, button);
                
                // Double-check the state after toggle
                setTimeout(() => {
                    const isFavorite = window.app.isFavoriteItem(itemId);
                    console.log('After toggle - isFavorite:', isFavorite);
                    console.log('Button classes after toggle:', button.className);
                    
                    // Force update if needed
                    if (isFavorite && !button.classList.contains('active')) {
                        console.log('Forcing active class addition');
                        button.classList.add('active');
                    } else if (!isFavorite && button.classList.contains('active')) {
                        console.log('Forcing active class removal');
                        button.classList.remove('active');
                    }
                }, 100);
            } else {
                console.error('App not ready for favorite toggle');
            }
        }
        
        function addItemToCart(item) {
            console.log('Add to cart called for item:', item);
            if (window.app && window.app.cart && window.app.cart.addItem) {
                const cartItem = {
                    ...item,
                    quantity: 1,
                    customizations: []
                };
                window.app.cart.addItem(cartItem);
                console.log('Item added to cart successfully');
            } else {
                console.error('Cart not ready');
            }
        }
        
        // Cart quantity control functions
        function updateCartQuantity(cartItemId, newQuantity) {
            console.log('updateCartQuantity called:', cartItemId, newQuantity);
            console.log('cartItemId type:', typeof cartItemId);
            console.log('newQuantity type:', typeof newQuantity);
            
            if (window.app && window.app.cart && window.app.cart.updateItemQuantity) {
                window.app.cart.updateItemQuantity(cartItemId, newQuantity);
                console.log('Cart updateItemQuantity called');
            } else {
                console.error('Cart not ready for quantity update');
            }
        }
        
        function removeCartItem(cartItemId) {
            console.log('removeCartItem called:', cartItemId);
            console.log('cartItemId type:', typeof cartItemId);
            
            if (window.app && window.app.cart && window.app.cart.removeItem) {
                window.app.cart.removeItem(cartItemId);
                console.log('Cart removeItem called');
            } else {
                console.error('Cart not ready for item removal');
            }
        }
    </script>
    
    <!-- Service Worker for PWA -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('sw.js')
                    .then(function(registration) {
                        console.log('ServiceWorker registration successful with scope:', registration.scope);
                    })
                    .catch(function(err) {
                        console.log('ServiceWorker registration failed:', err);
                    });
            });
        }
    </script>
</body>
</html>
