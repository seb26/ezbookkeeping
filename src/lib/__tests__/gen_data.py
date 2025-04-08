import datetime
import json

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

def generate_test_cases_getFiscalYearFromUnixTime():
    lines = []
    for testDateString in TEST_DATES:
        line = {}
        results = {}
        for fiscalYearId, samplePeriodData in TEST_FISCAL_YEAR_PERIODS.items():
            testDate = datetime.datetime.strptime(testDateString, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
            for samplePeriod in samplePeriodData:
                sampleFYStart = datetime.datetime.strptime(samplePeriod['start'], '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
                sampleFYEnd = datetime.datetime.strptime(samplePeriod['end'], '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
                if sampleFYStart <= testDate <= sampleFYEnd:
                    results[fiscalYearId] = samplePeriod['year']
                else:
                    continue
        line = {
            'date': testDateString,
            'expected': results,
        }
        lines.append(line)
    return lines
        

def generate_test_cases_getFiscalYearStartUnixTime():
    lines = []
    for testDateString in TEST_DATES:
        line = {}
        results = {}
        testDate = datetime.datetime.strptime(testDateString, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
        for fiscalYearId, samplePeriodData in TEST_FISCAL_YEAR_PERIODS.items():
            for samplePeriod in samplePeriodData:
                sampleFYStart = datetime.datetime.strptime(samplePeriod['start'], '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
                sampleFYStartUnixTime = int(sampleFYStart.timestamp())  
                sampleFYStartUnixTimeISO = sampleFYStart.isoformat().replace('+00:00', 'Z')
                sampleFYEnd = datetime.datetime.strptime(samplePeriod['end'], '%Y-%m-%d').replace(hour=23, minute=59, second=59, tzinfo=datetime.timezone.utc)
                if sampleFYStart <= testDate <= sampleFYEnd:
                    results[fiscalYearId] = {
                        'unixTime': sampleFYStartUnixTime,
                        'unixTimeISO': sampleFYStartUnixTimeISO,
                    }
        line = {
            'date': testDateString,
            'expected': results,
        }
        lines.append(line)
    return lines

def generate_test_cases_getFiscalYearEndUnixTime():
    lines = []
    for testDateString in TEST_DATES:
        line = {}
        results = {}
        testDate = datetime.datetime.strptime(testDateString, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
        for fiscalYearId, samplePeriodData in TEST_FISCAL_YEAR_PERIODS.items():
            for samplePeriod in samplePeriodData:
                sampleFYStart = datetime.datetime.strptime(samplePeriod['start'], '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
                sampleFYEnd = datetime.datetime.strptime(samplePeriod['end'], '%Y-%m-%d').replace(hour=23, minute=59, second=59, tzinfo=datetime.timezone.utc)
                sampleFYEndUnixTime = int(sampleFYEnd.timestamp())
                sampleFYEndUnixTimeISO = sampleFYEnd.isoformat().replace('+00:00', 'Z')
                if sampleFYStart <= testDate <= sampleFYEnd:
                    results[fiscalYearId] = {
                        'unixTime': sampleFYEndUnixTime,
                        'unixTimeISO': sampleFYEndUnixTimeISO,
                    }
        line = {
            'date': testDateString,
            'expected': results,
        }
        lines.append(line)
    return lines

def generate_test_cases_getFiscalYearUnixTimeRange():
    lines = []
    for testDateString in TEST_DATES:
        line = {}
        results = {}
        testDate = datetime.datetime.strptime(testDateString, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
        for fiscalYearId, samplePeriodData in TEST_FISCAL_YEAR_PERIODS.items():
            for samplePeriod in samplePeriodData:
                sampleFYStart = datetime.datetime.strptime(samplePeriod['start'], '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
                sampleFYEnd = datetime.datetime.strptime(samplePeriod['end'], '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=datetime.timezone.utc)
                if sampleFYStart <= testDate <= sampleFYEnd:
                    results[fiscalYearId] = {
                        'fiscalYear': samplePeriod['year'],
                        'minUnixTime': int(sampleFYStart.timestamp()),
                        'maxUnixTime': int(sampleFYEnd.timestamp()),
                    }
        line = {
            'date': testDateString,
            'expected': results,
        }
        lines.append(line)
    return lines

def main():
    with open('./src/lib/__tests__/fiscalyear_data.json', 'w') as f:
        json.dump({
            'test_cases_getFiscalYearFromUnixTime': generate_test_cases_getFiscalYearFromUnixTime(),
            'test_cases_getFiscalYearStartUnixTime': generate_test_cases_getFiscalYearStartUnixTime(),
            'test_cases_getFiscalYearEndUnixTime': generate_test_cases_getFiscalYearEndUnixTime(),
            'test_cases_getFiscalYearUnixTimeRange': generate_test_cases_getFiscalYearUnixTimeRange(),
        }, f, indent=4)

if __name__ == '__main__':
    main()