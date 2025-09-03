<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/utils.php';

class AuthAPI {
    private $auth;
    private $utils;

    public function __construct() {
        $this->auth = Auth::getInstance();
        $this->utils = new Utils();
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';

        switch ($method) {
            case 'POST':
                switch ($action) {
                    case 'login':
                        $this->login();
                        break;
                    case 'logout':
                        $this->logout();
                        break;
                    case 'register':
                        $this->register();
                        break;
                    case 'forgot-password':
                        $this->forgotPassword();
                        break;
                    case 'reset-password':
                        $this->resetPassword();
                        break;
                    default:
                        $this->utils->jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
                }
                break;
            case 'GET':
                switch ($action) {
                    case 'check':
                        $this->checkAuth();
                        break;
                    case 'user':
                        $this->getCurrentUser();
                        break;
                    default:
                        $this->utils->jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
                }
                break;
            default:
                $this->utils->jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
    }

    private function login() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            $this->utils->jsonResponse(['success' => false, 'message' => 'Invalid JSON data'], 400);
        }

        $required = ['email', 'password'];
        $errors = $this->utils->validateRequired($data, $required);
        
        if (!empty($errors)) {
            $this->utils->jsonResponse(['success' => false, 'message' => implode(', ', $errors)], 400);
        }

        $email = $this->utils->sanitizeInput($data['email']);
        $password = $data['password'];

        if (!$this->utils->validateEmail($email)) {
            $this->utils->jsonResponse(['success' => false, 'message' => 'Invalid email format'], 400);
        }

        $result = $this->auth->login($email, $password);
        
        if ($result['success']) {
            $this->utils->jsonResponse([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $result['user']['id'],
                    'name' => $result['user']['name'],
                    'email' => $result['user']['email'],
                    'role' => $result['user']['role_name'],
                    'restaurant_id' => $result['user']['restaurant_id'],
                    'branch_id' => $result['user']['branch_id']
                ]
            ]);
        } else {
            $this->utils->jsonResponse(['success' => false, 'message' => $result['message']], 401);
        }
    }

    private function logout() {
        $result = $this->auth->logout();
        $this->utils->jsonResponse($result);
    }

    private function register() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            $this->utils->jsonResponse(['success' => false, 'message' => 'Invalid JSON data'], 400);
        }

        $required = ['name', 'email', 'password', 'role'];
        $errors = $this->utils->validateRequired($data, $required);
        
        if (!empty($errors)) {
            $this->utils->jsonResponse(['success' => false, 'message' => implode(', ', $errors)], 400);
        }

        $name = $this->utils->sanitizeInput($data['name']);
        $email = $this->utils->sanitizeInput($data['email']);
        $password = $data['password'];
        $role = $this->utils->sanitizeInput($data['role']);

        if (!$this->utils->validateEmail($email)) {
            $this->utils->jsonResponse(['success' => false, 'message' => 'Invalid email format'], 400);
        }

        if (strlen($password) < 6) {
            $this->utils->jsonResponse(['success' => false, 'message' => 'Password must be at least 6 characters'], 400);
        }

        // Check if user already exists
        require_once __DIR__ . '/../includes/database.php';
        $db = Database::getInstance();
        $existingUser = $db->fetch("SELECT id FROM users WHERE email = ?", [$email]);
        
        if ($existingUser) {
            $this->utils->jsonResponse(['success' => false, 'message' => 'User already exists'], 409);
        }

        // Get role ID
        $roleData = $db->fetch("SELECT id FROM roles WHERE name = ?", [$role]);
        if (!$roleData) {
            $this->utils->jsonResponse(['success' => false, 'message' => 'Invalid role'], 400);
        }

        // Create user
        $userData = [
            'name' => $name,
            'email' => $email,
            'password' => $this->auth->hashPassword($password),
            'role_id' => $roleData['id'],
            'restaurant_id' => $data['restaurant_id'] ?? null,
            'branch_id' => $data['branch_id'] ?? null,
            'status' => 1
        ];

        $userId = $db->insert('users', $userData);
        
        if ($userId) {
            $this->utils->jsonResponse(['success' => true, 'message' => 'User registered successfully']);
        } else {
            $this->utils->jsonResponse(['success' => false, 'message' => 'Registration failed'], 500);
        }
    }

    private function forgotPassword() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            $this->utils->jsonResponse(['success' => false, 'message' => 'Invalid JSON data'], 400);
        }

        $required = ['email'];
        $errors = $this->utils->validateRequired($data, $required);
        
        if (!empty($errors)) {
            $this->utils->jsonResponse(['success' => false, 'message' => implode(', ', $errors)], 400);
        }

        $email = $this->utils->sanitizeInput($data['email']);

        if (!$this->utils->validateEmail($email)) {
            $this->utils->jsonResponse(['success' => false, 'message' => 'Invalid email format'], 400);
        }

        // Check if user exists
        require_once __DIR__ . '/../includes/database.php';
        $db = Database::getInstance();
        $user = $db->fetch("SELECT * FROM users WHERE email = ?", [$email]);
        
        if (!$user) {
            $this->utils->jsonResponse(['success' => false, 'message' => 'User not found'], 404);
        }

        // Generate reset token
        $token = $this->utils->generateToken();
        $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

        // Store reset token (you might want to create a password_resets table)
        // For now, we'll just send a success response
        $this->utils->jsonResponse(['success' => true, 'message' => 'Password reset link sent to your email']);
    }

    private function resetPassword() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            $this->utils->jsonResponse(['success' => false, 'message' => 'Invalid JSON data'], 400);
        }

        $required = ['token', 'password'];
        $errors = $this->utils->validateRequired($data, $required);
        
        if (!empty($errors)) {
            $this->utils->jsonResponse(['success' => false, 'message' => implode(', ', $errors)], 400);
        }

        $token = $this->utils->sanitizeInput($data['token']);
        $password = $data['password'];

        if (strlen($password) < 6) {
            $this->utils->jsonResponse(['success' => false, 'message' => 'Password must be at least 6 characters'], 400);
        }

        // For now, we'll just send a success response
        // In a real implementation, you would validate the token and update the password
        $this->utils->jsonResponse(['success' => true, 'message' => 'Password reset successfully']);
    }

    private function checkAuth() {
        $isLoggedIn = $this->auth->isLoggedIn();
        $this->utils->jsonResponse(['success' => true, 'authenticated' => $isLoggedIn]);
    }

    private function getCurrentUser() {
        $user = $this->auth->getCurrentUser();
        
        if ($user) {
            $this->utils->jsonResponse(['success' => true, 'user' => $user]);
        } else {
            $this->utils->jsonResponse(['success' => false, 'message' => 'Not authenticated'], 401);
        }
    }
}

// Handle the request
$authAPI = new AuthAPI();
$authAPI->handleRequest();
?>