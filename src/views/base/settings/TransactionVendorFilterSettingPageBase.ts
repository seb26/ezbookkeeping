import { ref, computed } from 'vue';

import { useI18n } from '@/locales/helpers.ts';

import { useTransactionVendorsStore } from '@/stores/transactionVendor.ts';
import { useTransactionsStore } from '@/stores/transaction.ts';
import { useStatisticsStore } from '@/stores/statistics.ts';

import type { TypeAndDisplayName } from '@/core/base.ts';
import { TransactionVendorFilterType } from '@/core/transaction.ts';
import type { TransactionVendor } from '@/models/transaction_vendor.ts';
import { mdiMinusBox, mdiPlusBox } from '@mdi/js';

export function useTransactionVendorFilterSettingPageBase(type?: string) {
    const { getAllTransactionVendorFilterTypes } = useI18n();

    const transactionVendorsStore = useTransactionVendorsStore();
    const transactionsStore = useTransactionsStore();
    const statisticsStore = useStatisticsStore();

    const loading = ref<boolean>(true);
    const showHidden = ref<boolean>(false);
    const filterVendorIds = ref<Record<string, boolean>>({});
    const prefilledVendorFilterType = TransactionVendorFilterType.ExcludeVendors.type;
    const vendorFilterType = ref<number>(prefilledVendorFilterType); // Invite user to "Exclude Selected Vendors" on first open
    const draftVendorSelections = ref<Record<number, Record<string, boolean>>>({});


    const allVendors = computed<TransactionVendor[]>(() => transactionVendorsStore.allTransactionVendors);
    const allVendorFilterTypes = computed<TypeAndDisplayName[]>(() => getAllTransactionVendorFilterTypes().filter((filterType) => filterType.type !== TransactionVendorFilterType.All.type));
    const hasAnyAvailableVendor = computed<boolean>(() => transactionVendorsStore.allAvailableVendorsCount > 0);
    const hasAnyVisibleVendor = computed<boolean>(() => {
        if (showHidden.value) {
            return transactionVendorsStore.allAvailableVendorsCount > 0;
        } else {
            return transactionVendorsStore.allVisibleVendorsCount > 0;
        }
    });
    const expandVendorCheckboxIcon = computed<string>(() => vendorFilterType.value === TransactionVendorFilterType.IncludeVendors.type ? mdiPlusBox : mdiMinusBox);
    const expandVendorCheckboxDisabled = computed<boolean>(() => vendorFilterType.value === TransactionVendorFilterType.HasVendor.type || vendorFilterType.value === TransactionVendorFilterType.NoVendor.type);

    function clearVendorFilters(): void {
        filterVendorIds.value = {};
        vendorFilterType.value = TransactionVendorFilterType.Default.type;
        draftVendorSelections.value = {};
        // Don't auto-save, let user click Apply to save the cleared state
    }

    // loadFilterVendorIds() is called when the page is loaded
    // By default all vendors are not selected, and a user decision to select a vendor adds that vendor to the list.
    // Selecting Include or Exclude vendor filter options effectively determines how the results are intersected by those vendors.
    // There are no select all/none/inverse operations, as this is unusable for a large number of vendors in relation
    // to the API string, and the UI experience of navigating the list.
    function loadFilterVendorIds(): boolean {
        const selectedVendorIds: Record<string, boolean> = {};

        if (type === 'statisticsCurrent') {
            const transactionVendorIds = statisticsStore.transactionStatisticsFilter.vendorIds ? statisticsStore.transactionStatisticsFilter.vendorIds.split(',') : [];

            for (const transactionVendorId of transactionVendorIds) {
                if (transactionVendorsStore.allTransactionVendorsMap[transactionVendorId]) {
                    selectedVendorIds[transactionVendorId] = true;
                }
            }
            filterVendorIds.value = selectedVendorIds;
            const currentFilterType = statisticsStore.transactionStatisticsFilter.vendorFilterType;
            vendorFilterType.value = (currentFilterType === 0) ? prefilledVendorFilterType : currentFilterType;
            return true;
        } else if (type === 'transactionListCurrent') {
            for (const transactionVendorId in transactionsStore.allFilterVendorIds) {
                if (!Object.prototype.hasOwnProperty.call(transactionsStore.allFilterVendorIds, transactionVendorId)) {
                    continue;
                }

                if (transactionVendorsStore.allTransactionVendorsMap[transactionVendorId]) {
                    selectedVendorIds[transactionVendorId] = true;
                }
            }
            filterVendorIds.value = selectedVendorIds;
            return true;
        } else {
            return false;
        }
    }

    function saveFilterVendorIds(): boolean {
        // filterVendorIds already contains only the selected vendor IDs
        const selectedVendorIds = Object.keys(filterVendorIds.value).filter(id => filterVendorIds.value[id]);
        // When vendorFilterType is 0 (All), clear vendorIds to ensure no vendor filtering
        const finalVendorIds = vendorFilterType.value === TransactionVendorFilterType.All.type ? '' : selectedVendorIds.join(',');
        let changed = true;

        if (type === 'statisticsCurrent') {
            changed = statisticsStore.updateTransactionStatisticsFilter({
                vendorIds: finalVendorIds,
                vendorFilterType: vendorFilterType.value
            });

            if (changed) {
                statisticsStore.updateTransactionStatisticsInvalidState(true);
            }
        } else if (type === 'transactionListCurrent') {
            changed = transactionsStore.updateTransactionListFilter({
                vendorIds: finalVendorIds
            });

            if (changed) {
                transactionsStore.updateTransactionListInvalidState(true);
            }
        }

        return changed;
    }

    function setVendorFilterType(filterType: number): void {
        draftVendorSelections.value[vendorFilterType.value] = { ...filterVendorIds.value };
        vendorFilterType.value = filterType;
        // Load draft selections for new filter type or start with no selections
        filterVendorIds.value = draftVendorSelections.value[filterType] ? { ...draftVendorSelections.value[filterType] } : {};
    }

    return {
        // states
        loading,
        showHidden,
        filterVendorIds,
        vendorFilterType,
        // computed states
        allVendors,
        allVendorFilterTypes,
        hasAnyAvailableVendor,
        hasAnyVisibleVendor,
        expandVendorCheckboxIcon,
        expandVendorCheckboxDisabled,
        // functions
        clearVendorFilters,
        loadFilterVendorIds,
        saveFilterVendorIds,
        setVendorFilterType
    };
}
