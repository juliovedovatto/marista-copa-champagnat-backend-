;(function ($) {
    'use strict'


    $(document).ready(function () {
        initScoreboardComponent();
        initGalleryComponent();
        initLoginComponent();
        initRoundsComponent();
    });

    function initRoundsComponent() {
        var $component = $('.rounds-component');
        if (!$component.length) {
            return false;
        }

        $.get('/api/admin/round').then(function (response) {
            if (!response || !response.success) {
                return false;
            }

            $.each(response.data, function (i, item) {
                var $formRound = $component.find('.round-form-dummy').clone(true).removeClass('round-form-dummy');

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

                $component.find('.round-list').append($formRound);
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

            $.ajax({
                url: $formRound.attr('action'),
                data: $formRound.serialize(),
                method: 'DELETE'
            }).then(function (response) {
                if (!response || !response.success) {
                    return false;
                }

                $formRound.fadeOut('fast', function () { $formRound.remove(); });
            });

            return false;
        });

        $component.on('change propertychange', '.round-form:not(.round-form-dummy) .round-teams .team-list .team:not(.team-dummy) :text', function (e) {
            var $formRound = $(this).closest('.round-form');

            $.ajax({
                url: $formRound.attr('action'),
                data: $formRound.serialize(),
                method: 'PUT'
            }).then(function (response) {
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
                $.ajax({
                    url: $formRound.attr('action'),
                    data: $formRound.serialize(),
                    method: 'PUT'
                }).then(function (response) {
                    if (!response || !response.success) {
                        return false;
                    }
                });
            });

            return false;
        });

        $component.on('change propertychange', '.round-form:not(.round-form-dummy) input[name="round[name]"]', function (e) {
            var $form = $(this).closest('.round-form');

            $.ajax({
                url: $form.attr('action'),
                data: $form.serialize(),
                method: 'PUT'
            }).then(function (response) {
                if (!response || !response.success) {
                    return false;
                }
            });
        });

        $component.find('.form-add-round').on('submit', function (e) {
            e.preventDefault()

            var $form = $(this);
            $.post( $form.attr('action'), $form.serialize()).then(function (response) {
                if (!response || !response.success) {
                    return false;
                }

                var $formRound = $component.find('.round-form-dummy').clone(true).removeClass('round-form-dummy');

                $formRound.find('input[name="round[name]"]').val(response.data.name);
                $formRound.find('input[name="round[id]"]').val(response.data.id);

                $component.find('.round-list').append($formRound);

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
        $.get('/api/admin/group').then(function (response) {
            if (!response || !response.success) {
                return false;
            }

            $.each(response.data, function (i, group) {
                var $group = $component.find('.group-dummy').clone(true).removeClass('group-dummy');

                $group.find('.form-group-details :text').val(group.name);
                $group.find('.form-group-details input[type="hidden"]').val(group.id);

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

                $component.find('.group-list').append($group);
            });

            return false;
        });

        // add group
        $component.find('.form-add-group').on('submit', function (e) {
            e.preventDefault();

            var $form = $(this);

            $.post($form.attr('action'), $form.serialize()).then(function (response) {
                if (!response || !response.success) {
                    return false;
                }

                var group = response.data;
                var $group = $component.find('.group-dummy').clone(true).removeClass('group-dummy');

                $group.find('.form-group-details :text').val(group.name);
                $group.find('.form-group-details input[type="hidden"]').val(group.id);
                _buildScoreboardSortable($group);

                $component.find('.group-list').append($group);

                $form.trigger('reset');
            });

            return false;
        });

        // update group info
        $component.on('change propertychange', '.group:not(.group-dummy) .form-group-details :text', function (e) {
            var $form = $(this).closest('form');

            $.ajax({
                url: $form.attr('action'),
                data: $form.serialize() + '&' + CSRFRequest.name + '&' + CSRFRequest.value,
                method: 'PUT'
            }).then(function (response) {
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
            var group_id = $group.find('.form-group-details input[type="hidden"]').val();

            if (!window.confirm("Deseja excluir este grupo? Todos os dados deste grupo serão removidos.\n\nDeseja continuar?")) {
                return false;
            }

            $.ajax({
                type: 'DELETE' ,
                url: '/api/admin/group',
                data: 'group=' + group_id + '&' + CSRFRequest.name + '&' + CSRFRequest.value
            }).then(function (response) {
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

            $.post(
                $form.attr('action'),
                $form.serialize() + '&group=' + group_id + '&' + CSRFRequest.name + '&' + CSRFRequest.value
            ).then(function (response) {
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

            $.ajax({
                url: $form.attr('action'),
                data: $form.serialize() + '&group=' + group_id + '&' + CSRFRequest.name + '&' + CSRFRequest.value,
                method: 'PUT'
            }).then(function (response) {
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
                $.ajax({
                    type: 'DELETE' ,
                    url: '/api/admin/team',
                    data: $form.serialize() + '&group=' + group_id + '&' + CSRFRequest.name + '&' + CSRFRequest.value
                }).then(function (response) {
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

        $.get('/api/admin/gallery').then(function (response) {
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

            $.ajax({
                type: 'DELETE' ,
                url: '/api/admin/gallery/delete/' + id,
                data: CSRFRequest.name + '&' + CSRFRequest.value
            }).then(function (response) {
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

            $.post($form.attr('action'), $form.serialize()).then(function (response) {
                if (!response || !response.success) {
                    return false;
                }

                window.location = response.data.redirect;
            });

            return false;
        });
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

                var formData = $.extend({}, $.deParam(CSRFRequest.name + '&' + CSRFRequest.value), { group: data });

                $.ajax({
                    url: $form.attr('action'),
                    data: formData,
                    method: 'PUT'
                }).then(function (response) {
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
    

    $.extend({
        deParam : function(str) {
            return $.map(
                (str || str).replace(/(^\?)/,'').split("&"),
                function (n){
                    return n = n.split("="), this[n[0]] = n[1],this
                }.bind({})
            )[0];
        }

    });


})(jQuery);