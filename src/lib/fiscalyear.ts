import moment from 'moment-timezone';
import { FiscalYearStart } from '@/core/fiscalyear';
import { 
    type TimeRange,
} from '@/core/datetime.ts';
import { 
    getTodayFirstUnixTime,
    getTodayLastUnixTime,
} from '@/lib/datetime';

// Represents a fiscal year with its unix time range
export interface FiscalYearUnixTime {
    readonly fiscalYear: number;
    readonly minUnixTime: number;
    readonly maxUnixTime: number;
}

// Get fiscal year start date for a specific year
export function getFiscalYearStartUnixTime(unixTime: number, fiscalYearStartDate: number): number {
    const fiscalYearStartObj = FiscalYearStart.strictFromNumber(fiscalYearStartDate);
    const fiscalYearStartMonth = fiscalYearStartObj.Month;
    const fiscalYearStartDay = fiscalYearStartObj.Day;
    
    const fiscalYear = getFiscalYearFromUnixTime(unixTime, fiscalYearStartDate);
    
    // The actual start date is in the previous calendar year for any fiscal year convention
    // that is not January 1.
    const calendarYear = fiscalYear - 1;
    
    return moment().set({ 
        year: calendarYear, 
        month: fiscalYearStartMonth - 1, 
        date: fiscalYearStartDay,
        hour: 0, 
        minute: 0,
        second: 0, 
        millisecond: 0 
    }).startOf('day').unix();
}

// Get fiscal year end date for a specific year
export function getFiscalYearEndUnixTime(fiscalYear: number, fiscalYearStartDate: number): number {
    const fiscalYearStartObj = FiscalYearStart.strictFromNumber(fiscalYearStartDate);
    const fiscalYearStartMonth = fiscalYearStartObj.Month;
    const fiscalYearStartDay = fiscalYearStartObj.Day;
    
    // For the end year convention, the end date is in the fiscal year that's being requested
    const nextYearStartTime = moment().set({
        year: fiscalYear,
        month: fiscalYearStartMonth - 1,
        date: fiscalYearStartDay,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    }).startOf('day').unix();
    
    return moment.unix(nextYearStartTime).subtract(1, 'seconds').unix();
}

// Get fiscal year number for a specific unix time
export function getFiscalYearFromUnixTime(unixTime: number, fiscalYearStartDate: number): number {
    const date = moment.unix(unixTime);
    const year = date.year();
    const fiscalYearStartObj = FiscalYearStart.strictFromNumber(fiscalYearStartDate);
    
    const fiscalYearStart = moment().set({ 
        year: year, 
        month: fiscalYearStartObj.Month - 1, 
        date: fiscalYearStartObj.Day,
        hour: 0, 
        minute: 0, 
        second: 0, 
        millisecond: 0 
    }).startOf('day');
    
    // For end calendar year convention:
    // If the date is on or after this year's fiscal start, it belongs to next fiscal year
    if (date.isSameOrAfter(fiscalYearStart)) {
        return year + 1;
    }
    
    return year;
}

// Get the current fiscal year based on today's date
export function getCurrentFiscalYear(fiscalYearStartDate: number): number {
    return getFiscalYearFromUnixTime(getTodayFirstUnixTime(), fiscalYearStartDate);
}

// Check if a unix time is in a specific fiscal year
export function isInFiscalYear(unixTime: number, fiscalYear: number, fiscalYearStartDate: number): boolean {
    const fiscalYearStartObj = FiscalYearStart.strictFromNumber(fiscalYearStartDate);
    const fiscalYearStartMonth = fiscalYearStartObj.Month;
    const fiscalYearStartDay = fiscalYearStartObj.Day;
    
    // For end calendar year convention, the start date is in the previous year
    const startTime = moment().set({
        year: fiscalYear - 1,
        month: fiscalYearStartMonth - 1,
        date: fiscalYearStartDay,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    }).startOf('day').unix();
    
    // End date is in the fiscal year
    const endTime = moment().set({
        year: fiscalYear,
        month: fiscalYearStartMonth - 1,
        date: fiscalYearStartDay,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    }).startOf('day').subtract(1, 'seconds').unix();
    
    return unixTime >= startTime && unixTime <= endTime;
}

// Get fiscal year with unix time range
export function getFiscalYearUnixTime(unixTime: number, fiscalYearStartDate: number): FiscalYearUnixTime {
    const fiscalYear = getFiscalYearFromUnixTime(unixTime, fiscalYearStartDate);
    const fiscalYearStartObj = FiscalYearStart.strictFromNumber(fiscalYearStartDate);
    const fiscalYearStartMonth = fiscalYearStartObj.Month;
    const fiscalYearStartDay = fiscalYearStartObj.Day;
    
    const startTime = moment().set({
        year: fiscalYear - 1,
        month: fiscalYearStartMonth - 1,
        date: fiscalYearStartDay,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    }).startOf('day').unix();
    
    const endTime = moment().set({
        year: fiscalYear,
        month: fiscalYearStartMonth - 1,
        date: fiscalYearStartDay,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    }).startOf('day').subtract(1, 'seconds').unix();
    
    return {
        fiscalYear,
        minUnixTime: startTime,
        maxUnixTime: endTime
    };
}

// Get fiscal year-to-date range
export function getFiscalYearToDateUnixTimes(fiscalYearStartDate: number): TimeRange {
    const today = moment.unix(getTodayFirstUnixTime());
    const fiscalYear = getFiscalYearFromUnixTime(today.unix(), fiscalYearStartDate);
    const fiscalYearStartObj = FiscalYearStart.strictFromNumber(fiscalYearStartDate);
    
    // For the end calendar year convention, start date is in previous calendar year
    const startTime = moment().set({
        year: fiscalYear - 1,
        month: fiscalYearStartObj.Month - 1,
        date: fiscalYearStartObj.Day,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    }).startOf('day').unix();
    
    return {
        minTime: startTime,
        maxTime: getTodayLastUnixTime()
    };
}

// Get previous fiscal year-to-date range (for comparative analysis)
export function getPreviousFiscalYearToDateUnixTimes(fiscalYearStartDate: number): TimeRange {
    const today = moment.unix(getTodayFirstUnixTime());
    const currentFiscalYear = getFiscalYearFromUnixTime(today.unix(), fiscalYearStartDate);
    const previousFiscalYear = currentFiscalYear - 1;
    const fiscalYearStartObj = FiscalYearStart.strictFromNumber(fiscalYearStartDate);
    
    // Calculate days elapsed in current fiscal year
    // With end convention, start date is in previous calendar year
    const fiscalYearStart = moment().set({
        year: currentFiscalYear - 1,
        month: fiscalYearStartObj.Month - 1,
        date: fiscalYearStartObj.Day,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    }).startOf('day');
    
    const daysElapsed = today.diff(fiscalYearStart, 'days');
    
    // Get same point in previous fiscal year
    const previousYearStart = moment().set({
        year: previousFiscalYear - 1,
        month: fiscalYearStartObj.Month - 1,
        date: fiscalYearStartObj.Day,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    }).startOf('day');
    
    const previousYearSamePoint = previousYearStart.clone().add(daysElapsed, 'days').endOf('day');
    
    return {
        minTime: previousYearStart.unix(),
        maxTime: previousYearSamePoint.unix()
    };
}

// Check if date range spans multiple fiscal years
export function spanMultipleFiscalYears(minTime: number, maxTime: number, fiscalYearStartDate: number): boolean {
    const startFiscalYear = getFiscalYearFromUnixTime(minTime, fiscalYearStartDate);
    const endFiscalYear = getFiscalYearFromUnixTime(maxTime, fiscalYearStartDate);
    
    return startFiscalYear !== endFiscalYear;
}

// Get all fiscal years spanned by a date range
export function getFiscalYearsInDateRange(minTime: number, maxTime: number, fiscalYearStartDate: number): FiscalYearUnixTime[] {
    const startFiscalYear = getFiscalYearFromUnixTime(minTime, fiscalYearStartDate);
    const endFiscalYear = getFiscalYearFromUnixTime(maxTime, fiscalYearStartDate);
    const years: FiscalYearUnixTime[] = [];
    
    for (let year = startFiscalYear; year <= endFiscalYear; year++) {
        // Using the year as a reference point doesn't work with end convention
        // We need to create a date in that fiscal year and get its fiscal year unixtime
        const fiscalYearStartObj = FiscalYearStart.strictFromNumber(fiscalYearStartDate);
        
        // Create a date definitely in this fiscal year (middle of the fiscal year)
        // For fiscal year 2023 (Apr 1, 2022 - Mar 31, 2023), use Oct 1, 2022
        const midYearDate = moment().set({
            year: year - 1, // Calendar year is fiscal year - 1
            month: (fiscalYearStartObj.Month - 1 + 6) % 12, // 6 months after fiscal year start
            date: 1,
            hour: 12,
            minute: 0,
            second: 0,
            millisecond: 0
        });
        
        years.push(getFiscalYearUnixTime(midYearDate.unix(), fiscalYearStartDate));
    }
    
    return years;
}

// Get first day of current fiscal year
export function getThisFiscalYearFirstUnixTime(fiscalYearStartDate: number): number {
    const today = moment.unix(getTodayFirstUnixTime());
    const fiscalYear = getFiscalYearFromUnixTime(today.unix(), fiscalYearStartDate);
    const fiscalYearStartObj = FiscalYearStart.strictFromNumber(fiscalYearStartDate);
    
    // For end calendar year convention, start is in previous calendar year
    return moment().set({ 
        year: fiscalYear - 1, 
        month: fiscalYearStartObj.Month - 1, 
        date: fiscalYearStartObj.Day,
        hour: 0, 
        minute: 0, 
        second: 0, 
        millisecond: 0 
    }).startOf('day').unix();
}

// Get last day of current fiscal year
export function getThisFiscalYearLastUnixTime(fiscalYearStartDate: number): number {
    const fiscalYear = getCurrentFiscalYear(fiscalYearStartDate);
    const fiscalYearStartObj = FiscalYearStart.strictFromNumber(fiscalYearStartDate);
    
    // For end calendar year convention, end is in the fiscal year
    return moment().set({
        year: fiscalYear,
        month: fiscalYearStartObj.Month - 1,
        date: fiscalYearStartObj.Day,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    }).startOf('day').subtract(1, 'seconds').unix();
}

// Determine if a given date is the start of a fiscal year
export function isStartOfFiscalYear(unixTime: number, fiscalYearStartDate: number): boolean {
    const date = moment.unix(unixTime).startOf('day');
    const fiscalYearStartObj = FiscalYearStart.strictFromNumber(fiscalYearStartDate);
    
    return date.date() === fiscalYearStartObj.Day && date.month() === (fiscalYearStartObj.Month - 1);
}

// Format a fiscal year for display (e.g., "FY2023")
export function formatFiscalYear(fiscalYear: number, prefix: string = "FY"): string {
    return `${prefix}${fiscalYear}`;
}

// Get next fiscal year start
export function getNextFiscalYearStartUnixTime(fiscalYearStartDate: number): number {
    const currentFiscalYear = getCurrentFiscalYear(fiscalYearStartDate);
    const fiscalYearStartObj = FiscalYearStart.strictFromNumber(fiscalYearStartDate);
    
    // For end calendar year convention, start date is in previous calendar year
    return moment().set({
        year: currentFiscalYear,
        month: fiscalYearStartObj.Month - 1,
        date: fiscalYearStartObj.Day,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    }).startOf('day').unix();
} 
