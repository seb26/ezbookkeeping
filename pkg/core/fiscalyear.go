package core

import (
	"fmt"

	"github.com/mayswind/ezbookkeeping/pkg/errs"
)

// FiscalYearStartDateType represents the fiscal year start date as a uint16 (month: high byte, day: low byte)
type FiscalYearStartDateType uint16

// Fiscal Year Start Date Type
const (
	FISCAL_YEAR_START_DATE_TYPE_DEFAULT FiscalYearStartDateType = 101 // January 1st
	FISCAL_YEAR_START_DATE_TYPE_INVALID FiscalYearStartDateType = 1232
)

// NewFiscalYearStartDateType creates a new FiscalYearStartDateType from month and day values
func NewFiscalYearStartDateType(month uint8, day uint8) (FiscalYearStartDateType, error) {
	month, day, err := validateMonthDay(month, day)
	if err != nil {
		return 0, err
	}

	return FiscalYearStartDateType(uint16(month)<<8 | uint16(day)), nil
}

// GetMonthDay extracts the month and day from FiscalYearStartDateType
func (f FiscalYearStartDateType) GetMonthDay() (uint8, uint8, error) {
	month := uint8(uint16(f) >> 8)
	day := uint8(uint16(f) & 0xFF)

	return validateMonthDay(month, day)
}

// String returns a string representation of FiscalYearStartDateType in MM/DD format
func (f FiscalYearStartDateType) String() string {
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
