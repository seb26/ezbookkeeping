import datetime
import sys

#test_dates_getFiscalYearStartUnixTime = {
#    # Calendar year 2023
#    '2023-01-01': { 'January 1': '2023-01-01', 'April 1': '2022-04-01', 'October 1': '2022-10-01' },
#    '2023-03-31': { 'January 1': '2023-01-01', 'April 1': '2022-04-01', 'October 1': '2022-10-01' },
#    '2023-04-01': { 'January 1': '2023-01-01', 'April 1': '2023-04-01', 'October 1': '2022-10-01' },
#    '2023-09-30': { 'January 1': '2023-01-01', 'April 1': '2023-04-01', 'October 1': '2022-10-01' },
#    '2023-10-01': { 'January 1': '2023-01-01', 'April 1': '2023-04-01', 'October 1': '2023-10-01' },
#    '2023-12-31': { 'January 1': '2023-01-01', 'April 1': '2023-04-01', 'October 1': '2023-10-01' },
#
#    # Calendar year 2024
#    '2024-01-01': { 'January 1': '2024-01-01', 'April 1': '2023-04-01', 'October 1': '2023-10-01' },
#    '2024-03-31': { 'January 1': '2024-01-01', 'April 1': '2023-04-01', 'October 1': '2023-10-01' },
#    '2024-04-01': { 'January 1': '2024-01-01', 'April 1': '2024-04-01', 'October 1': '2023-10-01' },
#    '2024-09-30': { 'January 1': '2024-01-01', 'April 1': '2024-04-01', 'October 1': '2023-10-01' },
#    '2024-10-01': { 'January 1': '2024-01-01', 'April 1': '2024-04-01', 'October 1': '2024-10-01' },
#    '2024-12-31': { 'January 1': '2024-01-01', 'April 1': '2024-04-01', 'October 1': '2024-10-01' },
#
#    # Calendar year 2025
#    '2025-01-01': { 'January 1': '2025-01-01', 'April 1': '2024-04-01', 'October 1': '2024-10-01' },
#    '2025-03-31': { 'January 1': '2025-01-01', 'April 1': '2024-04-01', 'October 1': '2024-10-01' },
#    '2025-04-01': { 'January 1': '2025-01-01', 'April 1': '2025-04-01', 'October 1': '2024-10-01' },
#    '2025-09-30': { 'January 1': '2025-01-01', 'April 1': '2025-04-01', 'October 1': '2024-10-01' },
#    '2025-10-01': { 'January 1': '2025-01-01', 'April 1': '2025-04-01', 'October 1': '2025-10-01' },
#    '2025-12-31': { 'January 1': '2025-01-01', 'April 1': '2025-04-01', 'October 1': '2025-10-01' },
#}

TEST_FISCAL_YEAR_PERIODS = {
    'January 1': [
        { 'year': 2022, 'start': '2022-01-01', 'end': '2022-12-31' },
        { 'year': 2023, 'start': '2023-01-01', 'end': '2023-12-31' },
        { 'year': 2024, 'start': '2024-01-01', 'end': '2024-12-31' },
        { 'year': 2025, 'start': '2025-01-01', 'end': '2025-12-31' },
        { 'year': 2026, 'start': '2026-01-01', 'end': '2026-12-31' },
    ],
    'April 1': [
        { 'year': 2022, 'start': '2021-04-01', 'end': '2022-03-31' },
        { 'year': 2023, 'start': '2022-04-01', 'end': '2023-03-31' },
        { 'year': 2024, 'start': '2023-04-01', 'end': '2024-03-31' },
        { 'year': 2025, 'start': '2024-04-01', 'end': '2025-03-31' },
        { 'year': 2026, 'start': '2025-04-01', 'end': '2026-03-31' },
    ],
    'October 1': [
        { 'year': 2022, 'start': '2021-10-01', 'end': '2022-09-30' },
        { 'year': 2023, 'start': '2022-10-01', 'end': '2023-09-30' },
        { 'year': 2024, 'start': '2023-10-01', 'end': '2024-09-30' },
        { 'year': 2025, 'start': '2024-10-01', 'end': '2025-09-30' },
        { 'year': 2026, 'start': '2025-10-01', 'end': '2026-09-30' },
    ]
}

TEST_DATES = [
    '2022-01-01',
    '2022-03-31',
    '2022-04-01',
    '2022-09-30',
    '2022-10-01',
    '2022-12-31',

    '2023-01-01',
    '2023-03-31',
    '2023-04-01',
    '2023-09-30',
    '2023-10-01',
    '2023-12-31',

    '2024-01-01',
    '2024-03-31',
    '2024-04-01',
    '2024-09-30',
    '2024-10-01',
    '2024-12-31',

    '2025-01-01',
    '2025-03-31',
    '2025-04-01',
    '2025-09-30',
    '2025-10-01',
    '2025-12-31',
]

UNIX_TIME_ISO = 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'

def generate_test_cases_getFiscalYearFromUnixTime():
    lines = []
    TEST_FORMAT_STRING = "    {{ date: '{testDate}', unixTime: {unixTime}, expected: {{ {expectedSubstring} }} }}"
    EXPECTED_SUBSTRING = "'{fiscalYearId}': {value}"
    for testDateString in TEST_DATES:
        line = ''
        substring = []
        for fiscalYearId, samplePeriodData in TEST_FISCAL_YEAR_PERIODS.items():
            testDate = datetime.datetime.strptime(testDateString, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
            testDateUnixTime = int(testDate.timestamp())
            for samplePeriod in samplePeriodData:
                sampleFYStart = datetime.datetime.strptime(samplePeriod['start'], '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
                sampleFYEnd = datetime.datetime.strptime(samplePeriod['end'], '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
                if sampleFYStart <= testDate <= sampleFYEnd:
                    substring.append(
                        EXPECTED_SUBSTRING.format(
                            fiscalYearId=fiscalYearId,
                            value=samplePeriod['year'],
                        )
                    )
                else:
                    continue
        line += TEST_FORMAT_STRING.format(testDate=testDateString, unixTime=testDateUnixTime, expectedSubstring=', '.join(substring))
        lines.append(line)
    print('# Generated test cases for getFiscalYearFromUnixTime')
    print(',\n'.join(lines))
        

def generate_test_cases_getFiscalYearStartUnixTime():
    lines = []
    TEST_FORMAT_STRING = "    {{ date: '{testDate}', unixTime: {unixTime}, expected: {{ {expectedSubstring} }} }}"
    EXPECTED_SUBSTRING = "'{fiscalYearId}': {{ unixTime: {unixTime}, unixTimeISO: '{unixTimeISO}' }}"
    for testDateString in TEST_DATES:
        line = ''
        substring = []
        testDate = datetime.datetime.strptime(testDateString, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
        testDateUnixTime = int(testDate.timestamp())
        for fiscalYearId, samplePeriodData in TEST_FISCAL_YEAR_PERIODS.items():
            for samplePeriod in samplePeriodData:
                sampleFYStart = datetime.datetime.strptime(samplePeriod['start'], '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
                sampleFYStartUnixTime = int(sampleFYStart.timestamp())  
                sampleFYStartUnixTimeISO = sampleFYStart.isoformat().replace('+00:00', 'Z')
                sampleFYEnd = datetime.datetime.strptime(samplePeriod['end'], '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=datetime.timezone.utc)
                if sampleFYStart <= testDate <= sampleFYEnd:
                    substring.append(
                        EXPECTED_SUBSTRING.format(
                            fiscalYearId=fiscalYearId,
                        unixTime=sampleFYStartUnixTime,
                        unixTimeISO=sampleFYStartUnixTimeISO
                        )
                    )
        line += TEST_FORMAT_STRING.format(testDate=testDateString, unixTime=testDateUnixTime, expectedSubstring=', '.join(substring))
        lines.append(line)
    print('# Generated test cases for getFiscalYearStartUnixTime')
    print(',\n'.join(lines))

def generate_test_cases_getFiscalYearEndUnixTime():
    lines = []
    TEST_FORMAT_STRING = "    {{ date: '{testDate}', unixTime: {unixTime}, expected: {{ {expectedSubstring} }} }}"
    EXPECTED_SUBSTRING = "'{fiscalYearId}': {{ unixTime: {unixTime}, unixTimeISO: '{unixTimeISO}' }}"
    for testDateString in TEST_DATES:
        line = ''
        substring = []
        testDate = datetime.datetime.strptime(testDateString, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
        testDateUnixTime = int(testDate.timestamp())
        for fiscalYearId, samplePeriodData in TEST_FISCAL_YEAR_PERIODS.items():
            for samplePeriod in samplePeriodData:
                sampleFYStart = datetime.datetime.strptime(samplePeriod['start'], '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
                sampleFYEnd = datetime.datetime.strptime(samplePeriod['end'], '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=datetime.timezone.utc)
                sampleFYEndUnixTime = int(sampleFYEnd.timestamp())
                sampleFYEndUnixTimeISO = sampleFYEnd.isoformat().replace('.999999+00:00', 'Z')
                if sampleFYStart <= testDate <= sampleFYEnd:
                    substring.append(
                        EXPECTED_SUBSTRING.format(
                            fiscalYearId=fiscalYearId,
                        unixTime=sampleFYEndUnixTime,
                        unixTimeISO=sampleFYEndUnixTimeISO
                        )
                    )
        line += TEST_FORMAT_STRING.format(testDate=testDateString, unixTime=testDateUnixTime, expectedSubstring=', '.join(substring))
        lines.append(line)
    print('# Generated test cases for getFiscalYearEndUnixTime')
    print(',\n'.join(lines))

def main():
    if sys.argv[1] == 'generate' and sys.argv[2] == 'getFiscalYearFromUnixTime':
        generate_test_cases_getFiscalYearFromUnixTime()
        sys.exit(0)
    elif sys.argv[1] == 'generate' and sys.argv[2] == 'getFiscalYearStartUnixTime':
        generate_test_cases_getFiscalYearStartUnixTime()
        sys.exit(0)
    elif sys.argv[1] == 'generate' and sys.argv[2] == 'getFiscalYearEndUnixTime':
        generate_test_cases_getFiscalYearEndUnixTime()
        sys.exit(0)
    else:
        print('Invalid argument')
        sys.exit(1)

if __name__ == '__main__':
    main()