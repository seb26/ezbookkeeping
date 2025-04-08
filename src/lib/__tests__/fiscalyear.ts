// Unit tests for fiscal year functions
import moment from 'moment-timezone';
import { describe, expect, test, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Import all the fiscal year functions from the lib
import {
    getFiscalYearFromUnixTime,
    getFiscalYearStartUnixTime,
    getFiscalYearEndUnixTime,
    getFiscalYearUnixTimeRange
} from '@/lib/fiscalyear.ts';

import { formatUnixTime } from '@/lib/datetime.ts';
import { FiscalYearStart } from '@/core/fiscalyear.ts';

// Set test environment timezone to UTC, since the test data constants are in UTC
beforeAll(() => {
    moment.tz.setDefault('UTC');
});

// UTILITIES

function importTestData(datasetName: string): any[] {
    const data = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'fiscalyear_data.json'), 'utf8')
    );
    if (!data || typeof data[datasetName] === 'undefined') {
        throw new Error(`${datasetName} is undefined or missing in the data object.`);
    }
    return data[datasetName];
}

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
type TestCase_getFiscalYearFromUnixTime = {
    date: string;
    unixTime: number;
    expected: {
        [fiscalYearStartId: string]: number;
    };
};

let TEST_CASES_GET_FISCAL_YEAR_FROM_UNIX_TIME: TestCase_getFiscalYearFromUnixTime[];
TEST_CASES_GET_FISCAL_YEAR_FROM_UNIX_TIME = importTestData('test_cases_getFiscalYearFromUnixTime') as TestCase_getFiscalYearFromUnixTime[];

describe('getFiscalYearFromUnixTime', () => {
    Object.values(TEST_FISCAL_YEAR_START_PRESETS).forEach((testFiscalYearStart) => {
        TEST_CASES_GET_FISCAL_YEAR_FROM_UNIX_TIME.forEach((testCase) => {
            test(`returns correct fiscal year for ${getTestTitleFormat(testFiscalYearStart.id, testCase.date)}`, () => {
                const testCaseUnixTime = moment(testCase.date).unix();
                const fiscalYear = getFiscalYearFromUnixTime(testCaseUnixTime, testFiscalYearStart.value);
                const expected = testCase.expected[testFiscalYearStart.id];
                expect(fiscalYear).toBe(expected);
            });
        });
    });
});


// FISCAL YEAR START UNIX TIME
type TestCase_getFiscalYearStartUnixTime = {
    date: string;
    expected: {
        [fiscalYearStart: string]: {
            unixTime: number;
            unixTimeISO: string;
        };
    };
}

let TEST_CASES_GET_FISCAL_YEAR_START_UNIX_TIME: TestCase_getFiscalYearStartUnixTime[];
TEST_CASES_GET_FISCAL_YEAR_START_UNIX_TIME = importTestData('test_cases_getFiscalYearStartUnixTime') as TestCase_getFiscalYearStartUnixTime[];

describe('getFiscalYearStartUnixTime', () => {
    Object.values(TEST_FISCAL_YEAR_START_PRESETS).forEach((testFiscalYearStart) => {
        TEST_CASES_GET_FISCAL_YEAR_START_UNIX_TIME.forEach((testCase) => {
            test(`returns correct start unix time for ${getTestTitleFormat(testFiscalYearStart.id, testCase.date)}`, () => {
                const testCaseUnixTime = moment(testCase.date).unix();
                const startUnixTime = getFiscalYearStartUnixTime(testCaseUnixTime, testFiscalYearStart.value);
                const expected = testCase.expected[testFiscalYearStart.id];
                const unixTimeISO = formatUnixTimeISO(startUnixTime);
                
                expect({ unixTime: startUnixTime, ISO: unixTimeISO }).toStrictEqual({ unixTime: expected.unixTime, ISO: expected.unixTimeISO });
            });
        });
    });
});


// FISCAL YEAR END UNIX TIME
type TestCase_getFiscalYearEndUnixTime = {
    date: string;
    expected: {
        [fiscalYearStart: string]: {
            unixTime: number;
            unixTimeISO: string;
        };
    };
}

let TEST_CASES_GET_FISCAL_YEAR_END_UNIX_TIME: TestCase_getFiscalYearEndUnixTime[];
TEST_CASES_GET_FISCAL_YEAR_END_UNIX_TIME = importTestData('test_cases_getFiscalYearEndUnixTime') as TestCase_getFiscalYearEndUnixTime[];

describe('getFiscalYearEndUnixTime', () => {
    Object.values(TEST_FISCAL_YEAR_START_PRESETS).forEach((testFiscalYearStart) => {
        TEST_CASES_GET_FISCAL_YEAR_END_UNIX_TIME.forEach((testCase) => {
            test(`returns correct end unix time for ${getTestTitleFormat(testFiscalYearStart.id, testCase.date)}`, () => {
                const testCaseUnixTime = moment(testCase.date).unix();
                const endUnixTime = getFiscalYearEndUnixTime(testCaseUnixTime, testFiscalYearStart.value);
                const expected = testCase.expected[testFiscalYearStart.id];
                const unixTimeISO = formatUnixTimeISO(endUnixTime);
                
                expect({ unixTime: endUnixTime, ISO: unixTimeISO }).toStrictEqual({ unixTime: expected.unixTime, ISO: expected.unixTimeISO });
            
            });
        });
    });
});

// GET FISCAL YEAR UNIX TIME RANGE
type TestCase_getFiscalYearUnixTimeRange = {
    date: string;
    expected: {
        [fiscalYearStart: string]: {
            fiscalYear: number;
            minUnixTime: number;
            maxUnixTime: number;
        }
    }
}

let TEST_CASES_GET_FISCAL_YEAR_UNIX_TIME_RANGE: TestCase_getFiscalYearUnixTimeRange[];
TEST_CASES_GET_FISCAL_YEAR_UNIX_TIME_RANGE = importTestData('test_cases_getFiscalYearUnixTimeRange') as TestCase_getFiscalYearUnixTimeRange[];

describe('getFiscalYearUnixTimeRange', () => {
    Object.values(TEST_FISCAL_YEAR_START_PRESETS).forEach((testFiscalYearStart) => {
        TEST_CASES_GET_FISCAL_YEAR_UNIX_TIME_RANGE.forEach((testCase) => {
            test(`returns correct fiscal year unix time range for ${getTestTitleFormat(testFiscalYearStart.id, testCase.date)}`, () => {
                const testCaseUnixTime = moment(testCase.date).unix();
                const fiscalYearUnixTimeRange = getFiscalYearUnixTimeRange(testCaseUnixTime, testFiscalYearStart.value);
                expect(fiscalYearUnixTimeRange).toStrictEqual(testCase.expected[testFiscalYearStart.id]);
            });
        });
    });
});