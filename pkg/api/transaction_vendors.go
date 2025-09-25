package api

import (
	"sort"

	"github.com/mayswind/ezbookkeeping/pkg/core"
	"github.com/mayswind/ezbookkeeping/pkg/errs"
	"github.com/mayswind/ezbookkeeping/pkg/log"
	"github.com/mayswind/ezbookkeeping/pkg/models"
	"github.com/mayswind/ezbookkeeping/pkg/services"
)

// TransactionVendorsApi represents transaction vendor api
type TransactionVendorsApi struct {
	vendors *services.TransactionVendorService
}

// Initialize a transaction vendor api singleton instance
var (
	TransactionVendors = &TransactionVendorsApi{
		vendors: services.TransactionVendors,
	}
)

// VendorListHandler returns transaction vendor list of current user
func (a *TransactionVendorsApi) VendorListHandler(c *core.WebContext) (any, *errs.Error) {
	uid := c.GetCurrentUid()
	vendors, err := a.vendors.GetAllVendorsByUid(c, uid)

	if err != nil {
		log.Errorf(c, "[transaction_vendors.VendorListHandler] failed to get vendors for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	vendorResps := make(models.TransactionVendorInfoResponseSlice, len(vendors))

	for i := 0; i < len(vendors); i++ {
		vendorResps[i] = vendors[i].ToTransactionVendorInfoResponse()
	}

	sort.Sort(vendorResps)

	return vendorResps, nil
}

// VendorGetHandler returns one specific transaction vendor of current user
func (a *TransactionVendorsApi) VendorGetHandler(c *core.WebContext) (any, *errs.Error) {
	var vendorGetReq models.TransactionVendorGetRequest
	err := c.ShouldBindQuery(&vendorGetReq)

	if err != nil {
		log.Warnf(c, "[transaction_vendors.VendorGetHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	uid := c.GetCurrentUid()
	vendor, err := a.vendors.GetVendorByVendorId(c, uid, vendorGetReq.Id)

	if err != nil {
		log.Errorf(c, "[transaction_vendors.VendorGetHandler] failed to get vendor \"id:%d\" for user \"uid:%d\", because %s", vendorGetReq.Id, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	vendorResp := vendor.ToTransactionVendorInfoResponse()

	return vendorResp, nil
}

// VendorCreateHandler saves a new transaction vendor by request parameters for current user
func (a *TransactionVendorsApi) VendorCreateHandler(c *core.WebContext) (any, *errs.Error) {
	var vendorCreateReq models.TransactionVendorCreateRequest
	err := c.ShouldBindJSON(&vendorCreateReq)

	if err != nil {
		log.Warnf(c, "[transaction_vendors.VendorCreateHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	uid := c.GetCurrentUid()

	vendor := a.createNewVendorModel(uid, &vendorCreateReq)

	err = a.vendors.CreateVendor(c, vendor)

	if err != nil {
		log.Errorf(c, "[transaction_vendors.VendorCreateHandler] failed to create vendor \"id:%d\" for user \"uid:%d\", because %s", vendor.VendorId, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	log.Infof(c, "[transaction_vendors.VendorCreateHandler] user \"uid:%d\" has created a new vendor \"id:%d\" successfully", uid, vendor.VendorId)

	vendorResp := vendor.ToTransactionVendorInfoResponse()

	return vendorResp, nil
}

// VendorModifyHandler saves an existed transaction vendor by request parameters for current user
func (a *TransactionVendorsApi) VendorModifyHandler(c *core.WebContext) (any, *errs.Error) {
	var vendorModifyReq models.TransactionVendorModifyRequest
	err := c.ShouldBindJSON(&vendorModifyReq)

	if err != nil {
		log.Warnf(c, "[transaction_vendors.VendorModifyHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	uid := c.GetCurrentUid()
	vendor, err := a.vendors.GetVendorByVendorId(c, uid, vendorModifyReq.Id)

	if err != nil {
		log.Errorf(c, "[transaction_vendors.VendorModifyHandler] failed to get vendor \"id:%d\" for user \"uid:%d\", because %s", vendorModifyReq.Id, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	newVendor := &models.TransactionVendor{
		VendorId: vendor.VendorId,
		Uid:      uid,
		Name:     vendorModifyReq.Name,
	}

	if newVendor.Name == vendor.Name {
		return nil, errs.ErrNothingWillBeUpdated
	}

	err = a.vendors.ModifyVendor(c, newVendor)

	if err != nil {
		log.Errorf(c, "[transaction_vendors.VendorModifyHandler] failed to update vendor \"id:%d\" for user \"uid:%d\", because %s", vendorModifyReq.Id, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	log.Infof(c, "[transaction_vendors.VendorModifyHandler] user \"uid:%d\" has updated vendor \"id:%d\" successfully", uid, vendorModifyReq.Id)

	vendor.Name = newVendor.Name
	vendorResp := vendor.ToTransactionVendorInfoResponse()

	return vendorResp, nil
}

// VendorHideHandler hides a transaction vendor by request parameters for current user
func (a *TransactionVendorsApi) VendorHideHandler(c *core.WebContext) (any, *errs.Error) {
	var vendorHideReq models.TransactionVendorHideRequest
	err := c.ShouldBindJSON(&vendorHideReq)

	if err != nil {
		log.Warnf(c, "[transaction_vendors.VendorHideHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	uid := c.GetCurrentUid()
	err = a.vendors.HideVendor(c, uid, []int64{vendorHideReq.Id}, vendorHideReq.Hidden)

	if err != nil {
		log.Errorf(c, "[transaction_vendors.VendorHideHandler] failed to hide vendor \"id:%d\" for user \"uid:%d\", because %s", vendorHideReq.Id, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	log.Infof(c, "[transaction_vendors.VendorHideHandler] user \"uid:%d\" has hidden vendor \"id:%d\"", uid, vendorHideReq.Id)
	return true, nil
}

// VendorDeleteHandler deletes an existed transaction vendor by request parameters for current user
func (a *TransactionVendorsApi) VendorDeleteHandler(c *core.WebContext) (any, *errs.Error) {
	var vendorDeleteReq models.TransactionVendorDeleteRequest
	err := c.ShouldBindJSON(&vendorDeleteReq)

	if err != nil {
		log.Warnf(c, "[transaction_vendors.VendorDeleteHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	uid := c.GetCurrentUid()
	err = a.vendors.DeleteVendor(c, uid, vendorDeleteReq.Id)

	if err != nil {
		log.Errorf(c, "[transaction_vendors.VendorDeleteHandler] failed to delete vendor \"id:%d\" for user \"uid:%d\", because %s", vendorDeleteReq.Id, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	log.Infof(c, "[transaction_vendors.VendorDeleteHandler] user \"uid:%d\" has deleted vendor \"id:%d\"", uid, vendorDeleteReq.Id)
	return true, nil
}

// createNewVendorModel returns a new vendor model by request parameters
func (a *TransactionVendorsApi) createNewVendorModel(uid int64, vendorCreateReq *models.TransactionVendorCreateRequest) *models.TransactionVendor {
	return &models.TransactionVendor{
		Uid:  uid,
		Name: vendorCreateReq.Name,
	}
}
