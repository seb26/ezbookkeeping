package validators

import (
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"github.com/mayswind/ezbookkeeping/pkg/core"
)

// ValidateFiscalYearStartDate validates if a fiscal year start date is valid
func ValidateFiscalYearStartDate(fl validator.FieldLevel) bool {
	date, ok := fl.Field().Interface().(core.FiscalYearStartDateType)
	if !ok {
		return false
	}

	month := uint8(uint16(date) >> 8)
	day := uint8(uint16(date) & 0xFF)

	if month < 1 || month > 12 || day < 1 {
		return false
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

	return day <= maxDays
}

// RegisterFiscalYearStartDateValidator registers the fiscal year start date validator
func RegisterFiscalYearStartDateValidator() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("validFiscalYearStartDate", ValidateFiscalYearStartDate)
	}
}
