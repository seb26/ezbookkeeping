import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import type { BeforeResolveFunction } from '@/core/base.ts';

import {
    type TransactionVendorInfoResponse,
    TransactionVendor
} from '@/models/transaction_vendor.ts';

import { isEquals } from '@/lib/common.ts';

import logger from '@/lib/logger.ts';
import services, { type ApiResponsePromise } from '@/lib/services.ts';

export const useTransactionVendorsStore = defineStore('transactionVendors', () => {
    const allTransactionVendors = ref<TransactionVendor[]>([]);
    const allTransactionVendorsMap = ref<Record<string, TransactionVendor>>({});
    const transactionVendorListStateInvalid = ref<boolean>(true);

    const allVisibleVendors = computed<TransactionVendor[]>(() => {
        const visibleVendors: TransactionVendor[] = [];

        for (const vendor of allTransactionVendors.value) {
            if (!vendor.hidden) {
                visibleVendors.push(vendor);
            }
        }

        return visibleVendors;
    });

    const allAvailableVendorsCount = computed<number>(() => allTransactionVendors.value.length);
    const allVisibleVendorsCount = computed<number>(() => allVisibleVendors.value.length);

    function loadTransactionVendorList(vendors: TransactionVendor[]): void {
        allTransactionVendors.value = vendors;
        allTransactionVendorsMap.value = {};

        for (const vendor of vendors) {
            allTransactionVendorsMap.value[vendor.id] = vendor;
        }
    }

    function addVendorToTransactionVendorList(vendor: TransactionVendor): void {
        allTransactionVendors.value.push(vendor);
        allTransactionVendorsMap.value[vendor.id] = vendor;
    }

    function updateVendorInTransactionVendorList(vendor: TransactionVendor): void {
        for (let i = 0; i < allTransactionVendors.value.length; i++) {
            if (allTransactionVendors.value[i].id === vendor.id) {
                allTransactionVendors.value.splice(i, 1, vendor);
                break;
            }
        }

        allTransactionVendorsMap.value[vendor.id] = vendor;
    }

    function updateVendorVisibilityInTransactionVendorList({ vendor, hidden }: { vendor: TransactionVendor, hidden: boolean }): void {
        if (allTransactionVendorsMap.value[vendor.id]) {
            allTransactionVendorsMap.value[vendor.id].hidden = hidden;
        }
    }

    function removeVendorFromTransactionVendorList(vendor: TransactionVendor): void {
        for (let i = 0; i < allTransactionVendors.value.length; i++) {
            if (allTransactionVendors.value[i].id === vendor.id) {
                allTransactionVendors.value.splice(i, 1);
                break;
            }
        }

        if (allTransactionVendorsMap.value[vendor.id]) {
            delete allTransactionVendorsMap.value[vendor.id];
        }
    }

    function updateTransactionVendorListInvalidState(invalidState: boolean): void {
        transactionVendorListStateInvalid.value = invalidState;
    }

    function resetTransactionVendors(): void {
        allTransactionVendors.value = [];
        allTransactionVendorsMap.value = {};
        transactionVendorListStateInvalid.value = true;
    }

    function loadAllVendors({ force }: { force?: boolean }): Promise<TransactionVendor[]> {
        if (!force && !transactionVendorListStateInvalid.value) {
            return new Promise((resolve) => {
                resolve(allTransactionVendors.value);
            });
        }

        return new Promise((resolve, reject) => {
            services.getAllTransactionVendors().then(response => {
                const data = response.data;

                if (!data || !data.success || !data.result) {
                    reject({ message: 'Unable to retrieve vendor list' });
                    return;
                }

                if (transactionVendorListStateInvalid.value) {
                    updateTransactionVendorListInvalidState(false);
                }

                const transactionVendors = TransactionVendor.ofMulti(data.result);

                if (force && data.result && isEquals(allTransactionVendors.value, transactionVendors)) {
                    reject({ message: 'Vendor list is up to date', isUpToDate: true });
                    return;
                }

                loadTransactionVendorList(transactionVendors);

                resolve(transactionVendors);
            }).catch(error => {
                if (force) {
                    logger.error('failed to force load vendor list', error);
                } else {
                    logger.error('failed to load vendor list', error);
                }

                if (error.response && error.response.data && error.response.data.errorMessage) {
                    reject({ error: error.response.data });
                } else if (!error.processed) {
                    reject({ message: 'Unable to retrieve vendor list' });
                } else {
                    reject(error);
                }
            });
        });
    }

    function saveVendor({ vendor }: { vendor: TransactionVendor }): Promise<TransactionVendor> {
        return new Promise((resolve, reject) => {
            let promise: ApiResponsePromise<TransactionVendorInfoResponse>;

            if (!vendor.id) {
                promise = services.addTransactionVendor(vendor.toCreateRequest());
            } else {
                promise = services.modifyTransactionVendor(vendor.toModifyRequest());
            }

            promise.then(response => {
                const data = response.data;

                if (!data || !data.success || !data.result) {
                    if (!vendor.id) {
                        reject({ message: 'Unable to add vendor' });
                    } else {
                        reject({ message: 'Unable to save vendor' });
                    }
                    return;
                }

                const transactionVendor = TransactionVendor.of(data.result);

                if (!vendor.id) {
                    addVendorToTransactionVendorList(transactionVendor);
                } else {
                    updateVendorInTransactionVendorList(transactionVendor);
                }

                resolve(transactionVendor);
            }).catch(error => {
                logger.error('failed to save vendor', error);

                if (error.response && error.response.data && error.response.data.errorMessage) {
                    reject({ error: error.response.data });
                } else if (!error.processed) {
                    if (!vendor.id) {
                        reject({ message: 'Unable to add vendor' });
                    } else {
                        reject({ message: 'Unable to save vendor' });
                    }
                } else {
                    reject(error);
                }
            });
        });
    }

    function hideVendor({ vendor, hidden }: { vendor: TransactionVendor, hidden: boolean }): Promise<boolean> {
        return new Promise((resolve, reject) => {
            services.hideTransactionVendor({
                id: vendor.id,
                hidden: hidden
            }).then(response => {
                const data = response.data;

                if (!data || !data.success || !data.result) {
                    if (hidden) {
                        reject({ message: 'Unable to hide this vendor' });
                    } else {
                        reject({ message: 'Unable to show this vendor' });
                    }
                    return;
                }

                updateVendorVisibilityInTransactionVendorList({ vendor: vendor, hidden: hidden });
                resolve(true);
            }).catch(error => {
                logger.error('failed to change vendor visibility', error);

                if (error.response && error.response.data && error.response.data.errorMessage) {
                    reject({ error: error.response.data });
                } else if (!error.processed) {
                    if (hidden) {
                        reject({ message: 'Unable to hide this vendor' });
                    } else {
                        reject({ message: 'Unable to show this vendor' });
                    }
                } else {
                    reject(error);
                }
            });
        });
    }

    function deleteVendor({ vendor, beforeResolve }: { vendor: TransactionVendor, beforeResolve?: BeforeResolveFunction }): Promise<boolean> {
        return new Promise((resolve, reject) => {
            services.deleteTransactionVendor({
                id: vendor.id
            }).then(response => {
                const data = response.data;

                if (!data || !data.success || !data.result) {
                    reject({ message: 'Unable to delete this vendor' });
                    return;
                }

                if (beforeResolve) {
                    beforeResolve(() => {
                        removeVendorFromTransactionVendorList(vendor);
                        resolve(true);
                    });
                } else {
                    removeVendorFromTransactionVendorList(vendor);
                    resolve(true);
                }
            }).catch(error => {
                logger.error('failed to delete vendor', error);

                if (error.response && error.response.data && error.response.data.errorMessage) {
                    reject({ error: error.response.data });
                } else if (!error.processed) {
                    reject({ message: 'Unable to delete this vendor' });
                } else {
                    reject(error);
                }
            });
        });
    }

    return {
        allTransactionVendors,
        allTransactionVendorsMap,
        transactionVendorListStateInvalid,
        allVisibleVendors,
        allAvailableVendorsCount,
        allVisibleVendorsCount,
        loadAllVendors,
        saveVendor,
        hideVendor,
        deleteVendor,
        updateTransactionVendorListInvalidState,
        resetTransactionVendors
    };
}); 