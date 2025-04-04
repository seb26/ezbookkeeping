package core

import (
	"fmt"

	"github.com/mayswind/ezbookkeeping/pkg/errs"
)

// FiscalYearFormatType represents the fiscal year start date as a uint16 (month: high byte, day: low byte)
type FiscalYearFormatType uint16

// Fiscal Year Start Date Type
const (
	FISCAL_YEAR_FORMAT_TYPE_DEFAULT FiscalYearFormatType = 0x0101 // January 1st
	FISCAL_YEAR_FORMAT_TYPE_INVALID FiscalYearFormatType = 0x0D01 // Invalid (month 13, day 1)
)

// NewFiscalYearFormatType creates a new FiscalYearFormatType from month and day values
func NewFiscalYearFormatType(month uint8, day uint8) (FiscalYearFormatType, error) {
	month, day, err := validateMonthDay(month, day)
	if err != nil {
		return 0, err
	}

	return FiscalYearFormatType(uint16(month)<<8 | uint16(day)), nil
}

// GetMonthDay extracts the month and day from FiscalYearType
func (f FiscalYearFormatType) GetMonthDay() (uint8, uint8, error) {
	if f == 0 || f >= FISCAL_YEAR_FORMAT_TYPE_INVALID {
		return 0, 0, errs.ErrFormatInvalid
	}

	// Extract month and day (month in high byte, day in low byte)
	month := uint8(f >> 8)
	day := uint8(f & 0xFF)

	return validateMonthDay(month, day)
}

// String returns a string representation of FiscalYearFormatType in MM/DD format
func (f FiscalYearFormatType) String() string {
	month, day, err := f.GetMonthDay()
	if err != nil {
		return "Invalid"
	}
	return fmt.Sprintf("%02d/%02d", month, day)
}

// validateMonthDay validates a month and day and returns them if valid
func validateMonthDay(month uint8, day uint8) (uint8, uint8, error) {
	if month < 1 || month > 12 || day < 1 {
		return 0, 0, errs.ErrFormatInvalid
	}

	maxDays := uint8(31)
	switch month {
	case 1, 3, 5, 7, 8, 10, 12: // January, March, May, July, August, October, December
		maxDays = 31
	case 4, 6, 9, 11: // April, June, September, November
		maxDays = 30
	case 2: // February
		maxDays = 29 // Allowing 29 for leap years
	}

	if day > maxDays {
		return 0, 0, errs.ErrFormatInvalid
	}

	return month, day, nil
}
