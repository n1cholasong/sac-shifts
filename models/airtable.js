var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appvLp8BIX7Rmbgaz');

const table = base('Availabilities')

const simplifiedRecord = (record) => {
    return {
        id: record[0].id,
        fields: record[0].fields,
    }
};

const getRecords = async () => {
    try {
        const records = await table
            .select({
                maxRecords: 3,
                view: "Grid view"
            })
            .firstPage();
        console.log(simplifiedRecord(records));
    }
    catch (err) {
        console.error(err);
    }

};

const getRecordById = async (id) => {
    try {
        const record = await table.find(id);
        console.log(simplifiedRecord(record));
    }
    catch (err) {
        console.error(err);
    }

};

const createRecord = async (fields) => {
    try {
        const createdRecord = await table.create(fields);
        console.log(simplifiedRecord(createdRecord));
    }
    catch (err) {
        console.error(err);
    }

};

const updateRecord = async (id, fields) => {
    try {
        const updatedRecord = await table.update(id, fields);
        console.log(simplifiedRecord(updatedRecord));
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

module.exports = { getRecords, getRecordById, createRecord, updateRecord, deleteRecord }