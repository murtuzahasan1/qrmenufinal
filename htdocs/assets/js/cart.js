// LunaDine - Shopping Cart JavaScript
// Handles cart functionality, checkout process, and order placement

class ShoppingCart {
    constructor() {
        this.items = [];
        this.branch = null;
        this.orderType = 'dine-in';
        this.selectedTable = null;
        this.promoCode = null;
        this.discount = 0;
        this.currentStep = 1;
        
        this.init();
    }

    init() {
        this.loadCartFromStorage();
        this.updateCartDisplay();
    }

    setBranch(branch) {
        this.branch = branch;
        this.saveCartToStorage();
    }

    setOrderType(type) {
        this.orderType = type;
        this.saveCartToStorage();
    }

    addItem(item) {
        const existingIndex = this.items.findIndex(cartItem => 
            cartItem.branch_menu_item_id === item.branch_menu_item_id && 
            JSON.stringify(cartItem.customizations) === JSON.stringify(item.customizations)
        );

        if (existingIndex > -1) {
            this.items[existingIndex].quantity += item.quantity;
        } else {
            this.items.push({
                ...item,
                id: 'cart-' + Date.now() + '-' + Math.floor(Math.random() * 1000), // More reliable unique ID
                addedAt: new Date().toISOString()
            });
        }

        this.saveCartToStorage();
        this.updateCartDisplay();
        this.showFloatingCart();
    }

    removeItem(cartItemId) {
        console.log('removeItem called:', cartItemId);
        console.log('cartItemId type:', typeof cartItemId);
        console.log('Current cart items before removal:', this.items.map(i => ({ id: i.id, idType: typeof i.id, name: i.name })));
        
        const initialLength = this.items.length;
        // Ensure string comparison
        const itemIdStr = String(cartItemId);
        this.items = this.items.filter(item => String(item.id) !== itemIdStr);
        
        console.log('Items removed:', initialLength - this.items.length);
        console.log('Cart items after removal:', this.items.map(i => ({ id: i.id, name: i.name })));
        
        this.saveCartToStorage();
        this.updateCartDisplay();
        
        if (this.items.length === 0) {
            this.hideFloatingCart();
        }
    }

    updateItemQuantity(cartItemId, newQuantity) {
        console.log('updateItemQuantity called:', cartItemId, newQuantity);
        console.log('cartItemId type:', typeof cartItemId);
        console.log('Current cart items:', this.items.map(i => ({ id: i.id, idType: typeof i.id, name: i.name, qty: i.quantity })));
        
        // Ensure string comparison
        const itemIdStr = String(cartItemId);
        const item = this.items.find(item => String(item.id) === itemIdStr);
        console.log('Found item:', item);
        
        if (item) {
            if (newQuantity <= 0) {
                console.log('Quantity <= 0, removing item');
                this.removeItem(cartItemId);
            } else {
                console.log('Updating quantity from', item.quantity, 'to', newQuantity);
                item.quantity = newQuantity;
                this.saveCartToStorage();
                this.updateCartDisplay();
                console.log('Quantity updated successfully');
            }
        } else {
            console.error('Item not found with ID:', cartItemId, 'Available IDs:', this.items.map(i => i.id));
        }
    }

    getItemQuantity(menuItemId) {
        return this.items
            .filter(item => item.branch_menu_item_id === menuItemId)
            .reduce((total, item) => total + item.quantity, 0);
    }

    updateItemQuantityById(menuItemId, newQuantity) {
        const item = this.items.find(item => item.branch_menu_item_id === menuItemId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeItemById(menuItemId);
            } else {
                item.quantity = newQuantity;
                this.saveCartToStorage();
                this.updateCartDisplay();
            }
        }
    }

    removeItemById(menuItemId) {
        this.items = this.items.filter(item => item.branch_menu_item_id !== menuItemId);
        this.saveCartToStorage();
        this.updateCartDisplay();
    }

    clear() {
        this.items = [];
        this.promoCode = null;
        this.discount = 0;
        this.selectedTable = null;
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.hideFloatingCart();
    }

    getSubtotal() {
        return this.items.reduce((total, item) => {
            const itemPrice = parseFloat(item.price);
            const customizationPrice = item.customizations.reduce((custTotal, custom) => {
                return custTotal + parseFloat(custom.additional_price || 0);
            }, 0);
            return total + ((itemPrice + customizationPrice) * item.quantity);
        }, 0);
    }

    getVATAmount() {
        const vatPercentage = this.branch?.settings?.vat_percentage || 15;
        return (this.getSubtotal() * vatPercentage) / 100;
    }

    getDiscountAmount() {
        return this.discount;
    }

    getTotal() {
        return this.getSubtotal() + this.getVATAmount() - this.getDiscountAmount();
    }

    updateCartDisplay() {
        console.log('updateCartDisplay called');
        console.log('Current cart items:', this.items.length);
        this.updateCartSummary();
        this.updateCartDetails();
        this.updateCheckoutItems();
        console.log('updateCartDisplay completed');
    }

    updateCartSummary() {
        const count = this.items.reduce((total, item) => total + item.quantity, 0);
        const total = this.getTotal();
        const currencySymbol = this.branch?.settings?.currency_symbol || '৳';

        document.getElementById('cart-count').textContent = count;
        document.getElementById('cart-total').textContent = `${currencySymbol}${total.toFixed(2)}`;

        // Show/hide floating cart
        if (count > 0) {
            this.showFloatingCart();
        } else {
            this.hideFloatingCart();
        }
    }

    updateCartDetails() {
        const cartItems = document.getElementById('cart-items');
        const currencySymbol = this.branch?.settings?.currency_symbol || '৳';

        if (this.items.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add some delicious items to get started</p>
                </div>
            `;
            return;
        }

        cartItems.innerHTML = '';

        this.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            
            const customizationsText = item.customizations.length > 0 
                ? item.customizations.map(c => c.option_name).join(', ')
                : '';

            const itemPrice = parseFloat(item.price);
            const customizationPrice = item.customizations.reduce((total, custom) => {
                return total + parseFloat(custom.additional_price || 0);
            }, 0);
            const totalItemPrice = (itemPrice + customizationPrice) * item.quantity;

            itemElement.innerHTML = `
                <div class="cart-item-image" style="background-image: url('${item.image_url || ''}')"></div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    ${customizationsText ? `<div class="cart-item-customizations">${customizationsText}</div>` : ''}
                    <div class="cart-item-controls">
                        <div class="cart-qty-controls">
                            <button class="cart-qty-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                            <span class="cart-qty">${item.quantity}</span>
                            <button class="cart-qty-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        </div>
                        <div class="cart-item-price">${currencySymbol}${totalItemPrice.toFixed(2)}</div>
                        <button class="remove-item-btn" onclick="removeCartItem('${item.id}')" title="Remove item">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;

            cartItems.appendChild(itemElement);
        });

        // Update totals
        document.getElementById('cart-subtotal').textContent = `${currencySymbol}${this.getSubtotal().toFixed(2)}`;
        document.getElementById('cart-vat').textContent = `${currencySymbol}${this.getVATAmount().toFixed(2)}`;
        document.getElementById('cart-final-total').textContent = `${currencySymbol}${this.getTotal().toFixed(2)}`;
    }

    updateCheckoutItems() {
        const checkoutItems = document.getElementById('checkout-items');
        if (!checkoutItems) return;

        const currencySymbol = this.branch?.settings?.currency_symbol || '৳';
        
        checkoutItems.innerHTML = `
            <div class="order-items">
                ${this.items.map(item => {
                    const itemPrice = parseFloat(item.price);
                    const customizationPrice = item.customizations.reduce((total, custom) => {
                        return total + parseFloat(custom.additional_price || 0);
                    }, 0);
                    const totalItemPrice = (itemPrice + customizationPrice) * item.quantity;
                    
                    return `
                        <div class="checkout-item">
                            <span class="item-name">${item.name} × ${item.quantity}</span>
                            <span class="item-price">${currencySymbol}${totalItemPrice.toFixed(2)}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="order-totals">
                <div class="total-line">
                    <span>Subtotal:</span>
                    <span>${currencySymbol}${this.getSubtotal().toFixed(2)}</span>
                </div>
                <div class="total-line">
                    <span>VAT (${this.branch?.settings?.vat_percentage || 15}%):</span>
                    <span>${currencySymbol}${this.getVATAmount().toFixed(2)}</span>
                </div>
                ${this.discount > 0 ? `
                    <div class="total-line discount">
                        <span>Discount:</span>
                        <span>-${currencySymbol}${this.getDiscountAmount().toFixed(2)}</span>
                    </div>
                ` : ''}
                <div class="total-line total">
                    <span>Total:</span>
                    <span>${currencySymbol}${this.getTotal().toFixed(2)}</span>
                </div>
            </div>
        `;

        // Update final summary
        document.getElementById('final-subtotal').textContent = `${currencySymbol}${this.getSubtotal().toFixed(2)}`;
        document.getElementById('final-vat').textContent = `${currencySymbol}${this.getVATAmount().toFixed(2)}`;
        document.getElementById('final-total').textContent = `${currencySymbol}${this.getTotal().toFixed(2)}`;
        
        if (this.discount > 0) {
            document.getElementById('final-discount').textContent = `${currencySymbol}${this.getDiscountAmount().toFixed(2)}`;
            document.getElementById('final-discount-line').style.display = 'flex';
        } else {
            document.getElementById('final-discount-line').style.display = 'none';
        }
    }

    showFloatingCart() {
        document.getElementById('floating-cart').style.display = 'block';
    }

    hideFloatingCart() {
        document.getElementById('floating-cart').style.display = 'none';
    }

    toggle() {
        console.log('Cart toggle method called');
        const cartDetails = document.getElementById('cart-details');
        if (!cartDetails) {
            console.error('Cart details element not found');
            return;
        }
        
        cartDetails.classList.toggle('show');
        
        // Force visibility on mobile for debugging
        if (window.innerWidth <= 768) {
            if (cartDetails.classList.contains('show')) {
                cartDetails.style.display = 'block';
                cartDetails.style.opacity = '1';
                cartDetails.style.visibility = 'visible';
                cartDetails.style.transform = 'translateY(0)';
                cartDetails.style.position = 'fixed';
                cartDetails.style.bottom = '100px';
                cartDetails.style.left = '20px';
                cartDetails.style.right = '20px';
                cartDetails.style.zIndex = '9999';
                cartDetails.style.background = 'white';
                cartDetails.style.border = '1px solid #ddd'; // Subtle border instead of red
            } else {
                // Reset styles when hiding
                cartDetails.style.display = '';
                cartDetails.style.opacity = '';
                cartDetails.style.visibility = '';
                cartDetails.style.transform = '';
                cartDetails.style.position = '';
                cartDetails.style.bottom = '';
                cartDetails.style.left = '';
                cartDetails.style.right = '';
                cartDetails.style.zIndex = '';
                cartDetails.style.background = '';
                cartDetails.style.border = '';
            }
        }
    }

    async proceedToCheckout() {
        if (this.items.length === 0) {
            app.showNotification('Your cart is empty', 'warning');
            return;
        }

        if (!this.branch) {
            app.showNotification('Please select a restaurant first', 'warning');
            return;
        }

        // Load tables if dine-in
        if (this.orderType === 'dine-in') {
            await this.loadTables();
        }

        // Hide cart and show checkout modal
        this.toggle();
        this.showCheckoutModal();
    }

    async loadTables() {
        try {
            const tables = await app.loadTables(this.branch.id);
            this.displayTables(tables);
        } catch (error) {
            console.error('Error loading tables:', error);
            app.showNotification('Failed to load tables', 'error');
        }
    }

    displayTables(tables) {
        const tablesGrid = document.getElementById('tables-grid');
        tablesGrid.innerHTML = '';

        if (tables.length === 0) {
            tablesGrid.innerHTML = '<p>No tables available</p>';
            return;
        }

        tables.forEach(table => {
            const tableElement = document.createElement('div');
            tableElement.className = 'table-option';
            if (this.selectedTable && this.selectedTable.id === table.id) {
                tableElement.classList.add('selected');
            }
            
            tableElement.innerHTML = `
                <div class="table-number">Table ${table.table_identifier}</div>
                <div class="table-capacity">Seats ${table.capacity}</div>
            `;
            
            tableElement.onclick = () => this.selectTable(table);
            tablesGrid.appendChild(tableElement);
        });

        // Pre-select table if coming from QR code
        if (app.currentTable && !this.selectedTable) {
            const qrTable = tables.find(t => t.id == app.currentTable.id);
            if (qrTable) {
                this.selectTable(qrTable);
            }
        }
    }

    selectTable(table) {
        // Remove previous selection
        document.querySelectorAll('.table-option').forEach(el => {
            el.classList.remove('selected');
        });

        // Select new table
        event.target.closest('.table-option').classList.add('selected');
        this.selectedTable = table;
        
        app.showNotification(`Table ${table.table_identifier} selected`, 'success');
    }

    showCheckoutModal() {
        this.currentStep = 1;
        
        // Initialize order type selection
        document.querySelectorAll('.checkout-modal .order-type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === this.orderType) {
                btn.classList.add('active');
            }
            
            // Add click event listener for order type buttons
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Order type button clicked:', btn.dataset.type);
                
                // Remove active class from all buttons
                document.querySelectorAll('.checkout-modal .order-type-btn').forEach(b => {
                    b.classList.remove('active');
                });
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Update order type
                this.orderType = btn.dataset.type;
                console.log('Order type set to:', this.orderType);
                
                // Update checkout sections
                this.updateCheckoutSections();
                
                // Save to storage
                this.saveCartToStorage();
            });
        });
        
        // Update checkout sections based on current order type
        this.updateCheckoutSections();
        
        this.updateCheckoutStep();
        app.showModal('checkout-modal');
    }

    updateCheckoutStep() {
        // Update step indicators
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index + 1 < this.currentStep) {
                step.classList.add('completed');
            } else if (index + 1 === this.currentStep) {
                step.classList.add('active');
            }
        });

        // Show/hide step content
        document.querySelectorAll('.checkout-step').forEach((step, index) => {
            step.style.display = index + 1 === this.currentStep ? 'block' : 'none';
        });

        // Update buttons
        const backBtn = document.getElementById('checkout-back-btn');
        const nextBtn = document.getElementById('checkout-next-btn');
        const placeOrderBtn = document.getElementById('place-order-btn');

        backBtn.style.display = this.currentStep > 1 ? 'inline-block' : 'none';
        nextBtn.style.display = this.currentStep < 3 ? 'inline-block' : 'none';
        placeOrderBtn.style.display = this.currentStep === 3 ? 'inline-block' : 'none';

        // Update next button text
        if (this.currentStep === 1) {
            nextBtn.textContent = 'Continue to Customer Info';
        } else if (this.currentStep === 2) {
            nextBtn.textContent = 'Continue to Payment';
        }

        // Update order type specific sections
        if (this.currentStep === 1) {
            this.updateOrderTypeDisplay();
        }
    }

    updateOrderTypeDisplay() {
        const tableSelection = document.getElementById('table-selection');
        const deliveryAddress = document.getElementById('delivery-address');

        if (this.orderType === 'dine-in') {
            tableSelection.style.display = 'block';
            deliveryAddress.style.display = 'none';
        } else if (this.orderType === 'delivery') {
            tableSelection.style.display = 'none';
            deliveryAddress.style.display = 'block';
        } else {
            tableSelection.style.display = 'none';
            deliveryAddress.style.display = 'none';
        }
    }

    updateCheckoutSections() {
        const tableSelection = document.getElementById('table-selection');
        const deliveryAddress = document.getElementById('delivery-address');
        
        if (this.orderType === 'dine-in') {
            if (tableSelection) tableSelection.style.display = 'block';
            if (deliveryAddress) deliveryAddress.style.display = 'none';
        } else if (this.orderType === 'delivery') {
            if (tableSelection) tableSelection.style.display = 'none';
            if (deliveryAddress) deliveryAddress.style.display = 'block';
        } else {
            if (tableSelection) tableSelection.style.display = 'none';
            if (deliveryAddress) deliveryAddress.style.display = 'none';
        }
    }

    nextCheckoutStep() {
        console.log('Next checkout step called, current step:', this.currentStep);
        if (!this.validateCurrentStep()) {
            console.log('Step validation failed');
            return;
        }

        if (this.currentStep < 3) {
            this.currentStep++;
            console.log('Moving to step:', this.currentStep);
            this.updateCheckoutStep();
        }
    }

    previousCheckoutStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateCheckoutStep();
        }
    }

    validateCurrentStep() {
        console.log('Validating step:', this.currentStep, 'Order type:', this.orderType);
        switch (this.currentStep) {
            case 1:
                // Allow proceeding from step 1 for all order types
                // Table selection can be optional or handled later
                console.log('Step 1 validation passed');
                return true;
            case 2:
                const name = document.getElementById('customer-name').value.trim();
                const phone = document.getElementById('customer-phone').value.trim();
                
                if (!name) {
                    app.showNotification('Please enter your name', 'warning');
                    document.getElementById('customer-name').focus();
                    return false;
                }
                
                if (!phone) {
                    app.showNotification('Please enter your phone number', 'warning');
                    document.getElementById('customer-phone').focus();
                    return false;
                }

                if (this.orderType === 'delivery') {
                    const address = document.getElementById('customer-address').value.trim();
                    if (!address) {
                        app.showNotification('Please enter your delivery address', 'warning');
                        document.getElementById('customer-address').focus();
                        return false;
                    }
                }
                return true;
            case 3:
                return true;
            default:
                return true;
        }
    }

    async applyPromoCode() {
        const codeInput = document.getElementById('promo-code');
        const code = codeInput.value.trim();
        const messageElement = document.getElementById('promo-message');

        if (!code) {
            messageElement.textContent = 'Please enter a promo code';
            messageElement.className = 'promo-message error';
            return;
        }

        try {
            const response = await fetch('api/index.php?promocode=1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code
                })
            });

            if (response.ok) {
                const promoData = await response.json();
                this.promoCode = promoData;
                
                // Calculate discount
                const subtotal = this.getSubtotal();
                if (subtotal >= promoData.min_order_amount) {
                    if (promoData.type === 'percentage') {
                        this.discount = (subtotal * promoData.discount) / 100;
                    } else {
                        this.discount = Math.min(promoData.discount, subtotal);
                    }
                    
                    messageElement.textContent = `Promo code applied! You saved ${this.branch?.settings?.currency_symbol || '৳'}${this.discount.toFixed(2)}`;
                    messageElement.className = 'promo-message success';
                    
                    this.updateCartDisplay();
                    app.showNotification('Promo code applied successfully!', 'success');
                } else {
                    messageElement.textContent = `Minimum order amount is ${this.branch?.settings?.currency_symbol || '৳'}${promoData.min_order_amount}`;
                    messageElement.className = 'promo-message error';
                }
            } else {
                messageElement.textContent = 'Invalid or expired promo code';
                messageElement.className = 'promo-message error';
            }
        } catch (error) {
            console.error('Error applying promo code:', error);
            messageElement.textContent = 'Failed to apply promo code';
            messageElement.className = 'promo-message error';
        }
    }

    selectPaymentMethod(method) {
        document.querySelectorAll('.payment-method').forEach(el => {
            el.classList.remove('active');
        });
        event.target.closest('.payment-method').classList.add('active');
    }

    async placeOrder() {
        try {
            if (!this.validateCurrentStep()) {
                return;
            }

            app.showLoading();

            const orderData = {
                branch_id: this.branch.id,
                order_type: this.orderType === 'dine-in' ? 'dine-in' : this.orderType,
                table_id: this.selectedTable?.id || null,
                customer_name: document.getElementById('customer-name').value.trim(),
                customer_phone: document.getElementById('customer-phone').value.trim(),
                customer_address: this.orderType === 'delivery' ? document.getElementById('customer-address').value.trim() : null,
                language: app.currentLanguage,
                promo_code: this.promoCode?.code || null,
                items: this.items.map(item => ({
                    branch_menu_item_id: item.branch_menu_item_id,
                    quantity: item.quantity,
                    customizations: item.customizations
                }))
            };

            const response = await fetch('api/index.php?orders=1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const result = await response.json();
                
                // Save order to history
                app.orders.addToHistory({
                    ...result,
                    items: this.items,
                    branch: this.branch,
                    orderType: this.orderType,
                    customer: {
                        name: orderData.customer_name,
                        phone: orderData.customer_phone,
                        address: orderData.customer_address
                    },
                    total: this.getTotal(),
                    placedAt: new Date().toISOString()
                });

                // Clear cart
                this.clear();
                
                // Close checkout modal
                app.closeModal('checkout-modal');
                
                app.showNotification('Order placed successfully!', 'success', 'Thank you!');
                
                // Show order tracking info notification
                setTimeout(() => {
                    app.showNotification('Your order is being prepared. Check your order history to track progress.', 'info', 'Order Tracking');
                }, 2000);
                
            } else {
                const errorData = await response.json();
                app.showNotification(errorData.error || 'Failed to place order', 'error');
            }

        } catch (error) {
            console.error('Error placing order:', error);
            app.showNotification('Failed to place order. Please try again.', 'error');
        } finally {
            app.hideLoading();
        }
    }

    saveCartToStorage() {
        const cartData = {
            items: this.items,
            branch: this.branch,
            orderType: this.orderType,
            selectedTable: this.selectedTable,
            promoCode: this.promoCode,
            discount: this.discount
        };
        localStorage.setItem('lunadine_cart', JSON.stringify(cartData));
    }

    loadCartFromStorage() {
        const cartData = localStorage.getItem('lunadine_cart');
        if (cartData) {
            try {
                const parsed = JSON.parse(cartData);
                this.items = parsed.items || [];
                this.branch = parsed.branch;
                this.orderType = parsed.orderType || 'dine-in';
                this.selectedTable = parsed.selectedTable;
                this.promoCode = parsed.promoCode;
                this.discount = parsed.discount || 0;
            } catch (error) {
                console.error('Error loading cart from storage:', error);
                this.clear();
            }
        }
    }
}

// Global functions for onclick handlers
function nextCheckoutStep() {
    app.cart.nextCheckoutStep();
}

function previousCheckoutStep() {
    app.cart.previousCheckoutStep();
}

function applyPromoCode() {
    app.cart.applyPromoCode();
}

function placeOrder() {
    app.cart.placeOrder();
}
