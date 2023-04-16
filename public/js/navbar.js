$(document).ready(function () {
    const nav = $('nav.navbar');
    $(window).scroll(function () {
        if ($(this).scrollTop() > 0) {
            nav.addClass('add-shadow');
        } else {
            nav.removeClass('add-shadow');
        }
    });
});