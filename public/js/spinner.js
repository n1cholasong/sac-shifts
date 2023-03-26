const submitButton = $('#submitBtn');
const spinner = $('#spinner');
const dropdown = $('[data-target="availability-dropdown"]');

const background = $('#background');

$(document).ready(function () {
    $('#SAC').change(function () {
        let selectedSAC = $(this).find('option:selected').text(); // Get the selected option value
        $('#selected-sac-input').val(selectedSAC); // Set the hidden input value
        console.log(selectedSAC);
    });

    $('#availabilityForm').submit(function (event) {
        // Disable the submit button
        submitButton.prop('disabled', true);
        // Display the loading spinner
        spinner.show();
        background.show();
    });

    dropdown.on('click', function () {
        spinner.show();
        background.show();
        $.get('/submitAvailability', function (data) {
            //Handle response data here
            console.log(data);
        })

    });

    background.hide();
    setTimeout(function () {
        background.hide();
    }, 10000);
});


