<?php
/**
 * Serverless Laravel Entry Point for Vercel
 * 
 * PROBLEM: Vercel Functions have a READ-ONLY filesystem except /tmp
 * SOLUTION: Redirect all Laravel writable paths to /tmp before boot
 */

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Step 1: Create writable /tmp structure
$tmpDirs = [
    '/tmp/storage/framework/cache/data',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/framework/views',
    '/tmp/storage/logs',
    '/tmp/bootstrap/cache'
];

foreach ($tmpDirs as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

// Step 2: Create required bootstrap cache files (Laravel expects these)
$configCache = '/tmp/bootstrap/cache/config.php';
$servicesCache = '/tmp/bootstrap/cache/services.php';
$packagesCache = '/tmp/bootstrap/cache/packages.php';

if (!file_exists($configCache)) {
    file_put_contents($configCache, "<?php\nreturn [];");
}
if (!file_exists($servicesCache)) {
    file_put_contents($servicesCache, "<?php\nreturn [];");
}
if (!file_exists($packagesCache)) {
    file_put_contents($packagesCache, "<?php\nreturn [];");
}

// Step 3: Override environment for serverless
putenv('VIEW_COMPILED_PATH=/tmp/storage/framework/views');
putenv('CACHE_DRIVER=array');
putenv('SESSION_DRIVER=cookie');
putenv('LOG_CHANNEL=errorlog');
putenv('FILESYSTEM_DRIVER=local');
putenv('QUEUE_CONNECTION=sync');
putenv('APP_ENV=production');
putenv('APP_DEBUG=false');

$_ENV['VIEW_COMPILED_PATH'] = '/tmp/storage/framework/views';
$_ENV['CACHE_DRIVER'] = 'array';
$_ENV['SESSION_DRIVER'] = 'cookie';
$_ENV['LOG_CHANNEL'] = 'errorlog';
$_ENV['FILESYSTEM_DRIVER'] = 'local';
$_ENV['QUEUE_CONNECTION'] = 'sync';
$_ENV['APP_ENV'] = 'production';
$_ENV['APP_DEBUG'] = 'false';

// Step 4: Check for maintenance mode (skip if file doesn't exist)
$maintenanceFile = __DIR__.'/../storage/framework/maintenance.php';
if (file_exists($maintenanceFile)) {
    require $maintenanceFile;
}

// Step 5: Load Composer autoloader
require __DIR__.'/../vendor/autoload.php';

// Step 6: Bootstrap Laravel with custom storage path
$app = require_once __DIR__.'/../bootstrap/app.php';

// Override storage path BEFORE Laravel initializes services
$app->useStoragePath('/tmp/storage');

// Step 7: Handle the request
$kernel = $app->make(Kernel::class);

$response = $kernel->handle(
    $request = Request::capture()
);

$response->send();

$kernel->terminate($request, $response);
