"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateHelper = void 0;
var DateHelper = /** @class */ (function () {
    function DateHelper(dates) {
        if (dates === void 0) { dates = []; }
        this._dates = dates;
    }
    DateHelper.prototype.earliestDate = function () {
        return new Date(Math.min.apply(Math, this.sanitizeDates().map(function (d) { return d.getTime(); })));
    };
    DateHelper.prototype.latestDate = function () {
        return new Date(Math.max.apply(Math, this.sanitizeDates().map(function (d) { return d.getTime(); })));
    };
    DateHelper.prototype.isBetween = function (_start, _end) {
        var now = new Date();
        var start = new Date(_start);
        var end = new Date(_end);
        return now > start && now < end;
    };
    DateHelper.prototype.sanitizeDates = function () {
        if (this._dates.length === 0) {
            return [];
        }
        var dates = this._dates.map(function (dateStr) {
            var date = new Date(dateStr);
            return isNaN(date.getTime()) ? undefined : date;
        });
        return dates.filter(Boolean);
    };
    return DateHelper;
}());
exports.DateHelper = DateHelper;
