class SAC {
    constructor(fullname, name, adminNo, batchNo) {
        this.fullname = fullname;
        this.name = name;
        this.adminNo = adminNo;
        this.batchNo = batchNo;
        this.availability = { shift1: new Array(), shift2: new Array() }
        this.shiftsAvailable = 0;
        this.daysAvailable = 0;
    }

    getFullName() {
        return this.fullname
    }

    setFullName(fullname) {
        this.fullname = fullname;
    }

    getName() {
        return this.name;
    }

    setName(name) {
        this.name = name;
    }

    getAdminNo() {
        return this.adminNo;
    }

    setAdminNo(adminNo) {
        this.adminNo = adminNo;
    }

    getBatchNo() {
        return this.batchNo;
    }

    setBatchNo(batchNo) {
        this.batchNo = batchNo;
    }

    getAvailability() {
        return this.availability;
    }

    addAvailability(availability, shiftNo) {
        if (!availability || !shiftNo) {
            throw new Error(`Invalid arguments. Expected usage: addAvailability(availability: string, shiftNo: number)`);
        }
        if (typeof availability !== "string") {
            throw new TypeError(`Expected availability to be a string, but got ${typeof availability} instead`);
        }
        if (typeof shiftNo !== "number") {
            throw new TypeError(`Expected shiftNo to be a number, but got ${typeof shiftNo} instead`);
        }

        const shift = shiftNo === 1 ? this.availability.shift1 : shiftNo === 2 ? this.availability.shift2 : null;
        if (!shift) {
            throw new Error(`Invalid shift number ${shiftNo}. Only 1 and 2 are valid options.`);
        }

        shift.push(availability);
    }

    removeAvailability(availability, shiftNo) {
        if (!availability || !shiftNo) {
            throw new Error(`Invalid arguments. Expected usage: removeAvailability(availability: string, shiftNo: number)`);
        }
        if (typeof availability !== "string") {
            throw new TypeError(`Expected availability to be a string, but got ${typeof availability} instead`);
        }
        if (typeof shiftNo !== "number") {
            throw new TypeError(`Expected shiftNo to be a number, but got ${typeof shiftNo} instead`);
        }

        const shift = shiftNo === 1 ? this.availability.shift1 : shiftNo === 2 ? this.availability.shift2 : null;
        if (!shift) {
            throw new Error(`Invalid shift number ${shiftNo}. Only 1 and 2 are valid options.`);
        }

        const index = shift.indexOf(availability);
        if (index === -1) {
            throw new Error(`Availability ${availability} does not exist in shift ${shiftNo}`);
        }

        shift.splice(index, 1);
    }

    getPriorityScore() {
        return this.shiftsAvailable * this.daysAvailable;
    }

    setPriorityScore(shiftsAvailable, daysAvailable) {
        this.shiftsAvailable = shiftsAvailable
        this.daysAvailable = daysAvailable;
    }
}

module.exports = { SAC }