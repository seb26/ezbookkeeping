// Unit tests for fiscal year functions
import moment from 'moment-timezone';
import { describe, expect, test } from '@jest/globals';

// Import all the fiscal year functions from the lib
import {
    getFiscalYearFromUnixTime,
    getFiscalYearStartUnixTime,
    getFiscalYearEndUnixTime,
    getFiscalYearUnixTimeRange
} from '@/lib/fiscalyear.ts';

import { formatUnixTime } from '@/lib/datetime.ts';
import { FiscalYearStart } from '@/core/fiscalyear.ts';

// UTILITIES
function formatUnixTimeISO(unixTime: number): string {
    return formatUnixTime(unixTime, 'YYYY-MM-DD[T]HH:mm:ss[Z]');
}

function getTestTitleFormat(testFiscalYearStartId: string, testCaseDateString: string): string {
    return `FY_START: ${testFiscalYearStartId.padStart(10, ' ')}; DATE: ${moment(testCaseDateString).format('MMMM D, YYYY')}`;
}

// FISCAL YEAR START CONFIGURATION
type FiscalYearStartConfig = {
    id: string;
    value: number;
};

const FISCAL_YEAR_STARTS: Record<string, FiscalYearStartConfig> = {
    'January 1': {
        id: 'January 1',
        value: 0x0101,
    },
    'April 1': {
        id: 'April 1',
        value: 0x0401,
    },
    'October 1': {
        id: 'October 1',
        value: 0x0A01,
    },
};

// VALIDATE FISCAL YEAR START
describe('validateFiscalYearStart', () => {
    Object.values(FISCAL_YEAR_STARTS).forEach((testFiscalYearStart) => {
        test(`should return true for valid fiscal year start: ${testFiscalYearStart.id}`, () => {
            expect(FiscalYearStart.isValidType(testFiscalYearStart.value)).toBe(true);
        });
    });
});

// FISCAL YEAR FROM UNIX TIME
type FiscalYearFromUnixTimeTestCase = {
    date: string;
    unixTime: number;
    expected: {
        [fiscalYearStart: string]: number;
    };
};

const FISCAL_YEAR_FROM_UNIX_TIME_TEST_CASES: FiscalYearFromUnixTimeTestCase[] = [
    { date: '2022-01-01', unixTime: 1640995200, expected: { 'January 1': 2022, 'April 1': 2022, 'October 1': 2022 } },
    { date: '2022-03-31', unixTime: 1648684800, expected: { 'January 1': 2022, 'April 1': 2022, 'October 1': 2022 } },
    { date: '2022-04-01', unixTime: 1648771200, expected: { 'January 1': 2022, 'April 1': 2023, 'October 1': 2022 } },
    { date: '2022-09-30', unixTime: 1664496000, expected: { 'January 1': 2022, 'April 1': 2023, 'October 1': 2022 } },
    { date: '2022-10-01', unixTime: 1664582400, expected: { 'January 1': 2022, 'April 1': 2023, 'October 1': 2023 } },
    { date: '2022-12-31', unixTime: 1672444800, expected: { 'January 1': 2022, 'April 1': 2023, 'October 1': 2023 } },
    { date: '2023-01-01', unixTime: 1672531200, expected: { 'January 1': 2023, 'April 1': 2023, 'October 1': 2023 } },
    { date: '2023-03-31', unixTime: 1680220800, expected: { 'January 1': 2023, 'April 1': 2023, 'October 1': 2023 } },
    { date: '2023-04-01', unixTime: 1680307200, expected: { 'January 1': 2023, 'April 1': 2024, 'October 1': 2023 } },
    { date: '2023-09-30', unixTime: 1696032000, expected: { 'January 1': 2023, 'April 1': 2024, 'October 1': 2023 } },
    { date: '2023-10-01', unixTime: 1696118400, expected: { 'January 1': 2023, 'April 1': 2024, 'October 1': 2024 } },
    { date: '2023-12-31', unixTime: 1703980800, expected: { 'January 1': 2023, 'April 1': 2024, 'October 1': 2024 } },
    { date: '2024-01-01', unixTime: 1704067200, expected: { 'January 1': 2024, 'April 1': 2024, 'October 1': 2024 } },
    { date: '2024-03-31', unixTime: 1711843200, expected: { 'January 1': 2024, 'April 1': 2024, 'October 1': 2024 } },
    { date: '2024-04-01', unixTime: 1711929600, expected: { 'January 1': 2024, 'April 1': 2025, 'October 1': 2024 } },
    { date: '2024-09-30', unixTime: 1727654400, expected: { 'January 1': 2024, 'April 1': 2025, 'October 1': 2024 } },
    { date: '2024-10-01', unixTime: 1727740800, expected: { 'January 1': 2024, 'April 1': 2025, 'October 1': 2025 } },
    { date: '2024-12-31', unixTime: 1735603200, expected: { 'January 1': 2024, 'April 1': 2025, 'October 1': 2025 } },
    { date: '2025-01-01', unixTime: 1735689600, expected: { 'January 1': 2025, 'April 1': 2025, 'October 1': 2025 } },
    { date: '2025-03-31', unixTime: 1743379200, expected: { 'January 1': 2025, 'April 1': 2025, 'October 1': 2025 } },
    { date: '2025-04-01', unixTime: 1743465600, expected: { 'January 1': 2025, 'April 1': 2026, 'October 1': 2025 } },
    { date: '2025-09-30', unixTime: 1759190400, expected: { 'January 1': 2025, 'April 1': 2026, 'October 1': 2025 } },
    { date: '2025-10-01', unixTime: 1759276800, expected: { 'January 1': 2025, 'April 1': 2026, 'October 1': 2026 } },
    { date: '2025-12-31', unixTime: 1767139200, expected: { 'January 1': 2025, 'April 1': 2026, 'October 1': 2026 } }
];

describe('getFiscalYearFromUnixTime', () => {
    Object.values(FISCAL_YEAR_STARTS).forEach((testFiscalYearStart) => {
        FISCAL_YEAR_FROM_UNIX_TIME_TEST_CASES.forEach((testCase) => {
            test(`returns correct fiscal year for ${getTestTitleFormat(testFiscalYearStart.id, testCase.date)}`, () => {
                const fiscalYear = getFiscalYearFromUnixTime(testCase.unixTime, testFiscalYearStart.value);
                const expected = testCase.expected[testFiscalYearStart.id];
                
                expect(fiscalYear).toBe(expected);
            });
        });
    });
});


// FISCAL YEAR START UNIX TIME
type FiscalYearStartUnixTimeTestCase = {
    date: string;
    unixTime: number;
    expected: {
        [fiscalYearStart: string]: {
            unixTime: number;
            unixTimeISO: string;
        };
    };
}

const FISCAL_YEAR_START_UNIX_TIME_TEST_CASES: FiscalYearStartUnixTimeTestCase[] = [
    { date: '2022-01-01', unixTime: 1640995200, expected: { 'January 1': { unixTime: 1640995200, unixTimeISO: '2022-01-01T00:00:00Z' }, 'April 1': { unixTime: 1617235200, unixTimeISO: '2021-04-01T00:00:00Z' }, 'October 1': { unixTime: 1633046400, unixTimeISO: '2021-10-01T00:00:00Z' } } },
    { date: '2022-03-31', unixTime: 1648684800, expected: { 'January 1': { unixTime: 1640995200, unixTimeISO: '2022-01-01T00:00:00Z' }, 'April 1': { unixTime: 1617235200, unixTimeISO: '2021-04-01T00:00:00Z' }, 'October 1': { unixTime: 1633046400, unixTimeISO: '2021-10-01T00:00:00Z' } } },
    { date: '2022-04-01', unixTime: 1648771200, expected: { 'January 1': { unixTime: 1640995200, unixTimeISO: '2022-01-01T00:00:00Z' }, 'April 1': { unixTime: 1648771200, unixTimeISO: '2022-04-01T00:00:00Z' }, 'October 1': { unixTime: 1633046400, unixTimeISO: '2021-10-01T00:00:00Z' } } },
    { date: '2022-09-30', unixTime: 1664496000, expected: { 'January 1': { unixTime: 1640995200, unixTimeISO: '2022-01-01T00:00:00Z' }, 'April 1': { unixTime: 1648771200, unixTimeISO: '2022-04-01T00:00:00Z' }, 'October 1': { unixTime: 1633046400, unixTimeISO: '2021-10-01T00:00:00Z' } } },
    { date: '2022-10-01', unixTime: 1664582400, expected: { 'January 1': { unixTime: 1640995200, unixTimeISO: '2022-01-01T00:00:00Z' }, 'April 1': { unixTime: 1648771200, unixTimeISO: '2022-04-01T00:00:00Z' }, 'October 1': { unixTime: 1664582400, unixTimeISO: '2022-10-01T00:00:00Z' } } },
    { date: '2022-12-31', unixTime: 1672444800, expected: { 'January 1': { unixTime: 1640995200, unixTimeISO: '2022-01-01T00:00:00Z' }, 'April 1': { unixTime: 1648771200, unixTimeISO: '2022-04-01T00:00:00Z' }, 'October 1': { unixTime: 1664582400, unixTimeISO: '2022-10-01T00:00:00Z' } } },
    { date: '2023-01-01', unixTime: 1672531200, expected: { 'January 1': { unixTime: 1672531200, unixTimeISO: '2023-01-01T00:00:00Z' }, 'April 1': { unixTime: 1648771200, unixTimeISO: '2022-04-01T00:00:00Z' }, 'October 1': { unixTime: 1664582400, unixTimeISO: '2022-10-01T00:00:00Z' } } },
    { date: '2023-03-31', unixTime: 1680220800, expected: { 'January 1': { unixTime: 1672531200, unixTimeISO: '2023-01-01T00:00:00Z' }, 'April 1': { unixTime: 1648771200, unixTimeISO: '2022-04-01T00:00:00Z' }, 'October 1': { unixTime: 1664582400, unixTimeISO: '2022-10-01T00:00:00Z' } } },
    { date: '2023-04-01', unixTime: 1680307200, expected: { 'January 1': { unixTime: 1672531200, unixTimeISO: '2023-01-01T00:00:00Z' }, 'April 1': { unixTime: 1680307200, unixTimeISO: '2023-04-01T00:00:00Z' }, 'October 1': { unixTime: 1664582400, unixTimeISO: '2022-10-01T00:00:00Z' } } },
    { date: '2023-09-30', unixTime: 1696032000, expected: { 'January 1': { unixTime: 1672531200, unixTimeISO: '2023-01-01T00:00:00Z' }, 'April 1': { unixTime: 1680307200, unixTimeISO: '2023-04-01T00:00:00Z' }, 'October 1': { unixTime: 1664582400, unixTimeISO: '2022-10-01T00:00:00Z' } } },
    { date: '2023-10-01', unixTime: 1696118400, expected: { 'January 1': { unixTime: 1672531200, unixTimeISO: '2023-01-01T00:00:00Z' }, 'April 1': { unixTime: 1680307200, unixTimeISO: '2023-04-01T00:00:00Z' }, 'October 1': { unixTime: 1696118400, unixTimeISO: '2023-10-01T00:00:00Z' } } },
    { date: '2023-12-31', unixTime: 1703980800, expected: { 'January 1': { unixTime: 1672531200, unixTimeISO: '2023-01-01T00:00:00Z' }, 'April 1': { unixTime: 1680307200, unixTimeISO: '2023-04-01T00:00:00Z' }, 'October 1': { unixTime: 1696118400, unixTimeISO: '2023-10-01T00:00:00Z' } } },
    { date: '2024-01-01', unixTime: 1704067200, expected: { 'January 1': { unixTime: 1704067200, unixTimeISO: '2024-01-01T00:00:00Z' }, 'April 1': { unixTime: 1680307200, unixTimeISO: '2023-04-01T00:00:00Z' }, 'October 1': { unixTime: 1696118400, unixTimeISO: '2023-10-01T00:00:00Z' } } },
    { date: '2024-03-31', unixTime: 1711843200, expected: { 'January 1': { unixTime: 1704067200, unixTimeISO: '2024-01-01T00:00:00Z' }, 'April 1': { unixTime: 1680307200, unixTimeISO: '2023-04-01T00:00:00Z' }, 'October 1': { unixTime: 1696118400, unixTimeISO: '2023-10-01T00:00:00Z' } } },
    { date: '2024-04-01', unixTime: 1711929600, expected: { 'January 1': { unixTime: 1704067200, unixTimeISO: '2024-01-01T00:00:00Z' }, 'April 1': { unixTime: 1711929600, unixTimeISO: '2024-04-01T00:00:00Z' }, 'October 1': { unixTime: 1696118400, unixTimeISO: '2023-10-01T00:00:00Z' } } },
    { date: '2024-09-30', unixTime: 1727654400, expected: { 'January 1': { unixTime: 1704067200, unixTimeISO: '2024-01-01T00:00:00Z' }, 'April 1': { unixTime: 1711929600, unixTimeISO: '2024-04-01T00:00:00Z' }, 'October 1': { unixTime: 1696118400, unixTimeISO: '2023-10-01T00:00:00Z' } } },
    { date: '2024-10-01', unixTime: 1727740800, expected: { 'January 1': { unixTime: 1704067200, unixTimeISO: '2024-01-01T00:00:00Z' }, 'April 1': { unixTime: 1711929600, unixTimeISO: '2024-04-01T00:00:00Z' }, 'October 1': { unixTime: 1727740800, unixTimeISO: '2024-10-01T00:00:00Z' } } },
    { date: '2024-12-31', unixTime: 1735603200, expected: { 'January 1': { unixTime: 1704067200, unixTimeISO: '2024-01-01T00:00:00Z' }, 'April 1': { unixTime: 1711929600, unixTimeISO: '2024-04-01T00:00:00Z' }, 'October 1': { unixTime: 1727740800, unixTimeISO: '2024-10-01T00:00:00Z' } } },
    { date: '2025-01-01', unixTime: 1735689600, expected: { 'January 1': { unixTime: 1735689600, unixTimeISO: '2025-01-01T00:00:00Z' }, 'April 1': { unixTime: 1711929600, unixTimeISO: '2024-04-01T00:00:00Z' }, 'October 1': { unixTime: 1727740800, unixTimeISO: '2024-10-01T00:00:00Z' } } },
    { date: '2025-03-31', unixTime: 1743379200, expected: { 'January 1': { unixTime: 1735689600, unixTimeISO: '2025-01-01T00:00:00Z' }, 'April 1': { unixTime: 1711929600, unixTimeISO: '2024-04-01T00:00:00Z' }, 'October 1': { unixTime: 1727740800, unixTimeISO: '2024-10-01T00:00:00Z' } } },
    { date: '2025-04-01', unixTime: 1743465600, expected: { 'January 1': { unixTime: 1735689600, unixTimeISO: '2025-01-01T00:00:00Z' }, 'April 1': { unixTime: 1743465600, unixTimeISO: '2025-04-01T00:00:00Z' }, 'October 1': { unixTime: 1727740800, unixTimeISO: '2024-10-01T00:00:00Z' } } },
    { date: '2025-09-30', unixTime: 1759190400, expected: { 'January 1': { unixTime: 1735689600, unixTimeISO: '2025-01-01T00:00:00Z' }, 'April 1': { unixTime: 1743465600, unixTimeISO: '2025-04-01T00:00:00Z' }, 'October 1': { unixTime: 1727740800, unixTimeISO: '2024-10-01T00:00:00Z' } } },
    { date: '2025-10-01', unixTime: 1759276800, expected: { 'January 1': { unixTime: 1735689600, unixTimeISO: '2025-01-01T00:00:00Z' }, 'April 1': { unixTime: 1743465600, unixTimeISO: '2025-04-01T00:00:00Z' }, 'October 1': { unixTime: 1759276800, unixTimeISO: '2025-10-01T00:00:00Z' } } },
    { date: '2025-12-31', unixTime: 1767139200, expected: { 'January 1': { unixTime: 1735689600, unixTimeISO: '2025-01-01T00:00:00Z' }, 'April 1': { unixTime: 1743465600, unixTimeISO: '2025-04-01T00:00:00Z' }, 'October 1': { unixTime: 1759276800, unixTimeISO: '2025-10-01T00:00:00Z' } } }
];

describe('getFiscalYearStartUnixTime', () => {
    Object.values(FISCAL_YEAR_STARTS).forEach((testFiscalYearStart) => {
        FISCAL_YEAR_START_UNIX_TIME_TEST_CASES.forEach((testCase) => {
            test(`returns correct start unix time for ${getTestTitleFormat(testFiscalYearStart.id, testCase.date)}`, () => {
                const startUnixTime = getFiscalYearStartUnixTime(testCase.unixTime, testFiscalYearStart.value);
                const expected = testCase.expected[testFiscalYearStart.id];
                const unixTimeISO = formatUnixTimeISO(startUnixTime);
                
                expect({ unixTime: startUnixTime, ISO: unixTimeISO }).toStrictEqual({ unixTime: expected.unixTime, ISO: expected.unixTimeISO });
            });
        });
    });
});


// FISCAL YEAR END UNIX TIME
type FiscalYearEndUnixTimeTestCase = {
    date: string;
    unixTime: number;
    expected: {
        [fiscalYearStart: string]: {
            unixTime: number;
            unixTimeISO: string;
        };
    };
}

const FISCAL_YEAR_END_UNIX_TIME_TEST_CASES: FiscalYearEndUnixTimeTestCase[] = [
    { date: '2022-01-01', unixTime: 1640995200, expected: { 'January 1': { unixTime: 1672531199, unixTimeISO: '2022-12-31T23:59:59Z' }, 'April 1': { unixTime: 1648771199, unixTimeISO: '2022-03-31T23:59:59Z' }, 'October 1': { unixTime: 1664582399, unixTimeISO: '2022-09-30T23:59:59Z' } } },
    { date: '2022-03-31', unixTime: 1648684800, expected: { 'January 1': { unixTime: 1672531199, unixTimeISO: '2022-12-31T23:59:59Z' }, 'April 1': { unixTime: 1648771199, unixTimeISO: '2022-03-31T23:59:59Z' }, 'October 1': { unixTime: 1664582399, unixTimeISO: '2022-09-30T23:59:59Z' } } },
    { date: '2022-04-01', unixTime: 1648771200, expected: { 'January 1': { unixTime: 1672531199, unixTimeISO: '2022-12-31T23:59:59Z' }, 'April 1': { unixTime: 1680307199, unixTimeISO: '2023-03-31T23:59:59Z' }, 'October 1': { unixTime: 1664582399, unixTimeISO: '2022-09-30T23:59:59Z' } } },
    { date: '2022-09-30', unixTime: 1664496000, expected: { 'January 1': { unixTime: 1672531199, unixTimeISO: '2022-12-31T23:59:59Z' }, 'April 1': { unixTime: 1680307199, unixTimeISO: '2023-03-31T23:59:59Z' }, 'October 1': { unixTime: 1664582399, unixTimeISO: '2022-09-30T23:59:59Z' } } },
    { date: '2022-10-01', unixTime: 1664582400, expected: { 'January 1': { unixTime: 1672531199, unixTimeISO: '2022-12-31T23:59:59Z' }, 'April 1': { unixTime: 1680307199, unixTimeISO: '2023-03-31T23:59:59Z' }, 'October 1': { unixTime: 1696118399, unixTimeISO: '2023-09-30T23:59:59Z' } } },
    { date: '2022-12-31', unixTime: 1672444800, expected: { 'January 1': { unixTime: 1672531199, unixTimeISO: '2022-12-31T23:59:59Z' }, 'April 1': { unixTime: 1680307199, unixTimeISO: '2023-03-31T23:59:59Z' }, 'October 1': { unixTime: 1696118399, unixTimeISO: '2023-09-30T23:59:59Z' } } },
    { date: '2023-01-01', unixTime: 1672531200, expected: { 'January 1': { unixTime: 1704067199, unixTimeISO: '2023-12-31T23:59:59Z' }, 'April 1': { unixTime: 1680307199, unixTimeISO: '2023-03-31T23:59:59Z' }, 'October 1': { unixTime: 1696118399, unixTimeISO: '2023-09-30T23:59:59Z' } } },
    { date: '2023-03-31', unixTime: 1680220800, expected: { 'January 1': { unixTime: 1704067199, unixTimeISO: '2023-12-31T23:59:59Z' }, 'April 1': { unixTime: 1680307199, unixTimeISO: '2023-03-31T23:59:59Z' }, 'October 1': { unixTime: 1696118399, unixTimeISO: '2023-09-30T23:59:59Z' } } },
    { date: '2023-04-01', unixTime: 1680307200, expected: { 'January 1': { unixTime: 1704067199, unixTimeISO: '2023-12-31T23:59:59Z' }, 'April 1': { unixTime: 1711929599, unixTimeISO: '2024-03-31T23:59:59Z' }, 'October 1': { unixTime: 1696118399, unixTimeISO: '2023-09-30T23:59:59Z' } } },
    { date: '2023-09-30', unixTime: 1696032000, expected: { 'January 1': { unixTime: 1704067199, unixTimeISO: '2023-12-31T23:59:59Z' }, 'April 1': { unixTime: 1711929599, unixTimeISO: '2024-03-31T23:59:59Z' }, 'October 1': { unixTime: 1696118399, unixTimeISO: '2023-09-30T23:59:59Z' } } },
    { date: '2023-10-01', unixTime: 1696118400, expected: { 'January 1': { unixTime: 1704067199, unixTimeISO: '2023-12-31T23:59:59Z' }, 'April 1': { unixTime: 1711929599, unixTimeISO: '2024-03-31T23:59:59Z' }, 'October 1': { unixTime: 1727740799, unixTimeISO: '2024-09-30T23:59:59Z' } } },
    { date: '2023-12-31', unixTime: 1703980800, expected: { 'January 1': { unixTime: 1704067199, unixTimeISO: '2023-12-31T23:59:59Z' }, 'April 1': { unixTime: 1711929599, unixTimeISO: '2024-03-31T23:59:59Z' }, 'October 1': { unixTime: 1727740799, unixTimeISO: '2024-09-30T23:59:59Z' } } },
    { date: '2024-01-01', unixTime: 1704067200, expected: { 'January 1': { unixTime: 1735689599, unixTimeISO: '2024-12-31T23:59:59Z' }, 'April 1': { unixTime: 1711929599, unixTimeISO: '2024-03-31T23:59:59Z' }, 'October 1': { unixTime: 1727740799, unixTimeISO: '2024-09-30T23:59:59Z' } } },
    { date: '2024-03-31', unixTime: 1711843200, expected: { 'January 1': { unixTime: 1735689599, unixTimeISO: '2024-12-31T23:59:59Z' }, 'April 1': { unixTime: 1711929599, unixTimeISO: '2024-03-31T23:59:59Z' }, 'October 1': { unixTime: 1727740799, unixTimeISO: '2024-09-30T23:59:59Z' } } },
    { date: '2024-04-01', unixTime: 1711929600, expected: { 'January 1': { unixTime: 1735689599, unixTimeISO: '2024-12-31T23:59:59Z' }, 'April 1': { unixTime: 1743465599, unixTimeISO: '2025-03-31T23:59:59Z' }, 'October 1': { unixTime: 1727740799, unixTimeISO: '2024-09-30T23:59:59Z' } } },
    { date: '2024-09-30', unixTime: 1727654400, expected: { 'January 1': { unixTime: 1735689599, unixTimeISO: '2024-12-31T23:59:59Z' }, 'April 1': { unixTime: 1743465599, unixTimeISO: '2025-03-31T23:59:59Z' }, 'October 1': { unixTime: 1727740799, unixTimeISO: '2024-09-30T23:59:59Z' } } },
    { date: '2024-10-01', unixTime: 1727740800, expected: { 'January 1': { unixTime: 1735689599, unixTimeISO: '2024-12-31T23:59:59Z' }, 'April 1': { unixTime: 1743465599, unixTimeISO: '2025-03-31T23:59:59Z' }, 'October 1': { unixTime: 1759276799, unixTimeISO: '2025-09-30T23:59:59Z' } } },
    { date: '2024-12-31', unixTime: 1735603200, expected: { 'January 1': { unixTime: 1735689599, unixTimeISO: '2024-12-31T23:59:59Z' }, 'April 1': { unixTime: 1743465599, unixTimeISO: '2025-03-31T23:59:59Z' }, 'October 1': { unixTime: 1759276799, unixTimeISO: '2025-09-30T23:59:59Z' } } },
    { date: '2025-01-01', unixTime: 1735689600, expected: { 'January 1': { unixTime: 1767225599, unixTimeISO: '2025-12-31T23:59:59Z' }, 'April 1': { unixTime: 1743465599, unixTimeISO: '2025-03-31T23:59:59Z' }, 'October 1': { unixTime: 1759276799, unixTimeISO: '2025-09-30T23:59:59Z' } } },
    { date: '2025-03-31', unixTime: 1743379200, expected: { 'January 1': { unixTime: 1767225599, unixTimeISO: '2025-12-31T23:59:59Z' }, 'April 1': { unixTime: 1743465599, unixTimeISO: '2025-03-31T23:59:59Z' }, 'October 1': { unixTime: 1759276799, unixTimeISO: '2025-09-30T23:59:59Z' } } },
    { date: '2025-04-01', unixTime: 1743465600, expected: { 'January 1': { unixTime: 1767225599, unixTimeISO: '2025-12-31T23:59:59Z' }, 'April 1': { unixTime: 1775001599, unixTimeISO: '2026-03-31T23:59:59Z' }, 'October 1': { unixTime: 1759276799, unixTimeISO: '2025-09-30T23:59:59Z' } } },
    { date: '2025-09-30', unixTime: 1759190400, expected: { 'January 1': { unixTime: 1767225599, unixTimeISO: '2025-12-31T23:59:59Z' }, 'April 1': { unixTime: 1775001599, unixTimeISO: '2026-03-31T23:59:59Z' }, 'October 1': { unixTime: 1759276799, unixTimeISO: '2025-09-30T23:59:59Z' } } },
    { date: '2025-10-01', unixTime: 1759276800, expected: { 'January 1': { unixTime: 1767225599, unixTimeISO: '2025-12-31T23:59:59Z' }, 'April 1': { unixTime: 1775001599, unixTimeISO: '2026-03-31T23:59:59Z' }, 'October 1': { unixTime: 1790812799, unixTimeISO: '2026-09-30T23:59:59Z' } } },
    { date: '2025-12-31', unixTime: 1767139200, expected: { 'January 1': { unixTime: 1767225599, unixTimeISO: '2025-12-31T23:59:59Z' }, 'April 1': { unixTime: 1775001599, unixTimeISO: '2026-03-31T23:59:59Z' }, 'October 1': { unixTime: 1790812799, unixTimeISO: '2026-09-30T23:59:59Z' } } }
];

describe('getFiscalYearEndUnixTime', () => {
    Object.values(FISCAL_YEAR_STARTS).forEach((testFiscalYearStart) => {
        FISCAL_YEAR_END_UNIX_TIME_TEST_CASES.forEach((testCase) => {
            test(`returns correct end unix time for ${getTestTitleFormat(testFiscalYearStart.id, testCase.date)}`, () => {
                const endUnixTime = getFiscalYearEndUnixTime(testCase.unixTime, testFiscalYearStart.value);
                const expected = testCase.expected[testFiscalYearStart.id];
                const unixTimeISO = formatUnixTimeISO(endUnixTime);
                
                expect({ unixTime: endUnixTime, ISO: unixTimeISO }).toStrictEqual({ unixTime: expected.unixTime, ISO: expected.unixTimeISO });
            
            });
        });
    });
});

// GET FISCAL YEAR UNIX TIME RANGE
type GetFiscalYearUnixTimeRangeTestCase = {
    date: string;
    expected: {
        [fiscalYearStart: string]: {
            fiscalYear: number;
            minUnixTime: number;
            maxUnixTime: number;
        }
    }
}

const GET_FISCAL_YEAR_UNIX_TIME_RANGE_TEST_CASES: GetFiscalYearUnixTimeRangeTestCase[] = [
    { date: '2023-07-15',
        expected: {
            'January 1': { fiscalYear: 2023, minUnixTime: 1672531200, maxUnixTime: 1704067199 },
            'April 1':   { fiscalYear: 2024, minUnixTime: 1680307200, maxUnixTime: 1711929599 },
            'October 1': { fiscalYear: 2023, minUnixTime: 1664582400, maxUnixTime: 1696118399 }
        }
    },
    { date: '2024-01-10',
        expected: {
            'January 1': { fiscalYear: 2024, minUnixTime: 1704067200, maxUnixTime: 1735689599 },
            'April 1':   { fiscalYear: 2024, minUnixTime: 1680307200, maxUnixTime: 1711929599 },
            'October 1': { fiscalYear: 2024, minUnixTime: 1696118400, maxUnixTime: 1727740799 }
        }
    },
    { date: '2024-10-15',
        expected: {
            'January 1': { fiscalYear: 2024, minUnixTime: 1704067200, maxUnixTime: 1735689599 },
            'April 1':   { fiscalYear: 2025, minUnixTime: 1711929600, maxUnixTime: 1743465599 },
            'October 1': { fiscalYear: 2025, minUnixTime: 1727740800, maxUnixTime: 1759276799 }
        }
    },
];

describe('getFiscalYearUnixTimeRange', () => {
    Object.values(FISCAL_YEAR_STARTS).forEach((testFiscalYearStart) => {
        GET_FISCAL_YEAR_UNIX_TIME_RANGE_TEST_CASES.forEach((testCase) => {
            test(`returns correct fiscal year unix time range for ${getTestTitleFormat(testFiscalYearStart.id, testCase.date)}`, () => {
                const testCaseUnixTime = moment(testCase.date).unix();
                const fiscalYearUnixTimeRange = getFiscalYearUnixTimeRange(testCaseUnixTime, testFiscalYearStart.value);
                expect(fiscalYearUnixTimeRange).toStrictEqual(testCase.expected[testFiscalYearStart.id]);
            });
        });
    });
});