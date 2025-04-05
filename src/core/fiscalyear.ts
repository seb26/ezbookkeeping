export class FiscalYearStart {
    public static readonly DefaultNumber = 0x0101;
    public static readonly DefaultString = "01-01";
    public static readonly Default = FiscalYearStart.of(1, 1);

    public readonly month: number;
    public readonly day: number;

    private constructor(month: number, day: number) {
        this.month = month;
        this.day = day;
    }

    public static of(month: number, day: number): FiscalYearStart {
        return new FiscalYearStart(month, day);
    }

    /**
     * Validate the month and day
     * @returns true if the month and day are valid, false otherwise
     */
    public isValid(): boolean {
        try {
            FiscalYearStart.validateMonthDay(this.month, this.day);
            return true;
        } catch (error) {
            return false;
        }
    }

    public isDefault(): boolean {
        return this.month === 1 && this.day === 1;
    }

    /**
     * Validate a month and day
     * @param month - The month to validate
     * @param day - The day to validate
     * @returns true if the month and day are valid, false otherwise
     */
    public static validateMonthDay(month: number, day: number): [number, number] {
        return validateMonthDay(month, day);
    }

    /**
     * Create a FiscalYearStart from a month and day
     * @param month - The month to create the FiscalYearStart from
     * @param day - The day to create the FiscalYearStart from
     * @returns FiscalYearStart instance
     */
    public static strictFromMonthDayValues(month: number, day: number): FiscalYearStart {
        return FiscalYearStart.of(month, day);
    }

    /**
     * Create a FiscalYearStart from a uint16 value (two bytes - month high, day low)
     * @param value uint16 value (month in high byte, day in low byte)
     * @returns FiscalYearStart instance
     */
    public static strictFromNumber(value: number): FiscalYearStart {
        if (value < 0 || value > 0xFFFF) {
            throw new Error("Invalid uint16 value");
        }

        const month = (value >> 8) & 0xFF;  // high byte
        const day = value & 0xFF;           // low byte

        try {
            const [validMonth, validDay] = validateMonthDay(month, day);
            return FiscalYearStart.of(validMonth, validDay);
        } catch (error) {
            throw new Error("Invalid uint16 value");
        }
    }

    /**
     * Create a FiscalYearStart from a month/day string
     * @param input MM-dd string (e.g. "04-01" = 1 April)
     * @returns FiscalYearStart instance
     */
    public static strictFromMonthDashDayString(input: string): FiscalYearStart {
        if (!input || !input.includes('-')) {
            throw new Error("Invalid input string");
        }

        const parts = input.split('-');
        if (parts.length !== 2) {
            throw new Error("Invalid input string");
        }

        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);

        if (isNaN(month) || isNaN(day)) {
            throw new Error("Invalid input string");
        }

        try {
            const [validMonth, validDay] = validateMonthDay(month, day);
            return FiscalYearStart.of(validMonth, validDay);
        } catch (error) {
            throw new Error("Invalid input string");
        }
    }

    public static fromMonthDashDayString(input: string): FiscalYearStart | null {
        try {
            return FiscalYearStart.strictFromMonthDashDayString(input);
        } catch (error) {
            return null;
        }
    }

    public static fromNumber(value: number): FiscalYearStart | null {
        try {
            return FiscalYearStart.strictFromNumber(value);
        } catch (error) {
            return null;
        }
    }

    public static fromMonthDayValues(month: number, day: number): FiscalYearStart | null {
        try {
            return FiscalYearStart.strictFromMonthDayValues(month, day);
        } catch (error) {
            return null;
        }
    }

    /**
     * Convert to a uint16 value (two bytes - month high, day low)
     * @returns uint16 value (month in high byte, day in low byte)
     */
    public toNumber(): number {
        return (this.month << 8) | this.day;
    }

    public toMonthDashDayString(): string {
        return `${this.month.toString().padStart(2, '0')}-${this.day.toString().padStart(2, '0')}`;
    }

    public toMonthDayValues(): [string, string] {
        return [
            `${this.month.toString().padStart(2, '0')}`,
            `${this.day.toString().padStart(2, '0')}`
        ]
    }

    public toString(): string {
        return this.toMonthDashDayString();
    }

}

function validateMonthDay(month: number, day: number): [number, number] {
    if (month < 1 || month > 12 || day < 1) {
        throw new Error("Invalid month or day");
    }

    let maxDays = 31;
    switch (month) {
        case 1: case 3: case 5: case 7: case 8: case 10: case 12: // January, March, May, July, August, October, December
            maxDays = 31;
            break;
        case 4: case 6: case 9: case 11: // April, June, September, November
            maxDays = 30;
            break;
        case 2: // February
            maxDays = 28; // Disallow fiscal year start on leap day
            break;
    }

    if (day > maxDays) {
        throw new Error("Invalid day for given month");
    }

    return [month, day];
}