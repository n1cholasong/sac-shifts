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

router.get('/availabilities', function (req, res,) {
    title = "SAC Availabilities";
    Shift.getRecords()
        .then((SAC) => {
            res.render('available', { title, SAC });
        });
})

router.get('/schedule', function (req, res) {
    const title = "SAC Schedule";
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let selectedMonth = parseInt(req.query.month);
    const d = new Date(), y = d.getFullYear();
    let startOfMonth = new Date(y, selectedMonth, 1);
    let endOfMonth = new Date(y, selectedMonth, 3);
    let juniorBatch = 0;
    let availabilities = [];
    const schedule = [];
    const days = [];
    const weeks = [];


    let rosterShift1 = [];
    let rosterShift2 = [];

    Shift.getRecords()
        .then((SAC) => {
            console.log(SAC[0]) // JSON reference

            SAC.forEach((record) => {
                availabilities.push(record);
                var batchNo = parseInt(record.fields.Batch[0].slice(6));
                if (batchNo > juniorBatch) {
                    juniorBatch = batchNo;
                }
            })
            console.log(availabilities.length);

            for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
                // if (date.getDay() == 0 || date.getDay() == 6) { continue; }

                // Filter SAC on Shift 1 and Shift 2 for the respective day
                let shift1 = availabilities
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
            console.log("BEFORE")
            console.log(days)

            // Shift allocation
            days.forEach((shift) => {
                let seniorShift1 = false;
                let seniorShift2 = false;
                let day = shift.day;
                let shift1 = [];
                let shift2 = [];
                let roster = { day, shift1, shift2 }

                //Assign at least one senior SAC to Shift1
                for (const student of shift.s1) {
                    if (seniorShift1) { break; }
                    if (parseInt(student.fields.Batch[0].slice(6)) !== juniorBatch) {
                        shift1.push(student);
                        shift.s1.shift()
                        seniorShift1 = true;
                    } else {
                        continue;
                    }
                }
                if (shift1.length == 0) {
                    shift1.push({ fields: { Available: moment(shift.day).format('YYYY-MM-DD'), 'Full Name': ['No Senior available!'] } });
                }
                //Add remaining SAC to Shift1
                for (let i = 0; i < 2; i++) {
                    if (shift1.length !== 3 && shift.s1[i] !== undefined) {
                        shift1.push(shift.s1[i]);
                        // shift.s1.shift();
                    } else {
                        shift1.push({ fields: { Available: moment(shift.day).format('YYYY-MM-DD'), 'Full Name': ['No SAC available!'] } });
                    }
                }

                //Assign at least one senior SAC to Shift2   
                for (const student of shift.s2) {
                    if (seniorShift2) { break; }
                    if (parseInt(student.fields.Batch[0].slice(6)) !== juniorBatch) {
                        shift2.push(student);
                        shift.s2.shift();
                        seniorShift2 = true;
                    } else {
                        continue;
                    }
                }
                if (shift2.length == 0) {
                    shift2.push({ fields: { Available: moment(shift.day).format('YYYY-MM-DD'), 'Full Name': ['No Senior available!'] } });
                }
                //Add remaining SAC to Shift2 
                for (let i = 0; i < 2; i++) {
                    if (shift2.length !== 3 && shift.s2[i] !== undefined) {
                        shift2.push(shift.s2[i]);
                        // shift.s2.shift();
                    } else {
                        shift2.push({ fields: { Available: moment(shift.day).format('YYYY-MM-DD'), 'Full Name': ['No SAC available!'] } });
                    }
                }

                schedule.push(roster);
            });
            console.log("AFTER")
            console.log(days)

            // console.log(schedule);
            console.log("Secnior list")
            schedule.forEach((roster) => {
                console.log("========== SHIFT 1 ==========")
                roster.shift1.forEach((sac) => {
                    console.log(sac.fields['Full Name'], sac.fields['Shift Type'], sac.fields.Available)
                })
                console.log("========== SHIFT 2 ==========")
                roster.shift2.forEach((sac) => {
                    console.log(sac.fields['Full Name'], sac.fields['Shift Type'], sac.fields.Available)
                })
            })

            const firstDayIndex = startOfMonth.getDay();
            const lastDayIndex = endOfMonth.getDay();

            for (let i = 0; i < firstDayIndex; i++) { days.unshift({ day: '', shift1: '', shift2: '' }); }
            for (let i = lastDayIndex; i < 6; i++) { days.push({ day: '', shift1: '', shift2: '' }); }
            while (days.length > 0) { weeks.push(days.splice(0, 7)); }

            // console.log(weeks);
            res.render('schedule', { title, month, selectedMonth, startOfMonth, endOfMonth, weeks })

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

module.exports = router;