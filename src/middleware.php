<?php

use Slim\App;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Middleware\Session;
use Slim\Exception;


return function (App $app) {
    /** @var $container Slim\Container */
    $container = $app->getContainer();
    $settings = $container->get('settings');

    // CORS
    $app->add(function (Request $request, Response $response, $next) use ($container, $settings) {
        $res = $next($request, $response);

        return $res
            ->withHeader('Access-Control-Allow-Origin', '*')
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    });

    // LoggedIn Middleware
    $app->add(function (Request $request, Response $response, $next) use ($container, $settings) {
        if (!$route = $request->getAttribute('route'))
            throw new Exception\NotFoundException($request, $response);

        $publicRoutes = $settings['auth']['publicRoutes'] ?? ['login', 'logout'];
        $adminPublicRoutes = $settings['auth']['adminPublicRoutes'] ?? [];

        $routPath = $request->getUri()->getPath();

        if (preg_match('#/admin/?#', $routPath)) {
            $isWhiteListed = $adminPublicRoutes === '*' || in_array($routPath, $adminPublicRoutes);
            $isUserLoggedIn = $this->session->exists('user');

            if (!$isUserLoggedIn && !$isWhiteListed) {
                if ($this->request->isXhr())
                    return $response->withJson([ 'success' => false, 'error' => 'Unauthorized' ], 401);

                return $response->withRedirect('/admin/login');
            }
        }

        $response = $next($request, $response);
        /*else {
            $isWhiteListed = $publicRoutes === '*' || in_array($routPath, $publicRoutes);
            $response =  !$isWhiteListed ? $response->withRedirect('/') : $next($request, $response);
        }*/

        return $response;
    });

    // Session Middleware
    $app->add(new Session([
        'name' => $settings['session']['name'],
        'autorefresh' => true,
        'lifetime' => $settings['session']['lifetime']
    ]));

    $app->add(function (Request $request, Response $response, $next) use ($container, $settings) {
        $csrf_name = $this->csrf->getTokenNameKey();
        $csrf_value = $this->csrf->getTokenValueKey();
        $name = $request->getAttribute($this->csrf->getTokenNameKey());
        $value = $request->getAttribute($csrf_value);

        $container->get('renderer')->addAttribute('csrf', [ 'name' => [ $csrf_name, $name ], 'value' => [ $csrf_value, $value ] ]);

        return $next($request, $response);
    });

};
