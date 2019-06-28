<?php

use Slim\App;
use SleekDB\SleekDB;

return function (App $app) {
    $container = $app->getContainer();

    // create media dir, if not present already
    isset($container->get('settings')['media']['mediaDir'])
        && !is_dir($container->get('settings')['media']['mediaDir'])
        && mkdir($container->get('settings')['media']['mediaDir'], 0755);


    if (php_sapi_name() !== 'cli-server') {
        $container['environment'] = function () {
            // Fix the Slim 3 subdirectory issue (#1529)
            // This fix makes it possible to run the app from localhost/slim3-app
            $scriptName = $_SERVER['SCRIPT_NAME'];
            $_SERVER['REAL_SCRIPT_NAME'] = $scriptName;
            $_SERVER['SCRIPT_NAME'] = dirname(dirname($scriptName)) . '/' . basename($scriptName);

            return new Slim\Http\Environment($_SERVER);
        };
    }

    // view renderer
    $container['renderer'] = function ($c) {
        $settings = $c->get('settings')['renderer'];
        $is_admin = preg_match('#^/admin/?#', $c->request->getUri()->getPath());

        $view = new \Slim\Views\PhpRenderer($settings['template_path'] . (!!$is_admin ? '/admin/' : ''));
        $view->setLayout("layout.phtml");

        return $view;
    };



    $container['csrf'] = function ($c) {
        $storage = null;

        return new \Slim\Csrf\Guard('csrf', $storage, null, 200, 16, true);
    };

    // monolog
    $container['logger'] = function ($c) {
        $settings = $c->get('settings')['logger'];
        $logger = new \Monolog\Logger($settings['name']);
        $logger->pushProcessor(new \Monolog\Processor\UidProcessor());
        $logger->pushHandler(new \Monolog\Handler\StreamHandler($settings['path'], $settings['level']));
        return $logger;
    };

    /**
     * JSON Storage
     * @see https://sleekdb.github.io
     * @param $c
     * @return SleekDB
     */
    $container['db'] = function ($c) {
        $settings = $c->get('settings')['db'];

        return function ($store) use ($settings) {
            return SleekDB::store($store, $settings['dataDir'], [
                'auto_cache' => $settings['auto_cache'],
                'timeout' => $settings['timeout']
            ]);
        };
    };

    /**
     * @see https://github.com/bryanjhv/slim-session
     * @param $c
     * @return \SlimSession\Helper
     */
    $container['session'] = function ($c) {
        return new \SlimSession\Helper;
    };

    $container['flash'] = function () {
        return new \Slim\Flash\Messages;
    };

    $container['helpers'] = function () { return new CopaChampagnat\Helpers; };
};
