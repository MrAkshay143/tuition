<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

$issues = [];

// 1. Audit Routes & Controller methods
echo "--- 1. AUDITING ROUTES & CONTROLLER METHODS ---\n";
$routeCollection = Route::getRoutes();
foreach ($routeCollection as $route) {
    $action = $route->getAction();
    if (isset($action['controller'])) {
        @list($controller, $method) = explode('@', $action['controller']);
        if ($controller && $method) {
            if (!class_exists($controller)) {
                $issues[] = "[Route Error] Controller class '$controller' does not exist for route: " . implode('|', $route->methods()) . " " . $route->uri();
            } elseif (!method_exists($controller, $method)) {
                $issues[] = "[Route Error] Method '$method' does not exist on controller '$controller' for route: " . implode('|', $route->methods()) . " " . $route->uri();
            }
        }
    }
}

// 2. Audit Domain Models & Database Tables
echo "--- 2. AUDITING MODELS & TABLES ---\n";
$modelFiles = glob(__DIR__ . '/app/Domains/*/Models/*.php');
foreach ($modelFiles as $file) {
    $content = file_get_contents($file);
    if (preg_match('/namespace\s+([^;]+);/', $content, $nsMatch) && preg_match('/class\s+([A-Za-z0-9_]+)/', $content, $classMatch)) {
        $fullClass = $nsMatch[1] . '\\' . $classMatch[1];
        if (class_exists($fullClass)) {
            try {
                $model = new $fullClass();
                $table = $model->getTable();
                if (!Schema::hasTable($table)) {
                    $issues[] = "[Model Error] Table '$table' for model '$fullClass' does not exist in DB schema.";
                } else {
                    $fillable = $model->getFillable();
                    $dbColumns = Schema::getColumnListing($table);
                    foreach ($fillable as $col) {
                        if (!in_array($col, $dbColumns)) {
                            $issues[] = "[Model Warning] Fillable attribute '$col' on model '$fullClass' does not exist in table '$table'.";
                        }
                    }
                }
            } catch (\Throwable $e) {
                $issues[] = "[Model Exception] Instantiating '$fullClass' threw exception: " . $e->getMessage();
            }
        }
    }
}

// 3. Output results
echo "\n================ AUDIT SUMMARY ================\n";
if (empty($issues)) {
    echo "SUCCESS: 0 Architectural / Schema / Route issues detected!\n";
} else {
    echo "FOUND " . count($issues) . " ISSUE(S):\n";
    foreach ($issues as $idx => $issue) {
        echo ($idx + 1) . ". $issue\n";
    }
}
echo "===============================================\n";
