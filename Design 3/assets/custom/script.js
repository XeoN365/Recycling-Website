function SubForm() {
    $.ajax({
        url: 'http://82.13.135.164:82/',
        type: 'post',
        data: $('#contactForm').serialize(),
        success: function () {
            alert("worked");
        }
    });
}
var isValid = function (input) {
    if (input.checkValidity) return input.checkValidity(); // native validation
    var isValid = true,
        value = $(input).val(),
        type = $(input).attr('type');
    // regexp rules from https://github.com/running-coder/jquery-form-validation
    if (value) isValid = !('email' === type && !/^([^@]+?)@(([a-z0-9]-*)*[a-z0-9]+\.)+([a-z0-9]+)$/i.test(value));
    else if ($(input).attr('required')) isValid = false;
    $(input)[(isValid ? 'remove' : 'add') + 'Class']('form-invalid');
    return isValid;
};

$('[data-form-type="formoid"]').each(function () {
    var form,
        $this = $(this),
        $form = $this.is('form') ? $this : $this.find('form'),
        $alert = $this.find('[data-form-alert]'),
        $title = $this.is('[data-form-title]') ? $this : $this.find('[data-form-title]'),
        $submit = $this.find('[onclick="SubForm();"]'),
        alertSuccess = $alert.html();

    $submit.click(function () {
        $form.addClass('form-active')
    });
    // on change form inputs if input[type=file].files[0]size>1mb disable sumbit button and show form alert
    $form.change(function (event) {
        if (event.target.type == 'file') {
            if (event.target.files[0].size > 1000000) {
                $alert.removeAttr('hidden');
                $alert.removeClass('alert-success').addClass('alert-danger')
                $alert.html('File size must be less than 1mb')
                $submit.addClass('btn-loading').prop('disabled', true);
            } else {
                $alert.attr('hidden', 'hidden');
                $alert.addClass('alert-success').removeClass('alert-danger')
                $alert.html('')
                $submit.removeClass('btn-loading').prop('disabled', false);
            }
        }
    })
    // event on form submit
    $form.submit(function (event) {
        event.preventDefault();
        $form.addClass('form-active');
        if ($submit.hasClass('btn-loading')) return;
        var isValidForm = true,
            data = [];
        form = form || Formoid.Form({
            email: $this.find('[data-form-email]').val(),
            title: $title.attr('data-form-title') || $title.text()
        });
        $alert.html('');

        let fields = $this.find('[data-form-field]');

        let promiseChain = Promise.resolve();

        fields.each(function () {
            promiseChain = promiseChain.then(() => new Promise((res, rej) => {
                // if form not validate
                if (!isValid(this)) {
                    isValidForm = false;
                    rej(new Error('Form is not valid'));
                }
                // start parse inputs
                if ($(this).attr('type') == 'file') {
                    var $input = $(this),
                        reader = new FileReader,
                        name = $(this).attr('data-form-field') || $(this).attr('name'),
                        files = $input[0].files[0];
                    reader.onloadend = function () {
                        data.push([
                            name,
                            reader.result
                        ])
                        res();
                    }
                    reader.onerror = function () {
                        $alert.html(reader.error)
                        rej(reader.error)
                    }
                    if (files) {
                        reader.readAsDataURL(files);
                    }
                } else if ($(this).attr('type') == 'checkbox') {
                    data.push([
                        $(this).attr('data-form-field') || $(this).attr('name'),
                        this.checked ? $(this).val() : 'No'
                    ]);
                } else if ($(this).attr('type') == 'radio') {
                    if (this.checked) {
                        data.push([
                            $(this).attr('data-form-field') || $(this).attr('name'),
                            $(this).val()
                        ]);
                    }
                } else {
                    data.push([
                        $(this).attr('data-form-field') || $(this).attr('name'),
                        $(this).val()
                    ]);
                }
                res();
            }));
        });
        $submit.addClass('btn-loading').prop('disabled', true);
        promiseChain
            .then(() => {
                if (!isValidForm) {
                    $submit.removeClass('btn-loading').prop('disabled', false);
                    return;
                }
                form.send(data)
                    .always(function () {
                        $submit.removeClass('btn-loading').prop('disabled', false);
                        $alert.removeAttr('hidden');
                    })
                    .then(function (message) {
                        fields.each(function () {
                            if ($(this).prop('checked') && $(this).attr('type') == 'checkbox') $(this).removeAttr('checked')
                            else $(this).val('')
                        })
                        $form.removeClass('form-active');
                        $alert.text(alertSuccess || message);
                        $alert.removeClass('alert-danger').addClass('alert-success')
                    })
                    .fail(function (error) {
                        $alert.text(error);
                        $alert.removeClass('alert-success').addClass('alert-danger')
                    })
            }, err => {
                $alert.html(err.message)
            });
        });
    });
