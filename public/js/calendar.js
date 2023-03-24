document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        contentHeight: 700,
        initialView: 'dayGridMonth',
        selectable: true,
        select: function(info) {
            // console.log('selected ' + info.startStr + ' to ' + info.endStr);
          }
    });
    calendar.render();
});