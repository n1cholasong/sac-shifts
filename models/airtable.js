var Airtable = require('airtable');
require('dotenv').config();
var base = new Airtable({ apiKey: process.env.PERSONAL_ACCESS_TOKEN }).base('appvLp8BIX7Rmbgaz');
const table = base('Admin Planner')



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
    var counter = 0
    var avalabilities = [];
    avalabilities.length = 0;
    await table
        .select({
            view: "Grid view",
            sort: [{ field: "Available", direction: "asc" }]
        }).all()
        .then((records) => {
            records.forEach((record) => {
                // console.log(simpleRecord(record));
                avalabilities.push(record._rawJson)
                counter++
            });
        })
        // console.log(avalabilities);
    return avalabilities
};

const getRecordById = async (id) => {
    try {
        const record = await table.find(id);
        console.log(simpleRecord(record));
    }
    catch (err) {
        console.error(err);
    }

};

const createRecord = async (fields) => {
    try {
        const createdRecord = await table.create(fields);
        console.log(simpleRecord(createdRecord));
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


module.exports = { getRecords, getRecordById, createRecord, updateRecord, deleteRecord, simpleRecord }