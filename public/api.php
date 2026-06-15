<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

define('ADMIN_PASSWORD', 'NARGIZA_ADMIN');
define('UPLOAD_DIR', __DIR__ . '/gallery_uploads/');
define('DATA_FILE', __DIR__ . '/gallery_data.json');

if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

function load_photos() {
    if (!file_exists(DATA_FILE)) return [];
    return json_decode(file_get_contents(DATA_FILE), true) ?: [];
}

function save_photos($photos) {
    file_put_contents(DATA_FILE, json_encode($photos));
}

$method = $_SERVER['REQUEST_METHOD'];

// GET — список фото
if ($method === 'GET') {
    echo json_encode(['photos' => array_values(load_photos())]);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$password = $body['password'] ?? '';

if ($password !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['error' => 'Неверный пароль']);
    exit;
}

// POST — загрузить фото
if ($method === 'POST') {
    $image_base64 = $body['image'] ?? '';
    if (strpos($image_base64, ',') !== false) {
        $image_base64 = explode(',', $image_base64)[1];
    }
    $image_data = base64_decode($image_base64);
    $ext = 'jpg';
    $content_type = $body['content_type'] ?? 'image/jpeg';
    if (strpos($content_type, 'png') !== false) $ext = 'png';
    if (strpos($content_type, 'webp') !== false) $ext = 'webp';

    $id = uniqid();
    $filename = $id . '.' . $ext;
    file_put_contents(UPLOAD_DIR . $filename, $image_data);

    $protocol = isset($_SERVER['HTTPS']) ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $base = dirname($_SERVER['SCRIPT_NAME']);
    $url = $protocol . '://' . $host . $base . '/gallery_uploads/' . $filename;

    $photos = load_photos();
    $photos[] = ['id' => $id, 'url' => $url];
    save_photos($photos);

    echo json_encode(['id' => $id, 'url' => $url]);
    exit;
}

// DELETE — удалить фото
if ($method === 'DELETE') {
    $id = $body['id'] ?? '';
    $photos = load_photos();
    $photos = array_filter($photos, function($p) use ($id, &$deleted_url) {
        if ($p['id'] === $id) {
            $deleted_url = $p['url'];
            return false;
        }
        return true;
    });
    // удалить файл
    $file = UPLOAD_DIR . $id . '.*';
    foreach (glob(UPLOAD_DIR . $id . '.*') as $f) {
        unlink($f);
    }
    save_photos(array_values($photos));
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
