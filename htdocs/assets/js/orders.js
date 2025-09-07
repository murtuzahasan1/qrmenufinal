// LunaDine - Order Management JavaScript
// Handles order history, tracking, and related functionality

class OrderManager {
    constructor() {
        this.orders = [];
        this.trackingInterval = null;
        this.init();
    }

    init() {
        this.loadOrderHistory();
    }

    addToHistory(order) {
        this.orders.unshift(order); // Add to beginning
        this.saveOrderHistory();
    }

    loadOrderHistory() {
        const stored = localStorage.getItem('lunadine_order_history');
        if (stored) {
            try {
                this.orders = JSON.parse(stored);
            } catch (error) {
                console.error('Error loading order history:', error);
                this.orders = [];
            }
        }
    }

    saveOrderHistory() {
        // Keep only last 50 orders
        if (this.orders.length > 50) {
            this.orders = this.orders.slice(0, 50);
        }
        localStorage.setItem('lunadine_order_history', JSON.stringify(this.orders));
    }

    showHistory() {
        // Hide other sections
        document.getElementById('branches-section').style.display = 'none';
        document.getElementById('menu-section').style.display = 'none';
        document.getElementById('favorites-section').style.display = 'none';
        
        // Show order history section
        document.getElementById('order-history-section').style.display = 'block';
        
        this.displayOrderHistory();
    }

    displayOrderHistory() {
        const container = document.getElementById('order-history-list');
        
        if (this.orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>No orders yet</h3>
                    <p>Your order history will appear here after you place your first order</p>
                    <button onclick="app.goBackToBranches()">Start Ordering</button>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        this.orders.forEach(order => {
            const orderElement = this.createOrderHistoryItem(order);
            container.appendChild(orderElement);
        });
    }

    createOrderHistoryItem(order) {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-history-item';

        const currencySymbol = order.branch?.settings?.currency_symbol || '৳';
        const orderDate = new Date(order.placedAt).toLocaleString();
        const statusClass = this.getStatusClass(order.status);

        orderDiv.innerHTML = `
            <div class="order-header">
                <div class="order-info">
                    <h3>Order #${order.order_id}</h3>
                    <p class="order-date">${orderDate}</p>
                    <p class="order-restaurant">${order.branch?.name || 'Unknown Restaurant'}</p>
                </div>
                <div class="order-status ${statusClass}">${order.status}</div>
            </div>
            
            <div class="order-items-summary">
                <p><strong>Items:</strong> ${this.getOrderItemsSummary(order.items)}</p>
                <p><strong>Order Type:</strong> ${this.formatOrderType(order.orderType)}</p>
                ${order.customer?.address ? `<p><strong>Address:</strong> ${order.customer.address}</p>` : ''}
            </div>
            
            <div class="order-footer">
                <div class="order-total">${currencySymbol}${order.total.toFixed(2)}</div>
                <div class="order-actions">
                    <button onclick="app.orders.trackOrder('${order.order_id}')">Track Order</button>
                    <button onclick="app.orders.reorder('${order.order_id}')">Reorder</button>
                    <button onclick="app.orders.showOrderDetails('${order.order_id}')">View Details</button>
                </div>
            </div>
        `;

        return orderDiv;
    }

    getOrderItemsSummary(items) {
        if (!items || items.length === 0) return 'No items';
        
        if (items.length === 1) {
            return `${items[0].name} × ${items[0].quantity}`;
        } else {
            const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
            return `${items.length} different items (${totalItems} total)`;
        }
    }

    formatOrderType(orderType) {
        switch (orderType) {
            case 'dine-in': return 'Dine In';
            case 'takeaway': return 'Takeaway';
            case 'delivery': return 'Delivery';
            default: return orderType;
        }
    }

    getStatusClass(status) {
        switch (status?.toLowerCase()) {
            case 'delivered':
            case 'completed':
                return 'delivered';
            case 'preparing':
            case 'placed':
                return 'preparing';
            case 'cancelled':
                return 'cancelled';
            default:
                return 'preparing';
        }
    }

    async trackOrder(orderId) {
        console.log('📦 TrackOrder called for:', orderId);
        
        // First, try to find the order in localStorage
        const localOrder = this.orders.find(order => order.order_id === orderId);
        
        if (localOrder) {
            console.log('✅ Found order in localStorage:', localOrder);
            
            // Use localStorage data for tracking
            this.showTrackingModalFromLocalStorage(localOrder);
        } else {
            console.log('🔍 Order not found in localStorage, trying API...');
            
            // Fallback to API if order not found locally
            try {
                const response = await fetch(`api/index.php?order_status=1&order_uid=${orderId}`);
                
                if (response.ok) {
                    const orderStatus = await response.json();
                    this.showTrackingModal(orderStatus);
                } else {
                    app.showNotification('Unable to track order', 'error');
                }
            } catch (error) {
                console.error('Error tracking order:', error);
                app.showNotification('Failed to track order', 'error');
            }
        }
    }

    showTrackingModalFromLocalStorage(localOrder) {
        console.log('📦 OrderManager: showTrackingModalFromLocalStorage called with:', localOrder);
        
        // Map localStorage order structure to tracking system
        let orderType = 'delivery'; // default
        let currentStep = 'preparing'; // default
        
        // Get order type from localStorage
        if (localOrder.orderType) {
            // The localStorage uses orderType field
            switch(localOrder.orderType.toLowerCase()) {
                case 'delivery':
                    orderType = 'delivery';
                    break;
                case 'takeaway':
                case 'pickup':
                    orderType = 'takeaway';
                    break;
                case 'dine-in':
                case 'dine_in':
                case 'dinein':
                    orderType = 'dine-in';
                    break;
                default:
                    orderType = 'delivery';
            }
            console.log('✅ Using orderType from localStorage:', orderType);
        }
        
        // Determine current step based on order status or time elapsed
        if (localOrder.status) {
            switch(localOrder.status.toLowerCase()) {
                case 'placed':
                case 'confirmed':
                    currentStep = 'placed';
                    break;
                case 'preparing':
                case 'in_kitchen':
                    currentStep = 'preparing';
                    break;
                case 'ready':
                    currentStep = 'ready';
                    break;
                case 'out_for_delivery':
                    currentStep = 'out';
                    break;
                case 'delivered':
                case 'completed':
                    currentStep = orderType === 'delivery' ? 'delivered' : 
                                 orderType === 'takeaway' ? 'collected' : 'served';
                    break;
                default:
                    // Simulate progress based on time elapsed
                    const orderTime = new Date(localOrder.placedAt);
                    const now = new Date();
                    const minutesElapsed = (now - orderTime) / (1000 * 60);
                    
                    if (minutesElapsed < 5) {
                        currentStep = 'placed';
                    } else if (minutesElapsed < 15) {
                        currentStep = 'preparing';
                    } else if (minutesElapsed < 25) {
                        currentStep = 'ready';
                    } else {
                        currentStep = orderType === 'delivery' ? 'out' : 'ready';
                    }
            }
        }
        
        console.log(`📦 Final localStorage order details: Type=${orderType}, Step=${currentStep}, ID=${localOrder.order_id}`);
        
        // Use the new enhanced tracking system
        if (typeof showOrderTracking === 'function') {
            showOrderTracking(localOrder.order_id, orderType, currentStep);
        } else {
            console.error('Enhanced tracking system not available, falling back to basic modal');
            // Fallback to basic modal opening
            if (window.app && window.app.showModal) {
                window.app.showModal('tracking-modal');
            }
        }
    }

    showTracking(orderId) {
        // Use localStorage data primarily, fallback to database
        this.trackOrder(orderId);
    }

    showTrackingModal(orderStatus) {
        // Use the new enhanced tracking system instead of the old one
        console.log('📦 OrderManager: showTrackingModal called with orderStatus:', orderStatus);
        
        // Map database order status to our tracking steps
        let currentStep = 'preparing'; // default
        let orderType = 'delivery'; // default, should come from orderStatus
        
        // Enhanced order type detection with debugging
        console.log('🔍 Detecting order type from orderStatus...');
        console.log('📊 orderStatus.order_type:', orderStatus.order_type);
        console.log('📊 orderStatus.delivery_method:', orderStatus.delivery_method);
        console.log('📊 orderStatus.service_type:', orderStatus.service_type);
        console.log('📊 orderStatus.type:', orderStatus.type);
        
        // Primary field: order_type from database
        if (orderStatus.order_type) {
            orderType = orderStatus.order_type;
            console.log('✅ Using order_type from database:', orderType);
        } 
        // Fallback fields for legacy data or other APIs
        else if (orderStatus.delivery_method) {
            switch(orderStatus.delivery_method.toLowerCase()) {
                case 'delivery':
                    orderType = 'delivery';
                    break;
                case 'pickup':
                case 'takeaway':
                case 'take_away':
                    orderType = 'takeaway';
                    break;
                case 'dine_in':
                case 'dine-in':
                case 'dinein':
                    orderType = 'dine-in';
                    break;
                default:
                    orderType = 'delivery';
            }
            console.log('✅ Mapped delivery_method to orderType:', orderType);
        } else {
            console.log('⚠️ No order type field found, using default: delivery');
            // For testing purposes, let's vary the order type based on order ID
            if (orderStatus.order_id) {
                const orderId = orderStatus.order_id.toString();
                if (orderId.includes('T') || orderId.includes('2')) {
                    orderType = 'takeaway';
                    console.log('🧪 Test: Set to takeaway based on order ID');
                } else if (orderId.includes('D') || orderId.includes('3')) {
                    orderType = 'dine-in';
                    console.log('🧪 Test: Set to dine-in based on order ID');
                }
            }
        }
        
        // Map the status from the database to our tracking system
        switch(orderStatus.status) {
            case 'placed':
            case 'confirmed':
                currentStep = 'placed';
                break;
            case 'preparing':
                currentStep = 'preparing';
                break;
            case 'ready':
                currentStep = 'ready';
                break;
            case 'out_for_delivery':
                currentStep = 'out';
                break;
            case 'delivered':
                currentStep = 'delivered';
                break;
            case 'collected':
                currentStep = 'collected';
                break;
            case 'served':
                currentStep = 'served';
                break;
            default:
                currentStep = 'preparing';
        }
        
        console.log(`📦 Final order details: Type=${orderType}, Step=${currentStep}, ID=${orderStatus.order_id}`);
        
        // Use the new enhanced tracking system
        if (typeof showOrderTracking === 'function') {
            showOrderTracking(orderStatus.order_id, orderType, currentStep);
        } else {
            console.error('Enhanced tracking system not available, falling back to basic modal');
            // Fallback to basic modal opening
            if (window.app && window.app.showModal) {
                window.app.showModal('tracking-modal');
            }
        }
        
        // Start tracking updates
        this.startTrackingUpdates(orderStatus.order_id);
    }

    updateStatusTimeline(currentStatus) {
        // This method is now handled by the enhanced tracking system
        // Keep for backwards compatibility but redirect to new system
        console.log('📍 updateStatusTimeline called - now handled by enhanced tracking system');
        
        // If we need to update an existing timeline, we could call our new functions here
        // But generally this should be handled by showOrderTracking
    }

    startTrackingUpdates(orderId) {
        // Clear any existing interval
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
        }

        // Update every 30 seconds
        this.trackingInterval = setInterval(() => {
            this.updateOrderStatus(orderId);
        }, 30000);
    }

    stopTrackingUpdates() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
    }

    async updateOrderStatus(orderId) {
        try {
            const response = await fetch(`api/index.php?order_status=1&order_uid=${orderId}`);
            
            if (response.ok) {
                const orderStatus = await response.json();
                this.updateStatusTimeline(orderStatus.status);
                
                // Update estimated time
                if (orderStatus.estimated_completion_time) {
                    const estimatedTime = new Date(orderStatus.estimated_completion_time);
                    const now = new Date();
                    const diffMinutes = Math.max(0, Math.ceil((estimatedTime - now) / (1000 * 60)));
                    document.getElementById('estimated-time').textContent = `${diffMinutes} minutes`;
                }

                // Stop tracking if order is completed
                if (orderStatus.status === 'delivered' || orderStatus.status === 'completed') {
                    this.stopTrackingUpdates();
                    
                    // Show completion notification
                    setTimeout(() => {
                        app.showNotification('Your order has been delivered! Enjoy your meal!', 'success');
                        this.showFeedbackPrompt(orderId);
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    }

    showFeedbackPrompt(orderId) {
        // For now, just show a notification
        // In a full implementation, you'd show a feedback modal
        setTimeout(() => {
            app.showNotification('Rate your experience!', 'info');
        }, 5000);
    }

    reorder(orderId) {
        const order = this.orders.find(o => o.order_id === orderId);
        if (!order) {
            app.showNotification('Order not found', 'error');
            return;
        }

        // Clear current cart
        app.cart.clear();

        // Set branch and order type
        if (order.branch) {
            app.cart.setBranch(order.branch);
            app.cart.setOrderType(order.orderType);
        }

        // Add items to cart
        order.items.forEach(item => {
            app.cart.addItem({
                ...item,
                quantity: item.quantity
            });
        });

        app.showNotification(`${order.items.length} items added to cart`, 'success');
        
        // Navigate to menu if we have branch info
        if (order.branch) {
            app.showBranchMenu(order.branch.id);
        } else {
            app.goBackToBranches();
        }
    }

    showOrderDetails(orderId) {
        const order = this.orders.find(o => o.order_id === orderId);
        if (!order) {
            app.showNotification('Order not found', 'error');
            return;
        }

        // Create and show order details modal
        this.createOrderDetailsModal(order);
    }

    createOrderDetailsModal(order) {
        const modalOverlay = document.getElementById('modal-overlay');
        const currencySymbol = order.branch?.settings?.currency_symbol || '৳';
        
        // Create modal content
        const modalContent = `
            <div class="modal order-details-modal">
                <div class="modal-header">
                    <h3>Order Details - #${order.order_id}</h3>
                    <button class="modal-close" onclick="app.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="order-details-content">
                        <div class="detail-section">
                            <h4>Restaurant Information</h4>
                            <p><strong>Name:</strong> ${order.branch?.name || 'Unknown'}</p>
                            <p><strong>Address:</strong> ${order.branch?.address || 'Unknown'}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Order Information</h4>
                            <p><strong>Order Type:</strong> ${this.formatOrderType(order.orderType)}</p>
                            <p><strong>Status:</strong> ${order.status}</p>
                            <p><strong>Placed:</strong> ${new Date(order.placedAt).toLocaleString()}</p>
                            ${order.customer?.name ? `<p><strong>Customer:</strong> ${order.customer.name}</p>` : ''}
                            ${order.customer?.phone ? `<p><strong>Phone:</strong> ${order.customer.phone}</p>` : ''}
                            ${order.customer?.address ? `<p><strong>Address:</strong> ${order.customer.address}</p>` : ''}
                        </div>
                        
                        <div class="detail-section">
                            <h4>Order Items</h4>
                            <div class="order-items-list">
                                ${order.items.map(item => `
                                    <div class="order-item">
                                        <div class="item-info">
                                            <span class="item-name">${item.name}</span>
                                            <span class="item-quantity">× ${item.quantity}</span>
                                        </div>
                                        <div class="item-price">${currencySymbol}${(item.price * item.quantity).toFixed(2)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Order Summary</h4>
                            <div class="order-summary">
                                <div class="summary-line">
                                    <span>Total:</span>
                                    <span class="total-amount">${currencySymbol}${order.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="app.orders.reorder('${order.order_id}')">
                        Reorder
                    </button>
                    <button class="btn-primary" onclick="app.closeModal()">
                        Close
                    </button>
                </div>
            </div>
        `;

        // Remove existing modal content and add new one
        modalOverlay.innerHTML = modalContent;
        modalOverlay.classList.add('show');
    }

    async submitFeedback(orderId, feedbackData) {
        try {
            const response = await fetch('api/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_id: orderId,
                    ...feedbackData
                })
            });

            if (response.ok) {
                app.showNotification('Thank you for your feedback!', 'success');
                return true;
            } else {
                app.showNotification('Failed to submit feedback', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            app.showNotification('Failed to submit feedback', 'error');
            return false;
        }
    }

    // Service Request functionality
    async requestService(serviceType) {
        if (!app.currentBranch || !app.currentTable) {
            app.showNotification('Service requests are only available for dine-in orders', 'warning');
            return;
        }

        try {
            const response = await fetch('api/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    branch_id: app.currentBranch.id,
                    table_id: app.currentTable.id,
                    request_type: serviceType,
                    language: app.currentLanguage
                })
            });

            if (response.ok) {
                const result = await response.json();
                app.showNotification(`${result.display_text} request sent successfully!`, 'success');
                app.closeModal('service-modal');
            } else {
                app.showNotification('Failed to send service request', 'error');
            }
        } catch (error) {
            console.error('Error sending service request:', error);
            app.showNotification('Failed to send service request', 'error');
        }
    }

    showServiceModal() {
        document.getElementById('modal-overlay').classList.add('show');
    }

    // Contact functions
    callRestaurant() {
        if (app.currentBranch?.phone) {
            window.location.href = `tel:${app.currentBranch.phone}`;
        } else {
            app.showNotification('Restaurant phone number not available', 'warning');
        }
    }

    shareLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
                    
                    if (navigator.share) {
                        navigator.share({
                            title: 'My Location',
                            text: 'Here is my location for delivery',
                            url: locationUrl
                        });
                    } else {
                        // Fallback: copy to clipboard
                        navigator.clipboard.writeText(locationUrl).then(() => {
                            app.showNotification('Location copied to clipboard', 'success');
                        });
                    }
                },
                (error) => {
                    app.showNotification('Unable to get your location', 'error');
                }
            );
        } else {
            app.showNotification('Geolocation not supported', 'error');
        }
    }

    // Cleanup
    destroy() {
        this.stopTrackingUpdates();
    }
}

// Global functions for onclick handlers
function trackOrder(orderId) {
    app.orders.trackOrder(orderId);
}

function reorderOrder(orderId) {
    app.orders.reorder(orderId);
}

function showOrderDetails(orderId) {
    app.orders.showOrderDetails(orderId);
}

function requestService(serviceType) {
    app.orders.requestService(serviceType);
}

function callRestaurant() {
    app.orders.callRestaurant();
}

function shareLocation() {
    app.orders.shareLocation();
}
