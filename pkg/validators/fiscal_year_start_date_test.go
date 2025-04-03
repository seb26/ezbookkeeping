package validators

import (
	"testing"

	"github.com/go-playground/validator/v10"
	"github.com/mayswind/ezbookkeeping/pkg/core"
	"github.com/stretchr/testify/assert"
)

type fiscalYearStartDateContainer struct {
	FiscalYearStartDate core.FiscalYearStartDateType `validate:"validFiscalYearStartDate"`
}

func TestValidateFiscalYearStartDate_ValidValues(t *testing.T) {
	validate := validator.New()
	validate.RegisterValidation("validFiscalYearStartDate", ValidateFiscalYearStartDate)

	testCases := []struct {
		name  string
		value core.FiscalYearStartDateType
	}{
		{"January 1st", 0x0101},           // January 1st
		{"December 31st", 0x0C1F},         // December 31st
		{"July 1st", 0x0701},              // July 1st
		{"April 15th", 0x040F},            // April 15th
		{"February 29th", 0x021D},         // February 29th (leap year)
		{"January 1st (decimal)", 101},    // January 1st (decimal)
		{"December 31st (decimal)", 1231}, // December 31st (decimal)
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			container := fiscalYearStartDateContainer{FiscalYearStartDate: tc.value}
			err := validate.Struct(container)
			assert.Nil(t, err)
		})
	}
}

func TestValidateFiscalYearStartDate_InvalidValues(t *testing.T) {
	validate := validator.New()
	validate.RegisterValidation("validFiscalYearStartDate", ValidateFiscalYearStartDate)

	testCases := []struct {
		name  string
		value core.FiscalYearStartDateType
	}{
		{"Zero value", 0},              // Zero value
		{"Month 0", 0x0001},            // Month 0 (invalid)
		{"Month 13", 0x0D01},           // Month 13 (invalid)
		{"Day 0", 0x0100},              // Day 0 (invalid)
		{"January 32", 0x0120},         // January 32 (invalid)
		{"February 30", 0x021E},        // February 30 (invalid)
		{"April 31", 0x041F},           // April 31 (invalid)
		{"June 31", 0x061F},            // June 31 (invalid)
		{"September 31", 0x091F},       // September 31 (invalid)
		{"November 32", 0x0B20},        // November 32 (invalid)
		{"Invalid month 255", 0xFF01},  // Invalid month
		{"Invalid day 255", 0x01FF},    // Invalid day
		{"Month 13 (decimal)", 1301},   // Month 13 (decimal)
		{"January 32 (decimal)", 132},  // January 32 (decimal)
		{"February 30 (decimal)", 230}, // February 30 (decimal)
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			container := fiscalYearStartDateContainer{FiscalYearStartDate: tc.value}
			err := validate.Struct(container)
			assert.NotNil(t, err)
		})
	}
}
