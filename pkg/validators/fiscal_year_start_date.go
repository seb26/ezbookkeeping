package validators

import (
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"github.com/mayswind/ezbookkeeping/pkg/core"
)

// ValidateFiscalYearFormat validates if a fiscal year start date is valid
func ValidateFiscalYearFormat(fl validator.FieldLevel) bool {
	date, ok := fl.Field().Interface().(core.FiscalYearFormatType)
	if !ok {
		return false
	}

	// Use the core functionality to validate
	_, _, err := date.GetMonthDay()
	return err == nil
}

// RegisterFiscalYearFormatValidator registers the fiscal year start date validator
func RegisterFiscalYearFormatValidator() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("validFiscalYearFormat", ValidateFiscalYearFormat)
	}
}
