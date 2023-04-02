const express = require('express');
const router = express.Router();
const Shift = require("../models/airtable");
const moment = require('moment');


router.get('/', function (req, res,) {
    title = "Home";
    res.render('index', { title });
})

router.get('/test', function (req, res,) {
    title = "Test Env";
    res.render('test', { title });
})

// Not in use
router.get('/availabilityList', function (req, res,) {
    title = "SAC Availability List";
    Shift.getRecords()
        .then((SAC) => {
            res.render('availabilityList', { title, SAC });
        })
        .catch(error => console.error(error));
})

router.get('/availability', function (req, res,) {
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
        res.render('availability', { title, month, selectedMonth })
    } else {
        Shift.getRecords()
            .then((result) => {
                for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
                    // Filter SAC on Shift 1 and Shift 2 for the respective day
                    const shiftOneAvailability = result
                        .filter((record =>
                            record.fields.DateAvailable == moment(date).format('YYYY-MM-DD') && parseInt(record.fields.ShiftType.slice(-1)) === 1
                        ));
                    const shiftTwoAvailability = result
                        .filter((record =>
                            record.fields.DateAvailable == moment(date).format('YYYY-MM-DD') && parseInt(record.fields.ShiftType.slice(-1)) === 2
                        ));

                    const dateString = moment(date).format('YYYY-MM-DD');
                    const sortedShift1 = (shiftOneAvailability.length > 0) ? shuffleArray(shiftOneAvailability).sort((a, b) => a.fields.PriorityScore - b.fields.PriorityScore) : [];
                    const sortedShift2 = (shiftTwoAvailability.length > 0) ? shuffleArray(shiftTwoAvailability).sort((a, b) => a.fields.PriorityScore - b.fields.PriorityScore) : [];
                    const shifts = { dateString, sortedShift1, sortedShift2 }
                    shiftsByDate.push(shifts);
                }

                //Format shift schedule into weeks 
                const firstDayIndex = startOfMonth.getDay();
                const lastDayIndex = endOfMonth.getDay();

                for (let i = 0; i < firstDayIndex; i++) { shiftsByDate.unshift({ dateString: '', sortedShift1: '', sortedShift2: '' }); }
                for (let i = lastDayIndex; i < 6; i++) { shiftsByDate.push({ dateString: '', sortedShift1: '', sortedShift2: '' }); }
                while (shiftsByDate.length > 0) { weeks.push(shiftsByDate.splice(0, 7)); }

                res.render('availability', { title, month, selectedMonth, startOfMonth, weeks })
            })
            .catch(error => console.error(error));
    }
});

router.get('/schedule', function (req, res) {
    const title = "SAC Schedule";
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let dateConfig = new Date(), year = dateConfig.getFullYear();

    let selectedMonth = parseInt(req.query.month);
    if (selectedMonth === 0) { year += 1 }

    let startOfMonth = new Date(year, selectedMonth, 1);
    let endOfMonth = new Date(year, selectedMonth + 1, 0);

    
    let availability = [];
    let juniorBatchNo = 0;
    let sacShiftFrequency = {};

    const schedule = [];
    const shiftsByDate = [];
    const weeklySchedule = [];

    if (isNaN(selectedMonth)) {
        res.render('schedule', { title, month, selectedMonth });
    }
    Shift.getRecords()
        .then((result) => {
            // console.log(result[0]) // JSON TEST
            result.forEach((record) => {
                availability.push(record); // Populate the availability array
                // Look for junior batch
                const batchNo = parseInt(record.fields.Batch[0].slice(6));
                if (batchNo > juniorBatchNo) {
                    juniorBatchNo = batchNo; // Takes the highest batch no.
                }
                // Populate dictionary with name for shift frequency
                // const adminNo = record.fields.AdminNo;
                const name = record.fields.Name;
                if (!(name in sacShiftFrequency)) {
                    sacShiftFrequency[name] = 0; // Defaults to 0
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
                const sortedShift1 = (shiftOneAvailability.length > 0) ? shuffleArray(shiftOneAvailability).sort((a, b) => a.fields.PriorityScore[0] - b.fields.PriorityScore[0]) : [];
                const sortedShift2 = (shiftTwoAvailability.length > 0) ? shuffleArray(shiftTwoAvailability).sort((a, b) => a.fields.PriorityScore[0] - b.fields.PriorityScore[0]) : [];
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
                        if (parseInt(shiftAvalability[i].fields.Batch[0].slice(6)) !== juniorBatchNo) {
                            const adminNo = shiftAvalability[i].fields.AdminNo[0];
                            const name = shiftAvalability[i].fields.Name;
                            if (!dayAllocation.includes(adminNo)) {
                                shiftRoster.push(shiftAvalability[i]);
                                shiftAvalability.splice(i, 1);
                                dayAllocation.push(adminNo);
                                sacShiftFrequency[name] += 1;
                                seniorAllocated = true;
                            }
                        }
                        continue;
                    }
                    if (shiftRoster.length == 0) {
                        shiftRoster.push({ fields: { DateAvailable: moment(date).format('YYYY-MM-DD'), Name: ['No Senior Available!'] } });
                    }
                    // Add remaining SAC to Shift
                    let i = 0;
                    while (shiftRoster.length < 3 && shiftAvalability.length > 0 && i < shiftAvalability.length) {
                        const adminNo = shiftAvalability[i].fields.AdminNo[0];
                        const name = shiftAvalability[i].fields.Name;
                        if (!dayAllocation.includes(adminNo)) {
                            shiftRoster.push(shiftAvalability[i]);
                            shiftAvalability.splice(i, 1);
                            dayAllocation.push(adminNo);
                            sacShiftFrequency[name] += 1;
                        } else {
                            i++;
                        }
                    }
                    while (shiftRoster.length < 3) {
                        shiftRoster.push({ fields: { DateAvailable: moment(date).format('YYYY-MM-DD'), Name: ['No SAC Available!'] } });
                    }

                    shiftAvalability.forEach(availability => shiftReserve.push(availability))
                }

                const seniorOnShift1 = day.sortedShift1.filter((record) => parseInt(record.fields.Batch[0].slice(6)) !== juniorBatchNo);
                const seniorOnShift2 = day.sortedShift2.filter((record) => parseInt(record.fields.Batch[0].slice(6)) !== juniorBatchNo);
                const shift1ByFrequency = day.sortedShift1.sort((a, b) => sacShiftFrequency[a.fields.Name[0]] - sacShiftFrequency[b.fields.Name[0]])
                const shift2ByFrequency = day.sortedShift2.sort((a, b) => sacShiftFrequency[a.fields.Name[0]] - sacShiftFrequency[b.fields.Name[0]])

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

            const sortedSacShiftFrequency = Object.fromEntries(
                Object.entries(sacShiftFrequency).sort(([, a], [, b]) => a - b)
            );

            res.render('schedule', { title, month, selectedMonth, startOfMonth, weeklySchedule, sortedSacShiftFrequency })
        })
        .catch(error => console.error(error));
});

router.get('/submitAvailability', function (req, res) {
    const title = "Submit Availability";
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let dateConfig = new Date(), year = dateConfig.getFullYear();

    let selectedMonth = parseInt(req.query.month);
    if (selectedMonth === 0) { year += 1 }

    let startOfMonth = new Date(year, selectedMonth, 1);
    let endOfMonth = new Date(year, selectedMonth + 1, 0);

    const SAC = [];
    const days = [];
    const weeks = [];

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
                        Id: student.id,
                        FullName: student.fields.FullName,
                        Batch: student.fields.Batch,
                        SAC: `${student.fields.Batch} | ${student.fields.FullName}`
                    }
                    SAC.push(format);
                });

                res.render('submitAvailability', { title, month, selectedMonth, startOfMonth, weeks, SAC, error, success });
            })
            .catch(error => console.log(error));
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

            const fields = { SAC: [dataId], DateAvailable: date, ShiftType: type }
            Shift.addAvalilability(fields);
        });

        req.flash('success', `Availabilities submitted for ${name}`);
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