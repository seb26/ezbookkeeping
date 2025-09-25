package models

// TransactionVendorNotSet represents the vendor id that is not set
const (
	TRANSACTION_VENDOR_NOT_SET int64 = -1
)

// TransactionVendorFilterType represents transaction vendor filter type
type TransactionVendorFilterType byte

// Transaction vendor filter types
const (
	TRANSACTION_VENDOR_FILTER_ALL             TransactionVendorFilterType = 0
	TRANSACTION_VENDOR_FILTER_HAS_VENDOR      TransactionVendorFilterType = 1
	TRANSACTION_VENDOR_FILTER_NO_VENDOR       TransactionVendorFilterType = 2
	TRANSACTION_VENDOR_FILTER_INCLUDE_VENDORS TransactionVendorFilterType = 3
	TRANSACTION_VENDOR_FILTER_EXCLUDE_VENDORS TransactionVendorFilterType = 4
)

// TransactionVendor represents transaction vendor data stored in database
type TransactionVendor struct {
	VendorId        int64  `xorm:"PK"`
	Uid             int64  `xorm:"INDEX(IDX_vendor_uid_deleted) NOT NULL"`
	Deleted         bool   `xorm:"INDEX(IDX_vendor_uid_deleted) NOT NULL"`
	Name            string `xorm:"VARCHAR(255) NOT NULL"`
	Hidden          bool   `xorm:"NOT NULL"`
	CreatedUnixTime int64
	UpdatedUnixTime int64
	DeletedUnixTime int64
}

// TransactionVendorGetRequest represents all parameters of transaction vendor getting request
type TransactionVendorGetRequest struct {
	Id int64 `form:"id,string" binding:"required,min=1"`
}

// TransactionVendorCreateRequest represents all parameters of transaction vendor creation request
type TransactionVendorCreateRequest struct {
	Name string `json:"name" binding:"required,notBlank,max=255"`
}

// TransactionVendorModifyRequest represents all parameters of transaction vendor modification request
type TransactionVendorModifyRequest struct {
	Id   int64  `json:"id,string" binding:"required,min=1"`
	Name string `json:"name" binding:"required,notBlank,max=255"`
}

// TransactionVendorHideRequest represents all parameters of transaction vendor hiding request
type TransactionVendorHideRequest struct {
	Id     int64 `json:"id,string" binding:"required,min=1"`
	Hidden bool  `json:"hidden"`
}

// TransactionVendorDeleteRequest represents all parameters of transaction vendor deleting request
type TransactionVendorDeleteRequest struct {
	Id int64 `json:"id,string" binding:"required,min=1"`
}

// TransactionVendorInfoResponse represents a view-object of transaction vendor
type TransactionVendorInfoResponse struct {
	Id     int64  `json:"id,string"`
	Name   string `json:"name"`
	Hidden bool   `json:"hidden"`
}

// ToTransactionVendorInfoResponse returns a view-object according to database model
func (v *TransactionVendor) ToTransactionVendorInfoResponse() *TransactionVendorInfoResponse {
	return &TransactionVendorInfoResponse{
		Id:     v.VendorId,
		Name:   v.Name,
		Hidden: v.Hidden,
	}
}

// TransactionVendorInfoResponseSlice represents the slice data structure of TransactionVendorInfoResponse
type TransactionVendorInfoResponseSlice []*TransactionVendorInfoResponse

// Len returns the count of items
func (s TransactionVendorInfoResponseSlice) Len() int {
	return len(s)
}

// Swap swaps two items
func (s TransactionVendorInfoResponseSlice) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

// Less reports whether the first item is less than the second one
func (s TransactionVendorInfoResponseSlice) Less(i, j int) bool {
	return s[i].Name < s[j].Name
}
