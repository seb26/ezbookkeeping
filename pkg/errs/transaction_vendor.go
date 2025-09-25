package errs

import "net/http"

// Error codes related to transaction vendors
var (
	ErrTransactionVendorIdInvalid            = NewNormalError(NormalSubcategoryVendor, 0, http.StatusBadRequest, "transaction vendor id is invalid")
	ErrTransactionVendorNotFound             = NewNormalError(NormalSubcategoryVendor, 1, http.StatusBadRequest, "transaction vendor not found")
	ErrTransactionVendorNameIsEmpty          = NewNormalError(NormalSubcategoryVendor, 2, http.StatusBadRequest, "transaction vendor name is empty")
	ErrTransactionVendorNameAlreadyExists    = NewNormalError(NormalSubcategoryVendor, 3, http.StatusBadRequest, "transaction vendor name already exists")
	ErrTransactionVendorInUseCannotBeDeleted = NewNormalError(NormalSubcategoryVendor, 4, http.StatusBadRequest, "transaction vendor is in use and cannot be deleted")
)
