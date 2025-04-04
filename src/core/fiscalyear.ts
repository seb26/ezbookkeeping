export class FiscalYearFormat {
    public static readonly DefaultUint16 = 0x0101;
    public static readonly DefaultString = "01-01";
    public static readonly Default = FiscalYearFormat.of(1, 1);

    public readonly month: number;
    public readonly day: number;

    private constructor(month: number, day: number) {
        this.month = month;
        this.day = day;
    }

    public static of(month: number, day: number): FiscalYearFormat {
        return new FiscalYearFormat(month, day);
    }

    public isValid(): boolean {
        try {
            FiscalYearFormat.validateMonthDay(this.month, this.day);
            return true;
        } catch (error) {
            return false;
        }
    }

    public isDefault(): boolean {
        return this.month === 1 && this.day === 1;
    }

    /**
     * Create a FiscalYearFormat from a uint16 value (two bytes - month high, day low)
     * @param value uint16 value (month in high byte, day in low byte)
     * @returns FiscalYearFormat instance or null if invalid
     */
    public static fromUint16(value: number): FiscalYearFormat | null {
        if (value < 0 || value > 0xFFFF) {
            return null;
        }

        const month = (value >> 8) & 0xFF;  // high byte
        const day = value & 0xFF;           // low byte

        try {
            const [validMonth, validDay] = FiscalYearFormat.validateMonthDay(month, day);
            return FiscalYearFormat.of(validMonth, validDay);
        } catch (error) {
            return null;
        }
    }

    /**
     * Convert to a uint16 value (two bytes - month high, day low)
     * @returns uint16 value (month in high byte, day in low byte)
     */
    public toUint16(): number {
        return (this.month << 8) | this.day;
    }

    /**
     * Create a FiscalYearFormat from a month/day string
     * @param monthDayString MM-dd string (e.g. "04-01" = 1 April)
     * @returns FiscalYearFormat instance or null if invalid
     */
    public static fromMonthDayString(monthDayString: string): FiscalYearFormat | null {
        if (!monthDayString || !monthDayString.includes('-')) {
            return null;
        }

        const parts = monthDayString.split('-');
        if (parts.length !== 2) {
            return null;
        }

        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);

        if (isNaN(month) || isNaN(day)) {
            return null;
        }

        try {
            const [validMonth, validDay] = FiscalYearFormat.validateMonthDay(month, day);
            return FiscalYearFormat.of(validMonth, validDay);
        } catch (error) {
            return null;
        }
    }

    public toMonthDayString(): string {
        return `${this.month.toString().padStart(2, '0')}-${this.day.toString().padStart(2, '0')}`;
    }

    public toString(): string {
        return this.toMonthDayString();
    }

    private static validateMonthDay(month: number, day: number): [number, number] {
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
}