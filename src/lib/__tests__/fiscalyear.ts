// Unit tests for fiscal year functions
import moment from 'moment-timezone';
import { describe, expect, test } from '@jest/globals';

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
    getNextFiscalYearStartUnixTime,
    isEndOfFiscalYear
} from '@/lib/fiscalyear.ts';

import { formatUnixTime } from '@/lib/datetime.ts';

// UTILITIES

function formatUnixTimeISO(unixTime: number): string {
    return formatUnixTime(unixTime, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
}


//
// FISCAL YEAR START CONFIGURATION
//
type FiscalYearStartConfig = {
    id: string;
    value: number;
};

const FISCAL_YEAR_STARTS: Record<string, FiscalYearStartConfig> = {
    'January 1': { id: 'January 1', value: 0x0101 },
    'April 1': { id: 'April 1', value: 0x0401 },
};


//
// FISCAL YEAR FROM UNIX TIME
//

const FISCAL_YEAR_FROM_UNIX_TIME_TEST_CASES: {
    date: string;
    unixTime: number;
    expected: {
        [fiscalYearStart: string]: number;
    };
}[] = [
    { date: '2023-01-01', unixTime: 1672531200, expected: { 'January 1': 2023, 'April 1': 2023 } },
    { date: '2023-03-31', unixTime: 1680220800, expected: { 'January 1': 2023, 'April 1': 2023 } },
    { date: '2023-04-01', unixTime: 1680307200, expected: { 'January 1': 2023, 'April 1': 2024 } },
    { date: '2023-12-31', unixTime: 1703980800, expected: { 'January 1': 2023, 'April 1': 2024 } },
    { date: '2024-01-01', unixTime: 1704067200, expected: { 'January 1': 2024, 'April 1': 2024 } },
    { date: '2024-03-31', unixTime: 1711843200, expected: { 'January 1': 2024, 'April 1': 2024 } },
    { date: '2024-04-01', unixTime: 1712016000, expected: { 'January 1': 2024, 'April 1': 2025 } },
    { date: '2024-12-31', unixTime: 1735603200, expected: { 'January 1': 2024, 'April 1': 2025 } }
];

describe('getFiscalYearFromUnixTime', () => {
    FISCAL_YEAR_FROM_UNIX_TIME_TEST_CASES.forEach((testCase) => {
        Object.values(FISCAL_YEAR_STARTS).forEach((testFiscalYearStart) => {
            const dateLong = moment(testCase.date).format('MMMM D, YYYY');
            test(`returns correct fiscal year for FY_START: ${testFiscalYearStart.id.padStart(10, ' ')} and DATE: ${dateLong}`, () => {
                const fiscalYear = getFiscalYearFromUnixTime(testCase.unixTime, testFiscalYearStart.value);
                const expected = testCase.expected[testFiscalYearStart.id];
                
                expect(fiscalYear).toBe(expected);
            });
        });
    });
});

//
// FISCAL YEAR START UNIX TIME
//

const FISCAL_YEAR_START_UNIX_TIME_TEST_CASES: {
    date: string;
    unixTime: number;
    expected: {
        [fiscalYearStart: string]: {
            unixTime: number;
            unixTimeISO: string;
        };
    };
}[] = [
    { date: '2023-01-01', unixTime: 1672531200, expected: { 'January 1': { unixTime: 1672531200, unixTimeISO: '2023-01-01T00:00:00.000Z' }, 'April 1': { unixTime: 1680307200, unixTimeISO: '2023-04-01T00:00:00.000Z' } } },
    { date: '2023-03-31', unixTime: 1680220800, expected: { 'January 1': { unixTime: 1672531200, unixTimeISO: '2023-01-01T00:00:00.000Z' }, 'April 1': { unixTime: 1680307200, unixTimeISO: '2023-04-01T00:00:00.000Z' } } },
    { date: '2023-04-01', unixTime: 1680307200, expected: { 'January 1': { unixTime: 1672531200, unixTimeISO: '2023-01-01T00:00:00.000Z' }, 'April 1': { unixTime: 1711929600, unixTimeISO: '2024-04-01T00:00:00.000Z' } } },
    { date: '2023-12-31', unixTime: 1703980800, expected: { 'January 1': { unixTime: 1672531200, unixTimeISO: '2023-01-01T00:00:00.000Z' }, 'April 1': { unixTime: 1711929600, unixTimeISO: '2024-04-01T00:00:00.000Z' } } },
    { date: '2024-01-01', unixTime: 1704067200, expected: { 'January 1': { unixTime: 1704067200, unixTimeISO: '2024-01-01T00:00:00.000Z' }, 'April 1': { unixTime: 1711929600, unixTimeISO: '2024-04-01T00:00:00.000Z' } } },
    { date: '2024-03-31', unixTime: 1711843200, expected: { 'January 1': { unixTime: 1704067200, unixTimeISO: '2024-01-01T00:00:00.000Z' }, 'April 1': { unixTime: 1711929600, unixTimeISO: '2024-04-01T00:00:00.000Z' } } },
    { date: '2024-04-01', unixTime: 1712016000, expected: { 'January 1': { unixTime: 1704067200, unixTimeISO: '2024-01-01T00:00:00.000Z' }, 'April 1': { unixTime: 1743465600, unixTimeISO: '2025-04-01T00:00:00.000Z' } } },
    { date: '2024-12-31', unixTime: 1735603200, expected: { 'January 1': { unixTime: 1704067200, unixTimeISO: '2024-01-01T00:00:00.000Z' }, 'April 1': { unixTime: 1743465600, unixTimeISO: '2025-04-01T00:00:00.000Z' } } }
];

describe('getFiscalYearStartUnixTime', () => {
    FISCAL_YEAR_START_UNIX_TIME_TEST_CASES.forEach((testCase) => {
        Object.values(FISCAL_YEAR_STARTS).forEach((testFiscalYearStart) => {
            const dateLong = moment(testCase.date).format('MMMM D, YYYY');
            test(`returns correct start unix time for FY_START: ${testFiscalYearStart.id.padStart(10, ' ')} and DATE: ${dateLong}`, () => {
                const startUnixTime = getFiscalYearStartUnixTime(testCase.unixTime, testFiscalYearStart.value);
                const expected = testCase.expected[testFiscalYearStart.id];
                
                expect(startUnixTime).toBe(expected.unixTime);
                const unixTimeISO = formatUnixTimeISO(startUnixTime);
                expect(unixTimeISO).toBe(expected.unixTimeISO);
            });
        });
    });
});


//
// FISCAL YEAR END UNIX TIME
//

const FISCAL_YEAR_END_UNIX_TIME_TEST_CASES: {
    date: string;
    unixTime: number;
    expected: {
        [fiscalYearStart: string]: {
            unixTime: number;
            unixTimeISO: string;
        };
    };
}[] = [
    { date: '2023-01-01', unixTime: 1672531200, expected: { 'January 1': { unixTime: 1672531199, unixTimeISO: '2023-12-31T23:59:59.000Z' }, 'April 1': { unixTime: 1711929599, unixTimeISO: '2024-03-31T23:59:59.000Z' } } },
    { date: '2023-03-31', unixTime: 1680220800, expected: { 'January 1': { unixTime: 1672531199, unixTimeISO: '2023-12-31T23:59:59.000Z' }, 'April 1': { unixTime: 1711929599, unixTimeISO: '2024-03-31T23:59:59.000Z' } } },
    { date: '2023-04-01', unixTime: 1680307200, expected: { 'January 1': { unixTime: 1672531199, unixTimeISO: '2023-12-31T23:59:59.000Z' }, 'April 1': { unixTime: 1743465599, unixTimeISO: '2025-03-31T23:59:59.000Z' } } },
    { date: '2023-12-31', unixTime: 1703980800, expected: { 'January 1': { unixTime: 1672531199, unixTimeISO: '2023-12-31T23:59:59.000Z' }, 'April 1': { unixTime: 1743465599, unixTimeISO: '2025-03-31T23:59:59.000Z' } } },
    { date: '2024-01-01', unixTime: 1704067200, expected: { 'January 1': { unixTime: 1704067199, unixTimeISO: '2024-12-31T23:59:59.000Z' }, 'April 1': { unixTime: 1743465599, unixTimeISO: '2025-03-31T23:59:59.000Z' } } },
    { date: '2024-03-31', unixTime: 1711843200, expected: { 'January 1': { unixTime: 1704067199, unixTimeISO: '2024-12-31T23:59:59.000Z' }, 'April 1': { unixTime: 1743465599, unixTimeISO: '2025-03-31T23:59:59.000Z' } } },
    { date: '2024-04-01', unixTime: 1712016000, expected: { 'January 1': { unixTime: 1704067199, unixTimeISO: '2024-12-31T23:59:59.000Z' }, 'April 1': { unixTime: 1775001599, unixTimeISO: '2026-03-31T23:59:59.000Z' } } },
    { date: '2024-12-31', unixTime: 1735603200, expected: { 'January 1': { unixTime: 1704067199, unixTimeISO: '2024-12-31T23:59:59.000Z' }, 'April 1': { unixTime: 1775001599, unixTimeISO: '2026-03-31T23:59:59.000Z' } } }
];

describe('getFiscalYearEndUnixTime', () => {
    FISCAL_YEAR_END_UNIX_TIME_TEST_CASES.forEach((testCase) => {
        Object.values(FISCAL_YEAR_STARTS).forEach((testFiscalYearStart) => {
            const dateLong = moment(testCase.date).format('MMMM D, YYYY');
            test(`returns correct end unix time for FY_START: ${testFiscalYearStart.id.padStart(10, ' ')} and DATE: ${dateLong}`, () => {
                const endUnixTime = getFiscalYearEndUnixTime(testCase.unixTime, testFiscalYearStart.value);
                const expected = testCase.expected[testFiscalYearStart.id];
                
                expect(endUnixTime).toBe(expected.unixTime);
                const unixTimeISO = formatUnixTimeISO(endUnixTime);
                expect(unixTimeISO).toBe(expected.unixTimeISO);
            });
        });
    });
});