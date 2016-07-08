/**
 * Copyright © 2015-2016 Noesys Software Pvt.Ltd. - All Rights Reserved
 * -------------',
 * This file is part of Infoveave.
 * Infoveave is dual licensed under Infoveave Commercial License and AGPL v3
 * -------------
 * You should have received a copy of the GNU Affero General Public License v3
 * along with this program (Infoveave)',
 * You can be released from the requirements of the license by purchasing
 * a commercial license. Buying such a license is mandatory as soon as you
 * develop commercial activities involving the Infoveave without
 * disclosing the source code of your own applications.
 * -------------
 * Authors: Naresh Jois <naresh@noesyssoftware.com>, et al.
 */
import * as _s from "underscore.string";
export enum DateRangeInterval {
    Days = 0,
    Weeks = 1,
    Months = 2,
    Quarters = 3,
    Years = 4,
    Custom = 999
}
export const DateRanges = [
    { id: 101, name: "This Week" },
    { id: 104, name: "Last Week" },
    { id: 102, name: "Last 2 Weeks" },
    { id: 103, name: "Last 4 Weeks" },
    { id: 201, name: "This Month" },
    { id: 202, name: "Last 2 Months" },
    { id: 203, name: "Last 3 Months" },
    { id: 204, name: "Last 6 Months" },
    { id: 205, name: "Last 12 Months" },
    { id: 301, name: "This Quarter" },
    { id: 302, name: "Last 2 Quarters" },
    { id: 401, name: "This Year" },
    { id: 402, name: "Last 2 Years" },
    { id: 999, name: "Custom" }];

export class DateHelpers {
    static getStartEndDate = (progression: number): { startDate: Date; endDate: Date; mode: DateRangeInterval } => {
        let startDate = new Date();
        let endDate = new Date();
        let mode = DateRangeInterval.Custom;
        switch (progression) {
            case 101:
                startDate = moment(startDate).startOf("week").toDate();
                endDate = moment(endDate).endOf("week").toDate();
                break;
            case 102:
                startDate = moment(startDate).subtract(1, "week").startOf("week").toDate();
                endDate = moment(endDate).endOf("week").toDate();
                break;
            case 103:
                startDate = moment(startDate).subtract(3, "week").startOf("week").toDate();
                endDate = moment(endDate).endOf("week").toDate();
                break;
            case 104:
                startDate = moment(startDate).subtract(1, "week").startOf("week").toDate();
                endDate = moment(endDate).subtract(1, "week").endOf("week").toDate();
                break;
            case 201:
                startDate = moment(startDate).startOf("month").toDate();
                endDate = moment(endDate).endOf("month").toDate();
                break;
            case 202:
                startDate = moment(startDate).subtract(1, "month").startOf("month").toDate();
                endDate = moment(endDate).endOf("month").toDate();
                break;
            case 203:
                startDate = moment(startDate).subtract(2, "month").startOf("month").toDate();
                endDate = moment(endDate).endOf("month").toDate();
                break;
             case 204:
                startDate = moment(startDate).subtract(5, "month").startOf("month").toDate();
                endDate = moment(endDate).endOf("month").toDate();
                break;
             case 205:
                startDate = moment(startDate).subtract(11, "month").startOf("month").toDate();
                endDate = moment(endDate).endOf("month").toDate();
                break;
            case 301:
                startDate = moment(startDate).startOf("quarter").toDate();
                endDate = moment(endDate).endOf("quarter").toDate();
                break;
            case 302:
                startDate = moment(startDate).subtract(1, "quarter").startOf("quarter").toDate();
                endDate = moment(endDate).endOf("quarter").toDate();
                break;
            case 401:
                startDate = moment(startDate).startOf("year").toDate();
                endDate = moment(endDate).endOf("year").toDate();
                break;
            case 402:
                startDate = moment(startDate).subtract(1, "year").startOf("year").toDate();
                endDate = moment(endDate).endOf("year").toDate();
                break;
            default:
                startDate = moment(startDate).startOf("month").toDate();
                endDate = moment(endDate).endOf("month").toDate();
                mode = DateRangeInterval.Months;
                break;
        }
        return { startDate: startDate, endDate: endDate, mode: mode };
    };

    static getQueryDates(mode: DateRangeInterval, progression: number, beginDate: Date, endDate: Date): string[] {
        if (progression !== 999) {
            if (_s.startsWith(progression.toString(), "1")) {
                mode = DateRangeInterval.Weeks;
            }
            if (_s.startsWith(progression.toString(), "2")) {
                mode = DateRangeInterval.Months;
            }
            if (_s.startsWith(progression.toString(), "3")) {
                mode = DateRangeInterval.Quarters;
            }
            if (_s.startsWith(progression.toString(), "4")) {
                mode = DateRangeInterval.Years;
            }
            if (beginDate == null || endDate == null) {
                let res = DateHelpers.getStartEndDate(progression);
                beginDate = res.startDate;
                endDate = res.endDate;
            }
        }
        let dates = [];
        let counter = 1;
        if (mode === DateRangeInterval.Days) {
            let endString = moment(endDate).format("YYYY-MM-DD");
            let startString = moment(beginDate).format("YYYY-MM-DD");
            dates.push("[Day].[" + startString + "]");
            while (startString !== endString) {
                startString = moment(beginDate).add(counter, "day").format("YYYY-MM-DD");
                counter++;
                dates.push("[Day].[" + startString + "]");
            }
            return dates;
        }
        if (mode === DateRangeInterval.Weeks) {
            let endString = moment(endDate).format("w, YYYY");
            let startString = moment(beginDate).format("w, YYYY");
            dates.push("[Week].[Week " + startString + "]");
            while (startString !== endString) {
                startString = moment(beginDate).add(counter, "week").format("w, YYYY");
                counter++;
                dates.push("[Week].[Week " + startString + "]");
            }
            return dates;
        }
        if (mode === DateRangeInterval.Months) {
            let endString = moment(endDate).format("MMMM YYYY");
            let startString = moment(beginDate).format("MMMM YYYY");
            dates.push("[Month].[" + startString + "]");
            while (startString !== endString) {
                startString = moment(beginDate).add(counter, "month").format("MMMM YYYY");
                counter++;
                dates.push("[Month].[" + startString + "]");
            }
            return dates;
        }
        if (mode === DateRangeInterval.Quarters) {
            let endString = moment(endDate).format("Q, YYYY");
            let startString = moment(beginDate).format("Q, YYYY");
            dates.push("[Quarter].[Quarter " + startString + "]");
            while (startString !== endString) {
                startString = moment(beginDate).add(counter, "quarter").format("Q, YYYY");
                counter++;
                dates.push("[Quarter].[Quarter " + startString + "]");
            }
            return dates;
        }
        if (mode === DateRangeInterval.Years) {
            let endString = moment(endDate).format("YYYY");
            let startString = moment(beginDate).format("YYYY");
            dates.push("[Year].[Calendar " + startString + "]");
            while (startString !== endString) {
                startString = moment(beginDate).add(counter, "year").format("YYYY");
                counter++;
                dates.push("[Year].[Calendar " + startString + "]");
            }
            return dates;
        }
    };

    /**
     * @param  {boolean} previousPeriod : This will use previousPeriod instead of Paraller Period
     * @param  {DateRangeInterval} mode
     * @param  {number} progression
     * @param  {Date} beginDate
     * @param  {Date} endDate
     */
    static getQueryDatesParallel(previousPeriod: boolean, mode: DateRangeInterval, progression: number, beginDate: Date, endDate: Date): { range: string[], startDate: string, endDate: string } {
        let diff = moment(endDate).diff(moment(beginDate), "days");
        // Sifter issue 18 
        // If date diff is > 365 the widget will have previous and parallel period data the same
        // If within 365 days the widget will handle previous and parallel data as expected.

        if (diff > 365) {
            // if (progression === 999 || previousPeriod) {
            // In Case the Progression is Custom There is No Parallel Period
            // but only previousPeriod, in that case we are basically taking
            // a diff os startDate and End Date and going back the same number
            // of days into the past and generating dates for the same
            let newStartDate = moment(beginDate).subtract(diff, "days");
            let newEndDate = moment(beginDate).subtract(1, "day");
            let range = DateHelpers.getQueryDates(mode, progression, newStartDate.toDate(), newEndDate.toDate());
            return { range: range, startDate: newStartDate.format("YYYY-MM-DD"), endDate: newEndDate.format("YYYY-MM-DD") };
            /*} else {
                let newStartDate = moment(beginDate).subtract(1, "year");
                let newEndDate = moment(endDate).subtract(1, "year");
                let range = DateHelpers.getQueryDates(mode, progression, newStartDate.toDate(), newEndDate.toDate());
                return { range: range, startDate: newStartDate.format("YYYY-MM-DD"), endDate: newEndDate.format("YYYY-MM-DD") };
            }*/
        } else {
            if (previousPeriod) {
                // In Case the Progression is Custom There is No Parallel Period
                // but only previousPeriod, in that case we are basically taking
                // a diff os startDate and End Date and going back the same number
                // of days into the past and generating dates for the same
                let newStartDate = moment(beginDate).subtract(diff, "days");
                let newEndDate = moment(beginDate).subtract(1, "day");
                let range = DateHelpers.getQueryDates(mode, progression, newStartDate.toDate(), newEndDate.toDate());
                return { range: range, startDate: newStartDate.format("YYYY-MM-DD"), endDate: newEndDate.format("YYYY-MM-DD") };
            } else {
                let newStartDate = moment(beginDate).subtract(1, "year");
                let newEndDate = moment(endDate).subtract(1, "year");
                let range = DateHelpers.getQueryDates(mode, progression, newStartDate.toDate(), newEndDate.toDate());
                return { range: range, startDate: newStartDate.format("YYYY-MM-DD"), endDate: newEndDate.format("YYYY-MM-DD") };
            }
        }
    }

    static getDisplayDate = (mode: DateRangeInterval, date: Date) => {
        let md = moment(date);
        switch (mode) {
            case DateRangeInterval.Years:
                return md.format("YYYY");
            case DateRangeInterval.Quarters:
                return "Quarter " + md.format("Q, YYYY");
            case DateRangeInterval.Months:
                return md.format("MMM YYYY");
            case DateRangeInterval.Weeks:
                return "Week " + md.format("w, YYYY");
            case DateRangeInterval.Days:
                return md.format("DD-MM-YYYY");
            default:
                return null;
        }
    };

    static selectedDateRange = (mode: DateRangeInterval, progression: number, beginDate: Date, endDate: Date): string => {
        if (progression !== 999) {
            return _.find(DateRanges, (d) => d.id === progression).name;
        } else {
            let bg = DateHelpers.getDisplayDate(mode, beginDate);
            let ed = DateHelpers.getDisplayDate(mode, endDate);
            if (bg === ed) { return bg; }
            return bg + " to " + ed;
        }
    };
}