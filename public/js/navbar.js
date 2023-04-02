$(document).ready(function () {
    const nav = $('nav.navbar');
    $('main').scroll(function () {
        if ($(this).scrollTop() > 0) {
            nav.addClass('add-shadow');
        } else {
            nav.removeClass('add-shadow');
        }
    });
});