var Airtable = require('airtable');
require('dotenv').config();
var base = new Airtable({ apiKey: process.env.PERSONAL_ACCESS_TOKEN }).base(process.env.BASE_ID);
const adminPlanner = base('Admin Planner');
const sacList = base('SAC');

const student = require("../models/sac");

const formatAvailability = (record) => {
    return {
        id: record.fields.SAC[0],
        fullname: record.fields.FullName[0],
        name: record.fields.Name[0],
        adminNo: record.fields.AdminNo[0],
        batchNo: Number(record.fields.Batch[0].slice(6)),
        dateAvailable: record.fields.DateAvailable,
        shiftType: record.fields.ShiftType,
        priorityScore: record.fields.PriorityScore[0]
    }
};

const formatSAC = (record) => {
    return {
        id: record.id,
        fullname: record.fields.FullName,
        name: record.fields.Name,
        adminNo: record.fields.AdminNo,
        batch: record.fields.Batch,
    }
}

const getRecords = async () => {
    try {
        const records = await adminPlanner.select({
            view: "Main View (DO NOT DELETE)",
            sort: [{ field: "DateAvailable", direction: "asc" }]
        }).all()
        // .then((records) => {
        //     records.forEach((record) => {
        //         availability.push(record._rawJson)
        //     });
        // })
        return records.map(record => formatAvailability(record))
    }
    catch (err) {
        console.error(err);
        return [];
    }
};


const getStudentObject = async () => {
    var availability = [];
    try {
        await sacList
            .select({
                view: "SAC (DO NOT DELETE)",
                sort: [{ field: "Batch", direction: "asc" }]
            }).all()
            .then((records) => {
                // console.log(records[0])
                records.forEach((record) => {
                    const fullname = record._rawJson.fields.FullName;
                    const name = record._rawJson.fields.Name;
                    const adminNo = record._rawJson.fields.AdminNo;
                    const batchNo = record._rawJson.fields.Batch.slice(6);
                    const studentObj = new student.SAC(fullname, name, adminNo, batchNo);
                    availability.push(studentObj);
                });
            })
    }
    catch (err) {
        console.error(err);
    }
    return availability;
};



const getAvailability = async () => {
    const student = await getStudentObject();
    const availability = await getRecords();

    // availability.forEach((result) => {
    //     console.log(recordFilter);
    // })

    // console.log(availability.length)

    // var index = student.findIndex((sac) => {
    //     sac.getAdminNo() == adminNo;
    // })
    // console.log(availability[0]);
}

function findSAC(adminNo) {
    const index = student.findIndex((sac) => {
        sac.getAdminNo() == adminNo;
    })

    return index;
}

const getSAC = async () => {
    try {
        const records = await sacList.select({
            view: "SAC (DO NOT DELETE)",
            sort: [{ field: "Batch", direction: "asc" }]
        }).all();
        return records.map(record => formatSAC(record._rawJson));
    } catch (err) {
        console.error(err);
        return [];
    }
}

const getRecordById = async (id) => {
    try {
        const record = await adminPlanner.find(id);
        console.log(recordFilter(record));
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
        console.log(formatAvailability(updatedRecord));
    }
    catch (err) {
        console.error(err);
    }

};

const deleteRecord = async (id) => {
    try {
        const deletedRecord = await adminPlanner.destroy(id);
        console.log(formatAvailability(deletedRecord));
    }
    catch (err) {
        console.error(err);
    }

};


module.exports = { getRecords, getRecordById, addAvalilability, getSAC, getStudentObject, getAvailability }