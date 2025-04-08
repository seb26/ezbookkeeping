import moment from 'moment-timezone';
import { FiscalYearStart } from '@/core/fiscalyear.ts';

// Represents a fiscal year with its unix time range
export interface FiscalYearUnixTime {
    readonly fiscalYear: number;
    readonly minUnixTime: number;
    readonly maxUnixTime: number;
}

// Get fiscal year for a specific unix time
export function getFiscalYearFromUnixTime(unixTime: number, fiscalYearStart: number): number {
    const date = moment.unix(unixTime);
    
    // For January 1 fiscal year start, fiscal year matches calendar year
    if (fiscalYearStart === 0x0101) {
        return date.year();
    }
    
    // Get date components
    const month = date.month() + 1; // 1-index
    const day = date.date();
    const year = date.year();
    
    const [fiscalYearStartMonth, fiscalYearStartDay] = FiscalYearStart.strictFromNumber(fiscalYearStart).values();
    
    // For other fiscal year starts:
    // If input time comes before the fiscal year start day in the calendar year,
    // it belongs to the fiscal year that ends in the current calendar year
    if (month < fiscalYearStartMonth || (month === fiscalYearStartMonth && day < fiscalYearStartDay)) {
        return year;
    }

    // If input time is on or after the fiscal year start day in the calendar year,
    // it belongs to the fiscal year that ends in the next calendar year
    return year + 1;
}

// Get fiscal year start date for a specific year
export function getFiscalYearStartUnixTime(unixTime: number, fiscalYearStart: number): number {
    const date = moment.unix(unixTime);
    
    // For January 1 fiscal year start, fiscal year start time is always January 1 in the input calendar year
    if (fiscalYearStart === 0x0101) {
        return moment().year(date.year()).month(0).date(1).hour(0).minute(0).second(0).millisecond(0).unix();
    }

    const [fiscalYearStartMonth, fiscalYearStartDay] = FiscalYearStart.strictFromNumber(fiscalYearStart).values();
    const month = date.month() + 1; // 1-index
    const day = date.date();
    const year = date.year();
    
    // For other fiscal year starts:
    // If input time comes before the fiscal year start day in the calendar year,
    // the relevant fiscal year has a start date in Calendar Year = Input Year, and end date in Calendar Year = Input Year + 1.
    // If input time comes on or after the fiscal year start day in the calendar year,
    // the relevant fiscal year has a start date in Calendar Year = Input Year - 1, and end date in Calendar Year = Input Year.
    let startYear = year - 1;
    if (month > fiscalYearStartMonth || (month === fiscalYearStartMonth && day >= fiscalYearStartDay)) {
        startYear = year;
    }

    return moment().set({
        year: startYear,
        month: fiscalYearStartMonth - 1, // 0-index
        date: fiscalYearStartDay,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
    }).unix();
}

// Get fiscal year end date for a specific year
export function getFiscalYearEndUnixTime(unixTime: number, fiscalYearStart: number): number {
    const date = moment.unix(unixTime);
    // For January 1 fiscal year start, fiscal year end time is always December 31 in the input calendar year
    if (fiscalYearStart === 0x0101) {
        const result = moment().set({
            year: date.year(),
            month: 11, // 0-index
            date: 31,
            hour: 23,
            minute: 59,
            second: 59,
            millisecond: 999,
        });
        return result.unix();
    }

    const [fiscalYearStartMonth, fiscalYearStartDay] = FiscalYearStart.strictFromNumber(fiscalYearStart).values();
    const month = date.month() + 1; // 1-index
    const day = date.date();
    const year = date.year();
    
    // For other fiscal year starts:
    // If input time comes before the fiscal year start day in the calendar year,
    // the relevant fiscal year has a start date in Calendar Year = Input Year, and end date in Calendar Year = Input Year + 1.
    // If input time comes on or after the fiscal year start day in the calendar year,
    // the relevant fiscal year has a start date in Calendar Year = Input Year - 1, and end date in Calendar Year = Input Year.
    let endYear = year;
    if (month > fiscalYearStartMonth || (month === fiscalYearStartMonth && day >= fiscalYearStartDay)) {
        endYear = year + 1;
    }

    return moment().set({
        year: endYear,
        month: fiscalYearStartMonth - 1, // 0-index
        date: fiscalYearStartDay,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
    }).subtract(1, 'second').unix();
}
