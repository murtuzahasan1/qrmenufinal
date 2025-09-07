// LunaDine - Menu JavaScript
// Handles menu display, item interactions, and menu-specific functionality

class MenuManager {
    constructor() {
        console.log('🔧 MenuManager constructor called');
        this.currentMenu = null;
        this.searchQuery = '';
        this.activeFilters = new Set();
        this.currentCategory = null;
        
        this.init();
    }

    init() {
        console.log('🚀 MenuManager init called');
        this.bindMenuEvents();
    }

    setMenu(menuData) {
        console.log('📋 setMenu called with data:', menuData);
        this.currentMenu = menuData;
        this.displayMenu();
    }

    displayMenu() {
        if (!this.currentMenu) return;

        this.displayCategories();
        this.displayMenuItems();
        this.setupMenuSearch();
    }

    displayCategories() {
        const categoriesContainer = document.getElementById('category-list');
        if (!categoriesContainer) {
            console.log('⚠️ category-list element not found, skipping categories display');
            return;
        }
        
        categoriesContainer.innerHTML = '';

        this.currentMenu.categories.forEach((category, index) => {
            const categoryItem = document.createElement('div');
            categoryItem.className = `category-item ${index === 0 ? 'active' : ''}`;
            categoryItem.textContent = category.name;
            categoryItem.dataset.categoryId = category.id;
            categoryItem.onclick = () => this.selectCategory(category.id);
            categoriesContainer.appendChild(categoryItem);
        });
    }

    displayMenuItems() {
        console.log('📋 displayMenuItems called');
        const menuContainer = document.getElementById('menu-items');
        menuContainer.innerHTML = '';

        this.currentMenu.categories.forEach(category => {
            if (category.items.length === 0) return;
            console.log('📂 Processing category:', category.name, 'with', category.items.length, 'items');

            const categorySection = document.createElement('div');
            categorySection.className = 'menu-category';
            categorySection.id = `category-${category.id}`;
            categorySection.innerHTML = `
                <h3 class="category-title">${category.name}</h3>
                <div class="menu-items-grid" id="items-${category.id}"></div>
            `;

            const itemsGrid = categorySection.querySelector('.menu-items-grid');
            
            category.items.forEach(item => {
                console.log('🍽️ Creating card for item:', item.name, 'Available:', item.is_available);
                const itemCard = this.createMenuItemCard(item);
                itemsGrid.appendChild(itemCard);
            });

            menuContainer.appendChild(categorySection);
        });

        console.log('✅ Menu items displayed successfully');
        this.setupIntersectionObserver();
    }

    createMenuItemCard(item) {
        const card = document.createElement('div');
        card.className = 'menu-item';
        card.dataset.itemId = item.branch_menu_item_id;
        
        const currencySymbol = app.currentBranch?.settings?.currency_symbol || '৳';
        const isFavorite = app.isFavoriteItem(item.branch_menu_item_id);
        const isAvailable = item.is_available;

        // Get cart quantity - simple approach
        const cartItemQuantity = 0; // Start with 0, will be updated after cart loads
        
        card.innerHTML = `
            <div class="item-image ${!isAvailable ? 'unavailable' : ''}" 
                 style="background-image: url('${item.image_url || this.getPlaceholderImage(item.name)}')">
                ${!isAvailable ? '<div class="unavailable-overlay">Currently Unavailable</div>' : ''}
            </div>
            <div class="item-details">
                <div class="item-header">
                    <h4 class="item-name">${item.name}</h4>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            onclick="event.stopPropagation(); event.preventDefault(); toggleItemFavorite(${item.branch_menu_item_id}, this)">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <p class="item-description">${item.description || 'Delicious and fresh'}</p>
                <div class="item-tags">
                    ${(item.tags || []).map(tag => `<span class="item-tag">${tag}</span>`).join('')}
                </div>
                <div class="item-footer">
                    <span class="item-price">${currencySymbol}${parseFloat(item.price).toFixed(2)}</span>
                    ${isAvailable ? `
                        <button class="add-btn" onclick="event.stopPropagation(); event.preventDefault(); addItemToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                            Add
                        </button>
                    ` : `
                        <button class="add-btn unavailable" disabled>
                            Unavailable
                        </button>
                    `}
                </div>
            </div>
        `;

        // Add click handler for item modal (only if available)
        if (isAvailable) {
            console.log('🔧 Adding click handler for item:', item.name, item.branch_menu_item_id);
            card.addEventListener('click', (event) => {
                console.log('🖱️ Card clicked for item:', item.name);
                console.log('🔍 Click target:', event.target);
                console.log('🔍 Closest button check:', event.target.closest('button'));
                
                // Only open modal if we didn't click on a button
                if (!event.target.closest('button')) {
                    console.log('🎯 Opening modal for item:', item.name);
                    event.stopPropagation(); // Prevent event bubbling
                    event.preventDefault();  // Prevent default behavior
                    
                    // Add a small delay to ensure event handling is complete
                    setTimeout(() => {
                        this.openItemModal(item);
                    }, 50);
                } else {
                    console.log('🚫 Button clicked, not opening modal');
                }
            }, { capture: false });
        } else {
            card.classList.add('unavailable');
        }

        return card;
    }

    getPlaceholderImage(itemName) {
        // Generate a placeholder image based on item name
        const colors = ['#ff6b35', '#1ba672', '#fcb040', '#e23744', '#6c5ce7', '#fd79a8'];
        const hash = itemName.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        const colorIndex = Math.abs(hash) % colors.length;
        const color = colors[colorIndex];
        
        return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="${color}"/><text x="150" y="110" text-anchor="middle" fill="white" font-family="Arial" font-size="20" font-weight="bold">${itemName.substring(0, 2).toUpperCase()}</text></svg>`;
    }

    selectCategory(categoryId) {
        this.currentCategory = categoryId;
        
        // Update active category in sidebar
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-category-id="${categoryId}"]`).classList.add('active');

        // Scroll to category
        const categoryElement = document.getElementById(`category-${categoryId}`);
        if (categoryElement) {
            categoryElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
        }
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    const categoryId = entry.target.id.replace('category-', '');
                    this.highlightCategory(categoryId);
                }
            });
        }, { 
            rootMargin: '-20% 0px -20% 0px',
            threshold: [0, 0.5, 1]
        });

        document.querySelectorAll('.menu-category').forEach(category => {
            observer.observe(category);
        });
    }

    highlightCategory(categoryId) {
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const targetItem = document.querySelector(`[data-category-id="${categoryId}"]`);
        if (targetItem) {
            targetItem.classList.add('active');
        }
    }

    setupMenuSearch() {
        // Add search functionality for menu items
        const searchContainer = document.querySelector('.menu-header');
        if (!searchContainer) {
            return; // header removed; nothing to set up here
        }
        
        if (!document.getElementById('menu-search')) {
            const searchDiv = document.createElement('div');
            searchDiv.className = 'menu-search';
            searchDiv.innerHTML = `
                <div class="search-input-group">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" id="menu-search" placeholder="Search menu items...">
                    <button class="clear-search" onclick="menu.clearSearch()" style="display: none;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="menu-filters">
                    <button class="filter-btn" data-filter="vegetarian">
                        <i class="fas fa-leaf"></i> Vegetarian
                    </button>
                    <button class="filter-btn" data-filter="spicy">
                        <i class="fas fa-pepper-hot"></i> Spicy
                    </button>
                    <button class="filter-btn" data-filter="popular">
                        <i class="fas fa-fire"></i> Popular
                    </button>
                </div>
            `;
            searchContainer.appendChild(searchDiv);

            // Bind search events
            const searchInput = document.getElementById('menu-search');
            searchInput.addEventListener('input', (e) => this.searchMenuItems(e.target.value));
            searchInput.addEventListener('keyup', (e) => {
                const clearBtn = document.querySelector('.clear-search');
                clearBtn.style.display = e.target.value.length > 0 ? 'block' : 'none';
            });

            // Bind filter events
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.toggleFilter(e.target.dataset.filter, e.target));
            });
        }
    }

    searchMenuItems(query) {
        this.searchQuery = query.toLowerCase().trim();
        this.filterMenuItems();
    }

    toggleFilter(filter, button) {
        if (this.activeFilters.has(filter)) {
            this.activeFilters.delete(filter);
            button.classList.remove('active');
        } else {
            this.activeFilters.add(filter);
            button.classList.add('active');
        }
        this.filterMenuItems();
    }

    clearSearch() {
        document.getElementById('menu-search').value = '';
        document.querySelector('.clear-search').style.display = 'none';
        this.searchQuery = '';
        this.filterMenuItems();
    }

    filterMenuItems() {
        const menuItems = document.querySelectorAll('.menu-item');
        let visibleCount = 0;

        menuItems.forEach(item => {
            const itemName = item.querySelector('.item-name').textContent.toLowerCase();
            const itemDescription = item.querySelector('.item-description').textContent.toLowerCase();
            const itemTags = Array.from(item.querySelectorAll('.item-tag')).map(tag => tag.textContent.toLowerCase());

            let showItem = true;

            // Apply search filter
            if (this.searchQuery) {
                const searchMatch = itemName.includes(this.searchQuery) ||
                                  itemDescription.includes(this.searchQuery) ||
                                  itemTags.some(tag => tag.includes(this.searchQuery));
                showItem = showItem && searchMatch;
            }

            // Apply tag filters
            if (this.activeFilters.size > 0) {
                const hasMatchingFilter = Array.from(this.activeFilters).some(filter => 
                    itemTags.includes(filter) || 
                    (filter === 'popular' && itemTags.includes('popular')) // Check for popular tag in database
                );
                showItem = showItem && hasMatchingFilter;
            }

            if (showItem) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // Hide categories with no visible items
        document.querySelectorAll('.menu-category').forEach(category => {
            const visibleItems = category.querySelectorAll('.menu-item[style*="flex"]').length;
            category.style.display = visibleItems > 0 ? 'block' : 'none';
        });

        // Show no results message if needed
        this.showNoResultsMessage(visibleCount === 0);
    }

    showNoResultsMessage(show) {
        const existingMessage = document.getElementById('no-results-message');
        
        if (show && !existingMessage) {
            const message = document.createElement('div');
            message.id = 'no-results-message';
            message.className = 'empty-state';
            message.innerHTML = `
                <i class="fas fa-search"></i>
                <h3>No items found</h3>
                <p>Try adjusting your search or filters</p>
                <button onclick="menu.clearAllFilters()">Clear Filters</button>
            `;
            document.getElementById('menu-items').appendChild(message);
        } else if (!show && existingMessage) {
            existingMessage.remove();
        }
    }

    clearAllFilters() {
        // Clear search
        this.clearSearch();
        
        // Clear filters
        this.activeFilters.clear();
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.filterMenuItems();
    }

    toggleFavorite(itemId, button) {
        app.toggleFavorite(itemId, button);
    }

    adjustCartQuantity(itemId, change) {
        const currentQuantity = app.cart.getItemQuantity(itemId);
        const newQuantity = currentQuantity + change;
        
        if (newQuantity <= 0) {
            app.cart.removeItemById(itemId);
        } else {
            app.cart.updateItemQuantityById(itemId, newQuantity);
        }
        
        // Refresh the menu display to update quantity controls
        this.displayMenuItems();
    }

    quickAddToCart(item) {
        if (!item.is_available) {
            app.showNotification('This item is currently unavailable', 'warning');
            return;
        }

        app.cart.addItem({
            ...item,
            quantity: 1,
            customizations: []
        });
        
        app.showNotification(`${item.name} added to cart`, 'success');
        
        // Add visual feedback
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Added!';
        button.style.background = '#1ba672';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 1500);
    }

    openItemModal(item) {
        if (!item.is_available) {
            app.showNotification('This item is currently unavailable', 'warning');
            return;
        }

        const modal = document.getElementById('item-modal');
        const overlay = document.getElementById('modal-overlay');
        
        // Populate modal content
        document.getElementById('item-modal-title').textContent = item.name;
        document.getElementById('item-modal-description').textContent = item.description || 'Delicious and fresh';
        
        const modalImage = document.getElementById('item-modal-image');
        modalImage.src = item.image_url || this.getPlaceholderImage(item.name);
        modalImage.alt = item.name;
        
        const currencySymbol = app.currentBranch?.settings?.currency_symbol || '৳';
        document.getElementById('item-modal-price').textContent = `${currencySymbol}${parseFloat(item.price).toFixed(2)}`;
        
        // Reset quantity
        document.getElementById('item-quantity').textContent = '1';
        
        // Store current item
        app.currentModalItem = item;
        
        // Load customizations
        this.loadItemCustomizations(item);
        
        // Update initial price
        this.updateItemPrice();
        
        // Show modal
        app.showModal('item-modal');
    }

    loadItemCustomizations(item) {
        const container = document.getElementById('item-customizations');
        container.innerHTML = '';
        
        if (!item.customizations || item.customizations.length === 0) {
            container.innerHTML = '<p class="no-customizations">No customizations available</p>';
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
                                   onchange="menu.updateItemPrice()"
                                   ${group.type === 'single' && option.is_default ? 'checked' : ''}>
                            <span class="customization-option-name">${option.name}</span>
                            <span class="customization-option-price">
                                ${option.price > 0 ? `+${app.currentBranch?.settings?.currency_symbol || '৳'}${parseFloat(option.price).toFixed(2)}` : 'Free'}
                            </span>
                        </label>
                    `).join('')}
                </div>
            `;
            container.appendChild(groupDiv);
        });
    }

    updateItemPrice() {
        if (!app.currentModalItem) return;

        const basePrice = parseFloat(app.currentModalItem.price);
        const quantity = parseInt(document.getElementById('item-quantity').textContent);
        
        // Calculate customization price
        let customizationPrice = 0;
        document.querySelectorAll('#item-customizations input:checked').forEach(input => {
            const optionId = input.value;
            const option = this.findCustomizationOption(app.currentModalItem, optionId);
            if (option) {
                customizationPrice += parseFloat(option.price || 0);
            }
        });
        
        const totalPrice = (basePrice + customizationPrice) * quantity;
        const currencySymbol = app.currentBranch?.settings?.currency_symbol || '৳';
        document.getElementById('item-total-price').textContent = `${currencySymbol}${totalPrice.toFixed(2)}`;
    }

    findCustomizationOption(item, optionId) {
        for (const group of item.customizations || []) {
            const option = group.options.find(opt => opt.id == optionId);
            if (option) return option;
        }
        return null;
    }

    updateQuantity(change) {
        const qtyElement = document.getElementById('item-quantity');
        let qty = parseInt(qtyElement.textContent) + change;
        if (qty < 1) qty = 1;
        if (qty > 10) qty = 10; // Maximum quantity limit
        qtyElement.textContent = qty;
        this.updateItemPrice();
    }

    addToCart() {
        if (!app.currentModalItem) return;

        const quantity = parseInt(document.getElementById('item-quantity').textContent);
        const customizations = [];
        
        // Collect selected customizations
        document.querySelectorAll('#item-customizations input:checked').forEach(input => {
            const optionId = input.value;
            const option = this.findCustomizationOption(app.currentModalItem, optionId);
            if (option) {
                const groupId = input.name.replace('custom_', '');
                customizations.push({
                    group_id: groupId,
                    option_id: option.id,
                    option_name: option.name,
                    additional_price: parseFloat(option.price || 0)
                });
            }
        });
        
        app.cart.addItem({
            ...app.currentModalItem,
            quantity: quantity,
            customizations: customizations
        });
        
        app.closeModal('item-modal');
        app.showNotification(`${app.currentModalItem.name} added to cart`, 'success');
    }

    // Additional utility methods
    getItemById(itemId) {
        for (const category of this.currentMenu?.categories || []) {
            const item = category.items.find(item => item.branch_menu_item_id == itemId);
            if (item) return item;
        }
        return null;
    }

    getCategoryById(categoryId) {
        return this.currentMenu?.categories?.find(cat => cat.id == categoryId) || null;
    }

    getPopularItems(limit = 6) {
        const allItems = [];
        this.currentMenu?.categories?.forEach(category => {
            allItems.push(...category.items);
        });
        
        // Get items marked as popular in database, or fallback to available items
        return allItems
            .filter(item => item.is_available && (item.tags?.includes('popular') || item.is_popular))
            .slice(0, limit);
    }

    bindMenuEvents() {
        // Handle responsive category switching on mobile
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                this.makeCategoriesMobile();
            } else {
                this.makeCategoriesDesktop();
            }
        });
    }

    makeCategoriesMobile() {
        const categoryList = document.getElementById('category-list');
        if (categoryList) {
            categoryList.style.display = 'flex';
            categoryList.style.overflowX = 'auto';
            categoryList.style.padding = '16px';
            categoryList.style.gap = '8px';
        }
    }

    makeCategoriesDesktop() {
        const categoryList = document.getElementById('category-list');
        if (categoryList) {
            categoryList.style.display = 'block';
            categoryList.style.overflowX = 'visible';
            categoryList.style.padding = '0';
            categoryList.style.gap = '0';
        }
    }
}

// Create global menu manager instance
window.menu = new MenuManager();

// Global functions for onclick handlers
function selectCategory(categoryId) {
    menu.selectCategory(categoryId);
}

function quickAddToCart(item) {
    menu.quickAddToCart(item);
}

function openItemModal(item) {
    menu.openItemModal(item);
}

function updateQuantity(change) {
    menu.updateQuantity(change);
}

function addToCart() {
    menu.addToCart();
}

function updateItemPrice() {
    menu.updateItemPrice();
}
