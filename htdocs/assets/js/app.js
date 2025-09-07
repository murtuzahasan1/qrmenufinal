// LunaDine - Main Application JavaScript
// Handles initialization, navigation, and core functionality

class LunaDineApp {
    constructor() {
        this.currentBranch = null;
        this.currentTable = null;
        this.currentLanguage = 'en';
        this.branches = [];
        this.languages = [];
        this.cart = new ShoppingCart();
        this.orders = new OrderManager();
        this.modalJustOpened = false; // Flag to prevent immediate closing
        this.favoritesLoadTimeout = null; // Debounce timeout for favorites loading
        this.lastFavoritesContent = null; // Cache for favorites content comparison
        
        this.init();
    }

    async init() {
        try {
            // Show loading spinner
            this.showLoading();

            // Check for QR code parameters
            this.checkQRParameters();

            // Load initial data
            await this.loadLanguages();
            await this.loadBranches();

            // Initialize UI
            this.initializeUI();
            this.bindEvents();

            // Hide loading spinner
            this.hideLoading();

            // Load user data from localStorage
            this.loadUserData();

        } catch (error) {
            console.error('Initialization error:', error);
            this.showNotification('Failed to load application', 'error');
            this.hideLoading();
        }
    }

    // QR Code Detection
    checkQRParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const branchId = urlParams.get('branch_id') || urlParams.get('branch');
        const tableId = urlParams.get('table_id') || urlParams.get('table');

        if (branchId && tableId) {
            this.currentBranch = { id: branchId };
            this.currentTable = { id: tableId };
            this.showQRBanner(branchId, tableId);
        }
    }

    async showQRBanner(branchId, tableId) {
        try {
            // Get branch details
            const response = await fetch(`api/index.php?branches=1`);
            if (!response.ok) {
                throw new Error('Failed to fetch branches');
            }
            const branches = await response.json();
            const branch = branches.find(b => b.id == branchId);

            if (branch) {
                document.getElementById('branch-name').textContent = branch.name;
                document.getElementById('table-number').textContent = tableId;
                document.getElementById('qr-banner').style.display = 'block';
                
                // Auto-scroll to menu after 3 seconds
                setTimeout(() => {
                    this.proceedFromQR();
                }, 3000);
            }
        } catch (error) {
            console.error('Error loading QR branch data:', error);
        }
    }

    proceedFromQR() {
        document.getElementById('qr-banner').style.display = 'none';
        this.showBranchMenu(this.currentBranch.id);
        
        // Set default order type to dine-in and preselect table
        setTimeout(() => {
            const dineInBtn = document.querySelector('[data-type="dine-in"]');
            if (dineInBtn) {
                this.selectOrderType('dine-in');
                dineInBtn.click();
            }
        }, 1000);
    }

    // API Calls
    async loadLanguages() {
        try {
            const response = await fetch('api/index.php?languages=1');
            if (!response.ok) {
                throw new Error('Failed to fetch languages');
            }
            this.languages = await response.json();
            this.populateLanguageSelector();
        } catch (error) {
            console.error('Error loading languages:', error);
        }
    }

    async loadBranches() {
        try {
            const response = await fetch('api/index.php?branches=1');
            if (!response.ok) {
                throw new Error('Failed to fetch branches');
            }
            this.branches = await response.json();
            this.displayBranches();
        } catch (error) {
            console.error('Error loading branches:', error);
            this.showNotification('Failed to load restaurants', 'error');
        }
    }

    async loadBranchSettings(branchId) {
        try {
            const response = await fetch(`api/index.php?settings=1&branch_id=${branchId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch settings');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading branch settings:', error);
            return null;
        }
    }

    async loadMenu(branchId, language = null) {
        try {
            const lang = language || this.currentLanguage;
            const response = await fetch(`api/index.php?menu=1&branch_id=${branchId}&language=${lang}`);
            if (!response.ok) {
                throw new Error('Failed to fetch menu');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading menu:', error);
            this.showNotification('Failed to load menu', 'error');
            return null;
        }
    }

    async loadTables(branchId) {
        try {
            const response = await fetch(`api/index.php?tables=1&branch_id=${branchId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch tables');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading tables:', error);
            return [];
        }
    }

    // UI Population
    populateLanguageSelector() {
        const select = document.getElementById('language-select');
        select.innerHTML = '';
        
        this.languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.name;
            if (lang.code === this.currentLanguage) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    displayBranches(filteredBranches = null) {
        const branchesToShow = filteredBranches || this.branches;
        const grid = document.getElementById('branches-grid');
        grid.innerHTML = '';

        if (branchesToShow.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-store-slash"></i>
                    <h3>No restaurants found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        branchesToShow.forEach(branch => {
            const branchCard = this.createBranchCard(branch);
            grid.appendChild(branchCard);
        });
    }

    createBranchCard(branch) {
        const card = document.createElement('div');
        card.className = 'branch-card';
        card.onclick = () => this.selectBranch(branch);

        card.innerHTML = `
            <div class="branch-image">
                <div class="branch-status ${branch.status}">${branch.status}</div>
            </div>
            <div class="branch-info">
                <h3 class="branch-name">${branch.name}</h3>
                <p class="branch-address">${branch.address}</p>
                <div class="branch-meta">
                    <span class="branch-phone">${branch.phone}</span>
                    <div class="branch-rating">
                        <i class="fas fa-star"></i>
                        <span>4.2</span>
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    // This method is replaced by the enhanced version below

    async showBranchMenu(branchId) {
        try {
            this.showLoading();

            // Load menu data
            const [menuData, settings] = await Promise.all([
                this.loadMenu(branchId),
                this.loadBranchSettings(branchId)
            ]);

            if (!menuData) {
                this.hideLoading();
                return;
            }

            // Update current branch with settings
            if (settings) {
                this.currentBranch.settings = settings;
            }

            // Hide branches section and show menu
            document.getElementById('branches-section').style.display = 'none';
            document.getElementById('menu-section').style.display = 'block';

            // Update restaurant info
            document.getElementById('current-restaurant-name').textContent = this.currentBranch.name;
            document.getElementById('current-restaurant-address').textContent = this.currentBranch.address;
            document.getElementById('current-restaurant-status').textContent = this.currentBranch.status;
            document.getElementById('current-restaurant-status').className = `status ${this.currentBranch.status}`;

            // Display menu
            this.displayMenu(menuData);

            // Initialize cart for this branch
            this.cart.setBranch(this.currentBranch);

            this.hideLoading();

        } catch (error) {
            console.error('Error showing branch menu:', error);
            this.showNotification('Failed to load menu', 'error');
            this.hideLoading();
        }
    }

    displayMenu(menuData) {
        console.log('🍽️ App displayMenu called with:', menuData);
        // Store menu data for filtering
        this.currentMenuData = menuData;
        
        // Populate category filters and navigation
        this.populateMenuCategories();
        
        // Initialize search functionality
        this.initializeMenuSearch();
        
        // Display all items initially using the app's system
        this.performMenuSearch('');
        
        // Also store menu data in MenuManager for modal functionality
        if (window.menu) {
            console.log('📋 Storing menu data in MenuManager for modal handling');
            window.menu.currentMenu = menuData;
        } else {
            console.error('❌ MenuManager not found on window object');
        }
        
        // For legacy compatibility with category sidebar (if still exists)
        const legacyCategoriesContainer = document.getElementById('category-list');
        if (legacyCategoriesContainer) {
            legacyCategoriesContainer.innerHTML = '';
            menuData.categories.forEach((category, index) => {
                const categoryItem = document.createElement('div');
                categoryItem.className = `category-item ${index === 0 ? 'active' : ''}`;
                categoryItem.textContent = category.name;
                categoryItem.onclick = () => this.scrollToCategory(category.id);
                legacyCategoriesContainer.appendChild(categoryItem);
            });
        }
    }

    createLegacyMenuItemCard(item) {
        const card = document.createElement('div');
        card.className = 'menu-item';
        card.onclick = () => this.openItemModal(item);

        const currencySymbol = this.currentBranch.settings?.currency_symbol || '৳';
        const isFavorite = this.isFavoriteItem(item.branch_menu_item_id);

        card.innerHTML = `
            <div class="item-image" style="background-image: url('${item.image_url || ''}')">
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); app.toggleFavorite(${item.branch_menu_item_id}, this)">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="item-details">
                <h4 class="item-name">${item.name}</h4>
                <p class="item-description">${item.description || ''}</p>
                <div class="item-tags">
                    ${item.tags.map(tag => `<span class="item-tag">${tag}</span>`).join('')}
                </div>
                <div class="item-footer">
                    <span class="item-price">${currencySymbol}${item.price}</span>
                    <button class="add-btn" onclick="event.stopPropagation(); app.quickAddToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                        Add
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    // Navigation and UI
    goBackToBranches() {
        document.getElementById('menu-section').style.display = 'none';
        document.getElementById('branches-section').style.display = 'block';
        
        // Show hero section when going back to branches
        const heroSection = document.getElementById('home');
        if (heroSection) {
            heroSection.style.display = 'block';
        }
        
        // Reset hero to default view
        document.getElementById('default-hero').style.display = 'block';
        document.getElementById('branch-hero').style.display = 'none';
        
        this.currentBranch = null;
        this.cart.clear();
        
        // Update navigation to home
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const homeLink = document.querySelector('[href="#home"]');
        if (homeLink) {
            homeLink.classList.add('active');
        }
    }

    scrollToCategory(categoryId) {
        const element = document.getElementById(`category-${categoryId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Update active category
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.classList.add('active');
    }

    setupCategoryObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const categoryId = entry.target.id.replace('category-', '');
                    this.highlightCategory(categoryId);
                }
            });
        }, { rootMargin: '-50% 0px -50% 0px' });

        document.querySelectorAll('.menu-category').forEach(category => {
            observer.observe(category);
        });
    }

    highlightCategory(categoryId) {
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = Array.from(document.querySelectorAll('.category-item')).find(item => {
            return item.onclick && item.onclick.toString().includes(categoryId);
        });
        
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    // Order Type Selection
    selectOrderType(type) {
        // Update UI
        document.querySelectorAll('.order-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

        // Update cart
        this.cart.setOrderType(type);

        // Show/hide relevant sections in checkout
        this.updateCheckoutSections(type);
    }

    updateCheckoutSections(orderType) {
        const tableSelection = document.getElementById('table-selection');
        const deliveryAddress = document.getElementById('delivery-address');

        if (orderType === 'dine-in') {
            tableSelection.style.display = 'block';
            deliveryAddress.style.display = 'none';
        } else if (orderType === 'delivery') {
            tableSelection.style.display = 'none';
            deliveryAddress.style.display = 'block';
        } else {
            tableSelection.style.display = 'none';
            deliveryAddress.style.display = 'none';
        }
    }

    // Search and Filtering
    searchBranches() {
        const query = document.getElementById('branch-search').value.toLowerCase().trim();
        
        if (query === '') {
            this.displayBranches();
            return;
        }

        const filtered = this.branches.filter(branch => 
            branch.name.toLowerCase().includes(query) ||
            branch.address.toLowerCase().includes(query)
        );

        this.displayBranches(filtered);
    }

    filterBranches(filter) {
        // Update active filter tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');

        let filtered;
        switch (filter) {
            case 'open':
                filtered = this.branches.filter(branch => branch.status === 'open');
                break;
            case 'delivery':
                filtered = this.branches; // All branches support delivery for now
                break;
            case 'popular':
                filtered = this.branches.slice(0, 6); // Show first 6 as popular
                break;
            default:
                filtered = this.branches;
        }

        this.displayBranches(filtered);
    }

    // Quick Actions
    showNearbyBranches() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // For demo purposes, just show all branches
                    // In real implementation, calculate distance and sort
                    this.showNotification('Showing nearby restaurants', 'info');
                    this.displayBranches();
                },
                (error) => {
                    this.showNotification('Unable to get your location', 'warning');
                    this.displayBranches();
                }
            );
        } else {
            this.showNotification('Geolocation not supported', 'warning');
            this.displayBranches();
        }
    }

    showPopularItems() {
        this.showSection('popular');
        this.loadPopularItems();
    }

    async loadPopularItems() {
        try {
            // Fetch popular items from database API
            const response = await fetch('api/index.php?menu=1&branch_id=1&language=en');
            if (!response.ok) {
                throw new Error('Failed to fetch popular items');
            }
            const data = await response.json();
            
            // Filter for popular items (items with popular tag)
            const popularItems = [];
            if (data.categories) {
                data.categories.forEach(category => {
                    if (category.items) {
                        category.items.forEach(item => {
                            if (item.tags && item.tags.includes('popular') && item.is_available) {
                                popularItems.push({
                                    ...item,
                                    category: category.name
                                });
                            }
                        });
                    }
                });
            }
            
            this.displayPopularItems(popularItems.slice(0, 6));
        } catch (error) {
            console.error('Error loading popular items:', error);
            this.showNotification('Failed to load popular items', 'error');
        }
    }

    displayPopularItems(items) {
        const grid = document.getElementById('popular-grid');
        const currencySymbol = '৳';
        
        if (!items || items.length === 0) {
            grid.innerHTML = '<div class="empty-state">No popular items available at the moment.</div>';
            return;
        }
        
        grid.innerHTML = items.map(item => `
            <div class="popular-item" data-category="${item.category || 'other'}">
                <div class="popular-item-badge">Popular</div>
                <div class="popular-item-image" style="background-image: url('${item.image_url || 'assets/images/placeholder-food.jpg'}')"></div>
                <div class="popular-item-content">
                    <div class="popular-item-header">
                        <div>
                            <div class="popular-item-name">${item.name}</div>
                            <div class="popular-item-restaurant">${item.branch_name || 'Luna Dine'}</div>
                        </div>
                        <div class="popular-item-rating">
                            <i class="fas fa-star"></i>
                            ${item.rating || '4.5'}
                        </div>
                    </div>
                    <div class="popular-item-description">${item.description}</div>
                    <div class="popular-item-footer">
                        <div class="popular-item-price">${currencySymbol}${parseFloat(item.price).toFixed(2)}</div>
                        <button class="add-btn" onclick="app.addPopularToCart(${item.id})">
                            <i class="fas fa-plus"></i> Add
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add filter functionality
        this.setupPopularFilters();
    }

    setupPopularFilters() {
        document.querySelectorAll('.popular-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.popular-filters .filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterPopularItems(e.target.dataset.filter);
            });
        });
    }

    filterPopularItems(category) {
        const items = document.querySelectorAll('.popular-item');
        items.forEach(item => {
            if (category === 'all' || item.dataset.category === category) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    addPopularToCart(itemId) {
        const items = this.getMockPopularItems();
        const item = items.find(i => i.id === itemId);
        
        if (item) {
            // Add to favorites as well
            this.addToFavorites(item);
            this.showNotification(`${item.name} added to favorites!`, 'success');
        }
    }

    addToFavorites(item) {
        console.log('Adding to favorites - item data:', item); // Debug log
        
        let favorites = JSON.parse(localStorage.getItem('lunadine_favorites') || '[]');
        
        // Check if already in favorites using multiple ID fields
        const itemId = item.id || item.branch_menu_item_id || item.item_id;
        if (!favorites.find(fav => 
            (fav.id && fav.id === itemId) || 
            (fav.branch_menu_item_id && fav.branch_menu_item_id === itemId)
        )) {
            // Get the name from available properties (more comprehensive)
            const itemName = item.name || item.item_name || item.menu_item_name || item.title || 'Unknown Item';
            console.log('Item name resolved to:', itemName); // Debug log
            
            // Create a standardized favorite item structure
            const favoriteItem = {
                id: itemId,
                branch_menu_item_id: item.branch_menu_item_id || itemId,
                name: itemName,
                price: item.price || item.selling_price || item.menu_price || item.cost || 0,
                image_url: item.image_url || item.image || item.photo || item.picture || 'assets/images/placeholder-food.jpg',
                branch_name: this.currentBranch?.name || item.branch_name || 'Restaurant',
                branch_id: this.currentBranch?.id || item.branch_id,
                category: item.category || item.category_name || 'Food',
                description: item.description || item.details || '',
                addedAt: new Date().toISOString(),
                // Preserve original data as backup
                originalData: item
            };
            
            console.log('Favorite item created:', favoriteItem); // Debug log
            
            favorites.push(favoriteItem);
            localStorage.setItem('lunadine_favorites', JSON.stringify(favorites));
        }
    }

    showOffers() {
        this.showSection('offers');
        this.loadOffers();
    }

    async loadOffers() {
        try {
            // Load offers from database
            console.log('Starting loadOffers...');
            const response = await fetch('api/index.php?promocode=1');
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error('Failed to fetch offers');
            }
            
            const data = await response.json();
            console.log('API Response data:', data);
            
            if (data.success && data.promocodes) {
                console.log('Using data.promocodes:', data.promocodes);
                this.displayOffers(data.promocodes);
            } else if (Array.isArray(data)) {
                console.log('Using array data:', data);
                this.displayOffers(data);
            } else {
                console.log('No valid promocodes found in response');
                throw new Error('No promocodes in response');
            }
        } catch (error) {
            console.error('Error loading offers:', error);
            this.showNotification('Failed to load offers', 'error');
            // Show empty state instead of mock data
            this.displayOffers([]);
        }
    }

    displayOffers(offers) {
        const grid = document.getElementById('offers-grid');
        
        if (!offers || offers.length === 0) {
            grid.innerHTML = '<div class="empty-state">No active offers available at the moment.</div>';
            return;
        }
        
        grid.innerHTML = offers.map(offer => `
            <div class="offer-card">
                <div class="offer-card-header">
                    <div class="offer-badge">Limited Time</div>
                    <div class="offer-title">${offer.title}</div>
                    <div class="offer-discount">${offer.discount}</div>
                    <div class="offer-subtitle">${offer.description}</div>
                </div>
                <div class="offer-card-body">
                    <div class="offer-description">${offer.description}</div>
                    <div class="offer-details">
                        <div class="offer-code">Code: ${offer.code}</div>
                        <div class="offer-expiry">Expires: ${new Date(offer.expires_at).toLocaleDateString()}</div>
                    </div>
                    <div class="offer-actions">
                        <button class="copy-code-btn" onclick="app.copyPromoCode('${offer.code}')">
                            <i class="fas fa-copy"></i> Copy Code
                        </button>
                        <button class="use-offer-btn" onclick="app.useOffer('${offer.code}')">
                            <i class="fas fa-shopping-cart"></i> Use Offer
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    copyPromoCode(code) {
        navigator.clipboard.writeText(code).then(() => {
            this.showNotification(`Promo code "${code}" copied!`, 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification(`Promo code "${code}" copied!`, 'success');
        });
    }

    useOffer(code) {
        // Store the promo code for later use
        localStorage.setItem('pending_promo_code', code);
        this.showNotification('Promo code saved! It will be applied at checkout.', 'success');
        
        // Navigate to menu/branches
        this.showSection('home');
        setTimeout(() => {
            document.getElementById('branches-section').scrollIntoView({ behavior: 'smooth' });
        }, 300);
    }

    // Section Management
    showSection(sectionName) {
        console.log('showSection called with:', sectionName);
        
        // Hide all sections
        const sections = ['home', 'menu-section', 'popular-section', 'offers-section', 'contact-section', 'order-history-section', 'favorites-section'];
        sections.forEach(section => {
            const element = document.getElementById(section === 'home' ? 'branches-section' : section);
            if (element) {
                element.style.display = 'none';
                console.log('Hidden section:', section);
            }
        });

        // Get hero section element
        const heroSection = document.getElementById('home');
        
        // Show home sections for home
        if (sectionName === 'home') {
            document.getElementById('branches-section').style.display = 'block';
            // Reset hero to default and show it
            document.getElementById('default-hero').style.display = 'block';
            document.getElementById('branch-hero').style.display = 'none';
            if (heroSection) {
                heroSection.style.display = 'block';
            }
            console.log('Showing home section');
        } else if (sectionName === 'menu') {
            // Show menu section and keep hero visible
            const menuSection = document.getElementById('menu-section');
            if (menuSection) {
                menuSection.style.display = 'block';
                console.log('Menu section displayed:', menuSection.style.display);
            } else {
                console.error('Menu section not found!');
            }
            
            if (heroSection) {
                heroSection.style.display = 'block';
                console.log('Hero section shown for menu');
            }
            // Show branch hero instead of default hero when in menu section
            if (this.currentBranch) {
                document.getElementById('default-hero').style.display = 'none';
                document.getElementById('branch-hero').style.display = 'block';
                console.log('Branch hero shown');
            }
        } else {
            // For popular, offers, contact pages - hide hero section
            const targetSection = document.getElementById(sectionName + '-section');
            if (targetSection) {
                targetSection.style.display = 'block';
                console.log('Showing section:', sectionName + '-section');
            }
            if (heroSection) {
                heroSection.style.display = 'none';
            }
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[href="#${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('showSection completed for:', sectionName);
    }

    // Enhanced Branch Selection
    selectBranch(branch) {
        console.log('selectBranch called with:', branch);
        
        // Set current branch
        this.currentBranch = branch;
        this.cart.setBranch(branch);
        
        // Update hero design
        console.log('Updating hero for branch');
        this.updateHeroForBranch(branch);
        
        // Show menu section immediately
        console.log('Showing menu section');
        this.showSection('menu');
        
        // Verify menu section is visible
        const menuSection = document.getElementById('menu-section');
        console.log('Menu section display after showSection:', menuSection ? menuSection.style.display : 'Element not found');
        
        // Load menu data in background
        this.loadBranchMenuAsync(branch);
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const menuLink = document.querySelector('[href="#menu"]');
        if (menuLink) {
            menuLink.classList.add('active');
        }

        console.log('Branch selection completed');
    }

    // Load branch menu asynchronously
    async loadBranchMenuAsync(branch) {
        try {
            this.showLoading();
            console.log('Loading menu for branch:', branch.id);

            // Load menu data
            const [menuData, settings] = await Promise.all([
                this.loadMenu(branch.id),
                this.loadBranchSettings(branch.id)
            ]);

            console.log('Menu data loaded:', menuData);

            if (!menuData) {
                this.hideLoading();
                this.showNotification('Failed to load menu for this branch', 'error');
                return;
            }

            // Update current branch with settings
            if (settings) {
                this.currentBranch.settings = settings;
            }

            // Update restaurant info
            const nameEl = document.getElementById('current-restaurant-name');
            const addressEl = document.getElementById('current-restaurant-address');
            const statusEl = document.getElementById('current-restaurant-status');
            
            if (nameEl) nameEl.textContent = this.currentBranch.name;
            if (addressEl) addressEl.textContent = this.currentBranch.address;
            if (statusEl) {
                statusEl.textContent = this.currentBranch.status;
                statusEl.className = `status ${this.currentBranch.status}`;
            }

            // Display menu
            this.displayMenu(menuData);

            this.hideLoading();

        } catch (error) {
            console.error('Error loading branch menu:', error);
            this.hideLoading();
            this.showNotification('Failed to load menu for this branch', 'error');
        }
    }

    updateHeroForBranch(branch) {
        const defaultHero = document.getElementById('default-hero');
        const branchHero = document.getElementById('branch-hero');
        
        // Hide default, show branch hero
        defaultHero.style.display = 'none';
        branchHero.style.display = 'block';
        
        // Update branch info - try both new and old element structures
        const branchTitle = document.getElementById('branch-hero-title');
        if (branchTitle) {
            branchTitle.textContent = branch.name;
        }
        
        const heroImage = document.getElementById('branch-hero-image');
        if (heroImage) {
            if (branch.image_url) {
                heroImage.style.backgroundImage = `url('${branch.image_url}')`;
            } else {
                // Set a default gradient background if no image
                heroImage.style.backgroundImage = 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))';
            }
        }
        
        // Update status - handle both new and old class names
        const statusElement = document.getElementById('branch-status');
        if (statusElement) {
            statusElement.textContent = branch.is_open ? 'Open' : 'Closed';
            // Clear all classes and add appropriate ones
            statusElement.className = '';
            statusElement.classList.add('status-indicator');
            if (!branch.is_open) {
                statusElement.classList.add('closed');
            }
            
            // Also support legacy class name
            if (statusElement.classList.contains('status-badge') || statusElement.classList.contains('branch-status')) {
                statusElement.className = `status-badge ${branch.is_open ? '' : 'closed'}`;
            }
        }
        
        // Update rating if available
        const ratingElement = document.getElementById('branch-rating');
        if (ratingElement && branch.rating) {
            ratingElement.innerHTML = `
                <i class="fas fa-star"></i> ${branch.rating}
            `;
        }
        
        // Update delivery time if available
        const deliveryElement = document.getElementById('branch-delivery');
        if (deliveryElement && branch.delivery_time) {
            deliveryElement.textContent = branch.delivery_time;
        }
        
        console.log('Hero updated for branch:', branch.name);
    }

    goBackToBranches() {
        document.getElementById('menu-section').style.display = 'none';
        document.getElementById('branches-section').style.display = 'block';
        
        // Reset hero to default
        document.getElementById('default-hero').style.display = 'block';
        document.getElementById('branch-hero').style.display = 'none';
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        document.querySelector('[href="#home"]').classList.add('active');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    scrollToMenu() {
        document.getElementById('menu-section').scrollIntoView({ behavior: 'smooth' });
    }

    showBranchInfo() {
        if (this.currentBranch) {
            this.showNotification(`${this.currentBranch.name} - ${this.currentBranch.address || 'Address not available'}`, 'info', 'Restaurant Info');
        }
    }

    // Contact Form
    submitContactForm() {
        const form = document.getElementById('contact-form');
        const formData = {
            name: form.querySelector('#contact-name').value,
            email: form.querySelector('#contact-email').value,
            subject: form.querySelector('#contact-subject').value,
            message: form.querySelector('#contact-message').value
        };

        // In a real application, this would send to a server
        console.log('Contact form submitted:', formData);
        
        // Show success message
        this.showNotification('Message sent successfully! We will get back to you soon.', 'success', 'Thank You!');
        
        // Reset form
        form.reset();
    }

    // ===== NEW MENU SEARCH & FILTER FUNCTIONALITY =====
    
    initializeMenuSearch() {
        const searchInput = document.getElementById('menu-search');
        const clearButton = document.getElementById('clear-search');
        
        if (searchInput) {
            // Add search input listener with debouncing
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                // Show/hide clear button
                if (clearButton) {
                    clearButton.style.display = query ? 'block' : 'none';
                }
                
                // Debounce search
                searchTimeout = setTimeout(() => {
                    this.performMenuSearch(query);
                }, 300);
            });
        }
        
        // Add event listeners for filter dropdowns
        const categoryFilter = document.getElementById('category-filter');
        const priceFilter = document.getElementById('price-filter');
        const dietaryFilter = document.getElementById('dietary-filter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filterByCategory();
                if (typeof updateFilterCount === 'function') {
                    updateFilterCount();
                }
            });
        }
        
        if (priceFilter) {
            priceFilter.addEventListener('change', () => {
                this.filterByPrice();
                if (typeof updateFilterCount === 'function') {
                    updateFilterCount();
                }
            });
        }
        
        if (dietaryFilter) {
            dietaryFilter.addEventListener('change', () => {
                this.filterByDietary();
                if (typeof updateFilterCount === 'function') {
                    updateFilterCount();
                }
            });
        }
    }
    
    performMenuSearch(query = '') {
        if (!this.currentMenuData) return;
        
        const searchQuery = query.toLowerCase();
        const categoryFilter = document.getElementById('category-filter')?.value || 'all';
        const priceFilter = document.getElementById('price-filter')?.value || 'all';
        const dietaryFilter = document.getElementById('dietary-filter')?.value || 'all';
        
        // Filter menu items
        let filteredItems = [];
        
        this.currentMenuData.categories.forEach(category => {
            category.items.forEach(item => {
                let matches = true;
                
                // Text search
                if (searchQuery && !item.name.toLowerCase().includes(searchQuery) && 
                    !item.description.toLowerCase().includes(searchQuery)) {
                    matches = false;
                }
                
                // Category filter
                if (categoryFilter !== 'all' && category.id != categoryFilter) {
                    matches = false;
                }
                
                // Price filter
                if (priceFilter !== 'all') {
                    const price = parseFloat(item.price);
                    if (priceFilter === 'low' && price >= 200) matches = false;
                    if (priceFilter === 'medium' && (price < 200 || price > 500)) matches = false;
                    if (priceFilter === 'high' && price <= 500) matches = false;
                }
                
                // Dietary filter
                if (dietaryFilter !== 'all') {
                    const tags = item.tags || [];
                    if (!tags.includes(dietaryFilter)) matches = false;
                }
                
                if (matches) {
                    filteredItems.push({...item, categoryName: category.name});
                }
            });
        });
        
        this.displayFilteredMenuItems(filteredItems, query);
        this.updateActiveFilters();
    }
    
    displayFilteredMenuItems(items, searchQuery = '') {
        const container = document.getElementById('menu-items-grid');
        const resultsInfo = document.getElementById('search-results-info');
        const noResults = document.getElementById('no-results');
        
        if (!container) return;
        
        // Update results info
        if (resultsInfo) {
            if (searchQuery || this.hasActiveFilters()) {
                resultsInfo.style.display = 'block';
                resultsInfo.innerHTML = `<span id="results-count">${items.length}</span> items found`;
            } else {
                resultsInfo.style.display = 'none';
            }
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Show no results if empty
        if (items.length === 0) {
            if (noResults) {
                noResults.style.display = 'block';
            }
            return;
        }
        
        if (noResults) {
            noResults.style.display = 'none';
        }
        
        // Display items
        items.forEach(item => {
            const card = this.createMenuItemCard(item);
            container.appendChild(card);
        });
    }
    
    createMenuItemCard(item) {
        const card = document.createElement('div');
        card.className = 'menu-item-card';
        
        // Add click handler with event checking
        card.addEventListener('click', (event) => {
            // Don't open modal if clicking on buttons
            if (event.target.closest('button')) {
                console.log('🚫 Button clicked, not opening modal');
                return;
            }
            console.log('🖱️ Card clicked for item:', item.name);
            event.stopPropagation();
            event.preventDefault();
            this.openItemModal(item);
        });
        
        const currencySymbol = this.currentBranch.settings?.currency_symbol || '৳';
        const isFavorite = this.isFavoriteItem(item.branch_menu_item_id || item.id);
        
        // Generate badges
        let badges = '';
        if (item.tags) {
            if (item.tags.includes('vegetarian')) badges += '<span class="menu-item-badge vegetarian">Veg</span>';
            if (item.tags.includes('spicy')) badges += '<span class="menu-item-badge spicy">Spicy</span>';
            if (item.tags.includes('popular')) badges += '<span class="menu-item-badge">Popular</span>';
        }
        
        // Add favorite button
        const favoriteBtn = `
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                    onclick="event.stopPropagation(); app.toggleFavorite(${item.branch_menu_item_id || item.id}, this)"
                    style="background: none; border: none; cursor: pointer; padding: 0; margin-left: auto;">
                <i class="fas fa-heart" style="color: ${isFavorite ? 'var(--primary-color)' : 'var(--medium-gray)'}; font-size: 16px;"></i>
            </button>
        `;
        
        card.innerHTML = `
            <div class="menu-item-image">
                ${badges}
                ${item.image_url ? 
                    `<img src="${item.image_url}" alt="${item.name}" loading="lazy">` : 
                    '<i class="fas fa-utensils placeholder-icon"></i>'
                }
            </div>
            <div class="menu-item-content">
                <div class="menu-item-header">
                    <h3 class="menu-item-name">${item.name}</h3>
                    ${favoriteBtn}
                </div>
                <p class="menu-item-description">${item.description || 'Delicious item from our kitchen'}</p>
                <div class="menu-item-footer">
                    <span class="menu-item-price">${currencySymbol}${parseFloat(item.price).toFixed(0)}</span>
                    <button class="menu-item-add-btn" onclick="event.stopPropagation(); app.quickAddToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                        <i class="fas fa-plus"></i>
                        Add
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    filterByCategory() {
        this.performMenuSearch(document.getElementById('menu-search')?.value || '');
    }
    
    filterByPrice() {
        this.performMenuSearch(document.getElementById('menu-search')?.value || '');
    }
    
    filterByDietary() {
        this.performMenuSearch(document.getElementById('menu-search')?.value || '');
    }
    
    clearMenuSearch() {
        const searchInput = document.getElementById('menu-search');
        const clearButton = document.getElementById('clear-search');
        
        if (searchInput) {
            searchInput.value = '';
        }
        if (clearButton) {
            clearButton.style.display = 'none';
        }
        
        this.performMenuSearch('');
    }
    
    resetAllFilters() {
        // Reset all filter controls
        const categoryFilter = document.getElementById('category-filter');
        const priceFilter = document.getElementById('price-filter');
        const dietaryFilter = document.getElementById('dietary-filter');
        const searchInput = document.getElementById('menu-search');
        const clearButton = document.getElementById('clear-search');
        
        if (categoryFilter) categoryFilter.value = 'all';
        if (priceFilter) priceFilter.value = 'all';
        if (dietaryFilter) dietaryFilter.value = 'all';
        if (searchInput) searchInput.value = '';
        if (clearButton) clearButton.style.display = 'none';
        
        // Re-display all items
        this.performMenuSearch('');
    }
    
    hasActiveFilters() {
        const categoryFilter = document.getElementById('category-filter')?.value;
        const priceFilter = document.getElementById('price-filter')?.value;
        const dietaryFilter = document.getElementById('dietary-filter')?.value;
        const searchQuery = document.getElementById('menu-search')?.value;
        
        return (categoryFilter && categoryFilter !== 'all') ||
               (priceFilter && priceFilter !== 'all') ||
               (dietaryFilter && dietaryFilter !== 'all') ||
               (searchQuery && searchQuery.trim());
    }
    
    updateActiveFilters() {
        const activeFiltersContainer = document.getElementById('active-filters');
        const filterTagsContainer = document.getElementById('filter-tags');
        
        if (!activeFiltersContainer || !filterTagsContainer) return;
        
        const filters = [];
        
        // Check each filter
        const categoryFilter = document.getElementById('category-filter');
        const priceFilter = document.getElementById('price-filter');
        const dietaryFilter = document.getElementById('dietary-filter');
        const searchInput = document.getElementById('menu-search');
        
        if (categoryFilter && categoryFilter.value !== 'all') {
            filters.push({
                type: 'category',
                label: categoryFilter.options[categoryFilter.selectedIndex].text,
                value: categoryFilter.value
            });
        }
        
        if (priceFilter && priceFilter.value !== 'all') {
            filters.push({
                type: 'price',
                label: priceFilter.options[priceFilter.selectedIndex].text,
                value: priceFilter.value
            });
        }
        
        if (dietaryFilter && dietaryFilter.value !== 'all') {
            filters.push({
                type: 'dietary',
                label: dietaryFilter.options[dietaryFilter.selectedIndex].text,
                value: dietaryFilter.value
            });
        }
        
        if (searchInput && searchInput.value.trim()) {
            filters.push({
                type: 'search',
                label: `"${searchInput.value.trim()}"`,
                value: searchInput.value.trim()
            });
        }
        
        // Show/hide active filters
        if (filters.length > 0) {
            activeFiltersContainer.style.display = 'block';
            filterTagsContainer.innerHTML = filters.map(filter => `
                <span class="filter-tag">
                    ${filter.label}
                    <button class="remove-tag" onclick="app.removeFilter('${filter.type}', '${filter.value}')">
                        <i class="fas fa-times"></i>
                    </button>
                </span>
            `).join('');
        } else {
            activeFiltersContainer.style.display = 'none';
        }
        
        // Update filter count for mobile toggle button
        if (typeof updateFilterCount === 'function') {
            updateFilterCount();
        }
    }
    
    removeFilter(type, value) {
        switch(type) {
            case 'category':
                document.getElementById('category-filter').value = 'all';
                break;
            case 'price':
                document.getElementById('price-filter').value = 'all';
                break;
            case 'dietary':
                document.getElementById('dietary-filter').value = 'all';
                break;
            case 'search':
                this.clearMenuSearch();
                break;
        }
        
        this.performMenuSearch(document.getElementById('menu-search')?.value || '');
    }
    
    populateMenuCategories() {
        if (!this.currentMenuData) return;
        
        const categoryFilter = document.getElementById('category-filter');
        const categoryNavMobile = document.getElementById('category-nav-scroll');
        const categoryListDesktop = document.getElementById('category-list-desktop');
        
        // Populate category filter dropdown
        if (categoryFilter) {
            // Clear existing options except "All Categories"
            while (categoryFilter.children.length > 1) {
                categoryFilter.removeChild(categoryFilter.lastChild);
            }
            
            this.currentMenuData.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        }
        
        // Populate mobile category navigation
        if (categoryNavMobile) {
            categoryNavMobile.innerHTML = this.currentMenuData.categories.map(category => `
                <a href="#" class="category-nav-item" onclick="app.selectMobileCategory(${category.id}); return false;">
                    ${category.name}
                </a>
            `).join('');
        }
        
        // Populate desktop category sidebar
        if (categoryListDesktop) {
            categoryListDesktop.innerHTML = `
                <a href="#" class="category-item-desktop active" onclick="app.selectDesktopCategory('all'); return false;">
                    All Items
                </a>
            ` + this.currentMenuData.categories.map(category => `
                <a href="#" class="category-item-desktop" onclick="app.selectDesktopCategory(${category.id}); return false;">
                    ${category.name}
                </a>
            `).join('');
        }
    }
    
    selectMobileCategory(categoryId) {
        // Update active state
        document.querySelectorAll('.category-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Apply filter
        document.getElementById('category-filter').value = categoryId;
        this.filterByCategory();
    }
    
    selectDesktopCategory(categoryId) {
        // Update active state
        document.querySelectorAll('.category-item-desktop').forEach(item => {
            item.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Apply filter
        document.getElementById('category-filter').value = categoryId;
        this.filterByCategory();
    }

    // Language Change
    changeLanguage(languageCode) {
        this.currentLanguage = languageCode;
        localStorage.setItem('lunadine_language', languageCode);
        
        // Reload menu if we're viewing one
        if (this.currentBranch) {
            this.showBranchMenu(this.currentBranch.id);
        }
        
        this.showNotification(`Language changed to ${languageCode.toUpperCase()}`, 'success');
    }

    // User Menu
    toggleUserMenu() {
        const dropdown = document.getElementById('user-dropdown');
        dropdown.classList.toggle('show');
    }

    // User Menu Actions
    showOrderHistory() {
        document.getElementById('user-dropdown').classList.remove('show');
        this.loadOrderHistory();
        this.showModal('history-modal');
    }

    showFavorites() {
        document.getElementById('user-dropdown').classList.remove('show');
        this.loadFavoritesModal();
        this.showModal('favorites-modal');
    }

    showProfile() {
        document.getElementById('user-dropdown').classList.remove('show');
        // Profile functionality can be implemented here
        this.showNotification('Profile feature coming soon!', 'info');
    }

    // Favorites Management
    toggleFavorite(itemId, button) {
        console.log('App toggleFavorite called:', itemId, button);
        let favorites = JSON.parse(localStorage.getItem('lunadine_favorites') || '[]');
        
        // Check if item is already in favorites using the improved method
        const existingIndex = favorites.findIndex(fav => 
            (fav.id && fav.id == itemId) || 
            (fav.branch_menu_item_id && fav.branch_menu_item_id == itemId)
        );
        
        console.log('Current favorites:', favorites);
        console.log('Item index in favorites:', existingIndex);
        
        if (existingIndex > -1) {
            // Remove from favorites
            favorites.splice(existingIndex, 1);
            localStorage.setItem('lunadine_favorites', JSON.stringify(favorites));
            
            console.log('Removing from favorites, removing active class');
            button.classList.remove('active');
            
            // Force removal of active state
            button.style.background = '';
            button.style.color = '';
            button.style.transform = '';
            
            const icon = button.querySelector('i');
            if (icon) {
                icon.style.color = '';
            }
            
            this.showNotification('Removed from favorites', 'info');
        } else {
            // Add to favorites - need to find the full item data
            const item = this.findItemById(itemId);
            
            if (item) {
                this.addToFavorites(item);
                
                console.log('Adding to favorites, adding active class');
                button.classList.add('active');
                
                // Force active state
                button.style.background = 'var(--danger-color)';
                button.style.color = 'white';
                
                const icon = button.querySelector('i');
                if (icon) {
                    icon.style.color = 'white';
                }
                
                this.showNotification('Added to favorites', 'success');
            } else {
                console.error('Could not find item with ID:', itemId);
                this.showNotification('Failed to add to favorites', 'error');
            }
        }
        
        console.log('Button classes after update:', button.className);
        
        // Invalidate cache since favorites changed
        this.lastFavoritesContent = null;
        
        // Only refresh favorites modal if it's currently visible to prevent unnecessary re-rendering
        const favoritesModal = document.getElementById('favorites-modal');
        if (favoritesModal && favoritesModal.style.display === 'block') {
            this.loadFavoritesModal();
        }
        
        // Force a visual update by triggering a reflow
        button.style.display = 'none';
        button.offsetHeight; // Trigger reflow
        button.style.display = '';
    }

    // Helper function to find item by ID in current menu data
    findItemById(itemId) {
        console.log('Finding item by ID:', itemId);
        console.log('Available menu data:', this.currentMenuData);
        
        // Search in current menu data (main source)
        if (this.currentMenuData && this.currentMenuData.categories) {
            for (const category of this.currentMenuData.categories) {
                if (category.items && category.items.length > 0) {
                    const item = category.items.find(item => 
                        item.id == itemId || 
                        item.branch_menu_item_id == itemId ||
                        item.item_id == itemId
                    );
                    if (item) {
                        console.log('Found item in category:', category.name, item);
                        return item;
                    }
                }
            }
        }
        
        // Fallback: Search in currentMenuItems if available
        if (this.currentMenuItems && this.currentMenuItems.length > 0) {
            const item = this.currentMenuItems.find(item => 
                item.id == itemId || 
                item.branch_menu_item_id == itemId ||
                item.item_id == itemId
            );
            if (item) {
                console.log('Found item in currentMenuItems:', item);
                return item;
            }
        }
        
        // Fallback: Search in currentMenu.categories if available
        if (this.currentMenu && this.currentMenu.categories) {
            for (const category of this.currentMenu.categories) {
                if (category.items && category.items.length > 0) {
                    const item = category.items.find(item => 
                        item.id == itemId || 
                        item.branch_menu_item_id == itemId ||
                        item.item_id == itemId
                    );
                    if (item) {
                        console.log('Found item in currentMenu category:', category.name, item);
                        return item;
                    }
                }
            }
        }
        
        // Fallback: Search in popular items if available
        if (this.popularItems && this.popularItems.length > 0) {
            const item = this.popularItems.find(item => 
                item.id == itemId || 
                item.branch_menu_item_id == itemId ||
                item.item_id == itemId
            );
            if (item) {
                console.log('Found item in popularItems:', item);
                return item;
            }
        }
        
        console.log('Item not found with ID:', itemId);
        console.log('Available data sources:', {
            currentMenuData: !!this.currentMenuData,
            currentMenuItems: !!this.currentMenuItems,
            currentMenu: !!this.currentMenu,
            popularItems: !!this.popularItems
        });
        return null;
    }

    isFavoriteItem(itemId) {
        const favorites = JSON.parse(localStorage.getItem('lunadine_favorites') || '[]');
        
        // Handle both old format (array of IDs) and new format (array of objects)
        return favorites.some(fav => {
            if (typeof fav === 'number' || typeof fav === 'string') {
                // Old format - just IDs
                return fav == itemId;
            } else if (typeof fav === 'object' && fav !== null) {
                // New format - objects with id properties
                return (fav.id && fav.id == itemId) || 
                       (fav.branch_menu_item_id && fav.branch_menu_item_id == itemId);
            }
            return false;
        });
    }

    displayFavorites() {
        // Hide other sections
        document.getElementById('branches-section').style.display = 'none';
        document.getElementById('menu-section').style.display = 'none';
        document.getElementById('order-history-section').style.display = 'none';
        
        // Show favorites section
        document.getElementById('favorites-section').style.display = 'block';
        
        const favoritesGrid = document.getElementById('favorites-grid');
        const favorites = JSON.parse(localStorage.getItem('lunadine_favorites') || '[]');
        
        if (favorites.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart-broken"></i>
                    <h3>No favorites yet</h3>
                    <p>Start browsing menus and add items to your favorites</p>
                    <button onclick="app.goBackToBranches()">Browse Restaurants</button>
                </div>
            `;
            return;
        }
        
        // For demo purposes, show placeholder favorite items
        favoritesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <h3>Your Favorites</h3>
                <p>You have ${favorites.length} favorite items</p>
                <button onclick="app.goBackToBranches()">Browse More</button>
            </div>
        `;
    }

    // Utility Functions
    showLoading() {
        document.getElementById('loading-spinner').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-spinner').classList.add('hidden');
    }

    showNotification(message, type = 'info', title = '') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const iconMap = {
            success: 'fas fa-check',
            error: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${iconMap[type]}"></i>
            </div>
            <div class="notification-content">
                ${title ? `<div class="notification-title">${title}</div>` : ''}
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Item Modal
    openItemModal(item) {
        console.log('🎯 App openItemModal called for:', item.name);
        
        const modal = document.getElementById('item-modal');
        const overlay = document.getElementById('modal-overlay');
        
        // Populate modal content
        document.getElementById('item-modal-title').textContent = item.name;
        document.getElementById('item-modal-description').textContent = item.description || '';
        
        // Handle image display
        const itemImage = document.getElementById('item-modal-image');
        const placeholderIcon = modal.querySelector('.placeholder-icon');
        
        if (item.image_url) {
            itemImage.src = item.image_url;
            itemImage.style.display = 'block';
            if (placeholderIcon) placeholderIcon.style.display = 'none';
        } else {
            itemImage.style.display = 'none';
            if (placeholderIcon) placeholderIcon.style.display = 'flex';
        }
        
        const currencySymbol = this.currentBranch.settings?.currency_symbol || '৳';
        document.getElementById('item-modal-price').textContent = `${currencySymbol}${item.price}`;
        
        // Reset quantity
        document.getElementById('item-quantity').textContent = '1';
        
        // Store current item
        this.currentModalItem = item;
        
        // Load customizations
        this.loadItemCustomizations(item);
        
        // Use the enhanced showModal function instead of directly manipulating classes
        this.showModal('item-modal');
    }

    loadItemCustomizations(item) {
        const container = document.getElementById('item-customizations');
        container.innerHTML = '';
        
        if (!item.customizations || item.customizations.length === 0) {
            return;
        }
        
        item.customizations.forEach(group => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'customization-group';
            groupDiv.innerHTML = `
                <h4>${group.name}</h4>
                <div class="customization-options">
                    ${group.options.map(option => `
                        <label class="customization-option">
                            <input type="${group.type === 'single' ? 'radio' : 'checkbox'}" 
                                   name="custom_${group.id}" 
                                   value="${option.id}"
                                   onchange="app.updateItemPrice()">
                            <span class="customization-option-name">${option.name}</span>
                            <span class="customization-option-price">+${this.currentBranch.settings?.currency_symbol || '৳'}${option.price}</span>
                        </label>
                    `).join('')}
                </div>
            `;
            container.appendChild(groupDiv);
        });
    }

    updateQuantity(change) {
        const qtyElement = document.getElementById('item-quantity');
        let qty = parseInt(qtyElement.textContent) + change;
        if (qty < 1) qty = 1;
        qtyElement.textContent = qty;
        this.updateItemPrice();
    }

    updateItemPrice() {
        const basePrice = parseFloat(this.currentModalItem.price);
        const quantity = parseInt(document.getElementById('item-quantity').textContent);
        
        // Calculate customization price
        let customizationPrice = 0;
        document.querySelectorAll('#item-customizations input:checked').forEach(input => {
            const option = this.findCustomizationOption(input.value);
            if (option) {
                customizationPrice += parseFloat(option.price);
            }
        });
        
        const totalPrice = (basePrice + customizationPrice) * quantity;
        const currencySymbol = this.currentBranch.settings?.currency_symbol || '৳';
        document.getElementById('item-total-price').textContent = `${currencySymbol}${totalPrice.toFixed(2)}`;
    }

    findCustomizationOption(optionId) {
        for (const group of this.currentModalItem.customizations || []) {
            const option = group.options.find(opt => opt.id == optionId);
            if (option) return option;
        }
        return null;
    }

    // Quick add to cart (without customizations)
    quickAddToCart(item) {
        console.log('🛒 quickAddToCart called for:', item.name);
        console.log('🔍 Item customizations:', item.customizations);
        
        // Check if item has customizations/add-ons/extras
        if (item.customizations && item.customizations.length > 0) {
            console.log('⚙️ Item has customizations, opening modal for selection');
            // Open modal so user can select add-ons/extras
            this.openItemModal(item);
            return;
        }
        
        // No customizations, add directly to cart
        console.log('✅ No customizations, adding directly to cart');
        this.cart.addItem({
            ...item,
            quantity: 1,
            customizations: []
        });
        
        this.showNotification(`${item.name} added to cart`, 'success');
    }

    // Add to cart from modal
    addToCart() {
        const quantity = parseInt(document.getElementById('item-quantity').textContent);
        const customizations = [];
        
        // Collect selected customizations
        document.querySelectorAll('#item-customizations input:checked').forEach(input => {
            const option = this.findCustomizationOption(input.value);
            if (option) {
                customizations.push({
                    group_id: input.name.replace('custom_', ''),
                    option_id: option.id,
                    option_name: option.name,
                    additional_price: option.price
                });
            }
        });
        
        this.cart.addItem({
            ...this.currentModalItem,
            quantity: quantity,
            customizations: customizations
        });
        
        this.closeModal('item-modal');
        this.showNotification(`${this.currentModalItem.name} added to cart`, 'success');
    }

    // Modal Management
    showModal(modalId) {
        console.log('🚀 showModal called with:', modalId);
        
        // Set flag to prevent immediate closing
        this.modalJustOpened = true;
        console.log('🛡️ Set modalJustOpened to true');
        
        // First, forcefully close ALL modals and log each one
        const allModals = document.querySelectorAll('.modal');
        console.log('🔍 Found modals:', allModals.length);
        allModals.forEach(modal => {
            if (modal.classList.contains('active')) {
                console.log('❌ Removing active class from modal:', modal.id);
            }
            modal.classList.remove('active');
        });
        
        // Remove overlay show class
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            console.log('📋 Removed show class from overlay');
        }
        
        // Small delay to ensure cleanup, then show the requested modal
        setTimeout(() => {
            console.log('⏰ Timeout triggered, showing modal:', modalId);
            const modal = document.getElementById(modalId);
            if (modal && overlay) {
                // Double-check that NO OTHER modals have active class
                document.querySelectorAll('.modal').forEach(m => {
                    if (m.id !== modalId && m.classList.contains('active')) {
                        console.warn('⚠️ Found unwanted active modal:', m.id, '- removing!');
                        m.classList.remove('active');
                    }
                });
                
                // Show only the specific modal using class
                modal.classList.add('active');
                overlay.classList.add('show');
                
                // Prevent body scroll when modal is open
                document.body.style.overflow = 'hidden';
                console.log('✅ Modal opened successfully:', modalId);
                console.log('📊 Modal classes:', modal.classList.toString());
                console.log('📊 Overlay classes:', overlay.classList.toString());
                
                // Log all active modals for debugging
                const activeModals = document.querySelectorAll('.modal.active');
                console.log('🎯 Active modals count:', activeModals.length);
                activeModals.forEach(m => console.log('   - Active modal:', m.id));
                
                // Reset flag after a delay to allow clicks
                setTimeout(() => {
                    this.modalJustOpened = false;
                    console.log('🔓 Modal click protection disabled');
                }, 300);
            } else {
                console.error('Modal or overlay not found:', modalId);
            }
        }, 10);
    }

    closeModal(modalId) {
        console.log('❌ closeModal called with:', modalId);
        
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
            }
        } else {
            // Hide all modals
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        }
        
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        console.log('✅ Modal closed successfully');
    }

    // Event Binding
    bindEvents() {
        // Search input - only if element exists
        const searchInput = document.getElementById('branch-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchBranches());
        }
        
        // Filter tabs - only if elements exist
        const filterTabs = document.querySelectorAll('.filter-tab');
        if (filterTabs.length > 0) {
            filterTabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    this.filterBranches(e.target.dataset.filter);
                });
            });
        }
        
        // Order type buttons - only if elements exist
        const orderTypeBtns = document.querySelectorAll('.order-type-btn');
        if (orderTypeBtns.length > 0) {
            orderTypeBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.selectOrderType(e.target.dataset.type);
                });
            });
        }
        
        // Mobile menu toggle - only if element exists
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
        
        // Close modals when clicking overlay - only if element exists
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                console.log('🖱️ Modal overlay clicked', e.target, e.currentTarget);
                console.log('🔍 Target classList:', e.target.classList);
                console.log('🔍 Target ID:', e.target.id);
                console.log('🛡️ Modal just opened?', this.modalJustOpened);
                
                // Don't close if modal was just opened
                if (this.modalJustOpened) {
                    console.log('🚫 Ignoring click - modal just opened');
                    return;
                }
                
                // Only close if clicking directly on the overlay, not on modal content
                if (e.target.classList.contains('modal-overlay') || e.target.id === 'modal-overlay') {
                    console.log('🚫 Closing modal via overlay click');
                    this.closeModal();
                } else {
                    console.log('🔒 Click was on modal content, not closing');
                    e.stopPropagation();
                }
            });
        }
        
        // Close user dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const userDropdown = document.getElementById('user-dropdown');
            if (!e.target.closest('.user-menu') && userDropdown) {
                userDropdown.classList.remove('show');
            }
        });

        // Add keyboard escape to close modal for debugging
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                console.log('🔑 Escape pressed, force closing modal');
                this.closeModal();
            }
        });

        // Contact form submission - only if element exists
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitContactForm();
            });
        }
    }

    toggleMobileMenu() {
        toggleMobileNav();
    }

    // Load user data from localStorage
    loadUserData() {
        const language = localStorage.getItem('lunadine_language');
        if (language && this.languages.find(l => l.code === language)) {
            this.currentLanguage = language;
            this.populateLanguageSelector();
        }
    }

    // Duplicate functions removed - using the ones with dropdown close functionality

    // Load order history
    loadOrderHistory() {
        const historyList = document.getElementById('history-list');
        const orders = JSON.parse(localStorage.getItem('lunadine_order_history') || '[]');
        
        if (orders.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>No Order History</h3>
                    <p>You haven't placed any orders yet.<br>Start exploring our delicious menu!</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = orders.map(order => `
            <div class="history-item" data-status="${order.status || 'delivered'}">
                <div class="history-header">
                    <div class="history-info">
                        <h4>${order.branch?.name || 'Restaurant'}</h4>
                        <div class="history-meta">
                            <span><i class="fas fa-calendar"></i> ${new Date(order.placedAt).toLocaleDateString()}</span>
                            <span><i class="fas fa-clock"></i> ${new Date(order.placedAt).toLocaleTimeString()}</span>
                            <span><i class="fas fa-utensils"></i> ${order.orderType || 'dine-in'}</span>
                        </div>
                    </div>
                    <div class="history-status ${order.status || 'delivered'}">${order.status || 'delivered'}</div>
                </div>
                <div class="history-items">
                    ${order.items.map(item => `
                        <div class="history-item-row">
                            <div class="history-item-details">
                                <div class="history-item-name">${item.name}</div>
                                <div class="history-item-desc">${item.description || ''}</div>
                            </div>
                            <div class="history-item-qty">×${item.quantity}</div>
                            <div class="history-item-price">৳${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="history-footer">
                    <div class="history-total">Total: ৳${order.total.toFixed(2)}</div>
                    <div class="history-actions">
                        <button class="reorder-btn" onclick="reorderItems('${order.order_id}')">
                            <i class="fas fa-redo"></i> Reorder
                        </button>
                        ${order.status !== 'delivered' ? `
                            <button class="track-btn" onclick="trackOrder('${order.order_id}')">
                                <i class="fas fa-map-marker-alt"></i> Track
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // Add filter functionality
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterOrderHistory(e.target.dataset.filter);
            });
        });
    }

    filterOrderHistory(filter) {
        const items = document.querySelectorAll('.history-item');
        items.forEach(item => {
            if (filter === 'all' || item.dataset.status === filter) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Load favorites modal with debouncing to prevent excessive re-rendering
    loadFavoritesModal() {
        // Clear existing timeout
        if (this.favoritesLoadTimeout) {
            clearTimeout(this.favoritesLoadTimeout);
        }
        
        // Debounce the actual loading to prevent excessive re-renders
        this.favoritesLoadTimeout = setTimeout(() => {
            this._doLoadFavoritesModal();
        }, 100);
    }
    
    // Internal method that actually loads the favorites
    _doLoadFavoritesModal() {
        const favoritesGrid = document.getElementById('favorites-modal-grid');
        const favorites = JSON.parse(localStorage.getItem('lunadine_favorites') || '[]');
        
        console.log('Loading favorites:', favorites); // Debug log
        
        // Check if content has changed to avoid unnecessary re-renders
        const currentContent = JSON.stringify(favorites);
        if (this.lastFavoritesContent === currentContent && favoritesGrid.innerHTML.trim() !== '') {
            console.log('Favorites content unchanged, skipping re-render');
            return;
        }
        this.lastFavoritesContent = currentContent;
        
        if (favorites.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <h3>No Favorites Yet</h3>
                    <p>Start adding items to your favorites by clicking the heart icon on menu items!</p>
                </div>
            `;
            return;
        }

        favoritesGrid.innerHTML = favorites.map(item => {
            // Ensure all properties exist with comprehensive fallbacks
            const itemName = item.name || 
                           item.item_name || 
                           item.menu_item_name || 
                           item.title ||
                           (item.originalData && item.originalData.name) ||
                           (item.originalData && item.originalData.item_name) ||
                           'Menu Item';
                           
            const itemPrice = item.price || 
                            item.selling_price || 
                            item.menu_price || 
                            item.cost ||
                            (item.originalData && item.originalData.price) ||
                            (item.originalData && item.originalData.selling_price) ||
                            0;
                            
            const itemImage = item.image_url || 
                            item.image || 
                            item.photo || 
                            item.picture ||
                            (item.originalData && item.originalData.image_url) ||
                            (item.originalData && item.originalData.image) ||
                            'assets/images/placeholder-food.jpg';
                            
            const branchName = item.branch_name || 
                             item.restaurant_name ||
                             (item.originalData && item.originalData.branch_name) ||
                             'Restaurant';
                             
            const itemId = item.id || 
                         item.branch_menu_item_id || 
                         item.item_id ||
                         (item.originalData && item.originalData.id) ||
                         (item.originalData && item.originalData.branch_menu_item_id) ||
                         0;
            
            console.log(`Favorite item: ${itemName}, price: ${itemPrice}, id: ${itemId}`); // Debug log
            
            return `
                <div class="favorite-item" data-item-id="${itemId}">
                    <div class="favorite-item-image">
                        <img src="${itemImage}" 
                             alt="${itemName}" 
                             loading="lazy"
                             onerror="this.src='assets/images/placeholder-food.jpg'"
                             onload="this.style.opacity='1'"
                             style="opacity:0;transition:opacity 0.3s ease;">
                        <div class="favorite-overlay">
                            <button class="remove-favorite-btn" onclick="removeFavorite(${itemId})" title="Remove from favorites">
                                <i class="fas fa-heart-broken"></i>
                            </button>
                        </div>
                    </div>
                    <div class="favorite-item-content">
                        <div class="favorite-item-header">
                            <div class="favorite-item-name">${itemName}</div>
                            <div class="favorite-item-price">৳${parseFloat(itemPrice).toFixed(2)}</div>
                        </div>
                        <div class="favorite-item-restaurant">${branchName}</div>
                        <div class="favorite-item-footer">
                            <button class="add-to-cart-favorite-btn" onclick="addFavoriteToCart(${itemId})">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Initialize UI
    initializeUI() {
        // Set default order type
        this.selectOrderType('dine-in');
        
        // Initialize header scroll effect
        window.addEventListener('scroll', () => {
            const header = document.getElementById('header');
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LunaDineApp();
});

// Global functions for onclick handlers
function proceedFromQR() {
    app.proceedFromQR();
}

function goBackToBranches() {
    app.goBackToBranches();
}

function searchBranches() {
    app.searchBranches();
}

function showNearbyBranches() {
    app.showNearbyBranches();
}

function showPopularItems() {
    app.showPopularItems();
}

function showOffers() {
    app.showOffers();
}

function changeLanguage(languageCode) {
    app.changeLanguage(languageCode);
}

function toggleUserMenu() {
    app.toggleUserMenu();
}

function showOrderHistory() {
    app.showOrderHistory();
}

function showFavorites() {
    app.showFavorites();
}

function showProfile() {
    app.showProfile();
}

function toggleCart() {
    if (window.app && window.app.cart) {
        window.app.cart.toggle();
    }
}

function proceedToCheckout() {
    if (window.app && window.app.cart) {
        window.app.cart.proceedToCheckout();
    }
}

function closeModal(modalId) {
    app.closeModal(modalId);
}

function updateQuantity(change) {
    app.updateQuantity(change);
}

function addToCart() {
    app.addToCart();
}

// Order History Functions
function reorderItems(orderId) {
    const orders = JSON.parse(localStorage.getItem('lunadine_order_history') || '[]');
    const order = orders.find(o => o.order_id === orderId);
    
    if (order) {
        // Clear current cart
        app.cart.clear();
        
        // Set the branch if different
        if (order.branch && order.branch.id !== app.currentBranch?.id) {
            app.selectBranch(order.branch);
        }
        
        // Add items to cart
        order.items.forEach(item => {
            app.cart.addItem({
                ...item,
                branch_menu_item_id: item.branch_menu_item_id || item.id,
                customizations: item.customizations || []
            });
        });
        
        app.showNotification('Items added to cart!', 'success');
        app.closeModal('history-modal');
    }
}

function trackOrder(orderId) {
    app.orders.showTracking(orderId);
    app.closeModal('history-modal');
}

// Favorites Functions
function removeFavorite(itemId) {
    let favorites = JSON.parse(localStorage.getItem('lunadine_favorites') || '[]');
    favorites = favorites.filter(item => item.id !== itemId);
    localStorage.setItem('lunadine_favorites', JSON.stringify(favorites));
    
    // Invalidate cache since favorites changed
    app.lastFavoritesContent = null;
    
    // Only refresh if favorites modal is currently visible
    const favoritesModal = document.getElementById('favorites-modal');
    if (favoritesModal && favoritesModal.style.display === 'block') {
        app.loadFavoritesModal();
    }
    app.showNotification('Removed from favorites', 'info');
}

function addFavoriteToCart(itemId) {
    const favorites = JSON.parse(localStorage.getItem('lunadine_favorites') || '[]');
    const item = favorites.find(i => i.id === itemId);
    
    if (item) {
        // Check if we have the right branch selected
        if (!app.currentBranch || app.currentBranch.id !== item.branch_id) {
            app.showNotification('Please select the restaurant first', 'warning');
            return;
        }
        
        app.cart.addItem({
            ...item,
            branch_menu_item_id: item.branch_menu_item_id || item.id,
            quantity: 1,
            customizations: []
        });
        
        app.showNotification('Added to cart!', 'success');
    }
}

function clearAllFavorites() {
    if (confirm('Are you sure you want to clear all favorites?')) {
        localStorage.setItem('lunadine_favorites', '[]');
        
        // Invalidate cache since favorites changed
        app.lastFavoritesContent = null;
        
        // Only refresh if favorites modal is currently visible
        const favoritesModal = document.getElementById('favorites-modal');
        if (favoritesModal && favoritesModal.style.display === 'block') {
            app.loadFavoritesModal();
        }
        app.showNotification('All favorites cleared', 'info');
    }
}

// Debug function to check favorites data structure
function debugFavorites() {
    const favorites = JSON.parse(localStorage.getItem('lunadine_favorites') || '[]');
    console.log('=== FAVORITES DEBUG ===');
    console.log('Total favorites:', favorites.length);
    favorites.forEach((item, index) => {
        console.log(`Favorite ${index + 1}:`, {
            id: item.id,
            name: item.name,
            item_name: item.item_name,
            menu_item_name: item.menu_item_name,
            title: item.title,
            price: item.price,
            selling_price: item.selling_price,
            allProperties: Object.keys(item)
        });
    });
    console.log('=== END DEBUG ===');
}

// Make debug function available globally
window.debugFavorites = debugFavorites;

// Migration function to convert old favorites format to new format
function migrateFavoritesToNewFormat() {
    const favorites = JSON.parse(localStorage.getItem('lunadine_favorites') || '[]');
    
    if (favorites.length === 0) return;
    
    // Check if migration is needed (if first item is just an ID)
    const needsMigration = favorites.some(fav => typeof fav === 'number' || typeof fav === 'string');
    
    if (needsMigration) {
        console.log('🔄 Migrating favorites from old format to new format...');
        
        // Clear old favorites and let users re-add them with proper data
        localStorage.setItem('lunadine_favorites', '[]');
        
        if (window.app) {
            window.app.showNotification('Favorites updated! Please re-add your favorite items.', 'info');
        }
        
        console.log('✅ Favorites migration completed');
    }
}

// Run migration on app load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(migrateFavoritesToNewFormat, 1000);
});

// New global functions
function showSection(sectionName) {
    app.showSection(sectionName);
}

function scrollToMenu() {
    app.scrollToMenu();
}

function showBranchInfo() {
    app.showBranchInfo();
}

// Global debug functions for emergency modal control
window.forceCloseModal = function() {
    console.log('🚨 FORCE CLOSING MODAL');
    if (window.app) {
        window.app.closeModal();
    }
    // Also force remove classes
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
        modal.style.display = 'none';
    });
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
    document.body.style.overflow = '';
};

// Mobile Navigation Functions
window.toggleMobileNav = function() {
    console.log('📱 toggleMobileNav called');
    const overlay = document.getElementById('mobile-nav-overlay');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (overlay && toggle) {
        const isActive = overlay.classList.contains('active');
        
        if (isActive) {
            // Close mobile menu
            overlay.classList.remove('active');
            toggle.classList.remove('active');
            document.body.style.overflow = '';
            console.log('📱 Mobile menu closed');
        } else {
            // Open mobile menu
            overlay.classList.add('active');
            toggle.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('📱 Mobile menu opened');
        }
    }
};

window.closeMobileNav = function() {
    console.log('📱 closeMobileNav called');
    const overlay = document.getElementById('mobile-nav-overlay');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (overlay) overlay.classList.remove('active');
    if (toggle) toggle.classList.remove('active');
    document.body.style.overflow = '';
    console.log('📱 Mobile menu closed');
};

window.mobileNavLink = function(section) {
    console.log('📱 mobileNavLink called for:', section);
    closeMobileNav();
    
    // Small delay to allow menu to close
    setTimeout(() => {
        if (window.app && window.app.showSection) {
            window.app.showSection(section);
        }
    }, 300);
};

// Update the existing toggleMobileMenu function in the app class
LunaDineApp.prototype.toggleMobileMenu = function() {
    toggleMobileNav();
};

// Add event listeners for mobile navigation when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle click handler
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileNav);
        console.log('📱 Mobile toggle click handler added');
    }
    
    // Mobile nav close button click handler
    const mobileClose = document.querySelector('.mobile-nav-close');
    if (mobileClose) {
        mobileClose.addEventListener('click', closeMobileNav);
        console.log('📱 Mobile close click handler added');
    }
    
    // Mobile overlay click handler (close on overlay click)
    const mobileOverlay = document.getElementById('mobile-nav-overlay');
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', function(e) {
            // Only close if clicking the overlay itself, not the content
            if (e.target === mobileOverlay) {
                closeMobileNav();
            }
        });
        console.log('📱 Mobile overlay click handler added');
    }
    
    // Add click handlers for mobile nav links
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                const section = href.substring(1);
                mobileNavLink(section);
            }
        });
    });
    console.log('📱 Mobile nav link handlers added');
    
    // Desktop nav responsive handling
    const handleDesktopNav = function() {
        const desktopNav = document.querySelector('.desktop-nav');
        const headerActions = document.querySelector('.header-actions');
        
        if (window.innerWidth >= 768) {
            // Desktop mode
            if (desktopNav) desktopNav.style.display = 'block';
            if (headerActions) {
                const desktopOnlyElements = headerActions.querySelectorAll('.desktop-only');
                desktopOnlyElements.forEach(el => el.style.display = 'block');
            }
        } else {
            // Mobile mode
            if (desktopNav) desktopNav.style.display = 'none';
            if (headerActions) {
                const desktopOnlyElements = headerActions.querySelectorAll('.desktop-only');
                desktopOnlyElements.forEach(el => el.style.display = 'none');
            }
        }
    };
    
    // Initial check and resize handler
    handleDesktopNav();
    window.addEventListener('resize', handleDesktopNav);
    console.log('📱 Responsive navigation handlers added');
});

window.debugModal = function() {
    console.log('🔍 Modal Debug Info:');
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('item-modal');
    console.log('Overlay classes:', overlay?.classList.toString());
    console.log('Modal classes:', modal?.classList.toString());
    console.log('Modal display:', modal?.style.display);
    console.log('Body overflow:', document.body.style.overflow);
};

// ===== ENHANCED ORDER TRACKING SYSTEM =====

// Order tracking data structure for different order types
window.orderTrackingData = {
    'delivery': {
        estimatedTime: '25-30 mins',
        estimatedText: 'Estimated delivery:',
        steps: [
            { id: 'placed', title: 'Order Placed', description: 'Your order has been confirmed', icon: 'fas fa-check' },
            { id: 'confirmed', title: 'Order Confirmed', description: 'Restaurant has accepted your order', icon: 'fas fa-receipt' },
            { id: 'preparing', title: 'Preparing', description: 'Your food is being freshly prepared', icon: 'fas fa-fire' },
            { id: 'ready', title: 'Ready for Pickup', description: 'Food is ready, waiting for delivery person', icon: 'fas fa-box' },
            { id: 'out', title: 'Out for Delivery', description: 'Your order is on the way to you', icon: 'fas fa-motorcycle' },
            { id: 'delivered', title: 'Delivered', description: 'Enjoy your delicious meal!', icon: 'fas fa-check-circle' }
        ]
    },
    'takeaway': {
        estimatedTime: '15-20 mins',
        estimatedText: 'Estimated pickup time:',
        steps: [
            { id: 'placed', title: 'Order Placed', description: 'Your takeaway order confirmed', icon: 'fas fa-check' },
            { id: 'preparing', title: 'Preparing', description: 'Your food is being freshly prepared', icon: 'fas fa-fire' },
            { id: 'ready', title: 'Ready for Pickup', description: 'Your order is ready for collection', icon: 'fas fa-shopping-bag' },
            { id: 'collected', title: 'Collected', description: 'Thank you for choosing us!', icon: 'fas fa-check-circle' }
        ]
    },
    'dine-in': {
        estimatedTime: '12-15 mins',
        estimatedText: 'Estimated serving time:',
        steps: [
            { id: 'placed', title: 'Order Placed', description: 'Your table order has been confirmed', icon: 'fas fa-check' },
            { id: 'preparing', title: 'Preparing', description: 'Your food is being freshly prepared', icon: 'fas fa-fire' },
            { id: 'ready', title: 'Ready to Serve', description: 'Food will be served to your table', icon: 'fas fa-utensils' },
            { id: 'served', title: 'Served', description: 'Enjoy your meal at the table!', icon: 'fas fa-check-circle' }
        ]
    }
};

// Function to show order tracking modal with dynamic content
function showOrderTracking(orderId, orderType = 'delivery', currentStep = 'preparing') {
    try {
        console.log(`🚀 Starting order tracking for: ${orderType}, step: ${currentStep}, order: ${orderId}`);
        
        // Update order ID
        const orderIdElement = document.getElementById('tracking-order-id');
        if (orderIdElement) {
            orderIdElement.textContent = `#${orderId}`;
            console.log(`✅ Updated order ID: #${orderId}`);
        } else {
            console.error('❌ Order ID element not found');
        }

        // Update order type badge
        const orderTypeBadge = document.getElementById('order-type-badge');
        if (orderTypeBadge) {
            orderTypeBadge.textContent = orderType.charAt(0).toUpperCase() + orderType.slice(1);
            orderTypeBadge.className = `order-type-badge ${orderType}`;
            console.log(`✅ Updated order type badge: ${orderType}`);
        } else {
            console.error('❌ Order type badge element not found');
        }

        // Generate timeline dynamically
        console.log('🔄 Generating timeline...');
        generateOrderTimeline(orderType, currentStep);

        // Update estimated time
        console.log('⏰ Updating estimated time...');
        updateEstimatedTime(orderType);

        // Show correct actions
        console.log('🔧 Setting up actions...');
        showOrderTypeActions(orderType);

        // Open the modal
        console.log('📱 Opening modal...');
        if (window.app && window.app.showModal) {
            window.app.showModal('tracking-modal');
        } else {
            // Fallback method
            const modal = document.getElementById('tracking-modal');
            if (modal) {
                modal.classList.add('show');
                document.body.classList.add('modal-open');
                console.log('✅ Modal opened using fallback method');
            } else {
                console.error('❌ Modal element not found');
            }
        }

        console.log(`✅ Order tracking completed for ${orderType} order #${orderId} at step: ${currentStep}`);
    } catch (error) {
        console.error('❌ Error showing order tracking:', error);
        showNotification('Failed to load order tracking', 'error');
    }
}

// Function to generate the complete timeline dynamically
function generateOrderTimeline(orderType, currentStep) {
    const timeline = document.getElementById('status-timeline');
    if (!timeline) {
        console.error('Timeline element not found');
        return;
    }

    const orderData = window.orderTrackingData[orderType];
    if (!orderData) {
        console.error('Order type not found:', orderType);
        return;
    }

    console.log(`🔄 Generating timeline for ${orderType} with current step: ${currentStep}`);

    // Clear existing content
    timeline.innerHTML = '';

    // Create timeline container
    const timelineContainer = document.createElement('div');
    timelineContainer.className = `${orderType}-timeline timeline-content active`;
    timelineContainer.setAttribute('data-order-type', orderType);

    let currentStepIndex = orderData.steps.findIndex(step => step.id === currentStep);
    if (currentStepIndex === -1) currentStepIndex = 0;

    console.log(`📍 Current step index: ${currentStepIndex} of ${orderData.steps.length} steps`);

    // Generate each step
    orderData.steps.forEach((stepData, index) => {
        const stepElement = document.createElement('div');
        stepElement.className = 'status-step';

        // Determine step status
        if (index < currentStepIndex) {
            stepElement.classList.add('completed');
        } else if (index === currentStepIndex) {
            stepElement.classList.add('active');
        }

        // Create step content
        stepElement.innerHTML = `
            <div class="status-icon">
                <i class="${stepData.icon}"></i>
            </div>
            <div class="status-content">
                <h4>${stepData.title}</h4>
                <p>${stepData.description}</p>
                <span class="status-time">${getStepTime(orderType, index, currentStepIndex)}</span>
            </div>
        `;

        timelineContainer.appendChild(stepElement);
    });

    timeline.appendChild(timelineContainer);
    console.log(`✅ Timeline generated with ${orderData.steps.length} steps`);
}

// Function to get appropriate time display for each step
function getStepTime(orderType, stepIndex, currentStepIndex) {
    if (stepIndex < currentStepIndex) {
        // Completed steps
        const timeAgo = (currentStepIndex - stepIndex) * 2;
        return `${timeAgo} mins ago`;
    } else if (stepIndex === currentStepIndex) {
        // Current step
        return 'In progress';
    } else {
        // Future steps
        const orderData = window.orderTrackingData[orderType];
        if (orderType === 'delivery') {
            const estimatedTimes = ['Est. 15 mins', 'Est. 20 mins', 'Est. 25-30 mins'];
            return estimatedTimes[stepIndex - currentStepIndex - 1] || 'Est. soon';
        } else if (orderType === 'takeaway') {
            return stepIndex === orderData.steps.length - 1 ? 'When you arrive' : 'Est. 15 mins';
        } else if (orderType === 'dine-in') {
            return stepIndex === orderData.steps.length - 1 ? 'When ready' : 'Est. 12 mins';
        }
        return 'Est. soon';
    }
}

// Function to update estimated time section
function updateEstimatedTime(orderType) {
    const estimatedTimeText = document.getElementById('estimated-time-text');

    if (estimatedTimeText) {
        const orderData = window.orderTrackingData[orderType];
        if (orderData) {
            estimatedTimeText.innerHTML = `${orderData.estimatedText} <strong>${orderData.estimatedTime}</strong>`;
            console.log(`⏰ Updated estimated time for ${orderType}: ${orderData.estimatedTime}`);
        }
    } else {
        console.error('Estimated time element not found');
    }
}

// Function to show correct action buttons based on order type
function showOrderTypeActions(orderType) {
    console.log(`🔧 Setting up actions for order type: ${orderType}`);
    
    // Hide all action groups within tracking actions
    const trackingActions = document.getElementById('tracking-actions');
    if (!trackingActions) {
        console.error('❌ Tracking actions container not found');
        return;
    }
    
    const allActionGroups = trackingActions.querySelectorAll('.action-group');
    console.log(`Found ${allActionGroups.length} action groups`);
    
    allActionGroups.forEach(group => {
        group.classList.remove('active');
        console.log(`Removed active class from: ${group.getAttribute('data-order-type')}`);
    });

    // Show the correct action group
    const targetActions = trackingActions.querySelector(`[data-order-type="${orderType}"]`);
    if (targetActions) {
        targetActions.classList.add('active');
        console.log(`✅ Activated ${orderType} actions`);
    } else {
        console.error(`❌ Action group not found for order type: ${orderType}`);
        // List all available action groups for debugging
        allActionGroups.forEach(group => {
            console.log(`Available action group: ${group.getAttribute('data-order-type')}`);
        });
    }
}

// Enhanced action functions for different order types
function callRestaurant() {
    showNotification('Calling restaurant...', 'info');
    // In a real app, this would initiate a phone call
    setTimeout(() => {
        showNotification('Call connected to restaurant', 'success');
    }, 1000);
}

function callDeliveryPerson() {
    showNotification('Calling delivery person...', 'info');
    setTimeout(() => {
        showNotification('Call connected to delivery person', 'success');
    }, 1000);
}

function shareLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                showNotification('Location shared successfully', 'success');
                console.log('Location:', position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                showNotification('Unable to access location', 'error');
                console.error('Geolocation error:', error);
            }
        );
    } else {
        showNotification('Geolocation not supported', 'error');
    }
}

function trackOnMap() {
    showNotification('Opening map tracking...', 'info');
    // In a real app, this would open a map with real-time tracking
    setTimeout(() => {
        showNotification('Map tracking opened', 'success');
    }, 500);
}

function getDirections() {
    showNotification('Getting directions to restaurant...', 'info');
    // In a real app, this would open maps with directions
    setTimeout(() => {
        showNotification('Directions opened in map app', 'success');
    }, 500);
}

function viewPickupDetails() {
    showNotification('Showing pickup details...', 'info');
    // Could open a modal with pickup instructions
    setTimeout(() => {
        alert('Pickup Details:\n\n📍 Location: Main Counter\n🕒 Pickup Hours: 10 AM - 10 PM\n📞 Call upon arrival: +880 1234567890\n🅿️ Free parking available');
    }, 500);
}

function callWaiter() {
    showNotification('Calling waiter to your table...', 'info');
    setTimeout(() => {
        showNotification('Waiter notified - will be with you shortly', 'success');
    }, 1000);
}

function requestWater() {
    showNotification('Requesting water for your table...', 'info');
    setTimeout(() => {
        showNotification('Water request sent - will be delivered shortly', 'success');
    }, 1000);
}

function requestBill() {
    showNotification('Requesting bill for your table...', 'info');
    setTimeout(() => {
        showNotification('Bill request sent - will be brought to your table', 'success');
    }, 1000);
}

function addMoreItems() {
    closeModal('tracking-modal');
    showNotification('Returning to menu...', 'info');
    setTimeout(() => {
        if (window.app && window.app.showSection) {
            window.app.showSection('menu');
        }
    }, 500);
}

// Function to simulate order progress (for demo purposes)
function simulateOrderProgress(orderId, orderType) {
    const steps = orderTrackingData[orderType].steps;
    let currentStepIndex = 0;

    const progressInterval = setInterval(() => {
        if (currentStepIndex < steps.length - 1) {
            currentStepIndex++;
            const currentStep = steps[currentStepIndex].id;
            
            // Update tracking if modal is open
            const trackingModal = document.getElementById('tracking-modal');
            if (trackingModal && trackingModal.classList.contains('active')) {
                updateStatusSteps(orderType, currentStep);
                showNotification(`Order update: ${steps[currentStepIndex].title}`, 'info');
            }
        } else {
            clearInterval(progressInterval);
            showNotification('Order completed!', 'success');
        }
    }, 10000); // Update every 10 seconds for demo
}

// Global functions for backwards compatibility
window.showOrderTracking = showOrderTracking;
window.callRestaurant = callRestaurant;
window.callDeliveryPerson = callDeliveryPerson;
window.shareLocation = shareLocation;
window.trackOnMap = trackOnMap;

// Page loaded - ready for user interactions
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Application loaded and ready');
});

// Global window functions for order tracking
window.getDirections = getDirections;
window.viewPickupDetails = viewPickupDetails;
window.callWaiter = callWaiter;
window.requestWater = requestWater;
window.requestBill = requestBill;
window.addMoreItems = addMoreItems;
window.simulateOrderProgress = simulateOrderProgress;
