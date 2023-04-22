var Airtable = require('airtable');
require('dotenv').config();
var base = new Airtable({ apiKey: process.env.PERSONAL_ACCESS_TOKEN }).base(process.env.BASE_ID);
const adminPlanner = base('Admin Planner');
const SAC = base('SAC');

const StudentObject = require("../models/sac");

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
    try {
        await adminPlanner
            .select({
                view: "Main View (DO NOT DELETE)",
                sort: [{ field: "DateAvailable", direction: "asc" }]
            }).all()
            .then((records) => {
                records.forEach((record) => {
                    availability.push(record._rawJson)
                });
            })
    }
    catch (error) {
        console.log(error, "getRecords");
    }
    return availability;
};


const getStudentObject = async () => {
    var availability = [];
    try {
        await SAC
            .select({
                view: "SAC (DO NOT DELETE)",
                sort: [{ field: "Batch", direction: "asc" }]
            }).all()
            .then((records) => {
                console.log(records[0])
                records.forEach((record) => {
                    const fullname = record._rawJson.fields.FullName;
                    const name = record._rawJson.fields.Name;
                    const adminNo = record._rawJson.fields.AdminNo;
                    const batchNo = record._rawJson.fields.Batch.slice(6);
                    const student = new StudentObject.SAC(fullname, name, adminNo, batchNo);
                    availability.push(student);
                });
            })
    }
    catch (error) {
        console.log(error, "getRecords");
    }
    return availability;
};


const getSAC = async () => {
    var students = [];
    try {
        await SAC
            .select({
                view: "SAC (DO NOT DELETE)",
                sort: [{ field: "Batch", direction: "asc" }]
            }).all()
            .then((records) => {
                records.forEach((record) => {
                    students.push(record._rawJson)
                });
            });
    } catch (error) {
        console.log(error, "getSAC");
    }
    return students;
}

const getRecordById = async (id) => {
    try {
        const record = await adminPlanner.find(id);
        console.log(simpleRecord(record));
    }
    catch (err) {
        console.error(err);
    }

};

const addAvalilability = async (fields) => {
    try {
        await adminPlanner.create(fields);
        console.log("Availability Submitted!")
    }
    catch (err) {
        console.error(err);
    }
};

const updateRecord = async (id, fields) => {
    try {
        const updatedRecord = await adminPlanner.update(id, fields);
        console.log(simpleRecord(updatedRecord));
    }
    catch (err) {
        console.error(err);
    }

};

const deleteRecord = async (id) => {
    try {
        const deletedRecord = await adminPlanner.destroy(id);
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


module.exports = { getRecords, getRecordById, addAvalilability, updateRecord, deleteRecord, simpleRecord, getSAC, getStudentObject }