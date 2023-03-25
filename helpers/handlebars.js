const moment = require('moment');

const formatDate = function (date, targetFormat) {
    return moment(date).format(targetFormat);
};

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

const ifWeekend = function (params1, params2, options) {
    if (params1 == params2) {
        return options.fn(this);
    }
    return options.inverse(this);
}

module.exports = { formatDate, ifEquals, ifMore, isSAC, isWeekend }