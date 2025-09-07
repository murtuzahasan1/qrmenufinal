<?php
/**
 * Luna Dine Admin Panel Database Initializer
 *
 * This script initializes or updates the SQLite database for the Luna Dine system,
 * including both the main application schema and the admin panel schema with users and roles.
 *
 * Usage: php admin/initialize.php
 */

class LunaDineAdminInitializer {
    private $db;
    private $dbPath;

    public function __construct() {
        // The database is located in the api directory, relative to the main htdocs folder.
        // This script is in htdocs/admin/, so we need to go up one level then into api/.
        $this->dbPath = __DIR__ . '/lunadine.db';
        $this->connect();
    }

    /**
     * Connect to the SQLite database
     */
    private function connect() {
        try {
            // If the database file doesn't exist, PDO will create it.
            $this->db = new PDO('sqlite:' . $this->dbPath);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            echo "✅ Connected to database: {$this->dbPath}\n";
        } catch (PDOException $e) {
            die("❌ Database connection failed: " . $e->getMessage() . "\n");
        }
    }

    /**
     * Execute an SQL script from a file
     * @param string $sqlFile Path to the SQL file.
     * @return bool True on success, false on failure.
     */
    public function executeSqlFile($sqlFile) {
        if (!file_exists($sqlFile)) {
            echo("❌ SQL file not found: {$sqlFile}\n");
            return false;
        }

        echo "📖 Reading SQL file: {$sqlFile}\n";
        $sql = file_get_contents($sqlFile);

        if ($sql === false) {
            echo("❌ Failed to read SQL file: {$sqlFile}\n");
            return false;
        }

        // Split SQL into individual statements
        $statements = $this->splitSqlStatements($sql);
        echo "🔄 Executing " . count($statements) . " SQL statements...\n";

        $executed = 0;
        $failed = 0;

        foreach ($statements as $index => $statement) {
            $statement = trim($statement);
            if (empty($statement) || strpos(trim($statement), '--') === 0) {
                continue;
            }

            try {
                $this->db->exec($statement);
                $executed++;
            } catch (PDOException $e) {
                // Ignore "table already exists" errors to make the script re-runnable
                if (strpos($e->getMessage(), 'already exists') === false) {
                    echo "❌ Statement " . ($index + 1) . " failed: " . $e->getMessage() . "\n";
                    echo "   Statement: " . substr($statement, 0, 100) . "...\n";
                    $failed++;
                }
            }
        }

        echo "✅ SQL script execution finished.\n";
        echo "   Executed: {$executed} statements\n";
        echo "   Failed: {$failed} statements\n";

        return $failed === 0;
    }

    /**
     * Split SQL string into individual statements
     */
    private function splitSqlStatements($sql) {
        return preg_split('/;\s*$/m', $sql, -1, PREG_SPLIT_NO_EMPTY);
    }

    /**
     * Verify that all tables have been created and populated
     */
    public function verifyInitialization() {
        echo "\n🔍 Verifying database initialization...\n";
        
        $checks = [
            'languages' => 'SELECT COUNT(*) as count FROM languages',
            'branches' => 'SELECT COUNT(*) as count FROM branches',
            'master_menu_items' => 'SELECT COUNT(*) as count FROM master_menu_items',
            'orders' => 'SELECT COUNT(*) as count FROM orders',
            'roles' => 'SELECT COUNT(*) as count FROM roles',
            'users' => 'SELECT COUNT(*) as count FROM users',
            'permissions' => 'SELECT COUNT(*) as count FROM permissions',
            'role_permissions' => 'SELECT COUNT(*) as count FROM role_permissions',
        ];

        $allGood = true;
        foreach ($checks as $table => $query) {
            try {
                $result = $this->db->query($query)->fetch();
                $count = $result['count'];
                echo "  ✅ Table `{$table}`: {$count} records found.\n";
            } catch (PDOException $e) {
                echo "  ❌ Table `{$table}`: Verification failed! " . $e->getMessage() . "\n";
                $allGood = false;
            }
        }
        
        if ($allGood) {
            echo "\n🎉 All critical tables verified successfully!\n";
        } else {
            echo "\n⚠️  Some verification checks failed. The database might not be set up correctly.\n";
        }
        return $allGood;
    }

    /**
     * Display a summary of the created admin data
     */
    public function displaySummary() {
        echo "\n📊 Admin Panel Data Summary\n";
        echo "============================\n";

        try {
            // Admin Users Summary
            $users = $this->db->query("
                SELECT u.username, r.role_name, b.name as branch_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                LEFT JOIN branches b ON u.branch_id = b.id
                ORDER BY r.id, b.id, u.username
            ")->fetchAll();

            echo "🔑 Admin Users (" . count($users) . "):\n";
            foreach ($users as $user) {
                $branchInfo = $user['branch_name'] ? " ({$user['branch_name']})" : "";
                echo "   • {$user['username']} [{$user['role_name']}]$branchInfo\n";
            }
            echo "\n   -> Default password for all users is 'password123'\n";

        } catch (PDOException $e) {
            echo "❌ Error generating summary: " . $e->getMessage() . "\n";
        }
    }

    /**
     * Clean up the database connection
     */
    public function __destruct() {
        $this->db = null;
    }
}

// --- Main Execution ---
if (php_sapi_name() !== 'cli') {
    die("This script must be run from the command line interface (CLI).\n");
}

echo "🚀 Luna Dine Full Database Initializer\n";
echo "=======================================\n\n";

// Define SQL file paths
$mainSchemaFile = __DIR__ . '/database_schema.sql';
$adminSchemaFile = __DIR__ . '/admin-dataschema.sql';

try {
    $initializer = new LunaDineAdminInitializer();

    // Execute Main App Schema
    echo "--- Initializing Main Application Schema ---\n";
    $mainSuccess = $initializer->executeSqlFile($mainSchemaFile);

    // Execute Admin Panel Schema
    if ($mainSuccess) {
        echo "\n--- Initializing Admin Panel Schema ---\n";
        $adminSuccess = $initializer->executeSqlFile($adminSchemaFile);
    } else {
        $adminSuccess = false;
        echo "\n❌ Skipping admin schema due to errors in the main schema.\n";
    }

    if ($mainSuccess && $adminSuccess) {
        $initializer->verifyInitialization();
        $initializer->displaySummary();
        echo "\n🎉 Database initialization completed successfully!\n";
        echo "   You can now log in to the admin panel.\n";
    } else {
        echo "\n❌ Database initialization failed. Please review the errors above.\n";
        exit(1);
    }

} catch (Exception $e) {
    echo "\n❌ A fatal error occurred: " . $e->getMessage() . "\n";
    exit(1);
}
?>
