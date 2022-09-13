const express = require('express');
const router = express.Router();
// const flashMessage = require('../helpers/messenger');

// const Shift = require("../models/airtable");

router.get('/', function (req, res,) {
    title = "Home";
    res.render('index', { title });
})

router.get('/form', function (req, res,) {
    title = "Avalability Form";
    res.render('form', { title });
})


module.exports = router;