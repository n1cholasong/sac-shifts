const express = require('express');
const { formatDate } = require('fullcalendar');
const router = express.Router();
const Shift = require("../models/airtable");
const moment = require('moment');
// const flashMessage = require('../helpers/messenger');


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
    const days = [];
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
    let selectedMonth = parseInt(req.query.month);
    const d = new Date(), y = d.getFullYear();
    let startOfMonth = new Date(y, selectedMonth, 1);
    let endOfMonth = new Date(y, selectedMonth + 1, 0);
    let juniorBatch = 0;
    let availabilities = [];
    const schedule = [];
    const days = [];
    const weeklySchedule = [];
    const weeklyRemainder = []

    if (isNaN(selectedMonth)) {
        res.render('schedule', { title, month, selectedMonth })
    }
    Shift.getRecords()
        .then((SAC) => {
            console.log(SAC[0]) // JSON reference

            //Check for junior batch (take the highest batch no.)
            SAC.forEach((record) => {
                availabilities.push(record);
                var batchNo = parseInt(record.fields.Batch[0].slice(6));
                if (batchNo > juniorBatch) {
                    juniorBatch = batchNo;
                }
            })
            console.log(availabilities.length);
            console.log(juniorBatch);

            for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
                // if (date.getDay() == 0 || date.getDay() == 6) { continue; }

                // Filter SAC on Shift 1 and Shift 2 for the respective day
                let shift1 =  
                    .filter((sac =>
                    sac.fields.Available == moment(date).format('YYYY-MM-DD') && parseInt(sac.fields['Shift Type'].slice(-1)) === 1
                ));
                let shift2 = availabilities
                    .filter((sac =>
                        // available = new Date(sac.fields.Available)
                        // date = new Date(2023, 1, 3)
                        sac.fields.Available == moment(date).format('YYYY-MM-DD') && parseInt(sac.fields['Shift Type'].slice(-1)) === 2
                    ));

                // console.log(`--------------------${moment(date).format('ddd DD MMM YYYY')}--------------------`)
                // console.log(`Shift 1: ${shift1.length}`);
                // console.log(`Shift 2: ${shift2.length}`);
                // console.log(shift1)
                // console.log(shift2)


                let day = moment(date).format('YYYY-MM-DD');
                let s1 = (shift1.length > 0) ? shuffleArray(shift1) : '';
                let s2 = (shift2.length > 0) ? shuffleArray(shift2) : '';
                let shifts = { day, s1, s2 }
                days.push(shifts);
            }
            // console.log("BEFORE")
            // console.log(days)

            // Shift allocation
            days.forEach((shift) => {
                const day = shift.day;
                let allocatedSAC = [];
                let shift1 = [];
                let shift2 = [];
                const roster = { day, shift1, shift2 }

                function allocateShift(shiftSource, shiftTarget) {
                    let seniorShift = false;
                    //Assign at least one senior to shift
                    for (let i = 0; i < shiftSource.length; i++) {
                        if (seniorShift) { break; }
                        if (parseInt(shiftSource[i].fields.Batch[0].slice(6)) !== juniorBatch) {
                            const adminNo = shiftSource[i].fields.AdminNo[0];
                            if (!allocatedSAC.includes(adminNo)) {
                                shiftTarget.push(shiftSource[i]);
                                shiftSource.splice(i, 1);
                                allocatedSAC.push(adminNo);
                                seniorShift = true;
                            }
                        }
                        continue;
                    }
                    if (shiftTarget.length == 0) {
                        shiftTarget.push({ fields: { Available: moment(shift.day).format('YYYY-MM-DD'), 'Full Name': ['No Senior available!'] } });
                    }
                    //Add remaining SAC to Shift
                    let i = 0;
                    while (shiftTarget.length < 3 && shiftSource.length > 0 && i < shiftSource.length) {
                        const adminNo = shiftSource[i].fields.AdminNo[0];
                        if (!allocatedSAC.includes(adminNo)) {
                            shiftTarget.push(shiftSource[i]);
                            shiftSource.splice(i, 1);
                            allocatedSAC.push(adminNo);
                        } else {
                            i++;
                        }
                    }
                    while (shiftTarget.length < 3) {
                        shiftTarget.push({ fields: { Available: moment(shift.day).format('YYYY-MM-DD'), 'Full Name': ['No SAC available!'] } });
                    }
                }

                if (shift.s1.length < shift.s2.length) {
                    allocateShift(shift.s1, shift1)
                    allocateShift(shift.s2, shift2)
                } else {
                    allocateShift(shift.s2, shift2)
                    allocateShift(shift.s1, shift1)
                }

                schedule.push(roster);
            });
            // console.log("AFTER")
            // console.log(schedule)

            schedule.forEach((roster) => {
                console.log("========== SHIFT 1 ==========")
                roster.shift1.forEach((sac) => {
                    let weekends = moment(sac.fields.Available).day();
                    if (weekends == 0 || weekends == 6) { return false; }

                    console.log(sac.fields['Full Name'], sac.fields['Shift Type'], sac.fields.Available)
                })
                console.log("========== SHIFT 2 ==========")
                roster.shift2.forEach((sac) => {
                    let weekends = moment(sac.fields.Available).day();
                    if (weekends == 0 || weekends == 6) { return false; }

                    console.log(sac.fields['Full Name'], sac.fields['Shift Type'], sac.fields.Available)
                })
            })

            const firstDayIndex = startOfMonth.getDay();
            const lastDayIndex = endOfMonth.getDay();

            //Format shift schedule into weeks 
            for (let i = 0; i < firstDayIndex; i++) { schedule.unshift({ day: '', shift1: '', shift2: '' }); }
            for (let i = lastDayIndex; i < 6; i++) { schedule.push({ day: '', shift1: '', shift2: '' }); }
            while (schedule.length > 0) { weeklySchedule.push(schedule.splice(0, 7)); }

            //Format remainingshift availabilities into weeks
            for (let i = 0; i < firstDayIndex; i++) { days.unshift({ day: '', shift1: '', shift2: '' }); }
            for (let i = lastDayIndex; i < 6; i++) { days.push({ day: '', shift1: '', shift2: '' }); }
            while (days.length > 0) { weeklyRemainder.push(days.splice(0, 7)); }

            // console.log(weeks);
            res.render('schedule', { title, month, selectedMonth, weeklySchedule, weeklyRemainder })
        });
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

function countShiftFrequency(array1, array2) {
    const combinedArray = array1.concat(array2);
    const elementFrequency = combinedArray.reduce((count, element) => {
        count[element] = (count[element] || 0) + 1;
        return count;
    }, {});
    const sortedFrequency = {};
    Object.keys(elementFrequency)
        .sort((a, b) => elementFrequency[a] - elementFrequency[b])
        .forEach((key) => {
            sortedFrequency[key] = elementFrequency[key];
        });
    return sortedFrequency;
}

module.exports = router;