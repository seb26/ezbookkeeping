package services

import (
	"strings"
	"time"

	"xorm.io/xorm"

	"github.com/mayswind/ezbookkeeping/pkg/core"
	"github.com/mayswind/ezbookkeeping/pkg/datastore"
	"github.com/mayswind/ezbookkeeping/pkg/errs"
	"github.com/mayswind/ezbookkeeping/pkg/models"
	"github.com/mayswind/ezbookkeeping/pkg/utils"
	"github.com/mayswind/ezbookkeeping/pkg/uuid"
)

// TransactionVendorService represents transaction vendor service
type TransactionVendorService struct {
	ServiceUsingDB
	ServiceUsingUuid
}

// Initialize a transaction vendor service singleton instance
var (
	TransactionVendors = &TransactionVendorService{
		ServiceUsingDB: ServiceUsingDB{
			container: datastore.Container,
		},
		ServiceUsingUuid: ServiceUsingUuid{
			container: uuid.Container,
		},
	}
)

// GetTotalVendorCountByUid returns total vendor count of user
func (s *TransactionVendorService) GetTotalVendorCountByUid(c core.Context, uid int64) (int64, error) {
	if uid <= 0 {
		return 0, errs.ErrUserIdInvalid
	}

	count, err := s.UserDataDB(uid).NewSession(c).Where("uid=? AND deleted=?", uid, false).Count(&models.TransactionVendor{})

	return count, err
}

// GetAllVendorsByUid returns all transaction vendor models of user
func (s *TransactionVendorService) GetAllVendorsByUid(c core.Context, uid int64) ([]*models.TransactionVendor, error) {
	if uid <= 0 {
		return nil, errs.ErrUserIdInvalid
	}

	var vendors []*models.TransactionVendor
	err := s.UserDataDB(uid).NewSession(c).Where("uid=? AND deleted=?", uid, false).Find(&vendors)

	return vendors, err
}

// GetVendorByVendorId returns a transaction vendor model according to transaction vendor id
func (s *TransactionVendorService) GetVendorByVendorId(c core.Context, uid int64, vendorId int64) (*models.TransactionVendor, error) {
	if uid <= 0 {
		return nil, errs.ErrUserIdInvalid
	}

	if vendorId <= 0 {
		return nil, errs.ErrTransactionVendorIdInvalid
	}

	vendor := &models.TransactionVendor{}
	has, err := s.UserDataDB(uid).NewSession(c).ID(vendorId).Where("uid=? AND deleted=?", uid, false).Get(vendor)

	if err != nil {
		return nil, err
	} else if !has {
		return nil, errs.ErrTransactionVendorNotFound
	}

	return vendor, nil
}

// GetVendorsByVendorIds returns transaction vendor models according to transaction vendor ids
func (s *TransactionVendorService) GetVendorsByVendorIds(c core.Context, uid int64, vendorIds []int64) (map[int64]*models.TransactionVendor, error) {
	if uid <= 0 {
		return nil, errs.ErrUserIdInvalid
	}

	if vendorIds == nil {
		return nil, errs.ErrTransactionVendorIdInvalid
	}

	var vendors []*models.TransactionVendor
	err := s.UserDataDB(uid).NewSession(c).Where("uid=? AND deleted=?", uid, false).In("vendor_id", vendorIds).Find(&vendors)

	if err != nil {
		return nil, err
	}

	vendorMap := s.GetVendorMapByList(vendors)
	return vendorMap, err
}

// CreateVendor saves a new transaction vendor model to database
func (s *TransactionVendorService) CreateVendor(c core.Context, vendor *models.TransactionVendor) error {
	if vendor.Uid <= 0 {
		return errs.ErrUserIdInvalid
	}

	now := time.Now().Unix()
	vendor.VendorId = s.GenerateUuid(uuid.UUID_TYPE_VENDOR)
	vendor.CreatedUnixTime = now
	vendor.UpdatedUnixTime = now

	return s.UserDataDB(vendor.Uid).DoTransaction(c, func(sess *xorm.Session) error {
		duplicatedVendor := &models.TransactionVendor{}
		has, err := sess.Where("uid=? AND deleted=? AND name=?", vendor.Uid, false, vendor.Name).Get(duplicatedVendor)

		if err != nil {
			return err
		} else if has {
			return errs.ErrTransactionVendorNameAlreadyExists
		}

		_, err = sess.Insert(vendor)

		return err
	})
}

// ModifyVendor saves an existed transaction vendor model to database
func (s *TransactionVendorService) ModifyVendor(c core.Context, vendor *models.TransactionVendor) error {
	if vendor.Uid <= 0 {
		return errs.ErrUserIdInvalid
	}

	now := time.Now().Unix()
	vendor.UpdatedUnixTime = now

	return s.UserDataDB(vendor.Uid).DoTransaction(c, func(sess *xorm.Session) error {
		duplicatedVendor := &models.TransactionVendor{}
		has, err := sess.Where("uid=? AND deleted=? AND name=? AND vendor_id!=?", vendor.Uid, false, vendor.Name, vendor.VendorId).Get(duplicatedVendor)

		if err != nil {
			return err
		} else if has {
			return errs.ErrTransactionVendorNameAlreadyExists
		}

		updatedRows, err := sess.ID(vendor.VendorId).Where("uid=? AND deleted=?", vendor.Uid, false).Cols("name", "vendor_type", "updated_unix_time").Update(vendor)

		if err != nil {
			return err
		} else if updatedRows < 1 {
			return errs.ErrTransactionVendorNotFound
		}

		return err
	})
}

// HideVendor updates hidden field of given transaction vendor ids
func (s *TransactionVendorService) HideVendor(c core.Context, uid int64, ids []int64, hidden bool) error {
	if uid <= 0 {
		return errs.ErrUserIdInvalid
	}

	if len(ids) < 1 {
		return errs.ErrNothingWillBeUpdated
	}

	now := time.Now().Unix()

	updateModel := &models.TransactionVendor{
		Hidden:          hidden,
		UpdatedUnixTime: now,
	}

	updatedRows, err := s.UserDataDB(uid).NewSession(c).Where("uid=? AND deleted=?", uid, false).In("vendor_id", ids).Cols("hidden", "updated_unix_time").Update(updateModel)

	if err != nil {
		return err
	} else if updatedRows < 1 {
		return errs.ErrTransactionVendorNotFound
	}

	return nil
}

// DeleteVendor deletes an existed transaction vendor from database
func (s *TransactionVendorService) DeleteVendor(c core.Context, uid int64, vendorId int64) error {
	if uid <= 0 {
		return errs.ErrUserIdInvalid
	}

	if vendorId <= 0 {
		return errs.ErrTransactionVendorIdInvalid
	}

	now := time.Now().Unix()

	updateModel := &models.TransactionVendor{
		Deleted:         true,
		DeletedUnixTime: now,
	}

	return s.UserDataDB(uid).DoTransaction(c, func(sess *xorm.Session) error {
		updatedRows, err := sess.ID(vendorId).Where("uid=? AND deleted=?", uid, false).Cols("deleted", "deleted_unix_time").Update(updateModel)

		if err != nil {
			return err
		} else if updatedRows < 1 {
			return errs.ErrTransactionVendorNotFound
		}

		return err
	})
}

// DeleteAllVendors deletes all existed transaction vendors from database
func (s *TransactionVendorService) DeleteAllVendors(c core.Context, uid int64) error {
	if uid <= 0 {
		return errs.ErrUserIdInvalid
	}

	now := time.Now().Unix()

	updateModel := &models.TransactionVendor{
		Deleted:         true,
		DeletedUnixTime: now,
	}

	return s.UserDataDB(uid).DoTransaction(c, func(sess *xorm.Session) error {
		_, err := sess.Where("uid=? AND deleted=?", uid, false).Cols("deleted", "deleted_unix_time").Update(updateModel)
		return err
	})
}

// ExistsVendorName returns whether the given vendor name exists
func (s *TransactionVendorService) ExistsVendorName(c core.Context, uid int64, name string) (bool, error) {
	if uid <= 0 {
		return false, errs.ErrUserIdInvalid
	}

	return s.UserDataDB(uid).NewSession(c).Where("uid=? AND deleted=? AND name=?", uid, false, name).Exist(&models.TransactionVendor{})
}

// GetVendorMapByList returns a vendor map by a given vendor list
func (s *TransactionVendorService) GetVendorMapByList(vendors []*models.TransactionVendor) map[int64]*models.TransactionVendor {
	vendorMap := make(map[int64]*models.TransactionVendor)

	for i := 0; i < len(vendors); i++ {
		vendor := vendors[i]
		vendorMap[vendor.VendorId] = vendor
	}

	return vendorMap
}

// GetVendorNameMapByList returns a vendor name map by a given vendor list
func (s *TransactionVendorService) GetVendorNameMapByList(vendors []*models.TransactionVendor) map[string]*models.TransactionVendor {
	vendorMap := make(map[string]*models.TransactionVendor)

	for i := 0; i < len(vendors); i++ {
		vendor := vendors[i]
		vendorMap[vendor.Name] = vendor
	}

	return vendorMap
}

// GetVendorNames returns vendor names by a given vendor list
func (s *TransactionVendorService) GetVendorNames(vendors []*models.TransactionVendor) []string {
	names := make([]string, len(vendors))

	for i := 0; i < len(vendors); i++ {
		names[i] = vendors[i].Name
	}

	return names
}

// GetVendorIds converts a comma-separated string of vendor ids into a slice of int64
func (s *TransactionVendorService) GetVendorIds(vendorIds string) ([]int64, error) {
	if vendorIds == "" || vendorIds == "0" {
		return nil, nil
	}

	if vendorIds == "none" {
		return []int64{0}, nil
	}

	requestVendorIds, err := utils.StringArrayToInt64Array(strings.Split(vendorIds, ","))

	if err != nil {
		return nil, errs.Or(err, errs.ErrTransactionVendorIdInvalid)
	}

	return requestVendorIds, nil
}
