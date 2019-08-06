<?php
return [
    'settings' => [
        'auth' => [
            'secret' => 'copa-champagnat',
            // public urls
            'publicRoutes' => '*',
            'adminPublicRoutes' => [
                '/admin/login',
                '/admin/logout',
                '/api/admin/login',
                '/api/admin/csrf',
            ],
            'adminUsersIDs' => [
                1
            ]
        ],
        'session' => [
            /** @see https://github.com/bryanjhv/slim-session#supported-options */
            'name' => 'PHPSESSID',
            'lifetime' => '1 hour',
        ],

        'db' => [
            'dataDir' => __DIR__ . '/../data/',
            'auto_cache' => true,
            'timeout' => 5,
        ],

        'determineRouteBeforeAppMiddleware' => true, // Only set this if you need access to route within middleware
        'displayErrorDetails' => true, // set to false in production
        'addContentLengthHeader' => false, // Allow the web server to send the content-length header

        // Renderer settings
        'renderer' => [
            'template_path' => __DIR__ . '/../templates/',
        ],

        // Monolog settings
        'logger' => [
            'name' => 'slim-app',
            'path' => isset($_ENV['docker']) ? 'php://stdout' : __DIR__ . '/../logs/app.log',
            'level' => \Monolog\Logger::DEBUG,
        ],

        'media' => [
            'acceptedImages' => ['image/png', 'image/jpeg'],
            'maxImageWidth' => 2048,
            'maxImageHeight' => 2048,
            'thumbWidth' => 350,
            'thumbHeight' => 286,
            'mediaDir' => __DIR__ . '/../public/media'
        ]
    ],
];
