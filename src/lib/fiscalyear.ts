import moment from 'moment-timezone';
import { FiscalYearStart } from '@/core/fiscalyear.ts';
import { 
    type TimeRange,
} from '@/core/datetime.ts';
import { 
    getTodayFirstUnixTime,
    getTodayLastUnixTime,
} from '@/lib/datetime.ts';

// Represents a fiscal year with its unix time range
export interface FiscalYearUnixTime {
    readonly fiscalYear: number;
    readonly minUnixTime: number;
    readonly maxUnixTime: number;
}

// Get fiscal year for a specific unix time
export function getFiscalYearFromUnixTime(unixTime: number, fiscalYearStart: number): number {
    const date = moment.unix(unixTime);
    const [fiscalYearStartMonth, fiscalYearStartDay] = FiscalYearStart.strictFromNumber(fiscalYearStart).values();

    // For January 1 fiscal year start, fiscal year matches calendar year
    if (fiscalYearStartMonth === 1 && fiscalYearStartDay === 1) {
        return date.year();
    }

    // Get date components
    const month = date.month() + 1; // 0-based to 1-based
    const day = date.date();
    const year = date.year();

    // For other fiscal year starts (e.g. April 1):
    // If the date comes before the fiscal year start day in the calendar year,
    // it belongs to the fiscal year that ends in the current calendar year
    if (month < fiscalYearStartMonth || (month === fiscalYearStartMonth && day < fiscalYearStartDay)) {
        return year;
    }

    // If the date is on or after the fiscal year start day in the calendar year,
    // it belongs to the fiscal year that ends in the next calendar year
    return year + 1;
}

// Get fiscal year start date for a specific year
export function getFiscalYearStartUnixTime(unixTime: number, fiscalYearStart: number): number {
    const [fiscalYearStartMonth, fiscalYearStartDay] = FiscalYearStart.strictFromNumber(fiscalYearStart).values();

    let fiscalYear = getFiscalYearFromUnixTime(unixTime, fiscalYearStart);

    const result = moment().set({ 
        year: fiscalYear,
        month: fiscalYearStartMonth - 1, 
        date: fiscalYearStartDay,
        hour: 0, 
        minute: 0,
        second: 0, 
        millisecond: 0 
    }).startOf('day');

    return result.unix();

}

// Get fiscal year end date for a specific year
export function getFiscalYearEndUnixTime(unixTime: number, fiscalYearStart: number): number {
    const [fiscalYearStartMonth, fiscalYearStartDay] = FiscalYearStart.strictFromNumber(fiscalYearStart).values();

    let fiscalYear = getFiscalYearFromUnixTime(unixTime, fiscalYearStart);

    const result = moment().set({ 
        year: fiscalYear,
        month: fiscalYearStartMonth - 1, 
        date: fiscalYearStartDay,
        hour: 0, 
        minute: 0,
        second: 0, 
        millisecond: 0 
    }).startOf('day').add(1, 'year').subtract(1, 'second');

    return result.unix();
}
