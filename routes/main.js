const express = require('express');
const router = express.Router();
const airtable = require("../services/airtable");
const { cacheFunction } = require("../helpers/cache");
const moment = require('moment');
const { error } = require('flash-messenger/Alert');

const cacheDurationMillisecond = 1000 * 60 * 5; // 5 mins
let cachedAvailability = cacheFunction(airtable.getRecords(), cacheDurationMillisecond);
let cachedSAC = cacheFunction(airtable.getSAC(), cacheDurationMillisecond);

router.get('/', function (req, res,) {
    title = "Home";
    res.render('index', { title });
})

router.get('/test', function (req, res,) {
    title = "Test Env";
    const name = []

    airtable.getRecords()
        .then((result) => {
            // console.log(result[0])
            // result.forEach((SAC) => {
            //     name.push({
            //         name: SAC.getName(),
            //         availability: SAC.getAvailability()
            //     });

            // })
            // airtable.getAvailability();

            res.status(200).send(result[0].name);
        })
        .catch(error => res.status(400).send({ "message": error.toString() }))
    // .catch(error => console.error(error));
    // res.render('test', { title });
})

// Not in use
router.get('/availabilityList', function (req, res,) {
    const title = "SAC Availability List";
    airtable.getRecords()
        .then((SAC) => {
            res.render('availabilityList', { title, SAC });
        })
        .catch(error => console.error(error));
})

router.get('/availability', async function (req, res,) {
    const title = "SAC Availability";
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let dateConfig = new Date(), year = dateConfig.getFullYear();

    let selectedMonth = parseInt(req.query.month);
    if (selectedMonth === 0) { year += 1 }

    let startOfMonth = new Date(year, selectedMonth, 1);
    let endOfMonth = new Date(year, selectedMonth + 1, 0);

    const shiftsByDate = [];
    const weeks = [];

    if (isNaN(selectedMonth)) {
        cachedAvailability = cacheFunction(airtable.getRecords(), cacheDurationMillisecond);
        res.render('availability', { title, month, selectedMonth });
    } else {
        const result = [];
        
        try {
            result = await cachedAvailability();
        } catch (err) {
            console.error(err);
            res.render('error', { title, err });
        }

        for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
            // Filter SAC on Shift 1 and Shift 2 for the respective day
            const shiftOneAvailability = result
                .filter((record =>
                    record.dateAvailable == moment(date).format('YYYY-MM-DD') && parseInt(record.shiftType.slice(-1)) === 1
                ));
            const shiftTwoAvailability = result
                .filter((record =>
                    record.dateAvailable == moment(date).format('YYYY-MM-DD') && parseInt(record.shiftType.slice(-1)) === 2
                ));

            const dateString = moment(date).format('YYYY-MM-DD');
            const sortedShift1 = (shiftOneAvailability.length > 0) ? shuffleArray(shiftOneAvailability).sort((a, b) => a.priorityScore - b.priorityScore) : [];
            const sortedShift2 = (shiftTwoAvailability.length > 0) ? shuffleArray(shiftTwoAvailability).sort((a, b) => a.priorityScore - b.priorityScore) : [];
            const shifts = { dateString, sortedShift1, sortedShift2 }
            shiftsByDate.push(shifts);
        }

        //Format shift schedule into weeks 
        const firstDayIndex = startOfMonth.getDay();
        const lastDayIndex = endOfMonth.getDay();

        for (let i = 0; i < firstDayIndex; i++) { shiftsByDate.unshift({ dateString: '', sortedShift1: '', sortedShift2: '' }); }
        for (let i = lastDayIndex; i < 6; i++) { shiftsByDate.push({ dateString: '', sortedShift1: '', sortedShift2: '' }); }
        while (shiftsByDate.length > 0) { weeks.push(shiftsByDate.splice(0, 7)); }

        const noOfAvailability = shiftsByDate.reduce((acc, shifts) => acc + shifts.sortedShift1.length + shifts.sortedShift2.length, 0);
        console.log(`Indexed ${noOfAvailability} Availabilites.`);

        res.render('availability', { title, month, selectedMonth, startOfMonth, weeks });
    }
});

router.get('/schedule', async function (req, res) {
    const title = "SAC Schedule";
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let dateConfig = new Date(), year = dateConfig.getFullYear();

    let selectedMonth = parseInt(req.query.month);
    if (selectedMonth === 0) { year += 1 }

    let startOfMonth = new Date(year, selectedMonth, 1);
    let endOfMonth = new Date(year, selectedMonth + 1, 0);

    let availability = [];

    let weekdays = 0;
    let shiftsAssigned = 0;

    const schedule = [];
    const shiftsByDate = [];
    const weeklySchedule = [];


    if (isNaN(selectedMonth)) {
        cachedAvailability = cacheFunction(airtable.getRecords(), cacheDurationMillisecond);
        res.render('schedule', { title, month, selectedMonth });
    } else {
        try {
            availability = await cachedAvailability();
        }
        catch (err) {
            console.log("Shift allocation failed.");
            console.error(err);
            res.render('error', { title, err });
        }
        // console.log(availability[0]) // JSON TEST

        //Look for junior batch
        const juniorBatchNo = Math.max(...availability.map(record => record.batchNo));
        // Populate dictionary with name for shift frequency
        const shiftStats = availability.reduce((acc, record) => { acc[record.name] = 0; return acc; }, {})

        for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
            if (date.getDay() !== 0 && date.getDay() !== 6) { weekdays++; }

            // Filter SAC on Shift 1 and Shift 2 for the respective day
            const shiftOneAvailability = availability
                .filter((record =>
                    record.dateAvailable == moment(date).format('YYYY-MM-DD') && parseInt(record.shiftType.slice(-1)) === 1
                ));
            const shiftTwoAvailability = availability
                .filter((record =>
                    record.dateAvailable == moment(date).format('YYYY-MM-DD') && parseInt(record.shiftType.slice(-1)) === 2
                ));

            const dateString = moment(date).format('YYYY-MM-DD');
            const sortedShift1 = (shiftOneAvailability.length > 0) ? shuffleArray(shiftOneAvailability).sort((a, b) => a.priorityScore - b.priorityScore) : [];
            const sortedShift2 = (shiftTwoAvailability.length > 0) ? shuffleArray(shiftTwoAvailability).sort((a, b) => a.priorityScore - b.priorityScore) : [];
            const shifts = { dateString, sortedShift1, sortedShift2 }
            shiftsByDate.push(shifts);

            // sortedShift1.forEach(score => { console.log(score.fields.PriorityScore[0]) }) // LOG TEST
        }

        // Shift allocation
        shiftsByDate.forEach((day) => {
            const dayAllocation = []; // Stores AdminNo to prevent SACs getting assigned 2 shifts in a day 
            const date = day.dateString;
            const shift1 = [];
            const shift2 = [];
            const availableShift1 = [];
            const availableShift2 = [];
            const dutyRoster = { date, shift1, shift2, availableShift1, availableShift2 }

            // Main Allocation Algorithm
            function allocateShift(shiftAvalability, shiftRoster, shiftReserve) {
                let seniorAllocated = false;
                //Assign at least one senior to shift
                for (let i = 0; i < shiftAvalability.length; i++) {
                    if (seniorAllocated) { break; }
                    if (shiftAvalability[i].batchNo !== juniorBatchNo) {
                        const adminNo = shiftAvalability[i].adminNo;
                        const name = shiftAvalability[i].name;
                        if (!dayAllocation.includes(adminNo)) {
                            shiftRoster.push(shiftAvalability[i]);
                            shiftAvalability.splice(i, 1);
                            dayAllocation.push(adminNo);
                            shiftStats[name] += 1;
                            seniorAllocated = true;
                            shiftsAssigned++;
                        }
                    }
                    continue;
                }
                if (shiftRoster.length == 0) {
                    shiftRoster.push({ id: null, dateAvailable: moment(date).format('YYYY-MM-DD'), name: 'No Senior Available!' });
                }
                // Add remaining SAC to Shift
                let i = 0;
                while (shiftRoster.length < 3 && shiftAvalability.length > 0 && i < shiftAvalability.length) {
                    const adminNo = shiftAvalability[i].adminNo;
                    const name = shiftAvalability[i].name;
                    if (!dayAllocation.includes(adminNo)) {
                        shiftRoster.push(shiftAvalability[i]);
                        shiftAvalability.splice(i, 1);
                        dayAllocation.push(adminNo);
                        shiftStats[name] += 1;
                        shiftsAssigned++;
                    } else {
                        i++;
                    }
                }
                while (shiftRoster.length < 3) {
                    shiftRoster.push({ id: null, dateAvailable: moment(date).format('YYYY-MM-DD'), name: 'No SAC Available!' });
                }

                shiftAvalability.forEach(availability => shiftReserve.push(availability))
            }

            const seniorOnShift1 = day.sortedShift1.filter((record) => record.batchNo !== juniorBatchNo);
            const seniorOnShift2 = day.sortedShift2.filter((record) => record.batchNo !== juniorBatchNo);
            const shift1ByFrequency = day.sortedShift1.sort((a, b) => shiftStats[a.name] - shiftStats[b.name])
            const shift2ByFrequency = day.sortedShift2.sort((a, b) => shiftStats[a.name] - shiftStats[b.name])

            // Allocate shifts with the least senior first 
            if (seniorOnShift1.length < seniorOnShift2.length) {
                allocateShift(shift1ByFrequency, shift1, availableShift1);
                allocateShift(shift2ByFrequency, shift2, availableShift2);
            } else {
                allocateShift(shift2ByFrequency, shift2, availableShift2);
                allocateShift(shift1ByFrequency, shift1, availableShift1);
            }

            schedule.push(dutyRoster);
        });

        const firstDayIndex = startOfMonth.getDay();
        const lastDayIndex = endOfMonth.getDay();

        //Format shift schedule into weeks 
        for (let i = 0; i < firstDayIndex; i++) { schedule.unshift({ date: '', shift1: '', shift2: '' }); }
        for (let i = lastDayIndex; i < 6; i++) { schedule.push({ date: '', shift1: '', shift2: '' }); }
        while (schedule.length > 0) { weeklySchedule.push(schedule.splice(0, 7)); }

        const sortedShiftFrequency = Object.fromEntries(Object.entries(shiftStats).sort(([, a], [, b]) => a - b));

        console.log(`Shift allocation for (${moment(startOfMonth).format("MMM").toUpperCase()}) completed! | No. of shifts assigned: ${shiftsAssigned} | No. of shifts remaining: ${(weekdays * 6) - shiftsAssigned}`);
        res.render('schedule', { title, month, selectedMonth, startOfMonth, weeklySchedule, sortedShiftFrequency });
    }
});

router.get('/submitAvailability', async function (req, res) {
    const title = "Submit Availability";
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let dateConfig = new Date(), year = dateConfig.getFullYear();

    let selectedMonth = parseInt(req.query.month);
    if (selectedMonth === 0) { year += 1 }

    let startOfMonth = new Date(year, selectedMonth, 1);
    let endOfMonth = new Date(year, selectedMonth + 1, 0);

    const days = [];
    const weeks = [];

    const error = req.flash('error');
    const success = req.flash('success');

    if (isNaN(selectedMonth)) {
        cachedSAC = cacheFunction(airtable.getSAC(), cacheDurationMillisecond);
        res.render('submitAvailability', { title, month, selectedMonth });
    } else {
        const SAC = await cachedSAC();
        for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
            days.push(new Date(date));
        }

        const firstDayIndex = startOfMonth.getDay();
        const lastDayIndex = endOfMonth.getDay();

        // Format dates into weeks
        for (let i = 0; i < firstDayIndex; i++) { days.unshift(''); }
        for (let i = lastDayIndex; i < 6; i++) { days.push(''); }
        while (days.length > 0) { weeks.push(days.splice(0, 7)); }

        res.render('submitAvailability', { title, month, selectedMonth, startOfMonth, weeks, SAC, error, success });
    }
});

router.post('/submitAvailability/add', function (req, res) {
    let shift = req.body.shifts;
    const dataId = req.body.SAC;
    const name = req.body.selectedSAC;

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
            const shiftType = availability.slice(0, 3);
            const date = availability.slice(4);
            let type = null;

            if (shiftType == 'TS1') { type = 'Term Shift 1'; }
            if (shiftType == 'TS2') { type = 'Term Shift 2'; }
            if (shiftType == 'HS1') { type = 'Holiday Shift 1'; }
            if (shiftType == 'HS2') { type = 'Holiday Shift 2'; }

            const fields = { SAC: [dataId], DateAvailable: date, ShiftType: type }
            airtable.addAvalilability(fields);
        });

        req.flash('success', `Availabilities submitted for ${name}`);
        console.log(`Availability Submitted! (${shift.length})`);
        res.redirect('back');
    }
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

module.exports = router;