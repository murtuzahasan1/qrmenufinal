/**
 * Role-based Navigation System
 * Handles routing users to appropriate dashboards based on their roles
 */

class RoleNavigation {
    constructor() {
        this.roleDashboards = {
            'super_admin': 'dashboard-super-admin.html',
            'owner': 'dashboard-owner.html',
            'manager': 'dashboard-manager.html',
            'branch_manager': 'dashboard-branch-manager.html',
            'chef': 'dashboard-chef.html',
            'waiter': 'dashboard-waiter.html',
            'staff': 'dashboard-staff.html'
        };

        this.rolePermissions = {
            'super_admin': {
                canView: ['restaurants', 'branches', 'users', 'orders', 'menu', 'modules', 'qrcode'],
                dashboard: 'dashboard-super-admin.html'
            },
            'owner': {
                canView: ['branches', 'users', 'orders', 'menu', 'qrcode'],
                dashboard: 'dashboard-owner.html'
            },
            'manager': {
                canView: ['branches', 'users', 'orders', 'menu', 'qrcode'],
                dashboard: 'dashboard-manager.html'
            },
            'branch_manager': {
                canView: ['users', 'orders', 'menu', 'qrcode'],
                dashboard: 'dashboard-branch-manager.html'
            },
            'chef': {
                canView: ['orders', 'menu'],
                dashboard: 'dashboard-chef.html'
            },
            'waiter': {
                canView: ['orders', 'menu'],
                dashboard: 'dashboard-waiter.html'
            },
            'staff': {
                canView: ['orders', 'menu'],
                dashboard: 'dashboard-staff.html'
            }
        };

        this.init();
    }

    async init() {
        try {
            // Check if user is authenticated
            const authResult = await APIService.getCurrentUser();
            if (!authResult.success) {
                this.redirectToLogin();
                return;
            }

            this.currentUser = authResult.user;
            this.setupNavigation();
            this.handleCurrentPage();
        } catch (error) {
            console.error('Role navigation initialization failed:', error);
            this.redirectToLogin();
        }
    }

    setupNavigation() {
        // Update navigation menu based on user role
        this.updateNavigationMenu();
        
        // Add role-based access control to links
        this.addAccessControl();
    }

    updateNavigationMenu() {
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu) return;

        const permissions = this.rolePermissions[this.currentUser.role];
        if (!permissions) return;

        // Hide/show menu items based on permissions
        const menuItems = navMenu.querySelectorAll('li');
        menuItems.forEach(item => {
            const link = item.querySelector('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (href && href !== '#' && !this.hasPermission(href, permissions.canView)) {
                item.style.display = 'none';
            }
        });
    }

    addAccessControl() {
        // Add click handlers to navigation links
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href !== '#') {
                    if (!this.canAccessPage(href)) {
                        e.preventDefault();
                        Utils.showToast('You do not have permission to access this page.', 'error');
                    }
                }
            });
        });
    }

    hasPermission(pagePath, allowedPages) {
        if (!pagePath || pagePath === '#') return true;
        
        // Extract page name from path
        const pageName = pagePath.replace('.html', '').replace('/', '');
        return allowedPages.includes(pageName);
    }

    canAccessPage(pagePath) {
        const permissions = this.rolePermissions[this.currentUser.role];
        if (!permissions) return false;

        return this.hasPermission(pagePath, permissions.canView);
    }

    handleCurrentPage() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop().replace('.html', '');

        // Check if user should be redirected to their dashboard
        if (currentPage === 'dashboard') {
            this.redirectToDashboard();
            return;
        }

        // Check if user has permission to access current page
        if (!this.canAccessPage(currentPage + '.html')) {
            Utils.showToast('You do not have permission to access this page.', 'error');
            this.redirectToDashboard();
            return;
        }

        // Update page title and header based on role
        this.updatePageHeader();
    }

    redirectToDashboard() {
        const dashboardUrl = this.roleDashboards[this.currentUser.role];
        if (dashboardUrl) {
            window.location.href = dashboardUrl;
        } else {
            window.location.href = 'dashboard.html';
        }
    }

    updatePageHeader() {
        const dashboardTitle = document.querySelector('.dashboard-title');
        if (dashboardTitle) {
            const roleNames = {
                'super_admin': 'Super Admin',
                'owner': 'Owner',
                'manager': 'Manager',
                'branch_manager': 'Branch Manager',
                'chef': 'Chef',
                'waiter': 'Waiter',
                'staff': 'Staff'
            };

            const currentRole = roleNames[this.currentUser.role] || 'User';
            const currentPath = window.location.pathname;
            const currentPage = currentPath.split('/').pop().replace('.html', '');

            // Update title based on current page
            const pageTitles = {
                'dashboard-super-admin': 'Super Admin Dashboard',
                'dashboard-owner': 'Owner Dashboard',
                'dashboard-manager': 'Manager Dashboard',
                'dashboard-branch-manager': 'Branch Manager Dashboard',
                'dashboard-chef': 'Chef Dashboard',
                'dashboard-waiter': 'Waiter Dashboard',
                'dashboard-staff': 'Staff Dashboard',
                'restaurants': 'Restaurant Management',
                'branches': 'Branch Management',
                'users': 'User Management',
                'orders': 'Order Management',
                'menu': 'Menu Management',
                'modules': 'Module Management',
                'qrcode': 'QR Code Management'
            };

            const title = pageTitles[currentPage] || `${currentRole} Dashboard`;
            dashboardTitle.textContent = title;
        }

        // Update user avatar with role initials
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            const initials = {
                'super_admin': 'SA',
                'owner': 'O',
                'manager': 'M',
                'branch_manager': 'BM',
                'chef': 'C',
                'waiter': 'W',
                'staff': 'S'
            };

            userAvatar.textContent = initials[this.currentUser.role] || 'U';
        }
    }

    redirectToLogin() {
        window.location.href = '../login.html';
    }

    // Utility method to check if user has specific role
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    // Utility method to check if user has any of the specified roles
    hasAnyRole(roles) {
        return this.currentUser && roles.includes(this.currentUser.role);
    }

    // Utility method to get user permissions
    getPermissions() {
        return this.rolePermissions[this.currentUser.role] || {};
    }

    // Method to refresh navigation (useful after role changes)
    refreshNavigation() {
        this.setupNavigation();
        this.handleCurrentPage();
    }
}

// Initialize role navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Make RoleNavigation available globally
    window.RoleNavigation = RoleNavigation;
    
    // Initialize the navigation system
    window.roleNavigation = new RoleNavigation();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoleNavigation;
}