<?php

use Slim\App;
use Slim\Http\Request;
use Slim\Http\Response;

return function (App $app) {
    $container = $app->getContainer();

//  API ---------------------------------------------------------------------------------------------------------------


    $app->group('/api', function() use ($app, $container) {

        /**
         * Get all available gallery images
         */
        $app->get('/gallery', function (Request $request, Response $response, array $args) use ($container) {
            $apiResponse = [ 'success' => true ];

            $mediaSettings = $container->get('settings')['media'];
            $mediaDirUrl = $this->helpers->buildAbsoluteUrl($request);

            try {
                /** @var $db \SleekDB\SleekDB **/
                $db = $this->db->__invoke('gallery');

                $result = $db->orderBy('desc', 'date')->fetch() ?? [];

                $helpers = $this->helpers;
                $apiResponse['data'] = array_map(function ($item) use ($mediaDirUrl, $helpers) {
                    return [
                        'name' => $item['name'],
                        'url' => $helpers->pathJoin($mediaDirUrl, $item['url']),
                        'thumb_url' => $item['thumb_url'] ? $helpers->pathJoin($mediaDirUrl, $item['thumb_url']) : '',
                    ];
                }, $result);

            } catch (\Exception $err) {
                $apiResponse['success'] = false;
                $apiResponse['error'] = $err->getMessage();
            }

            return $response->withJson($apiResponse);
        });

        $app->get('/scoreboard', function (Request $request, Response $response, array $args) use ($container) {
            $apiResponse = [ 'success' => true ];

            try {
                /** @var $db \SleekDB\SleekDB **/
                $db = $this->db->__invoke('scoreboard');

                $result = $db->fetch() ?? [];
                $result = array_filter($result, function ($row) {
                   return isset($row['team-list']) && is_array($row['team-list']) && !!count($row['team-list']);
                });

                $apiResponse['data'] = array_map(function ($row) {
                    return [
                        'group' => $row['name'],
                        'teams' => $row['team-list'],
                    ];
                }, $result);

            } catch (\Exception $err) {
                $apiResponse['success'] = false;
                $apiResponse['error'] = $err->getMessage();
            }

            return $response->withJson($apiResponse);
        });

        $app->get('/round', function (Request $request, Response $response, array $args) use ($container) {
            $apiResponse = [ 'success' => true ];

            try {
                /** @var $db \SleekDB\SleekDB **/
                $db = $this->db->__invoke('scoreboard-rounds');

                $result = $db->fetch() ?? [];

                $apiResponse['data'] = array_map(function ($row) {
                    return [
                        'name' => $row['name'],
                        'group' => $row['group']
                    ];
                }, $result);

            } catch (\Exception $err) {
                $apiResponse['success'] = false;
                $apiResponse['error'] = $err->getMessage();
            }

            return $response->withJson($apiResponse);
        });


        $app->group('/admin', function () use ($app, $container) {
            $app->get('/group', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                try {
                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('scoreboard');

                    $result = $db->fetch();

                    $apiResponse['data'] = array_map(function ($row) {
                        return [
                            'id' => $row['_id'],
                            'name' => $row['name'],
                            'teams' => $row['team-list'],
                        ];
                    }, $result);

                } catch (\Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            });

            $app->post('/group', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                try {
                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('scoreboard');

                    $data = $request->getParsedBodyParam('group') ?? false;
                    if (!$data)
                        throw new \Exception('Invalid group data');

                    $data = array_map(function ($item) { return strip_tags(trim($item)); }, $data);
                    $group = $db->insert([
                        'name' => $data['name'],
                        'team-list' => []
                    ]);
                    if (!$group)
                        throw new \Exception('Group not found');

                    $apiResponse['data'] = [
                        'name' => $group['name'],
                        'id' => $group['_id'],
                    ];

                } catch (\Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            })->add($container->get('csrf'));

            $app->put('/group', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                try {
                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('scoreboard');

                    $data = $request->getParsedBodyParam('group') ?? false;
                    if (!$data)
                        throw new \Exception('Invalid group data');

                    $group = array_shift($db->where('_id', '=', $data['id'])->fetch());
                    if (!$group)
                        throw new \Exception('group not found');

//                $data = array_map(function ($item) { return strip_tags(trim($item)); }, $data);
                    $columns = [ 'name' => $data['name'] ];
                    if (isset($data['teams']) && is_array($data['teams']))
                        $columns['team-list'] = $data['teams'];

                    $result = $db->where('_id', '=', $data['id'])->update($columns);
                    if (!$result)
                        throw new \Exception('Unknown error while saving group.');

                } catch (\Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            })->add($container->get('csrf'));

            $app->delete('/group', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                try {
                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('scoreboard');

                    $group = $request->getParsedBodyParam('group') ?? false;
                    if (!is_numeric($group))
                        throw new \Exception('Invalid group data');

                    $group = array_shift($db->where('_id', '=', $group)->fetch());
                    if (!$group)
                        throw new \Exception('group not found');

                    $result = $db->where('_id', '=', $group['_id'])->delete();
                    if (!$result)
                        throw new \Exception('Unknown error while deleting group.');

                } catch (\Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            })->add($container->get('csrf'));

            $app->post('/team', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                try {
                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('scoreboard');

                    $data = $request->getParsedBodyParam('team') ?? false;
                    $group_id = $request->getParsedBodyParam('group') ?? false;
                    if (!$data || !$group_id)
                        throw new \Exception('Invalid data');

                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('scoreboard');

                    $group = array_shift($db->where('_id', '=', $group_id)->fetch()) ?: false;
                    if (!$group)
                        throw new \Exception('Invalid group');

                    $group['team-list'][] = [
                        'name' => $data['name'],
                        'wins' => $data['wins'],
                        'draws' => $data['draws'],
                        'defeats' => $data['defeats'],
                        'points' => $data['points'],
                    ];

                    if (!$db->where('_id', '=', $group_id)->update($group))
                        throw new \Exception('Unknown error whiel updating team data');

                } catch (\Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            })->add($container->get('csrf'));

            $app->put('/team', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                try {
                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('scoreboard');

                    $data = $request->getParsedBodyParam('team') ?? false;
                    $group_id = $request->getParsedBodyParam('group') ?? false;
                    if (!$data || !$group_id)
                        throw new \Exception('Invalid data');

                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('scoreboard');

                    $group = array_shift($db->where('_id', '=', $group_id)->fetch()) ?: false;
                    if (!$group)
                        throw new \Exception('Invalid group');

                    $team_index = $data['index'];
                    if (!isset($group['team-list'][$team_index]))
                        throw new \Exception('Invalid team');

                    $group['team-list'][$team_index] = [
                        'name' => $data['name'],
                        'wins' => $data['wins'],
                        'draws' => $data['draws'],
                        'defeats' => $data['defeats'],
                        'points' => $data['points'],
                    ];

                    if (!$db->where('_id', '=', $group_id)->update($group))
                        throw new \Exception('Unknown error whiel updating team data');

                } catch (\Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            })->add($container->get('csrf'));

            $app->delete('/team', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                try {
                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('scoreboard');

                    $data = $request->getParsedBodyParam('team') ?? false;
                    $group_id = $request->getParsedBodyParam('group') ?? false;
                    if (!$data || !$group_id)
                        throw new \Exception('Invalid data');

                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('scoreboard');

                    $group = array_shift($db->where('_id', '=', $group_id)->fetch()) ?: false;
                    if (!$group)
                        throw new \Exception('Invalid group');

                    $team_index = $data['index'];
                    if (isset($group['team-list'][$team_index]))
                        unset($group['team-list'][$team_index]);

                    if (!$db->where('_id', '=', $group_id)->update($group))
                        throw new \Exception('Unknown error whiel updating team data');

                } catch (\Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            })->add($container->get('csrf'));

            $app->get('/round', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                try {
                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('scoreboard-rounds');

                    $result = $db->fetch() ?? [];

                    $apiResponse['data'] = array_map(function ($row) {
                        return [
                            'id' => $row['_id'],
                            'name' => $row['name'],
                            'group' => $row['group']
                        ];
                    }, $result);

                } catch (\Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            });

            $app->post('/round', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                try {
                    $data = $request->getParsedBodyParam('round') ?? false;
                    if (!$data)
                        throw new \Exception('Invalid data');

                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('scoreboard-rounds');

                    $roundData = $db->insert([
                        'name' => $data['name'],
                        'group' => []
                    ]);

                    $apiResponse['data'] = [
                        'id' => $roundData['_id'],
                        'name' => $roundData['name']
                    ];

                } catch (\Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            })->add($container->get('csrf'));

            $app->put('/round', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                try {
                    $data = $request->getParsedBodyParam('round') ?? false;
                    if (!$data)
                        throw new \Exception('Invalid data');

                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('scoreboard-rounds');

                    $round = array_shift($db->where('_id', '=', $data['id'])->fetch()) ?: false;
                    if (!$round)
                        throw new \Exception('Scoreboard round not found.');

                    $result = $db->where('_id', '=', $data['id'])->update([ 'name' => $data['name'], 'group' => $data['group'] ]);
                    if (!$result)
                        throw new \Exception('Error while saving data');


                } catch (\Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            })->add($container->get('csrf'));

            $app->delete('/round', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                try {
                    $data = $request->getParsedBodyParam('round') ?? false;
                    if (!$data)
                        throw new \Exception('Invalid data');

                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('scoreboard-rounds');

                    $round = array_shift($db->where('_id', '=', $data['id'])->fetch()) ?: false;
                    if (!$round)
                        throw new \Exception('Scoreboard round not found.');

                    $result = $db->where('_id', '=', $data['id'])->delete();
                    if (!$result)
                        throw new \Exception('Error while removing data');


                } catch (\Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            })->add($container->get('csrf'));

            /**
             * Get all available gallery images
             */
            $app->get('/gallery', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                $mediaSettings = $container->get('settings')['media'];
                $mediaDirUrl = $this->helpers->buildAbsoluteUrl($request);

                try {
                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('gallery');

                    $result = $db->orderBy('desc', 'date')->fetch() ?? [];

                    //TODO: get gallery images from db
                    $helpers = $this->helpers;
                    $apiResponse['data'] = array_map(function ($item) use ($mediaDirUrl, $helpers) {
                        return [
                            'id' => $item['_id'],
                            'name' => $item['name'],
                            'url' => $helpers->pathJoin($mediaDirUrl, $item['url']),
                            'thumb_url' => $item['thumb_url'] ? $helpers->pathJoin($mediaDirUrl, $item['thumb_url']) : '',
                        ];
                    }, $result);

                } catch (\Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            });

            /**
             * Admin: Upload a gallery image
             */
            $app->post('/gallery/upload', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                $mediaSettings = $container->get('settings')['media'];
                $mediaDir = $this->helpers->normalizePath($mediaSettings['mediaDir']);
                $mediaDirUrl = $this->helpers->pathJoin($request->getUri()->getBasePath(), 'media');

                try {
                    /** @var $file Slim\Http\UploadedFile */
                    $file = $request->getUploadedFiles()['file'] ?? false;
                    if (!$file)
                        throw new \Exception('Invalid upload.');
                    elseif ($file->getError() != UPLOAD_ERR_OK) {
                        switch ($file->getError()) {
                            case UPLOAD_ERR_INI_SIZE:
                                $error = 'Upload exceds "upload_max_filesize" php config (' . ini_get('upload_max_filesize') . ').';
                                break;
                            default:
                                $error = 'Unknown error while uploading image.';
                        }

                        throw new \Exception($error);
                    } elseif (!in_array($file->getClientMediaType(), $mediaSettings['acceptedImages']))
                        throw new \Exception('Invalid image for upload. Accepted mimes: ' . implode(', ', $mediaSettings['acceptedImages']));

                    $filleExt = $this->helpers->getFileExtension($file->getClientFilename());
                    $filename = $this->helpers->sanitizeFileName(basename($file->getClientFilename(), ".{$filleExt}")) . ".{$filleExt}";
                    $filepath = $this->helpers->pathJoinFile($mediaDir, $filename);

                    if (is_file($filepath)) {
                        $i = 1;
                        while (is_file($filepath)) {
                            $filename = basename($file->getClientFilename(), ".{$filleExt}") . "-{$i}.{$filleExt}";
                            $filepath = $this->helpers->pathJoinFile($mediaDir, $filename);
                            $i++;
                        }
                    }

                    $file->moveTo($filepath);
                    $this->helpers->imageReiszeDown($filepath, $mediaSettings['maxImageWidth'], $mediaSettings['maxImageHeight']);

                    $thumbFilename = basename($filename, ".{$filleExt}") . "-thumb.{$filleExt}";
                    $thumbFilePath = $this->helpers->pathJoin($mediaDir, "thumb/{$thumbFilename}");
                    !is_dir(dirname($thumbFilePath)) && mkdir(dirname($thumbFilePath), 0755);
                    $this->helpers->imageCreateThumb($filepath, $thumbFilePath, $mediaSettings['thumbWidth'], $mediaSettings['thumbHeight']);

                    $fileUrl = str_replace($mediaDir, $mediaDirUrl, $filepath);
                    $thumbFileUrl = str_replace($mediaDir, $mediaDirUrl, $thumbFilePath);

                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('gallery');
                    $result = $db->insert([
                        'name' => $filename,
                        'url' => $fileUrl,
                        'thumb_url' => $thumbFileUrl,
                        'date' => time()
                    ]);

                    $apiResponse['data'] = [
                        'id' => $result['_id'] ?? 0,
                        'file' => $fileUrl,
                        'thumb' => $thumbFileUrl
                    ];
                } catch (\Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            })->add($container->get('csrf'));

            $app->delete('/gallery/delete/{id:\d+}', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                $mediaSettings = $container->get('settings')['media'];

                try {
                    $id = $args['id'] ?? false;
                    if (!$id)
                        throw new \Exception('Invalid ID');

                    /** @var $db \SleekDB\SleekDB **/
                    $db = $this->db->__invoke('gallery');

                    $result = array_shift($db->where( '_id', '=', $id)->fetch());

                    $filepath = $this->helpers->pathJoinFile($mediaSettings['mediaDir'], "../{$result['url']}");
                    $thumbFilePath = $this->helpers->pathJoinFile($mediaSettings['mediaDir'], "../{$result['thumb_url']}");

                    if (!$db->where( '_id', '=', $id)->delete())
                        throw new \Exception('Error happened when tried to delete image.');

                    array_map('unlink', array_filter([$filepath, $thumbFilePath], function ($file) { return !!$file && is_file($file); }));


                } catch (\Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            })->add($container->get('csrf'));

            $app->post('/login', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                $email = $request->getParsedBodyParam('email');
                $password = $request->getParsedBodyParam('password');

                try {
                    if (!$container->get('session')->get('user')) {
                        /** @var $db \SleekDB\SleekDB * */
                        $db = $this->db->__invoke('users');
                        $result = $db->where('email', '=', $email)->fetch() ?? [] ?: [];

                        $user = array_shift($result) ?? false;
                        if (!$user)
                            throw new \Exception('Login failed: user/password mistach.');

                        // TODO: add better validation and redirection (success/fail)
                        if (!password_verify($password, $user['password']))
                            throw new \Exception('Login failed: user/password mistach.');

                        $container->get('session')->set('user', $user);
                    }

                    $apiResponse['data'] = [ 'redirect' => $this->helpers->buildAbsoluteUrl($request, 'admin') ];

                } catch (Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            });

            $app->get('/csrf', function (Request $request, Response $response, array $args) use ($container) {
                $apiResponse = [ 'success' => true ];

                try {
                    $csrf_name = $this->csrf->getTokenNameKey();
                    $csrf_value = $this->csrf->getTokenValueKey();
                    $name = $request->getAttribute($this->csrf->getTokenNameKey());
                    $value = $request->getAttribute($csrf_value);

                    $apiResponse['csrf'] = [ 'name' => [ $csrf_name, $name ], 'value' => [ $csrf_value, $value ] ];
                } catch (Exception $err) {
                    $apiResponse['success'] = false;
                    $apiResponse['error'] = $err->getMessage();
                }

                return $response->withJson($apiResponse);
            })->add($container->get('csrf'));
        });
    });

//  /API --------------------------------------------------------------------------------------------------------------

//  ADMIN -------------------------------------------------------------------------------------------------------------

    $app->group('/admin', function() use ($app, $container) {
        /**
         * Admin Dashboard Route
         */
        $app->get('', function (Request $request, Response $response, array $args) use ($container) {
            $csrf_name = $this->csrf->getTokenNameKey();
            $csrf_value = $this->csrf->getTokenValueKey();
            $name = $request->getAttribute($this->csrf->getTokenNameKey());
            $value = $request->getAttribute($csrf_value);

            $args['csrf'] = [ 'name' => [ $csrf_name, $name ], 'value' => [ $csrf_value, $value ] ];
            $args['error'] = $this->flash->getMessage('error');

            return $container->get('renderer')->render($response, 'index.phtml', $args);
        })->add($container->get('csrf'));

        /**
         * Login Route
         */
        $app->get('/login', function (Request $request, Response $response, array $args) use ($container) {
            $csrf_name = $this->csrf->getTokenNameKey();
            $csrf_value = $this->csrf->getTokenValueKey();
            $name = $request->getAttribute($this->csrf->getTokenNameKey());
            $value = $request->getAttribute($csrf_value);
            $args['csrf'] = [ 'name' => [ $csrf_name, $name ], 'value' => [ $csrf_value, $value ] ];
            $args['error'] = $this->flash->getMessage('error');

            return $container->get('renderer')->render($response, 'login.phtml', $args);
        })->add($container->get('csrf'));

        /**
         * Logout Route
         */
        $app->get('/logout', function (Request $request, Response $response, array $args) use ($container) {
            $container->get('session')->delete('user');
            return $response->withRedirect('/admin/');
        });
    });

//  /ADMIN ------------------------------------------------------------------------------------------------------------


    $app->get('/[{name}]', function (Request $request, Response $response, array $args) use ($container) {
        // Sample log message
        $container->get('logger')->info("Slim-Skeleton '/' route");

        // Render index view
        return $container->get('renderer')->render($response, 'index.phtml', $args);
    });
};
