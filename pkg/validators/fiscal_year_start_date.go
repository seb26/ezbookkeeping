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

	// Use the core functionality to validate
	_, _, err := date.GetMonthDay()
	return err == nil
}

// RegisterFiscalYearStartDateValidator registers the fiscal year start date validator
func RegisterFiscalYearStartDateValidator() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("validFiscalYearStartDate", ValidateFiscalYearStartDate)
	}
}
