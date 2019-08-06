;(function ($) {
    'use strict'


    $(document).ready(function () {
        initScoreboardComponent();
        initGalleryComponent();
        initLoginComponent();
        initRoundsComponent();
        initUserComponent();
    });

    function initRoundsComponent() {
        var $component = $('.rounds-component');
        if (!$component.length) {
            return false;
        }


        _apiCall('admin/round').then(function (response) {
            if (!response || !response.success) {
                return false;
            }

            $.each(response.data, function (type, rows) {
                var $block = $component.find('#rounds-' + type);

                $.each(rows, function (i, item) {
                    var $formRound = $block.find('.round-form-dummy').clone(true).removeClass('round-form-dummy');

                    $formRound.find('input[name="round[name]"]').val(item.name);
                    $formRound.find('input[name="round[id]"]').val(item.id);

                    $.each(item.group, function (i, row) {
                        var $list = $formRound.find('.round-teams')
                        var $list1 = $list.find('.round-teams-1 .team-list');
                        var $list2 = $list.find('.round-teams-2 .team-list');
                        var index = $list1.find('.team:not(.team-dummy)').length;

                        var $team1 = $list1.find('.team-dummy').clone(true).removeClass('team-dummy').appendTo($list1);
                        var $team2 = $list2.find('.team-dummy').clone(true).removeClass('team-dummy').appendTo($list2);

                        $team1.find(':input').val(row.team.shift()).removeAttr('disabled').attr('name', $team1.find(':input').attr('name').replace('round[group][]', 'round[group][' + i + ']'));
                        $team2.find(':input').val(row.team.pop()).removeAttr('disabled').attr('name', $team2.find(':input').attr('name').replace('round[group][]', 'round[group][' + i + ']'));
                    });

                    $block.find('.round-list').append($formRound);
                });
            });
        });

        $component.on('click', '.round-list .round-form:not(.round-form-dummy) .btn-add-team', function (e) {
            e.preventDefault();

            var $formRound = $(this).closest('.round-form');
            var $list = $formRound.find('.round-teams')
            var $list1 = $list.find('.round-teams-1 .team-list');
            var $list2 = $list.find('.round-teams-2 .team-list');
            var index = $list1.find('.team:not(.team-dummy)').length;

            var $team1 = $list1.find('.team-dummy').clone(true).removeClass('team-dummy').appendTo($list1);
            var $team2 = $list2.find('.team-dummy').clone(true).removeClass('team-dummy').appendTo($list2);

            $team1.find(':input').removeAttr('disabled').attr('name', $team1.find(':input').attr('name').replace('round[group][]', 'round[group][' + index + ']'));
            $team2.find(':input').removeAttr('disabled').attr('name', $team2.find(':input').attr('name').replace('round[group][]', 'round[group][' + index + ']'));

            return false;
        });

        $component.on('click', '.round-list .round-form:not(.round-form-dummy) .btn-delete-round', function (e) {
            e.preventDefault();

            var $formRound = $(this).closest('.round-form');

            if (!window.confirm("Deseja excluir esta etapa? Todos os dados desta etapa serão removidos.\n\nDeseja continuar?")) {
                return false;
            }

            _apiCall($formRound.attr('action'), $formRound.serialize(), 'DELETE').then(function (response) {
                if (!response || !response.success) {
                    return false;
                }

                $formRound.fadeOut('fast', function () { $formRound.remove(); });
            });

            return false;
        });

        $component.on('change propertychange', '.round-form:not(.round-form-dummy) .round-teams .team-list .team:not(.team-dummy) :text', function (e) {
            var $formRound = $(this).closest('.round-form');

            _apiCall($formRound.attr('action'), $formRound.serialize(), 'PUT').then(function (response) {
                if (!response || !response.success) {
                    return false;
                }
            });
        });

        $component.on('click', '.round-form:not(.round-form-dummy) .round-teams .team-list .team:not(.team-dummy) .btn-team-remove', function (e) {
            e.preventDefault();

            var $formRound = $(this).closest('.round-form');
            var $list = $formRound.find('.round-teams');
            var index = $formRound.find('.btn-team-remove:visible').index(this);

            var deferred = $.Deferred();

            $list.find('.round-teams-1,.round-teams-2').each(function (i) {
                var $team = $(this).find('.team:visible').eq(index);

                $team.find(':input').prop('disabled', true);
                $team.fadeOut('fast', function () { $(this).remove() });

                if (i === 1) {
                    deferred.resolve();
                }
            });

            $.when(deferred).then(function () {
                _apiCall($formRound.attr('action'), $formRound.serialize(), 'PUT').then(function (response) {
                    if (!response || !response.success) {
                        return false;
                    }
                });
            });

            return false;
        });

        $component.on('change propertychange', '.round-form:not(.round-form-dummy) input[name="round[name]"]', function (e) {
            var $form = $(this).closest('.round-form');

            _apiCall($form.attr('action'), $form.serialize(), 'PUT').then(function (response) {
                if (!response || !response.success) {
                    return false;
                }
            });
        });

        $component.find('.form-add-round').on('submit', function (e) {
            e.preventDefault()

            var $form = $(this);
            var $block = $form.closest('.scoreboard-rounds-component');

            _apiCall($form.attr('action'), $form.serialize(), 'POST').then(function (response) {
                if (!response || !response.success) {
                    return false;
                }

                var $formRound = $block.find('.round-form-dummy').clone(true).removeClass('round-form-dummy');

                $formRound.find('input[name="round[name]"]').val(response.data.name);
                $formRound.find('input[name="round[id]"]').val(response.data.id);

                $block.find('.round-list').append($formRound);

                $form.trigger('reset');
            });

            return false;
        });
    }

    function initScoreboardComponent() {
        var $component = $('.scoreboard-component');
        if (!$component.length) {
            return false;
        }

        // list groups
        _apiCall('admin/group').then(function (response) {
            if (!response || !response.success) {
                return false;
            }

            $.each(response.data, function (type, rows) {

                var $block = $component.find('#' + type);

                $.each(rows, function (i, group) {
                    var $group = $block.find('.group-dummy').clone(true).removeClass('group-dummy');

                    $group.find('.form-group-details :text').val(group.name);
                    $group.find('.form-group-details input[name="group[id]"]').val(group.id);

                    var $teams = $.map(group.teams, function (team, i) {
                        var $team = $group.find('.team-list .team.team-dummy').clone(true);

                        $team.find('input[name="team[name]"]').val(team.name);
                        $team.find('input[name="team[wins]"]').val(team.wins);
                        $team.find('input[name="team[draws]"]').val(team.draws);
                        $team.find('input[name="team[defeats]"]').val(team.defeats);
                        $team.find('input[name="team[points]"]').val(team.points);
                        $team.find('input[name="team[index]"]').val(i);

                        return $team.removeClass('team-dummy');
                    });

                    $group.find('.team-list').append($teams);
                    _buildScoreboardSortable($group);

                    $block.find('.group-list').append($group);
                });
            });

            return false;
        });

        // add group
        $component.find('.form-add-group').on('submit', function (e) {
            e.preventDefault();

            var $form = $(this);
            var $block = $form.closest('.scoreboard-component-groups');

            _apiCall($form.attr('action'), $form.serialize(), 'POST').then(function (response) {
                if (!response || !response.success) {
                    return false;
                }

                var group = response.data;
                var $group = $block.find('.group-dummy').clone(true).removeClass('group-dummy');

                $group.find('.form-group-details :text').val(group.name);
                $group.find('.form-group-details input[name="group[id]"]').val(group.id);
                _buildScoreboardSortable($group);

                $block.find('.group-list').append($group);

                $form.trigger('reset');
            });

            return false;
        });

        // update group info
        $component.on('change propertychange', '.group:not(.group-dummy) .form-group-details :text', function (e) {
            var $form = $(this).closest('form');

            _apiCall($form.attr('action'), $form.serialize(), 'PUT').then(function (response) {
                if (!response || !response.success) {
                    return false;
                }
            });
        });

        $component.on('click', '.group:not(.group-dummy) .btn-add-team', function (e) {
            e.preventDefault();

            var $group = $(this).closest('.group');
            var group_id = $group.find('.form-group-details input[type="hidden"]').val();

            var $team = $group.find('.team-list .team.team-dummy').clone(true).removeClass('team-dummy').addClass('team-new');

            $group.find('.team-list').append($team);

            var index = $group.find('.team-list .team:not(.team-dummy)').index($team);

            window.setTimeout(function () {
                $team.find('input[name="team[index]"]').val(index);
                $team.find(':text:eq(0)').trigger('focus');
                $group.find('.team-list').sortable('refresh');
            }, 100);

            return false;
        });

        $component.on('click', '.group:not(.group-dummy) .btn-remove-group', function (e) {
            e.preventDefault();

            var $group = $(this).closest('.group');
            var $form = $group.find('.form-group-details');
            var group_id = $form.find('input[name="group[id]"]').val();

            if (!window.confirm("Deseja excluir este grupo? Todos os dados deste grupo serão removidos.\n\nDeseja continuar?")) {
                return false;
            }

            _apiCall('admin/group', 'group=' + group_id, 'DELETE').then(function (response) {
                if (!response || !response.success) {
                    return false;
                }

                $group.fadeOut('fast', function () { $group.remove(); });
            });

            return false;
        });

        $component.on('change propertychange', '.group:not(.group-dummy) .team-list .team.team-new:not(.team-dummy) :input', function (e) {
            var $team = $(this).closest('.team')
            var $group = $team.closest('.group');
            var $form = $team.find('.form-team')
            var group_id = $group.find('.form-group-details input[name="group[id]"]').val();

            _apiCall($form.attr('action'), $form.serialize() + '&group=' + group_id,  'POST').then(function (response) {
                if (!response || !response.success) {
                    return false;
                }

                $team.removeClass('team-new');
            });
        });

        $component.on('change propertychange', '.group:not(.group-dummy) .team-list .team:not(.team-dummy):not(.team-new) :input', function (e) {
            var $team = $(this).closest('.team')
            var $group = $team.closest('.group');
            var $form = $team.find('.form-team')
            var group_id = $group.find('.form-group-details input[name="group[id]"]').val();

            _apiCall($form.attr('action'), $form.serialize() + '&group=' + group_id, 'PUT').then(function (response) {
                if (!response || !response.success) {
                    return false;
                }
            });
        });

        $component.on('click', '.group:not(.group-dummy) .team-list .team:not(.team-dummy) .btn-team-remove', function (e) {
            e.preventDefault();

            var $team = $(this).closest('.team')
            var $group = $team.closest('.group');
            var $form = $team.find('.form-team')
            var group_id = $group.find('.form-group-details input[name="group[id]"]').val();
            var deferred = $.Deferred();

            $team.find(':input').trigger('blur').prop('readonly', true);

            if ($team.is('.team-new')) {
                deferred.resolve();
            } else {
                _apiCall('admin/team', $form.serialize() + '&group=' + group_id, 'DELETE').then(function (response) {
                    if (!response || !response.success) {
                        return false;
                    }

                    deferred.resolve();
                });
            }

            $.when(deferred).then(function () {
                $team.fadeOut('fast', function () { $team.remove(); $group.find('.team-list').sortable('refresh'); });
            });

            return false;
        });

        $component.on('submit', '.form-group-details, .form-team', function (e) {
            e.preventDefault();

            return false;
        });
    }

    function initGalleryComponentUpload() {
        var $component = $('.gallery-component');
        if (!$component.length) {
            return false;
        }

        var $form = $component.find("form.gallery-upload");
        var $galleryList = $component.find('.gallery .gallery-list');

        $form.addClass('dropzone').dropzone({
            // uploadMultiple: true,
            acceptedFiles: 'image/png, image/jpeg',
            dictDefaultMessage: 'Arraste arquivos aqui ou clique para fazer upload',
            success: function (file, response, x) {
                if (!response || !response.success) {
                    return false;
                }

                var item = response.data;

                $galleryList.prepend(_buildGalleryItem(item.id, item.thumb, item.file));
            },
            queuecomplete: function () {
                var instance = this;
                var completedFiles = $.grep(instance.files, function (file) { return file.status === 'success'; });

                $.each(completedFiles, function (i, file) {
                    $(file.previewElement).fadeOut('slow', function () {
                        if (!$form.find('.dz-preview:visible').length) {
                            instance.removeAllFiles(true);
                        }
                    });
                });
            }
        })
    }

    function initGalleryComponent() {
        var $component = $('.gallery-component');
        if (!$component.length) {
            return false;
        }

        var $galleryList = $component.find('.gallery .gallery-list');

        _apiCall('admin/gallery').then(function (response) {
            if (!response || !response.success) {
                return false;
            }

            $.each(response.data, function (i, item) {
                $galleryList.append(_buildGalleryItem(item.id, item.thumb_url, item.url));
            });
        });

        $(document).on('click', '.gallery-component .gallery-item .delete:visible', function (e) {
            e.preventDefault();

            var $image = $(this).closest('.gallery-item');
            var id = Number($image.data('id'));
            if (!$.isNumeric(id)) {
                return false;
            }

            _apiCall('admin/gallery/delete/' + id, null, 'DELETE').then(function (response) {
                if (!response || !response.success) {
                    return false;
                }

                $image.fadeOut('slow', function () { $(this).remove(); });
            });

            return false;
        });

        initGalleryComponentUpload();
    }

    function initLoginComponent() {
        var $component = $('.login-component');

        if (!$component.length) {
            return false;
        }

        $component.find('form').on('submit', function (e) {
            e.preventDefault();

            var $form = $(this);

            $component.find('.alert-danger').remove();
            $form.find(':submit').prop('disabled', true);

            _apiCall($form.attr('action'), $form.serializeObject(), 'POST').then(function (response) {
                if (!response || !response.success) {
                    if (response && !response.success) {

                    }

                    $component.append('<div class="alert alert-danger">Não foi possível realizar login. Usuário/Senha não conferem.</div>');

                    return false;
                }

                window.location = response.data.redirect;
            }).always(function () {
                $form.find(':submit').prop('disabled', false);
            });

            return false;
        });
    }

    function initUserComponent() {
        var $component = $('.user-component');

        if (!$component.length) {
            return false;
        }

        _apiCall('admin/user').then(function (response) {
            var $list = $component.find('.user-list-component .user-list');

            $list.find('tbody tr:not(.empty)').remove();

            if (response && !response.success) {
                $list.find('.empty').show().text('Erro ao listar usuários');
                return false;
            }

            $list.find('.empty').hide();


            _buildComponentUserList(response.data);
        });

        $component.find('.form-user-add').on('submit', function (e) {
            e.preventDefault();

            var $form = $(this);

            if ($form.data('loading')) {
                return false;
            }

            $component.find('.user-add-component .alert-danger').remove();
            $form.data('loading', true).find(':button').prop('disabled', true);

            _apiCall($form.attr('action'), $form.serializeObject(), 'POST').then(function (response) {
                if (response && !response.success) {
                    $component.find('.user-add-component').append('<div class="alert alert-danger">Não foi possível adicionar novo usuário.</div>');
                    return false;
                }

                $form.trigger('reset');

                _buildComponentUserList([ response.data ]);

            }).always(function () {
                $form.data('loading', false).find(':button').prop('disabled', false);
            });

            return false;
        });

        $component.on('click', '.user-list-component .btn-remove-user', function (e) {
            e.preventDefault();

            var $element = $(this).closest('.user')

            if (!window.confirm("Deseja excluir esta etapa? Todos os dados deste usuário serão removidos.\n\nDeseja continuar?")) {
                return false;
            }

            _apiCall('admin/user', { user: { id: $element.data('id') } }, 'DELETE').then(function (response) {
                if (!response || !response.success) {
                    if (response && response.errorCode) {
                        return window.alert(response.error);
                    }
                    return false;
                }

                $element.fadeOut('fast', function () { $element.remove(); });
            });

            return false;
        })
    }

    function _buildScoreboardSortable(group) {
        var $group = $(group);
        if (!$group.length) {
            return false;
        }

        var $form = $group.find('.form-group-details');
        var $list = $group.find('.team-list');

        return $list.sortable({
            axis: 'y',
            handle: '.team-move',
            containment: 'parent',
            update: function (event, ui) {
                var $teams = $list.find('.team:not(.team-dummy)');
                var data = {
                    teams: []
                };

                $teams.find('input[name="team[index]"]').each(function (i) { this.value = i; });

                $.each($form.serializeArray(), function (i, row) {
                    row.name = row.name.replace(/^group\[(.+)\]$/, '$1');

                    data[row.name] = row.value;
                });

                $teams.each(function () {
                    var $form = $(this).find('.form-team');
                    var teamData = {};

                    var team = $.each($form.serializeArray(), function (i, row) {
                        row.name = row.name.replace(/^team\[(.+)\]$/, '$1');
                        if (row.name === 'index') {
                            return;
                        }

                        teamData[row.name] = row.value;
                    });

                    data.teams.push(teamData);
                });

                var formData = $.extend({}, _serializeObject(CSRFRequest.name + '&' + CSRFRequest.value), { group: data });


                _apiCall($form.attr('action'), formData, 'PUT').then(function (response) {
                    if (!response || !response.success) {
                        return false;
                    }

                    $teams.removeClass('team-new');
                });
            }
        });
    }

    function _buildGalleryItem(id, thumb_url, url) {
        var $item = $('<li class="gallery-item" data-id="' + id + '" />');

        $item.append('<a data-fancybox rel="gallery" href="' + url + '" target="_blank"><img src="' + (thumb_url || item.url) + '" /></a>');
        $item.append('<span class="delete"></span>');

        return $item;
    }

    function _apiCall(endpoint, data, type) {
        var csrf = _serializeObject(CSRFRequest.name + '&' + CSRFRequest.value);
        var url = apiUrl;

        endpoint = endpoint.replace(/^\/|\/$/g, '');
        data = data || '';
        data = data.constructor === String ? _serializeObject(data) : data;
        type = (type || 'GET').toUpperCase();

        if (type !== 'GET' && !data.csrf_name) {
            data = $.extend(csrf, data);
        }

        url = apiUrl.replace(/\/$/, '');
        endpoint = endpoint.replace(/^\//, '');

        return $.ajax({
            url: url + '/' + endpoint,
            data: data,
            type: type
        });
    }

    function _buildComponentUserList(data) {
        var $component = $('.user-component .user-list-component .user-list');

        $.each(data, function (i, row) {
            $('<tr class="user" data-id="' + row.id + '" />').append(
                '<td>' + row.id + '</td>' +
                '<td>' + row.user + '</td>' +
                '<td>' + row.name + '</td>' +
                '<td>' + row.email + '</td>' +
                '<td>' +
                '<a class="btn btn-link" href="' + siteUrl + 'admin/user/edit/' + row.id + '">Editar</a>' +
                '<a class="btn btn-link btn-remove-user" href="#">Apagar</a>' +
                '</td>'
            ).appendTo($component.find('tbody'));
        });
    }


    function _serializeObject(query) {
        return URI.parseQuery(decodeURIComponent(query));
    }

//  MISC ------------------------------------------------------------------------------------------

})(jQuery);