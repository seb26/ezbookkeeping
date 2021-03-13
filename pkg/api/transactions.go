package api

import (
	"sort"

	"github.com/mayswind/lab/pkg/core"
	"github.com/mayswind/lab/pkg/errs"
	"github.com/mayswind/lab/pkg/log"
	"github.com/mayswind/lab/pkg/models"
	"github.com/mayswind/lab/pkg/services"
	"github.com/mayswind/lab/pkg/utils"
)

// TransactionsApi represents transaction api
type TransactionsApi struct {
	transactions          *services.TransactionService
	transactionCategories *services.TransactionCategoryService
	transactionTags       *services.TransactionTagService
	accounts              *services.AccountService
	users                 *services.UserService
}

// Initialize a transaction api singleton instance
var (
	Transactions = &TransactionsApi{
		transactions:          services.Transactions,
		transactionCategories: services.TransactionCategories,
		transactionTags:       services.TransactionTags,
		accounts:              services.Accounts,
		users:                 services.Users,
	}
)

// TransactionListHandler returns transaction list of current user
func (a *TransactionsApi) TransactionListHandler(c *core.Context) (interface{}, *errs.Error) {
	var transactionListReq models.TransactionListByMaxTimeRequest
	err := c.ShouldBindQuery(&transactionListReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionListHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	utcOffset, err := c.GetClientTimezoneOffset()

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionListHandler] cannot get client timezone offset, because %s", err.Error())
		return nil, errs.ErrClientTimezoneOffsetInvalid
	}

	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(uid)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.ErrorfWithRequestId(c, "[transactions.TransactionListHandler] failed to get user, because %s", err.Error())
		}

		return nil, errs.ErrUserNotFound
	}

	var allCategoryIds []int64

	if transactionListReq.CategoryId > 0 {
		allSubCategories, err := a.transactionCategories.GetAllCategoriesByUid(uid, 0, transactionListReq.CategoryId)

		if err != nil {
			log.WarnfWithRequestId(c, "[transactions.TransactionListHandler] get transaction category error, because %s", err.Error())
			return nil, errs.ErrOperationFailed
		}

		if len(allSubCategories) > 0 {
			for i := 0; i < len(allSubCategories); i++ {
				allCategoryIds = append(allCategoryIds, allSubCategories[i].CategoryId)
			}
		} else {
			allCategoryIds = append(allCategoryIds, transactionListReq.CategoryId)
		}
	}

	transactions, err := a.transactions.GetTransactionsByMaxTime(uid, transactionListReq.MaxTime, transactionListReq.MinTime, transactionListReq.Type, allCategoryIds, transactionListReq.AccountId, transactionListReq.Keyword, transactionListReq.Count+1, true)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionListHandler] failed to get transactions earlier than \"%d\" for user \"uid:%d\", because %s", transactionListReq.MaxTime, uid, err.Error())
		return nil, errs.ErrOperationFailed
	}

	hasMore := false
	var nextTimeSequenceId *int64

	if len(transactions) > transactionListReq.Count {
		hasMore = true
		nextTimeSequenceId = &transactions[transactionListReq.Count].TransactionTime
		transactions = transactions[:transactionListReq.Count]
	}

	transactionIds := make([]int64, len(transactions))
	accountIds := make([]int64, 0, len(transactions)*2)

	for i := 0; i < len(transactions); i++ {
		transactionId := transactions[i].TransactionId

		if transactions[i].Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN {
			transactionId = transactions[i].RelatedId
		}

		transactionIds[i] = transactionId
		accountIds = append(accountIds, transactions[i].AccountId)

		if transactions[i].Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN || transactions[i].Type == models.TRANSACTION_DB_TYPE_TRANSFER_OUT {
			accountIds = append(accountIds, transactions[i].RelatedAccountId)
		}
	}

	allAccounts, err := a.accounts.GetAccountsByAccountIds(uid, utils.ToUniqueInt64Slice(accountIds))

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionListHandler] failed to get accounts for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.ErrOperationFailed
	}

	transactions = a.filterTransactions(c, uid, transactions, allAccounts)

	allTransactionTagIds, err := a.transactionTags.GetAllTagIdsOfTransactions(uid, transactionIds)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionListHandler] failed to get transactions tag ids for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.ErrOperationFailed
	}

	transactionResps := &models.TransactionInfoPageWrapperResponse{}
	transactionResps.Items = make(models.TransactionInfoResponseSlice, len(transactions))

	for i := 0; i < len(transactions); i++ {
		transaction := transactions[i]

		if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN {
			transaction = a.transactions.GetRelatedTransferTransaction(transaction, transaction.RelatedId)
		}

		transactionEditable := transaction.IsEditable(user, utcOffset, allAccounts[transaction.AccountId], allAccounts[transaction.RelatedAccountId])
		transactionTagIds := allTransactionTagIds[transaction.TransactionId]
		transactionResps.Items[i] = transaction.ToTransactionInfoResponse(transactionTagIds, transactionEditable)
	}

	sort.Sort(transactionResps.Items)

	if hasMore {
		transactionResps.NextTimeSequenceId = nextTimeSequenceId
	}

	return transactionResps, nil
}

// TransactionMonthListHandler returns transaction list of current user by month
func (a *TransactionsApi) TransactionMonthListHandler(c *core.Context) (interface{}, *errs.Error) {
	var transactionListReq models.TransactionListInMonthByPageRequest
	err := c.ShouldBindQuery(&transactionListReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionMonthListHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	utcOffset, err := c.GetClientTimezoneOffset()

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionMonthListHandler] cannot get client timezone offset, because %s", err.Error())
		return nil, errs.ErrClientTimezoneOffsetInvalid
	}

	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(uid)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.ErrorfWithRequestId(c, "[transactions.TransactionMonthListHandler] failed to get user, because %s", err.Error())
		}

		return nil, errs.ErrUserNotFound
	}

	var allCategoryIds []int64

	if transactionListReq.CategoryId > 0 {
		allSubCategories, err := a.transactionCategories.GetAllCategoriesByUid(uid, 0, transactionListReq.CategoryId)

		if err != nil {
			log.WarnfWithRequestId(c, "[transactions.TransactionMonthListHandler] get transaction category error, because %s", err.Error())
			return nil, errs.ErrOperationFailed
		}

		if len(allSubCategories) > 0 {
			for i := 0; i < len(allSubCategories); i++ {
				allCategoryIds = append(allCategoryIds, allSubCategories[i].CategoryId)
			}
		} else {
			allCategoryIds = append(allCategoryIds, transactionListReq.CategoryId)
		}
	}

	transactions, err := a.transactions.GetTransactionsInMonthByPage(uid, transactionListReq.Year, transactionListReq.Month, transactionListReq.Type, allCategoryIds, transactionListReq.AccountId, transactionListReq.Keyword, transactionListReq.Page, transactionListReq.Count)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionMonthListHandler] failed to get transactions in month \"%d-%d\" for user \"uid:%d\", because %s", transactionListReq.Year, transactionListReq.Month, uid, err.Error())
		return nil, errs.ErrOperationFailed
	}

	transactionIds := make([]int64, len(transactions))
	accountIds := make([]int64, 0, len(transactions)*2)

	for i := 0; i < len(transactions); i++ {
		transactionId := transactions[i].TransactionId

		if transactions[i].Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN {
			transactionId = transactions[i].RelatedId
		}

		transactionIds[i] = transactionId
		accountIds = append(accountIds, transactions[i].AccountId)

		if transactions[i].Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN || transactions[i].Type == models.TRANSACTION_DB_TYPE_TRANSFER_OUT {
			accountIds = append(accountIds, transactions[i].RelatedAccountId)
		}
	}

	allAccounts, err := a.accounts.GetAccountsByAccountIds(uid, utils.ToUniqueInt64Slice(accountIds))

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionMonthListHandler] failed to get accounts for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.ErrOperationFailed
	}

	transactions = a.filterTransactions(c, uid, transactions, allAccounts)

	allTransactionTagIds, err := a.transactionTags.GetAllTagIdsOfTransactions(uid, transactionIds)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionMonthListHandler] failed to get transactions tag ids for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.ErrOperationFailed
	}

	transactionResps := make([]*models.TransactionInfoResponse, len(transactions))

	for i := 0; i < len(transactions); i++ {
		transaction := transactions[i]

		if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN {
			transaction = a.transactions.GetRelatedTransferTransaction(transaction, transaction.RelatedId)
		}

		transactionEditable := transaction.IsEditable(user, utcOffset, allAccounts[transaction.AccountId], allAccounts[transaction.RelatedAccountId])
		transactionTagIds := allTransactionTagIds[transaction.TransactionId]
		transactionResps[i] = transaction.ToTransactionInfoResponse(transactionTagIds, transactionEditable)
	}

	return transactionResps, nil
}

// TransactionGetHandler returns one specific transaction of current user
func (a *TransactionsApi) TransactionGetHandler(c *core.Context) (interface{}, *errs.Error) {
	var transactionGetReq models.TransactionGetRequest
	err := c.ShouldBindQuery(&transactionGetReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionGetHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	utcOffset, err := c.GetClientTimezoneOffset()

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionGetHandler] cannot get client timezone offset, because %s", err.Error())
		return nil, errs.ErrClientTimezoneOffsetInvalid
	}

	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(uid)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.ErrorfWithRequestId(c, "[transactions.TransactionGetHandler] failed to get user, because %s", err.Error())
		}

		return nil, errs.ErrUserNotFound
	}

	transaction, err := a.transactions.GetTransactionByTransactionId(uid, transactionGetReq.Id)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionGetHandler] failed to get transaction \"id:%d\" for user \"uid:%d\", because %s", transactionGetReq.Id, uid, err.Error())
		return nil, errs.ErrOperationFailed
	}

	if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN {
		transaction = a.transactions.GetRelatedTransferTransaction(transaction, transaction.RelatedId)
	}

	accountIds := make([]int64, 0, 2)
	accountIds = append(accountIds, transaction.AccountId)

	if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_OUT {
		accountIds = append(accountIds, transaction.RelatedAccountId)
		accountIds = utils.ToUniqueInt64Slice(accountIds)
	}

	accountMap, err := a.accounts.GetAccountsByAccountIds(uid, accountIds)

	if _, exists := accountMap[transaction.AccountId]; !exists {
		log.WarnfWithRequestId(c, "[transactions.TransactionGetHandler] account of transaction \"id:%d\" does not exist for user \"uid:%d\"", transaction.TransactionId, uid)
		return nil, errs.ErrTransactionNotFound
	}

	if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_OUT {
		if _, exists := accountMap[transaction.RelatedAccountId]; !exists {
			log.WarnfWithRequestId(c, "[transactions.TransactionGetHandler] related account of transaction \"id:%d\" does not exist for user \"uid:%d\"", transaction.TransactionId, uid)
			return nil, errs.ErrTransactionNotFound
		}
	}

	allTransactionTagIds, err := a.transactionTags.GetAllTagIdsOfTransactions(uid, []int64{transaction.TransactionId})

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionGetHandler] failed to get transactions tag ids for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.ErrOperationFailed
	}

	transactionEditable := transaction.IsEditable(user, utcOffset, accountMap[transaction.AccountId], accountMap[transaction.RelatedAccountId])
	transactionTagIds := allTransactionTagIds[transaction.TransactionId]
	transactionResp := transaction.ToTransactionInfoResponse(transactionTagIds, transactionEditable)

	return transactionResp, nil
}

// TransactionCreateHandler saves a new transaction by request parameters for current user
func (a *TransactionsApi) TransactionCreateHandler(c *core.Context) (interface{}, *errs.Error) {
	var transactionCreateReq models.TransactionCreateRequest
	err := c.ShouldBindJSON(&transactionCreateReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionCreateHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	tagIds, err := utils.StringArrayToInt64Array(transactionCreateReq.TagIds)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionCreateHandler] parse tag ids failed, because %s", err.Error())
		return nil, errs.ErrTransactionTagIdInvalid
	}

	if transactionCreateReq.Type < models.TRANSACTION_TYPE_MODIFY_BALANCE || transactionCreateReq.Type > models.TRANSACTION_TYPE_TRANSFER {
		log.WarnfWithRequestId(c, "[transactions.TransactionCreateHandler] transaction type is invalid")
		return nil, errs.ErrTransactionTypeInvalid
	}

	if transactionCreateReq.Type == models.TRANSACTION_TYPE_MODIFY_BALANCE && transactionCreateReq.CategoryId > 0 {
		log.WarnfWithRequestId(c, "[transactions.TransactionCreateHandler] balance modification transaction cannot set category id")
		return nil, errs.ErrBalanceModificationTransactionCannotSetCategory
	}

	if transactionCreateReq.Type != models.TRANSACTION_TYPE_TRANSFER && transactionCreateReq.DestinationAccountId != 0 {
		log.WarnfWithRequestId(c, "[transactions.TransactionCreateHandler] non-transfer transaction destination account cannot be set")
		return nil, errs.ErrTransactionDestinationAccountCannotBeSet
	} else if transactionCreateReq.Type == models.TRANSACTION_TYPE_TRANSFER && transactionCreateReq.SourceAccountId == transactionCreateReq.DestinationAccountId {
		log.WarnfWithRequestId(c, "[transactions.TransactionCreateHandler] transfer transaction source account must not be destination account")
		return nil, errs.ErrTransactionSourceAndDestinationIdCannotBeEqual
	}

	if transactionCreateReq.Type != models.TRANSACTION_TYPE_TRANSFER && transactionCreateReq.DestinationAmount != 0 {
		log.WarnfWithRequestId(c, "[transactions.TransactionCreateHandler] non-transfer transaction destination amount cannot be set")
		return nil, errs.ErrTransactionDestinationAmountCannotBeSet
	}

	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(uid)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.ErrorfWithRequestId(c, "[transactions.TransactionCreateHandler] failed to get user, because %s", err.Error())
		}

		return nil, errs.ErrUserNotFound
	}

	transaction := a.createNewTransactionModel(uid, &transactionCreateReq)
	transactionEditable := user.CanEditTransactionByTransactionTime(transaction.TransactionTime, transactionCreateReq.UtcOffset)

	if !transactionEditable {
		return nil, errs.ErrCannotCreateTransactionWithThisTransactionTime
	}

	err = a.transactions.CreateTransaction(transaction, tagIds)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionCreateHandler] failed to create transaction \"id:%d\" for user \"uid:%d\", because %s", transaction.TransactionId, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	log.InfofWithRequestId(c, "[transactions.TransactionCreateHandler] user \"uid:%d\" has created a new transaction \"id:%d\" successfully", uid, transaction.TransactionId)

	transactionResp := transaction.ToTransactionInfoResponse(tagIds, transactionEditable)

	return transactionResp, nil
}

// TransactionModifyHandler saves an existed transaction by request parameters for current user
func (a *TransactionsApi) TransactionModifyHandler(c *core.Context) (interface{}, *errs.Error) {
	var transactionModifyReq models.TransactionModifyRequest
	err := c.ShouldBindJSON(&transactionModifyReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionModifyHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	tagIds, err := utils.StringArrayToInt64Array(transactionModifyReq.TagIds)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionModifyHandler] parse tag ids failed, because %s", err.Error())
		return nil, errs.ErrTransactionTagIdInvalid
	}

	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(uid)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.ErrorfWithRequestId(c, "[transactions.TransactionModifyHandler] failed to get user, because %s", err.Error())
		}

		return nil, errs.ErrUserNotFound
	}

	transaction, err := a.transactions.GetTransactionByTransactionId(uid, transactionModifyReq.Id)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionModifyHandler] failed to get transaction \"id:%d\" for user \"uid:%d\", because %s", transactionModifyReq.Id, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN {
		log.WarnfWithRequestId(c, "[transactions.TransactionModifyHandler] cannot modify transaction \"id:%d\" for user \"uid:%d\", because transaction type is transfer in", transactionModifyReq.Id, uid)
		return nil, errs.ErrTransactionTypeInvalid
	}

	allTransactionTagIds, err := a.transactionTags.GetAllTagIdsOfTransactions(uid, []int64{transaction.TransactionId})

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionModifyHandler] failed to get transactions tag ids for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.ErrOperationFailed
	}

	transactionTagIds := allTransactionTagIds[transaction.TransactionId]

	if transactionTagIds == nil {
		transactionTagIds = make([]int64, 0, 0)
	}

	newTransaction := &models.Transaction{
		TransactionId:     transaction.TransactionId,
		Uid:               uid,
		CategoryId:        transactionModifyReq.CategoryId,
		TransactionTime:   utils.GetMinTransactionTimeFromUnixTime(transactionModifyReq.Time),
		TimezoneUtcOffset: transactionModifyReq.UtcOffset,
		AccountId:         transactionModifyReq.SourceAccountId,
		Amount:            transactionModifyReq.SourceAmount,
		Comment:           transactionModifyReq.Comment,
	}

	if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_OUT {
		newTransaction.RelatedAccountId = transactionModifyReq.DestinationAccountId
		newTransaction.RelatedAccountAmount = transactionModifyReq.DestinationAmount
	}

	if newTransaction.CategoryId == transaction.CategoryId &&
		utils.GetUnixTimeFromTransactionTime(newTransaction.TransactionTime) == utils.GetUnixTimeFromTransactionTime(transaction.TransactionTime) &&
		newTransaction.TimezoneUtcOffset == transaction.TimezoneUtcOffset &&
		newTransaction.AccountId == transaction.AccountId &&
		newTransaction.Amount == transaction.Amount &&
		(transaction.Type != models.TRANSACTION_DB_TYPE_TRANSFER_OUT || newTransaction.RelatedAccountId == transaction.RelatedAccountId) &&
		(transaction.Type != models.TRANSACTION_DB_TYPE_TRANSFER_OUT || newTransaction.RelatedAccountAmount == transaction.RelatedAccountAmount) &&
		newTransaction.Comment == transaction.Comment &&
		utils.Int64SliceEquals(tagIds, transactionTagIds) {
		return nil, errs.ErrNothingWillBeUpdated
	}

	var addTransactionTagIds []int64
	var removeTransactionTagIds []int64

	if !utils.Int64SliceEquals(tagIds, transactionTagIds) {
		removeTransactionTagIds = transactionTagIds
		addTransactionTagIds = tagIds
	}

	transactionEditable := user.CanEditTransactionByTransactionTime(transaction.TransactionTime, transaction.TimezoneUtcOffset)
	newTransactionEditable := user.CanEditTransactionByTransactionTime(newTransaction.TransactionTime, transactionModifyReq.UtcOffset)

	if !transactionEditable || !newTransactionEditable {
		return nil, errs.ErrCannotModifyTransactionWithThisTransactionTime
	}

	err = a.transactions.ModifyTransaction(newTransaction, addTransactionTagIds, removeTransactionTagIds)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionModifyHandler] failed to update transaction \"id:%d\" for user \"uid:%d\", because %s", transactionModifyReq.Id, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	log.InfofWithRequestId(c, "[transactions.TransactionModifyHandler] user \"uid:%d\" has updated transaction \"id:%d\" successfully", uid, transactionModifyReq.Id)

	newTransaction.Type = transaction.Type
	newTransactionResp := newTransaction.ToTransactionInfoResponse(tagIds, transactionEditable)

	return newTransactionResp, nil
}

// TransactionDeleteHandler deletes an existed transaction by request parameters for current user
func (a *TransactionsApi) TransactionDeleteHandler(c *core.Context) (interface{}, *errs.Error) {
	var transactionDeleteReq models.TransactionDeleteRequest
	err := c.ShouldBindJSON(&transactionDeleteReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionDeleteHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	utcOffset, err := c.GetClientTimezoneOffset()

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionDeleteHandler] cannot get client timezone offset, because %s", err.Error())
		return nil, errs.ErrClientTimezoneOffsetInvalid
	}

	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(uid)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.ErrorfWithRequestId(c, "[transactions.TransactionDeleteHandler] failed to get user, because %s", err.Error())
		}

		return nil, errs.ErrUserNotFound
	}

	transaction, err := a.transactions.GetTransactionByTransactionId(uid, transactionDeleteReq.Id)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionDeleteHandler] failed to get transaction \"id:%d\" for user \"uid:%d\", because %s", transactionDeleteReq.Id, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN {
		log.WarnfWithRequestId(c, "[transactions.TransactionDeleteHandler] cannot delete transaction \"id:%d\" for user \"uid:%d\", because transaction type is transfer in", transactionDeleteReq.Id, uid)
		return nil, errs.ErrTransactionTypeInvalid
	}

	transactionEditable := user.CanEditTransactionByTransactionTime(transaction.TransactionTime, utcOffset)

	if !transactionEditable {
		return nil, errs.ErrCannotDeleteTransactionWithThisTransactionTime
	}

	err = a.transactions.DeleteTransaction(uid, transactionDeleteReq.Id)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionDeleteHandler] failed to delete transaction \"id:%d\" for user \"uid:%d\", because %s", transactionDeleteReq.Id, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	log.InfofWithRequestId(c, "[transactions.TransactionDeleteHandler] user \"uid:%d\" has deleted transaction \"id:%d\"", uid, transactionDeleteReq.Id)
	return true, nil
}

func (a *TransactionsApi) filterTransactions(c *core.Context, uid int64, transactions []*models.Transaction, accountMap map[int64]*models.Account) []*models.Transaction {
	finalTransactions := make([]*models.Transaction, 0, len(transactions))

	for i := 0; i < len(transactions); i++ {
		transaction := transactions[i]

		if _, exists := accountMap[transaction.AccountId]; !exists {
			log.WarnfWithRequestId(c, "[transactions.filterTransactions] account of transaction \"id:%d\" does not exist for user \"uid:%d\"", transaction.TransactionId, uid)
			continue
		}

		if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN || transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_OUT {
			if _, exists := accountMap[transaction.RelatedAccountId]; !exists {
				log.WarnfWithRequestId(c, "[transactions.filterTransactions] related account of transaction \"id:%d\" does not exist for user \"uid:%d\"", transaction.TransactionId, uid)
				continue
			}
		}

		finalTransactions = append(finalTransactions, transaction)
	}

	return finalTransactions
}

func (a *TransactionsApi) createNewTransactionModel(uid int64, transactionCreateReq *models.TransactionCreateRequest) *models.Transaction {
	var transactionDbType models.TransactionDbType

	if transactionCreateReq.Type == models.TRANSACTION_TYPE_MODIFY_BALANCE {
		transactionDbType = models.TRANSACTION_DB_TYPE_MODIFY_BALANCE
	} else if transactionCreateReq.Type == models.TRANSACTION_TYPE_EXPENSE {
		transactionDbType = models.TRANSACTION_DB_TYPE_EXPENSE
	} else if transactionCreateReq.Type == models.TRANSACTION_TYPE_INCOME {
		transactionDbType = models.TRANSACTION_DB_TYPE_INCOME
	} else if transactionCreateReq.Type == models.TRANSACTION_TYPE_TRANSFER {
		transactionDbType = models.TRANSACTION_DB_TYPE_TRANSFER_OUT
	}

	transaction := &models.Transaction{
		Uid:               uid,
		Type:              transactionDbType,
		CategoryId:        transactionCreateReq.CategoryId,
		TransactionTime:   utils.GetMinTransactionTimeFromUnixTime(transactionCreateReq.Time),
		TimezoneUtcOffset: transactionCreateReq.UtcOffset,
		AccountId:         transactionCreateReq.SourceAccountId,
		Amount:            transactionCreateReq.SourceAmount,
		Comment:           transactionCreateReq.Comment,
	}

	if transactionCreateReq.Type == models.TRANSACTION_TYPE_TRANSFER {
		transaction.RelatedAccountId = transactionCreateReq.DestinationAccountId
		transaction.RelatedAccountAmount = transactionCreateReq.DestinationAmount
	}

	return transaction
}
