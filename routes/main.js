const { json } = require('express');
const express = require('express');
const router = express.Router();
// const flashMessage = require('../helpers/messenger');
const Shift = require("../models/airtable");

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
            console.log(SAC[0])
            record = JSON.stringify(SAC);
            res.render('available', { title, SAC });
        });
})

module.exports = router;