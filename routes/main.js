const express = require('express');
const router = express.Router();
const Shift = require("../models/airtable");
const moment = require('moment');


router.get('/', function (req, res,) {
    title = "Home";
    res.render('index', { title });
})

router.get('/form', function (req, res,) {
    title = "Avalability Form";
    res.render('form', { title });
})

router.get('/availabilities/listView', function (req, res,) {
    title = "SAC Availabilities";
    Shift.getRecords()
        .then((SAC) => {
            res.render('availabilities/listView', { title, SAC });
        });
})

router.get('/availabilities/calendarView', function (req, res,) {
    const title = "SAC Availabilities";
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let selectedMonth = parseInt(req.query.month);
    const d = new Date(), y = d.getFullYear();
    let startOfMonth = new Date(y, selectedMonth, 1);
    let endOfMonth = new Date(y, selectedMonth + 1, 0);
    let availabilities = [];
    const shiftsByDate = [];
    const weeks = [];

    if (isNaN(selectedMonth)) {
        res.render('availabilities/calendarView', { title, month, selectedMonth })
    } else {
        Shift.getRecords()
            .then((SAC) => {
                console.log(SAC[0]) // JSON Reference
                console.log("Selected Month", selectedMonth)
                console.log("Start of Month", startOfMonth)
                console.log("End of Month", endOfMonth)
                for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
                    console.log("Date in loop", date)
                    // if (date.getDay() == 0 || date.getDay() == 6) { continue; }

                    // Filter SAC on Shift 1 and Shift 2 for the respective day
                    let shift1 = SAC
                        .filter((sac =>
                            sac.fields.Available == moment(date).format('YYYY-MM-DD') && parseInt(sac.fields['Shift Type'].slice(-1)) === 1
                        ));
                    let shift2 = SAC
                        .filter((sac =>
                            sac.fields.Available == moment(date).format('YYYY-MM-DD') && parseInt(sac.fields['Shift Type'].slice(-1)) === 2
                        ));

                    console.log(shift1)
                    console.log(shift2)

                    let day = moment(date).format('D MMM');
                    let s1 = (shift1.length > 0) ? shuffleArray(shift1) : '';
                    let s2 = (shift2.length > 0) ? shuffleArray(shift2) : '';
                    let shifts = { day, s1, s2 }
                    days.push(shifts);
                }
                console.log(days)

                //Format shift schedule into weeks 
                const firstDayIndex = startOfMonth.getDay();
                const lastDayIndex = endOfMonth.getDay();

                for (let i = 0; i < firstDayIndex; i++) { days.unshift({ day: '', shift1: '', shift2: '' }); }
                for (let i = lastDayIndex; i < 6; i++) { days.push({ day: '', shift1: '', shift2: '' }); }
                while (days.length > 0) { weeks.push(days.splice(0, 7)); }

                res.render('availabilities/calendarView', { title, month, selectedMonth, weeks })
            });
    }
});

router.get('/schedule', function (req, res) {
    const title = "SAC Schedule";
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dateConfig = new Date(), year = dateConfig.getFullYear();

    let selectedMonth = parseInt(req.query.month);
    let startOfMonth = new Date(year, selectedMonth, 1);
    let endOfMonth = new Date(year, selectedMonth + 1, 0);

    let availability = [];
    let juniorBatchNo = 0;
    let sacShiftFrequency = {};
    
    const schedule = [];
    const shiftsByDate = [];
    const weeklySchedule = [];
    const weeklyRemainder = [];

    if (isNaN(selectedMonth)) {
        res.render('schedule', { title, month, selectedMonth });
    }

    Shift.getRecords()
        .then((result) => {
            result.forEach((record) => {
                availability.push(record); // Populate the availability array
                // Look for junior batch
                const batchNo = parseInt(record.fields.Batch[0].slice(6));
                if (batchNo > juniorBatchNo) {
                    juniorBatchNo = batchNo; // Takes the highest batch no.
                }
                // Populate dictionary with adminNo for shift frequency
                const adminNo = record.fields.AdminNo[0];
                if (!(adminNo in sacShiftFrequency)) {
                    sacShiftFrequency[adminNo] = 0; // Defaults to 0
                }
            })

            for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
                // Filter SAC on Shift 1 and Shift 2 for the respective day
                const shiftOneAvailability = availability
                    .filter((record =>
                        record.fields.DateAvailable == moment(date).format('YYYY-MM-DD') && parseInt(record.fields.ShiftType.slice(-1)) === 1
                    ));
                    const shiftTwoAvailability = availability
                    .filter((record =>
                        record.fields.DateAvailable == moment(date).format('YYYY-MM-DD') && parseInt(record.fields.ShiftType.slice(-1)) === 2
                    ));

                const dateString = moment(date).format('YYYY-MM-DD');
                const sortedShift1 = (shiftOneAvailability.length > 0) ? shuffleArray(shiftOneAvailability).sort((a, b) => a.fields.PriorityScore - b.fields.PriorityScore) : [];
                const sortedShift2 = (shiftTwoAvailability.length > 0) ? shuffleArray(shiftTwoAvailability).sort((a, b) => a.fields.PriorityScore - b.fields.PriorityScore) : [];
                const shifts = { dateString, sortedShift1, sortedShift2 }
                shiftsByDate.push(shifts);
            }

            // Shift allocation
            shiftsByDate.forEach((day) => {
                const dayAllocation = []; // Stores AdminNo to prevent SACs getting assigned 2 shifts in a day 
                const date = day.dateString;
                const shift1 = [];
                const shift2 = [];
                const dutyRoster = { date, shift1, shift2 }

                // Main Allocation Algorithm
                function allocateShift(shiftAvalability, shiftRoster) {
                    let seniorAllocated = false;
                    //Assign at least one senior to shift
                    for (let i = 0; i < shiftAvalability.length; i++) {
                        // console.log(shiftSource[i].fields['Full Name'], shiftSource[i].fields.PriorityScore); // LOG TEST
                        if (seniorAllocated) { break; }
                        if (parseInt(shiftAvalability[i].fields.Batch[0].slice(6)) !== juniorBatchNo) {
                            const adminNo = shiftAvalability[i].fields.AdminNo[0];
                            // const name = shiftAvalability[i].fields.FullName[0];
                            if (!dayAllocation.includes(adminNo)) {
                                shiftRoster.push(shiftAvalability[i]);
                                shiftAvalability.splice(i, 1);
                                dayAllocation.push(adminNo);
                                sacShiftFrequency[adminNo] += 1;
                                seniorAllocated = true;
                            }
                        }
                        continue;
                    }
                    if (shiftRoster.length == 0) {
                        shiftRoster.push({ fields: { DateAvailable: moment(date).format('YYYY-MM-DD'), FullName: ['No Senior Available!'] } });
                    }
                    // Add remaining SAC to Shift
                    let i = 0;
                    while (shiftRoster.length < 3 && shiftAvalability.length > 0 && i < shiftAvalability.length) {
                        const adminNo = shiftAvalability[i].fields.AdminNo[0];
                        const name = shiftAvalability[i].fields.FullName[0];
                        if (!dayAllocation.includes(adminNo)) {
                            shiftRoster.push(shiftAvalability[i]);
                            shiftAvalability.splice(i, 1);
                            dayAllocation.push(adminNo);
                            sacShiftFrequency[adminNo] += 1;
                        } else {
                            i++;
                        }
                    }
                    while (shiftRoster.length < 3) {
                        shiftRoster.push({ fields: { DateAvailable: moment(date).format('YYYY-MM-DD'), FullName: ['No SAC Available!'] } });
                    }
                }

                const seniorOnShift1 = day.sortedShift1.filter((record) => parseInt(record.fields.Batch[0].slice(6)) !== juniorBatchNo);
                const seniorOnShift2 = day.sortedShift2.filter((record) => parseInt(record.fields.Batch[0].slice(6)) !== juniorBatchNo);
                const shift1ByFrequency = day.sortedShift1.sort((a, b) => sacShiftFrequency[a.fields.AdminNo[0]] - sacShiftFrequency[b.fields.AdminNo[0]])
                const shift2ByFrequency = day.sortedShift2.sort((a, b) => sacShiftFrequency[a.fields.AdminNo[0]] - sacShiftFrequency[b.fields.AdminNo[0]])

                // Allocate shifts with the least senior first 
                if (seniorOnShift1.length < seniorOnShift2.length) {
                    allocateShift(shift1ByFrequency, shift1);
                    allocateShift(shift2ByFrequency, shift2);
                } else {
                    allocateShift(shift2ByFrequency, shift2);
                    allocateShift(shift1ByFrequency, shift1);
                }

                schedule.push(dutyRoster);
            });

            const firstDayIndex = startOfMonth.getDay();
            const lastDayIndex = endOfMonth.getDay();

            //Format shift schedule into weeks 
            for (let i = 0; i < firstDayIndex; i++) { schedule.unshift({ date: '', shift1: '', shift2: '' }); }
            for (let i = lastDayIndex; i < 6; i++) { schedule.push({ date: '', shift1: '', shift2: '' }); }
            while (schedule.length > 0) { weeklySchedule.push(schedule.splice(0, 7)); }

            //Format remainingshift availabilities into weeks
            for (let i = 0; i < firstDayIndex; i++) { shiftsByDate.unshift({ date: '', shift1: '', shift2: '' }); }
            for (let i = lastDayIndex; i < 6; i++) { shiftsByDate.push({ date: '', shift1: '', shift2: '' }); }
            while (shiftsByDate.length > 0) { weeklyRemainder.push(shiftsByDate.splice(0, 7)); }

            res.render('schedule', { title, month, selectedMonth, weeklySchedule, weeklyRemainder })
        });
});

router.get('/submitAvailability', function (req, res) {
    const title = "Submit Availability";
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let selectedMonth = parseInt(req.query.month);
    const d = new Date(), y = d.getFullYear();
    let startOfMonth = new Date(y, selectedMonth, 1);
    let endOfMonth = new Date(y, selectedMonth + 1, 0);
    const days = [];
    const weeks = [];
    let SAC = [];
    const error = req.flash('error');
    const success = req.flash('success');

    if (isNaN(selectedMonth)) {
        res.render('submitAvailability', { title, month, selectedMonth });
    } else {
        for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
            days.push(new Date(date));
        }

        const firstDayIndex = startOfMonth.getDay();
        const lastDayIndex = endOfMonth.getDay();

        // Format dates into weeks
        for (let i = 0; i < firstDayIndex; i++) { days.unshift(''); }
        for (let i = lastDayIndex; i < 6; i++) { days.push(''); }
        while (days.length > 0) { weeks.push(days.splice(0, 7)); }

        Shift.getSAC()
            .then((record) => {
                record.forEach((student) => {
                    const format = {
                        id: student.id,
                        Name: student.fields.Name,
                        adminNo: student.fields.AdminNo,
                        Batch: student.fields.Batch
                    }
                    SAC.push(format);
                });

                res.render('submitAvailability', { title, month, selectedMonth, weeks, SAC, error, success });
            });


    }
});

router.post('/submitAvailability/add', function (req, res) {
    let shift = req.body.shifts;
    const dataId = req.body.SAC;
    const name = req.body.selectedSAC;

    console.log(dataId);
    console.log(name);

    if (dataId == undefined) {
        req.flash('error', 'Please select a SAC before submission!');
        res.redirect('back');
    } else if (shift == undefined) {
        req.flash('error', 'Please select a shift before submission!');
        res.redirect('back');
    } else {
        // Convert checkboxes selection to an arry if its not one
        if (!Array.isArray(shift)) { shift = [shift]; }
        shift.forEach((availability) => {
            const shiftType = availability.slice(0, 2);
            const date = availability.slice(3);
            let type = null;
   
            if (shiftType == 'S1') {
                type = 'Term Shift 1';
            } else if (shiftType == 'S2') {
                type = 'Term Shift 2';
            } else {
                type = null;
            }

            const fields = { SAC: [dataId], Available: date, 'Shift Type': type }
            Shift.addAvalilability(fields);
        });

        req.flash('success', `Availabilities submitted for ${name}`);
        res.redirect('back');
    }

});

// router.post('/schedule', function (req, res) {
//     var selectedMonth = encodeURIComponent(req.body.month);
//     res.redirect('/schedule?month=' + selectedMonth);
// })

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// function countShiftFrequency(array1, array2) {
//     const combinedArray = array1.concat(array2);
//     const elementFrequency = combinedArray.reduce((count, element) => {
//         count[element] = (count[element] || 0) + 1;
//         return count;
//     }, {});
//     const sortedFrequency = {};
//     Object.keys(elementFrequency)
//         .sort((a, b) => elementFrequency[a] - elementFrequency[b])
//         .forEach((key) => {
//             sortedFrequency[key] = elementFrequency[key];
//         });
//     return sortedFrequency;
// }

module.exports = router;