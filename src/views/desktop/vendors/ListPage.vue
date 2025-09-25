<template>
    <v-row class="match-height">
        <v-col cols="12">
            <v-card>
                <template #title>
                    <div class="title-and-toolbar d-flex align-center">
                        <span>{{ tt('Transaction Vendors') }}</span>
                        <v-btn class="ml-3" color="default" variant="outlined"
                               :disabled="loading || updating || hasEditingVendor" @click="add">{{ tt('Add') }}</v-btn>
                        <v-btn density="compact" color="default" variant="text" size="24"
                               class="ml-2" :icon="true" :disabled="loading || updating || hasEditingVendor"
                               :loading="loading" @click="reload">
                            <template #loader>
                                <v-progress-circular indeterminate size="20"/>
                            </template>
                            <v-icon :icon="mdiRefresh" size="24" />
                            <v-tooltip activator="parent">{{ tt('Refresh') }}</v-tooltip>
                        </v-btn>
                        <v-spacer/>
                        <v-btn density="comfortable" color="default" variant="text" class="ml-2"
                               :disabled="loading || updating || hasEditingVendor" :icon="true">
                            <v-menu activator="parent">
                                <v-list>
                                    <v-list-item :prepend-icon="mdiEyeOutline"
                                                 :title="tt('Show Hidden Transaction Vendors')"
                                                 v-if="!showHidden" @click="showHidden = true"></v-list-item>
                                    <v-list-item :prepend-icon="mdiEyeOffOutline"
                                                 :title="tt('Hide Hidden Transaction Vendors')"
                                                 v-if="showHidden" @click="showHidden = false"></v-list-item>
                                </v-list>
                            </v-menu>
                        </v-btn>
                    </div>
                </template>

                <v-table class="transaction-vendors-table table-striped" :hover="!loading">
                    <thead>
                    <tr>
                        <th>
                            <div class="d-flex align-center">
                                <span>{{ tt('Vendor Title') }}</span>
                                <v-spacer/>
                                <span>{{ tt('Operation') }}</span>
                            </div>
                        </th>
                    </tr>
                    </thead>

                    <tbody v-if="loading && noAvailableVendor && !newVendor">
                    <tr :key="itemIdx" v-for="itemIdx in [ 1, 2, 3 ]">
                        <td class="px-0">
                            <v-skeleton-loader type="text" :loading="true"></v-skeleton-loader>
                        </td>
                    </tr>
                    </tbody>

                    <tbody v-if="!loading && noAvailableVendor && !newVendor">
                    <tr>
                        <td>{{ tt('No available vendor') }}</td>
                    </tr>
                    </tbody>

                    <draggable-list tag="tbody"
                                    item-key="id"
                                    handle=".drag-handle"
                                    ghost-class="dragging-item"
                                    :class="{ 'has-bottom-border': newVendor }"
                                    :disabled="noAvailableVendor"
                                    v-model="vendors">
                        <template #item="{ element }">
                            <tr class="transaction-vendors-table-row-vendor text-sm" v-if="showHidden || !element.hidden">
                                <td>
                                    <div class="d-flex align-center">
                                        <div class="d-flex align-center" v-if="editingVendor.id !== element.id">
                                            <v-badge class="right-bottom-icon" color="secondary"
                                                     location="bottom right" offset-x="8" :icon="mdiEyeOffOutline"
                                                     v-if="element.hidden">
                                                <v-icon size="20" start :icon="mdiStoreOutline"/>
                                            </v-badge>
                                            <v-icon size="20" start :icon="mdiStoreOutline" v-else-if="!element.hidden"/>
                                            <span class="transaction-vendor-name">{{ element.name }}</span>
                                        </div>

                                        <v-text-field class="w-100 mr-2" type="text"
                                            density="compact" variant="underlined"
                                            :disabled="loading || updating"
                                            :placeholder="tt('Vendor Title')"
                                            v-model="editingVendor.name"
                                            v-else-if="editingVendor.id === element.id"
                                            @keyup.enter="save(editingVendor)"
                                        >
                                            <template #prepend>
                                                <v-badge class="right-bottom-icon" color="secondary"
                                                         location="bottom right" offset-x="8" :icon="mdiEyeOffOutline"
                                                         v-if="element.hidden">
                                                    <v-icon size="20" start :icon="mdiStoreOutline"/>
                                                </v-badge>
                                                <v-icon size="20" start :icon="mdiStoreOutline" v-else-if="!element.hidden"/>
                                            </template>
                                        </v-text-field>

                                        <v-spacer/>

                                        <v-btn class="px-2 ml-2" color="default"
                                               density="comfortable" variant="text"
                                               :class="{ 'd-none': loading, 'hover-display': !loading }"
                                               :prepend-icon="mdiListBoxOutline"
                                               :loading="vendorHiding[element.id]"
                                               :disabled="loading || updating"
                                               v-if="editingVendor.id !== element.id"
                                               @click="viewTransactions(element.id)">
                                            {{ tt('View Transactions') }}
                                        </v-btn>
                                        <v-btn class="px-2 ml-2" color="default"
                                               density="comfortable" variant="text"
                                               :class="{ 'd-none': loading, 'hover-display': !loading }"
                                               :prepend-icon="element.hidden ? mdiEyeOutline : mdiEyeOffOutline"
                                               :loading="vendorHiding[element.id]"
                                               :disabled="loading || updating"
                                               v-if="editingVendor.id !== element.id"
                                               @click="hide(element, !element.hidden)">
                                            <template #loader>
                                                <v-progress-circular indeterminate size="20" width="2"/>
                                            </template>
                                            {{ element.hidden ? tt('Show') : tt('Hide') }}
                                        </v-btn>
                                        <v-btn class="px-2" color="default"
                                               density="comfortable" variant="text"
                                               :class="{ 'd-none': loading, 'hover-display': !loading }"
                                               :prepend-icon="mdiPencilOutline"
                                               :loading="vendorUpdating[element.id]"
                                               :disabled="loading || updating"
                                               v-if="editingVendor.id !== element.id"
                                               @click="edit(element)">
                                            <template #loader>
                                                <v-progress-circular indeterminate size="20" width="2"/>
                                            </template>
                                            {{ tt('Edit') }}
                                        </v-btn>
                                        <v-btn class="px-2" color="default"
                                               density="comfortable" variant="text"
                                               :class="{ 'd-none': loading, 'hover-display': !loading }"
                                               :prepend-icon="mdiDeleteOutline"
                                               :loading="vendorRemoving[element.id]"
                                               :disabled="loading || updating"
                                               v-if="editingVendor.id !== element.id"
                                               @click="remove(element)">
                                            <template #loader>
                                                <v-progress-circular indeterminate size="20" width="2"/>
                                            </template>
                                            {{ tt('Delete') }}
                                        </v-btn>
                                        <v-btn class="px-2"
                                               density="comfortable" variant="text"
                                               :prepend-icon="mdiCheck"
                                               :loading="vendorUpdating[element.id]"
                                               :disabled="loading || updating || !isVendorModified(element)"
                                               v-if="editingVendor.id === element.id" @click="save(editingVendor)">
                                            <template #loader>
                                                <v-progress-circular indeterminate size="20" width="2"/>
                                            </template>
                                            {{ tt('Save') }}
                                        </v-btn>
                                        <v-btn class="px-2" color="default"
                                               density="comfortable" variant="text"
                                               :prepend-icon="mdiClose"
                                               :disabled="loading || updating"
                                               v-if="editingVendor.id === element.id" @click="cancelSave(editingVendor)">
                                            {{ tt('Cancel') }}
                                        </v-btn>
                                        <span class="ml-2">
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </draggable-list>

                    <tbody v-if="newVendor">
                    <tr class="text-sm" :class="{ 'even-row': (availableVendorCount & 1) === 1}">
                        <td>
                            <div class="d-flex align-center">
                                <v-text-field class="w-100 mr-2" type="text" color="primary"
                                              density="compact" variant="underlined"
                                              :disabled="loading || updating" :placeholder="tt('Vendor Title')"
                                              v-model="newVendor.name" @keyup.enter="save(newVendor)">
                                    <template #prepend>
                                        <v-icon size="20" start :icon="mdiStoreOutline"/>
                                    </template>
                                </v-text-field>

                                <v-spacer/>

                                <v-btn class="px-2" density="comfortable" variant="text"
                                       :prepend-icon="mdiCheck"
                                       :loading="vendorUpdating['']"
                                       :disabled="loading || updating || !isVendorModified(newVendor)"
                                       @click="save(newVendor)">
                                    <template #loader>
                                        <v-progress-circular indeterminate size="20" width="2"/>
                                    </template>
                                    {{ tt('Save') }}
                                </v-btn>
                                <v-btn class="px-2" color="default"
                                       density="comfortable" variant="text"
                                       :prepend-icon="mdiClose"
                                       :disabled="loading || updating"
                                       @click="cancelSave(newVendor)">
                                    {{ tt('Cancel') }}
                                </v-btn>
                                <span class="ml-2">
                                </span>
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </v-table>
            </v-card>
        </v-col>
    </v-row>

    <confirm-dialog ref="confirmDialog"/>
    <snack-bar ref="snackbar" />
</template>

<script setup lang="ts">
import ConfirmDialog from '@/components/desktop/ConfirmDialog.vue';
import SnackBar from '@/components/desktop/SnackBar.vue';

import { ref, computed, useTemplateRef } from 'vue';

import { useRouter } from 'vue-router';

import { useI18n } from '@/locales/helpers.ts';

import { useTransactionVendorsStore } from '@/stores/transactionVendor.ts';

import { TransactionVendor } from '@/models/transaction_vendor.ts';

import {
    isNoAvailableVendor,
    getAvailableVendorCount
} from '@/lib/vendor.ts';

import {
    mdiRefresh,
    mdiPencilOutline,
    mdiCheck,
    mdiClose,
    mdiEyeOffOutline,
    mdiEyeOutline,
    mdiDeleteOutline,
    mdiStoreOutline,
    mdiListBoxOutline,
} from '@mdi/js';

type ConfirmDialogType = InstanceType<typeof ConfirmDialog>;
type SnackBarType = InstanceType<typeof SnackBar>;

const { tt } = useI18n();
const router = useRouter();

const transactionVendorsStore = useTransactionVendorsStore();

const confirmDialog = useTemplateRef<ConfirmDialogType>('confirmDialog');
const snackbar = useTemplateRef<SnackBarType>('snackbar');

const newVendor = ref<TransactionVendor | null>(null);
const editingVendor = ref<TransactionVendor>(TransactionVendor.createNewVendor());
const loading = ref<boolean>(true);
const updating = ref<boolean>(false);
const vendorUpdating = ref<Record<string, boolean>>({});
const vendorHiding = ref<Record<string, boolean>>({});
const vendorRemoving = ref<Record<string, boolean>>({});
const showHidden = ref<boolean>(false);

const vendors = computed<TransactionVendor[]>(() => transactionVendorsStore.allTransactionVendors);
const noAvailableVendor = computed<boolean>(() => isNoAvailableVendor(vendors.value, showHidden.value));
const availableVendorCount = computed<number>(() => getAvailableVendorCount(vendors.value, showHidden.value));
const hasEditingVendor = computed<boolean>(() => !!(newVendor.value || (editingVendor.value.id && editingVendor.value.id !== '')));

function isVendorModified(vendor: TransactionVendor): boolean {
    if (vendor.id) {
        return editingVendor.value.name !== '' && editingVendor.value.name !== vendor.name;
    } else {
        return vendor.name !== '';
    }
}

function reload(): void {
    if (hasEditingVendor.value) {
        return;
    }

    loading.value = true;

    transactionVendorsStore.loadAllVendors({
        force: true
    }).then(() => {
        loading.value = false;

        snackbar.value?.showMessage('Vendor list has been updated');
    }).catch(error => {
        loading.value = false;

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function add(): void {
    newVendor.value = TransactionVendor.createNewVendor();
}

function edit(vendor: TransactionVendor): void {
    editingVendor.value.id = vendor.id;
    editingVendor.value.name = vendor.name;
}

function save(vendor: TransactionVendor): void {
    updating.value = true;
    vendorUpdating.value[vendor.id || ''] = true;

    transactionVendorsStore.saveVendor({
        vendor: vendor
    }).then(() => {
        updating.value = false;
        vendorUpdating.value[vendor.id || ''] = false;

        if (vendor.id) {
            editingVendor.value.id = '';
            editingVendor.value.name = '';
        } else {
            newVendor.value = null;
        }
    }).catch(error => {
        updating.value = false;
        vendorUpdating.value[vendor.id || ''] = false;

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function cancelSave(vendor: TransactionVendor): void {
    if (vendor.id) {
        editingVendor.value.id = '';
        editingVendor.value.name = '';
    } else {
        newVendor.value = null;
    }
}

function hide(vendor: TransactionVendor, hidden: boolean): void {
    updating.value = true;
    vendorHiding.value[vendor.id] = true;

    transactionVendorsStore.hideVendor({
        vendor: vendor,
        hidden: hidden
    }).then(() => {
        updating.value = false;
        vendorHiding.value[vendor.id] = false;
    }).catch(error => {
        updating.value = false;
        vendorHiding.value[vendor.id] = false;

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function remove(vendor: TransactionVendor): void {
    confirmDialog.value?.open('Are you sure you want to delete this vendor?').then(() => {
        updating.value = true;
        vendorRemoving.value[vendor.id] = true;

        transactionVendorsStore.deleteVendor({
            vendor: vendor
        }).then(() => {
            updating.value = false;
            vendorRemoving.value[vendor.id] = false;
        }).catch(error => {
            updating.value = false;
            vendorRemoving.value[vendor.id] = false;

            if (!error.processed) {
                snackbar.value?.showError(error);
            }
        });
    });
}

function viewTransactions(vendorId: string): void {
    router.push(`/transaction/list?pageType=0&dateType=7&vendorIds=${vendorId}`);
}

transactionVendorsStore.loadAllVendors({
    force: false
}).then(() => {
    loading.value = false;
}).catch(error => {
    loading.value = false;

    if (!error.processed) {
        snackbar.value?.showError(error);
    }
});
</script>

<style>
.transaction-vendors-table tr.transaction-vendors-table-row-vendor .hover-display {
    display: none;
}

.transaction-vendors-table tr.transaction-vendors-table-row-vendor:hover .hover-display {
    display: inline-grid;
}

.transaction-vendors-table tr:not(:last-child) > td > div {
    padding-bottom: 1px;
}

.transaction-vendors-table .has-bottom-border tr:last-child > td > div {
    padding-bottom: 1px;
}

.transaction-vendors-table tr.transaction-vendors-table-row-vendor .right-bottom-icon .v-badge__badge {
    padding-bottom: 1px;
}

.transaction-vendors-table .v-text-field .v-input__prepend {
    margin-right: 0;
    color: rgba(var(--v-theme-on-surface));
}

.transaction-vendors-table .v-text-field .v-input__prepend .v-badge > .v-badge__wrapper > .v-icon {
    opacity: var(--v-medium-emphasis-opacity);
}

.transaction-vendors-table .v-text-field.v-input--plain-underlined .v-input__prepend {
    padding-top: 10px;
}

.transaction-vendors-table .v-text-field .v-field__input {
    font-size: 0.875rem;
    padding-top: 0;
    color: rgba(var(--v-theme-on-surface));
}

.transaction-vendors-table .transaction-vendor-name {
    font-size: 0.875rem;
}

.transaction-vendors-table tr .v-text-field .v-field__input {
    padding-bottom: 1px;
}
</style>
