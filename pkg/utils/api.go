package utils

import (
	"net/http"
	"reflect"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"github.com/mayswind/lab/pkg/core"
	"github.com/mayswind/lab/pkg/errs"
)

func PrintSuccessResult(c *core.Context, result interface{}) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"result":  result,
	})
}

func PrintErrorResult(c *core.Context, err *errs.Error) {
	c.SetResponseError(err)

	errorMessage := err.Error()

	if err.Code() == errs.ErrIncompleteOrIncorrectSubmission.Code() && len(err.BaseError) > 0 {
		validationErrors, ok := err.BaseError[0].(validator.ValidationErrors)

		if ok {
			for _, err := range validationErrors {
				errorMessage = getValidationErrorText(err)
				break
			}
		}
	}

	c.AbortWithStatusJSON(err.HttpStatusCode, gin.H{
		"success":      false,
		"errorCode":    err.Code(),
		"errorMessage": errorMessage,
		"path":         c.Request.URL.Path,
	})
}

func getValidationErrorText(err validator.FieldError) string {
	fieldName := GetFirstLowerCharString(err.Field())

	switch err.Tag() {
	case "required":
		return errs.GetParameterIsRequiredMessage(fieldName)
	case "max":
		if isIntegerParameter(err.Kind()) {
			return errs.GetParameterMustLessThanMessage(fieldName, err.Param())
		} else if isStringParameter(err.Kind()) {
			return errs.GetParameterMustLessThanCharsMessage(fieldName, err.Param())
		}
	case "min":
		if isIntegerParameter(err.Kind()) {
			return errs.GetParameterMustMoreThanMessage(fieldName, err.Param())
		} else if isStringParameter(err.Kind()) {
			return errs.GetParameterMustMoreThanCharsMessage(fieldName, err.Param())
		}
	case "len":
		return errs.GetParameterLengthNotEqualMessage(fieldName, err.Param())
	case "notBlank":
		return errs.GetParameterNotBeBlankMessage(fieldName)
	case "validUsername":
		return errs.GetParameterInvalidUsernameMessage(fieldName)
	case "validEmail":
		return errs.GetParameterInvalidEmailMessage(fieldName)
	case "validCurrency":
		return errs.GetParameterInvalidCurrencyMessage(fieldName)
	case "validHexRGBColor":
		return errs.GetParameterInvalidHexRGBColorMessage(fieldName)
	}

	return errs.GetParameterInvalidMessage(fieldName)
}

func isIntegerParameter(kind reflect.Kind) bool {
	switch kind {
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64, reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return true
	default:
		return false
	}
}

func isStringParameter(kind reflect.Kind) bool {
	return kind == reflect.String
}
