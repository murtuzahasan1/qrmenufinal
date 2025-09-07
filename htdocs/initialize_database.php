<?php
/**
 * Luna Dine Database Initializer
 * 
 * This script initializes the SQLite database for Luna Dine restaurant chain
 * with all tables, indexes, and demo data for Bangladesh locations.
 * 
 * Usage: php init_database.php
 */

class LunaDineDatabaseInitializer {
    private $db;
    private $dbPath;
    
    public function __construct() {
        $this->dbPath = __DIR__ . '/lunadine.db';
        $this->connect();
    }
    
    /**
     * Connect to SQLite database
     */
    private function connect() {
        try {
            $this->db = new PDO('sqlite:' . $this->dbPath);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            echo "✅ Connected to database: {$this->dbPath}\n";
        } catch (PDOException $e) {
            die("❌ Database connection failed: " . $e->getMessage() . "\n");
        }
    }
    
    /**
     * Execute SQL script from file
     */
    public function executeSqlFile($sqlFile) {
        if (!file_exists($sqlFile)) {
            die("❌ SQL file not found: {$sqlFile}\n");
        }
        
        echo "📖 Reading SQL file: {$sqlFile}\n";
        $sql = file_get_contents($sqlFile);
        
        if ($sql === false) {
            die("❌ Failed to read SQL file: {$sqlFile}\n");
        }
        
        // Split SQL into individual statements
        $statements = $this->splitSqlStatements($sql);
        
        echo "🔄 Executing " . count($statements) . " SQL statements...\n";
        
        $executed = 0;
        $failed = 0;
        
        foreach ($statements as $index => $statement) {
            $statement = trim($statement);
            
            // Skip empty statements and comments
            if (empty($statement) || $this->isComment($statement)) {
                continue;
            }
            
            try {
                $this->db->exec($statement);
                $executed++;
                
                // Show progress for every 10 statements
                if ($executed % 10 === 0) {
                    echo "  Progress: {$executed} statements executed\n";
                }
            } catch (PDOException $e) {
                echo "❌ Statement {$index} failed: " . $e->getMessage() . "\n";
                echo "   Statement: " . substr($statement, 0, 100) . "...\n";
                $failed++;
            }
        }
        
        echo "✅ Database initialization completed!\n";
        echo "   Executed: {$executed} statements\n";
        echo "   Failed: {$failed} statements\n";
        
        return $failed === 0;
    }
    
    /**
     * Split SQL into individual statements
     */
    private function splitSqlStatements($sql) {
        // Remove single-line comments
        $sql = preg_replace('/--.*$/m', '', $sql);
        
        // Remove multi-line comments
        $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);
        
        // Split on semicolons, but keep semicolons inside quotes/strings
        $statements = [];
        $current = '';
        $inString = false;
        $stringChar = '';
        
        for ($i = 0; $i < strlen($sql); $i++) {
            $char = $sql[$i];
            
            if ($inString) {
                if ($char === $stringChar && ($i === 0 || $sql[$i-1] !== '\\')) {
                    $inString = false;
                }
            } else {
                if ($char === '"' || $char === "'") {
                    $inString = true;
                    $stringChar = $char;
                } elseif ($char === ';') {
                    $statements[] = $current;
                    $current = '';
                    continue;
                }
            }
            
            $current .= $char;
        }
        
        // Add the last statement if it's not empty
        if (!empty(trim($current))) {
            $statements[] = $current;
        }
        
        return $statements;
    }
    
    /**
     * Check if line is a comment
     */
    private function isComment($line) {
        $line = trim($line);
        return empty($line) || strpos($line, '--') === 0 || strpos($line, '/*') === 0;
    }
    
    /**
     * Verify database initialization
     */
    public function verifyInitialization() {
        echo "\n🔍 Verifying database initialization...\n";
        
        $checks = [
            'languages' => 'SELECT COUNT(*) as count FROM languages',
            'branches' => 'SELECT COUNT(*) as count FROM branches',
            'master_menu_items' => 'SELECT COUNT(*) as count FROM master_menu_items',
            'menu_item_translations' => 'SELECT COUNT(*) as count FROM menu_item_translations',
            'menu_categories' => 'SELECT COUNT(*) as count FROM menu_categories',
            'branch_menu_items' => 'SELECT COUNT(*) as count FROM branch_menu_items',
            'customization_groups' => 'SELECT COUNT(*) as count FROM customization_groups',
            'customization_options' => 'SELECT COUNT(*) as count FROM customization_options',
            'restaurant_tables' => 'SELECT COUNT(*) as count FROM restaurant_tables',
            'promo_codes' => 'SELECT COUNT(*) as count FROM promo_codes',
            'orders' => 'SELECT COUNT(*) as count FROM orders',
            'order_items' => 'SELECT COUNT(*) as count FROM order_items',
            'feedback' => 'SELECT COUNT(*) as count FROM feedback',
            'service_requests' => 'SELECT COUNT(*) as count FROM service_requests'
        ];
        
        $allGood = true;
        
        foreach ($checks as $table => $query) {
            try {
                $result = $this->db->query($query)->fetch();
                $count = $result['count'];
                
                echo "  ✅ {$table}: {$count} records\n";
                
                // Basic validation for expected counts
                $expectedCounts = [
                    'languages' => 5,
                    'branches' => 5,
                    'master_menu_items' => 35,
                    'menu_item_translations' => 70,
                    'menu_categories' => 30,
                    'branch_menu_items' => 120,
                    'customization_groups' => 12,
                    'customization_options' => 36,
                    'restaurant_tables' => 26,
                    'promo_codes' => 10,
                    'orders' => 5,
                    'order_items' => 12,
                    'feedback' => 5,
                    'service_requests' => 5
                ];
                
                if (isset($expectedCounts[$table]) && $count != $expectedCounts[$table]) {
                    echo "    ⚠️  Expected {$expectedCounts[$table]}, got {$count}\n";
                    $allGood = false;
                }
            } catch (PDOException $e) {
                echo "  ❌ {$table}: Error - " . $e->getMessage() . "\n";
                $allGood = false;
            }
        }
        
        if ($allGood) {
            echo "\n🎉 All database tables verified successfully!\n";
        } else {
            echo "\n⚠️  Some verification checks failed. Please review the data.\n";
        }
        
        return $allGood;
    }
    
    /**
     * Display database summary
     */
    public function displaySummary() {
        echo "\n📊 Database Summary\n";
        echo "==================\n";
        
        try {
            // Branch information
            $branches = $this->db->query('SELECT name, address, status FROM branches')->fetchAll();
            echo "🏪 Branches (" . count($branches) . "):\n";
            foreach ($branches as $branch) {
                $status = $branch['status'] === 'open' ? '🟢 Open' : '🔴 Closed';
                echo "   • {$branch['name']} - {$status}\n";
                echo "     {$branch['address']}\n";
            }
            
            // Menu items count per branch
            echo "\n🍽️  Menu Items per Branch:\n";
            $menuCounts = $this->db->query("
                SELECT b.name, COUNT(bmi.id) as item_count
                FROM branches b
                LEFT JOIN branch_menu_items bmi ON b.id = bmi.branch_id
                GROUP BY b.id, b.name
                ORDER BY b.id
            ")->fetchAll();
            
            foreach ($menuCounts as $count) {
                echo "   • {$count['name']}: {$count['item_count']} items\n";
            }
            
            // Languages supported
            echo "\n🌐 Languages Supported:\n";
            $languages = $this->db->query('SELECT name, code, is_active FROM languages ORDER BY id')->fetchAll();
            foreach ($languages as $lang) {
                $status = $lang['is_active'] ? '✅ Active' : '❌ Inactive';
                echo "   • {$lang['name']} ({$lang['code']}) - {$status}\n";
            }
            
            // Active promo codes
            echo "\n🎟️  Active Promo Codes:\n";
            $promos = $this->db->query("
                SELECT code, type, value, min_order_amount 
                FROM promo_codes 
                WHERE is_active = 1 
                ORDER BY code
            ")->fetchAll();
            
            foreach ($promos as $promo) {
                $type = $promo['type'] === 'percentage' ? "{$promo['value']}%" : "৳{$promo['value']}";
                echo "   • {$promo['code']} - {$type} off (min: ৳{$promo['min_order_amount']})\n";
            }
            
            // Recent orders
            echo "\n📋 Recent Orders:\n";
            $orders = $this->db->query("
                SELECT o.order_uid, b.name as branch_name, o.order_type, o.status, o.total_amount
                FROM orders o
                JOIN branches b ON o.branch_id = b.id
                ORDER BY o.created_at DESC
                LIMIT 5
            ")->fetchAll();
            
            foreach ($orders as $order) {
                $statusIcon = match($order['status']) {
                    'completed' => '✅',
                    'ready' => '🟡',
                    'in_kitchen' => '🔵',
                    'placed' => '⏳',
                    'cancelled' => '❌',
                    default => '❓'
                };
                echo "   • {$order['order_uid']} - {$order['branch_name']} ({$order['order_type']}) {$statusIcon} ৳{$order['total_amount']}\n";
            }
            
        } catch (PDOException $e) {
            echo "❌ Error generating summary: " . $e->getMessage() . "\n";
        }
        
        echo "\n🗄️  Database file: {$this->dbPath}\n";
        echo "📁 Images directory: " . __DIR__ . "/images/\n";
    }
    
    /**
     * Clean up database connection
     */
    public function __destruct() {
        if ($this->db) {
            $this->db = null;
        }
    }
}

// Main execution
if (php_sapi_name() !== 'cli') {
    die("❌ This script must be run from the command line.\n");
}

echo "🚀 Luna Dine Database Initializer\n";
echo "=================================\n\n";

// Check if SQL file exists
$sqlFile = __DIR__ . '/database_schema.sql';
if (!file_exists($sqlFile)) {
    die("❌ SQL file not found: {$sqlFile}\nPlease ensure 'luna_dine_database.sql' exists in the same directory.\n");
}

// Check if images directory exists
$imagesDir = __DIR__ . '/images';
if (!is_dir($imagesDir)) {
    echo "⚠️  Images directory not found: {$imagesDir}\n";
    echo "   Please create the images directory and add the required menu item images.\n\n";
} else {
    $imageCount = count(glob($imagesDir . '/*.jpg'));
    echo "📸 Images directory found with {$imageCount} JPG images\n\n";
}

try {
    $initializer = new LunaDineDatabaseInitializer();
    
    // Execute SQL file
    $success = $initializer->executeSqlFile($sqlFile);
    
    if ($success) {
        // Verify initialization
        $initializer->verifyInitialization();
        
        // Display summary
        $initializer->displaySummary();
        
        echo "\n🎉 Database initialization completed successfully!\n";
        echo "   You can now use the database with your Luna Dine application.\n";
    } else {
        echo "\n❌ Database initialization completed with errors.\n";
        echo "   Please review the error messages above and fix any issues.\n";
        exit(1);
    }
    
} catch (Exception $e) {
    echo "❌ Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}
?>