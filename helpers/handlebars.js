const moment = require('moment');

const formatDate = function (date, targetFormat) {
    return moment(date).format(targetFormat);
}

const ifEquals = function (params1, params2, options) {
    if (params1 == params2) {
        return options.fn(this);
    }
    return options.inverse(this);
}

const ifMore = function (params1, params2, options) {
    if (params1 > params2) {
        return options.fn(this);
    }
    return options.inverse(this);
}

const isSAC = function (name) {
    if (name == "No Senior Available!") {
        return "text-danger fw-bold";
    } else if (name == "No SAC Available!") {
        return "text-danger fw-bold";
    } else {
        return "";
    }
}

const isWeekend = function (date) {
    const day = new Date(date).getDay();
    return (day == 0 || day == 6) ? true : false;
}

const shiftIndex = function (num) {
    if (num > 3) { return 'text-success fw-bold'; }
    if (num < 3) { return 'text-danger fw-bold'; }
    if (num == 3) { return 'text-warning fw-bold'; }
}

const getBatchNo = function (string) {
    return string.slice(6);
}

module.exports = { formatDate, ifEquals, ifMore, isSAC, isWeekend, shiftIndex, getBatchNo }