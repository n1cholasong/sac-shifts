var Airtable = require('airtable');
require('dotenv').config();
var base = new Airtable({ apiKey: process.env.PERSONAL_ACCESS_TOKEN }).base('appvLp8BIX7Rmbgaz');
const table = base('Admin Planner');
const SAC = base('SAC');

const simpleRecord = (record) => {
    return {
        id: record["id"],
        fullName: record["fields"]["Full Name"][0],
        adminNo: record["fields"]["Admin No"][0],
        date: record["fields"]["Available"],
        shiftType: record["fields"]["Shift Type"]
    }
};

const getRecords = async () => {
    var availability = [];
    await table
        .select({
            view: "Grid view",
            sort: [{ field: "DateAvailable", direction: "asc" }]
        }).all()
        .then((records) => {
            records.forEach((record) => {
                availability.push(record._rawJson)
            });
        })
    return availability;
};

const getSAC = async () => {
    var students = [];
    await SAC 
    .select({
        view: "DATABASE",
        sort: [{field: "Batch", direction: "asc"}]
    }).all()
    .then((records) => {
        records.forEach((record) => {
            students.push(record._rawJson)
        });
    });
    return students;
}

const getRecordById = async (id) => {
    try {
        const record = await table.find(id);
        console.log(simpleRecord(record));
    }
    catch (err) {
        console.error(err);
    }

};

const addAvalilability = async (fields) => {
    try {
        const newRecord = await table.create(fields);
    }
    catch (err) {
        console.error(err);
    }
};

const updateRecord = async (id, fields) => {
    try {
        const updatedRecord = await table.update(id, fields);
        console.log(simpleRecord(updatedRecord));
    }
    catch (err) {
        console.error(err);
    }

};

const deleteRecord = async (id) => {
    try {
        const deletedRecord = await table.destroy(id);
        console.log(minifyRecord(deletedRecord));
    }
    catch (err) {
        console.error(err);
    }

};

// createRecord({
//     Name: "Nicholas Test",
// });

// updateRecord('');

getRecords();


module.exports = { getRecords, getRecordById, addAvalilability, updateRecord, deleteRecord, simpleRecord, getSAC }