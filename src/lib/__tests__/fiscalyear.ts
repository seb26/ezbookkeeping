// Unit tests for fiscal year functions
import moment from 'moment-timezone';
import { describe, test, expect } from '@jest/globals';

// Import all the fiscal year functions from the lib
import {
  getFiscalYearStartUnixTime,
  getFiscalYearEndUnixTime,
  getFiscalYearFromUnixTime,
  getCurrentFiscalYear,
  isInFiscalYear,
  getFiscalYearUnixTime,
  getFiscalYearToDateUnixTimes,
  getPreviousFiscalYearToDateUnixTimes,
  spanMultipleFiscalYears,
  getFiscalYearsInDateRange,
  getThisFiscalYearFirstUnixTime,
  getThisFiscalYearLastUnixTime,
  isStartOfFiscalYear,
  formatFiscalYear,
  getNextFiscalYearStartUnixTime
} from '@/lib/fiscalyear.ts';

// Fiscal year configuration used throughout tests
const FISCAL_YEAR_START_DATE = 0x0401; // April 1

// Test dates - fixed point in time
// Under end calendar year convention:
// May 15, 2023 is in FY 2024 (Apr 1, 2023 - Mar 31, 2024)
// Mar 15, 2023 is in FY 2023 (Apr 1, 2022 - Mar 31, 2023)
const TEST_DATE_MAY_15_2023 = moment("2023-05-15").unix(); 
const TEST_DATE_MAR_15_2023 = moment("2023-03-15").unix();
const TEST_DATE_APR_1_2023 = moment("2023-04-01").unix(); // Start of FY 2024

describe('Fiscal Year Functions', () => {
  
  describe('getFiscalYearFromUnixTime', () => {
    test('returns correct fiscal year for date in middle of fiscal year', () => {
      // May 15, 2023 is now in fiscal year 2024 with end convention
      expect(getFiscalYearFromUnixTime(TEST_DATE_MAY_15_2023, FISCAL_YEAR_START_DATE)).toBe(2024);
    });
    
    test('returns correct fiscal year for date before fiscal year start', () => {
      // Mar 15, 2023 is in fiscal year 2023 with end convention
      expect(getFiscalYearFromUnixTime(TEST_DATE_MAR_15_2023, FISCAL_YEAR_START_DATE)).toBe(2023);
    });
  });
  
  describe('getFiscalYearStartUnixTime', () => {
    test('returns correct start unix time for fiscal year 2024', () => {
      const startTime = getFiscalYearStartUnixTime(TEST_DATE_MAY_15_2023, FISCAL_YEAR_START_DATE);
      // For FY 2024, start is April 1, 2023
      const expectedDate = moment("2023-04-01").startOf('day').unix();
      expect(startTime).toBe(expectedDate);
    });
    
    test('returns correct start unix time for fiscal year 2023', () => {
      const startTime = getFiscalYearStartUnixTime(TEST_DATE_MAR_15_2023, FISCAL_YEAR_START_DATE);
      // For FY 2023, start is April 1, 2022
      const expectedDate = moment("2022-04-01").startOf('day').unix();
      expect(startTime).toBe(expectedDate);
    });
  });
  
  describe('getFiscalYearEndUnixTime', () => {
    test('returns correct end unix time for fiscal year 2024', () => {
      const endTime = getFiscalYearEndUnixTime(2024, FISCAL_YEAR_START_DATE);
      // FY 2024 ends on March 31, 2024
      const expectedDate = moment("2024-03-31").endOf('day').unix();
      expect(endTime).toBe(expectedDate);
    });
    
    test('returns correct end unix time for fiscal year 2023', () => {
      const endTime = getFiscalYearEndUnixTime(2023, FISCAL_YEAR_START_DATE);
      // FY 2023 ends on March 31, 2023
      const expectedDate = moment("2023-03-31").endOf('day').unix();
      expect(endTime).toBe(expectedDate);
    });
  });

  describe('getCurrentFiscalYear', () => {
    // This test depends on the current date, so we'll mock current date or make a looser assertion
    test('returns a reasonable fiscal year value', () => {
      const currentYear = new Date().getFullYear();
      const fiscalYear = getCurrentFiscalYear(FISCAL_YEAR_START_DATE);
      
      // With end convention, current fiscal year should be current calendar year or next year
      expect(fiscalYear === currentYear || fiscalYear === currentYear + 1).toBe(true);
    });
  });
  
  describe('isInFiscalYear', () => {
    test('correctly identifies date in specified fiscal year', () => {
      // May 15, 2023 is in fiscal year 2024 with end convention
      expect(isInFiscalYear(TEST_DATE_MAY_15_2023, 2024, FISCAL_YEAR_START_DATE)).toBe(true);
    });
    
    test('correctly identifies date not in specified fiscal year', () => {
      // Mar 15, 2023 is not in fiscal year 2024
      expect(isInFiscalYear(TEST_DATE_MAR_15_2023, 2024, FISCAL_YEAR_START_DATE)).toBe(false);
      // Mar 15, 2023 is in fiscal year 2023
      expect(isInFiscalYear(TEST_DATE_MAR_15_2023, 2023, FISCAL_YEAR_START_DATE)).toBe(true);
    });
  });
  
  describe('getFiscalYearUnixTime', () => {
    test('returns correct fiscal year object with unix times', () => {
      const result = getFiscalYearUnixTime(TEST_DATE_MAY_15_2023, FISCAL_YEAR_START_DATE);
      
      // With end convention, May 15, 2023 is in FY 2024
      expect(result.fiscalYear).toBe(2024);
      expect(result.minUnixTime).toBe(moment("2023-04-01").startOf('day').unix());
      expect(result.maxUnixTime).toBe(moment("2024-03-31").endOf('day').unix());
    });
  });
  
  describe('getFiscalYearToDateUnixTimes', () => {
    // This test will depend on the current date, so we'll use a more general assertion
    test('returns time range from fiscal year start to today', () => {
      const result = getFiscalYearToDateUnixTimes(FISCAL_YEAR_START_DATE);
      
      // The start should be April 1 of the previous calendar year
      const today = moment();
      const fiscalYearStart = moment().month(3).date(1).startOf('day');
      
      if (today.isBefore(fiscalYearStart)) {
        fiscalYearStart.subtract(1, 'year');
      }
      
      expect(moment.unix(result.minTime).format('MM-DD')).toBe('04-01');
      // The end should be today's end timestamp
      expect(moment.unix(result.maxTime).startOf('day').isSame(moment().startOf('day'))).toBe(true);
    });
  });
  
  describe('getPreviousFiscalYearToDateUnixTimes', () => {
    test('returns time range from previous fiscal year start to equivalent point', () => {
      const result = getPreviousFiscalYearToDateUnixTimes(FISCAL_YEAR_START_DATE);
      const currentYTD = getFiscalYearToDateUnixTimes(FISCAL_YEAR_START_DATE);
      
      // Previous YTD start should be one year before current YTD start
      const prevStartDate = moment.unix(result.minTime).format('MM-DD');
      expect(prevStartDate).toBe('04-01');
      
      // Days elapsed should be the same in both ranges
      const currentDaysElapsed = moment.unix(currentYTD.maxTime).diff(moment.unix(currentYTD.minTime), 'days');
      const prevDaysElapsed = moment.unix(result.maxTime).diff(moment.unix(result.minTime), 'days');
      
      expect(prevDaysElapsed).toBe(currentDaysElapsed);
    });
  });

  
  describe('spanMultipleFiscalYears', () => {
    test('correctly identifies date range within same fiscal year', () => {
      // With end convention, May-Dec 2023 all fall within FY 2024
      const result = spanMultipleFiscalYears(
        moment("2023-05-01").unix(),
        moment("2023-12-31").unix(),
        FISCAL_YEAR_START_DATE
      );
      
      expect(result).toBe(false);
    });
    
    test('correctly identifies date range spanning multiple fiscal years', () => {
      // With end convention, this spans FY 2024 and FY 2025
      const result = spanMultipleFiscalYears(
        moment("2023-05-01").unix(),
        moment("2024-05-01").unix(),
        FISCAL_YEAR_START_DATE
      );
      
      expect(result).toBe(true);
    });
  });
  
  describe('getFiscalYearsInDateRange', () => {
    test('returns all fiscal years in date range', () => {
      const result = getFiscalYearsInDateRange(
        moment("2022-05-01").unix(),
        moment("2024-05-01").unix(),
        FISCAL_YEAR_START_DATE
      );
      
      // With end convention: 
      // May 1, 2022 is in FY 2023
      // May 1, 2024 is in FY 2025
      // So we should include FY2023, FY2024, FY2025
      expect(result.length).toBe(3);
      
      // Check fiscal years
      expect(result[0].fiscalYear).toBe(2023);
      expect(result[1].fiscalYear).toBe(2024);
      expect(result[2].fiscalYear).toBe(2025);
      
      // Check start and end dates
      expect(moment.unix(result[0].minUnixTime).format('YYYY-MM-DD')).toBe('2022-04-01');
      expect(moment.unix(result[0].maxUnixTime).format('YYYY-MM-DD')).toBe('2023-03-31');
      
      expect(moment.unix(result[1].minUnixTime).format('YYYY-MM-DD')).toBe('2023-04-01');
      expect(moment.unix(result[1].maxUnixTime).format('YYYY-MM-DD')).toBe('2024-03-31');
      
      expect(moment.unix(result[2].minUnixTime).format('YYYY-MM-DD')).toBe('2024-04-01');
      expect(moment.unix(result[2].maxUnixTime).format('YYYY-MM-DD')).toBe('2025-03-31');
    });
  });
  
  describe('getThisFiscalYearFirstUnixTime and getThisFiscalYearLastUnixTime', () => {
    test('returns correct first and last unix time for current fiscal year', () => {
      const firstTime = getThisFiscalYearFirstUnixTime(FISCAL_YEAR_START_DATE);
      const lastTime = getThisFiscalYearLastUnixTime(FISCAL_YEAR_START_DATE);
      
      // First time should be April 1 (begin of fiscal year)
      expect(moment.unix(firstTime).format('MM-DD')).toBe('04-01');
      
      // Last time should be March 31 (end of fiscal year)
      expect(moment.unix(lastTime).format('MM-DD')).toBe('03-31');
      
      // Last time should be about 1 year (minus 1 second) after first time
      const diffInDays = moment.unix(lastTime).diff(moment.unix(firstTime), 'days');
      expect(diffInDays).toBe(364); // 365 days (minus 1 second)
    });
  });
  
  describe('isStartOfFiscalYear', () => {
    test('correctly identifies first day of fiscal year', () => {
      expect(isStartOfFiscalYear(TEST_DATE_APR_1_2023, FISCAL_YEAR_START_DATE)).toBe(true);
    });
    
    test('correctly identifies non-first day of fiscal year', () => {
      expect(isStartOfFiscalYear(TEST_DATE_MAY_15_2023, FISCAL_YEAR_START_DATE)).toBe(false);
    });
  });
  
  describe('formatFiscalYear', () => {
    test('formats fiscal year with default prefix', () => {
      expect(formatFiscalYear(2024)).toBe('FY2024');
    });
    
    test('formats fiscal year with custom prefix', () => {
      expect(formatFiscalYear(2024, 'Fiscal Year ')).toBe('Fiscal Year 2024');
    });
  });
  
  describe('getNextFiscalYearStartUnixTime', () => {
    test('returns start of next fiscal year', () => {
      const currentFY = getCurrentFiscalYear(FISCAL_YEAR_START_DATE);
      const nextFYStart = getNextFiscalYearStartUnixTime(FISCAL_YEAR_START_DATE);
      
      // Next fiscal year should start on April 1 of current fiscal year 
      // (with end convention, the NEXT fiscal year starts in the current calendar year)
      expect(moment.unix(nextFYStart).format('MM-DD')).toBe('04-01');
      
      // The calendar year of next fiscal year start should be the current fiscal year - 1
      // This is because with end convention, FY 2025 starts on April 1, 2024
      expect(moment.unix(nextFYStart).year()).toBe(currentFY);
    });
  });
}); 