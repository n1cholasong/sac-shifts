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
    junior = 0;
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
    let endOfMonth = new Date(y, selectedMonth + 1, 0);
    let junior = 0;
    let availabilities = [];
    Shift.getRecords()
        .then((SAC) => {
            SAC.forEach((record) => {
                availabilities.push(record);
                var batchNo = parseInt(record.fields.Batch[0].slice(6));
                if (batchNo > junior) {
                    junior = batchNo;
                }
            })
            console.log(availabilities.length);
            console.log("Junior Batch:", junior);
            // scheduleDate = new Date(2023, 0, 1)
            // console.log(scheduleDate)
            
            
            let student = availabilities
                .filter(((sac) => {
                    available = new Date(sac.fields.Available)
                    date = new Date(2023, 1, 4)
                    return sac.fields.Available == moment(date).format('YYYY-MM-DD')
                }));
            console.log(student.length);
            // console.log(student);
        });


    // console.log(start.getDay());
    // console.log(end.getDay());
    // console.log(availabilities);
    const shift1 = [];
    const shift2 = [];
    for (var date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {

    }

    console.log()
    // console.log(moment(endOfMonth).format('l'));
    // for (var start; start <= end; start.addDay()) {
    //     console.log(start);
    // }
    res.render('schedule', { title, month, selectedMonth, startOfMonth, endOfMonth })
})

// router.post('/schedule', function (req, res) {
//     var selectedMonth = encodeURIComponent(req.body.month);
//     res.redirect('/schedule?month=' + selectedMonth);
// })

module.exports = router;