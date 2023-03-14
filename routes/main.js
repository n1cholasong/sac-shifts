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
                let day = moment(date).format('D MMM');

                let s1 = (shift1.length > 0) ? shuffleArray(shift1) : '';
                let s2 = (shift2.length > 0) ? shuffleArray(shift2) : '';
                let shifts = { day, s1, s2 }
                days.push(shifts);

                // console.log(schedule);

                // Shift allocation
                let seniorShift1 = false;
                let seniorShift2 = false;
                let rosterShift1 = [];
                let rosterShift2 = [];

                if (shift1.length > 0) {
                    for (const student of s1) {
                        if (parseInt(student.fields.Batch[0].slice(6)) !== juniorBatch && !seniorShift1) {
                            rosterShift1.push(student);
                            s1.pop(student)
                            seniorShift1 = true;
                        }
                    }
                }

                if (shift2.length > 0) {
                    for (const student of s2) {
                        if (parseInt(student.fields.Batch[0].slice(6)) !== juniorBatch && !seniorShift2) {
                            rosterShift2.push(student);
                            s2.pop(student)
                            seniorShift2 = true;
                        }
                    }
                }

                // console.log(rosterShift1)
                // console.log(rosterShift2)
                console.log("SHIFT 1")
                rosterShift1.forEach((sac) => {
                    console.log(sac.fields['Full Name'], sac.fields['Shift Type'])
                })
                console.log("SHIFT 2")
                rosterShift2.forEach((sac) => {
                    console.log(sac.fields['Full Name'], sac.fields['Shift Type'])
                })
            }

            // Separate list into weeks 
            const firstDayIndex = startOfMonth.getDay();
            const lastDayIndex = endOfMonth.getDay();

            for (let i = 0; i < firstDayIndex; i++) { days.unshift({ day: '', shift1: '', shift2: '' }); }
            for (let i = lastDayIndex; i < 6; i++) { days.push({ day: '', shift1: '', shift2: '' }); }
            while (days.length > 0) { weeks.push(days.splice(0, 7)); }

            // console.log(weeks);
            res.render('schedule', { title, month, selectedMonth, startOfMonth, endOfMonth, weeks })
        });
})

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