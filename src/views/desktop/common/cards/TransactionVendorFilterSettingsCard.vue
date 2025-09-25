<template>
    <v-card :class="{ 'pa-2 pa-sm-4 pa-md-8': dialogMode }">
        <template #title>
            <div class="d-flex align-center justify-center" v-if="dialogMode">
                <div class="w-100 text-center">
                    <h4 class="text-h4">{{ tt('Filter Transaction Vendors') }}</h4>
                </div>
                <v-btn density="comfortable" color="default" variant="text" class="ml-2"
                       :disabled="loading || !hasAnyAvailableVendor" :icon="true">
                    <v-icon :icon="mdiDotsVertical" />
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
            <div class="d-flex align-center" v-else-if="!dialogMode">
                <span>{{ tt('Filter Transaction Vendors') }}</span>
                <v-spacer/>
                <v-btn density="comfortable" color="default" variant="text" class="ml-2"
                       :disabled="loading" :icon="true">
                    <v-icon :icon="mdiDotsVertical" />
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

        <div v-if="loading">
            <v-skeleton-loader type="paragraph" :loading="loading"
                               :key="itemIdx" v-for="itemIdx in [ 1, 2, 3 ]"></v-skeleton-loader>
        </div>

        <v-card-text :class="{ 'mt-0 mt-sm-2 mt-md-4': dialogMode }" v-if="!loading && !hasAnyVisibleVendor">
            <span class="text-body-1">{{ tt('No available vendor') }}</span>
        </v-card-text>

        <v-card-text :class="{ 'mt-0 mt-sm-2 mt-md-4': dialogMode }" v-else-if="!loading && hasAnyVisibleVendor">
            <div class="vendor-filter-types d-flex flex-column mb-4" v-if="type === 'statisticsCurrent'">
                <v-btn border class="justify-start" :key="filterType.type"
                       :color="vendorFilterType === filterType.type ? 'primary' : 'default'"
                       :variant="vendorFilterType === filterType.type ? 'tonal' : 'outlined'"
                       :append-icon="(vendorFilterType === filterType.type ? mdiCheck : undefined)"
                       v-for="filterType in allVendorFilterTypes"
                       @click="setVendorFilterType(filterType.type)">
                    {{ filterType.displayName }}
                </v-btn>
            </div>

            <v-expansion-panels class="vendor-categories" multiple v-model="expandVendorCategories">
                <v-expansion-panel class="border" key="default" value="default">
                    <v-expansion-panel-title class="expand-panel-title-with-bg py-0">
                        <span class="ml-3">{{ tt('Vendors') }}</span>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <v-list rounded density="comfortable" class="pa-0">
                            <template :key="transactionVendor.id"
                                      v-for="transactionVendor in allVendors">
                                <v-list-item v-if="showHidden || !transactionVendor.hidden">
                                    <template #prepend>
                                        <v-checkbox :model-value="filterVendorIds[transactionVendor.id]"
                                                    :true-icon="expandVendorCheckboxIcon"
                                                    :disabled="expandVendorCheckboxDisabled"
                                                    @update:model-value="updateTransactionVendorSelected(transactionVendor, $event)">
                                            <template #label>
                                                <v-badge class="right-bottom-icon" color="secondary"
                                                         location="bottom right" offset-x="2" offset-y="2" :icon="mdiEyeOffOutline"
                                                         v-if="transactionVendor.hidden">
                                                    <v-icon size="24" :icon="mdiStoreOutline"/>
                                                </v-badge>
                                                <v-icon size="24" :icon="mdiStoreOutline" v-else-if="!transactionVendor.hidden"/>
                                                <span class="ml-3">{{ transactionVendor.name }}</span>
                                            </template>
                                        </v-checkbox>
                                    </template>
                                </v-list-item>
                            </template>
                        </v-list>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
        </v-card-text>

        <v-card-text class="overflow-y-visible" v-if="dialogMode">
            <div class="w-100 d-flex justify-center mt-2 mt-sm-4 mt-md-6 gap-4">
                <v-btn color="secondary" variant="tonal" @click="clearVendorFilters">{{ tt('Clear') }}</v-btn>
                <v-btn :disabled="!hasAnyVisibleVendor" @click="save">{{ tt('Apply') }}</v-btn>
                <v-btn color="secondary" variant="tonal" @click="cancel">{{ tt('Cancel') }}</v-btn>
            </div>
        </v-card-text>
    </v-card>

    <snack-bar ref="snackbar" />
</template>

<script setup lang="ts">
import SnackBar from '@/components/desktop/SnackBar.vue';

import { ref, useTemplateRef } from 'vue';

import { useI18n } from '@/locales/helpers.ts';
import { useTransactionVendorFilterSettingPageBase } from '@/views/base/settings/TransactionVendorFilterSettingPageBase.ts';

import { useTransactionVendorsStore } from '@/stores/transactionVendor.ts';

import type { TransactionVendor } from '@/models/transaction_vendor.ts';

import {
    mdiEyeOutline,
    mdiEyeOffOutline,
    mdiDotsVertical,
    mdiCheck,
    mdiStoreOutline,
} from '@mdi/js';

type SnackBarType = InstanceType<typeof SnackBar>;

const props = defineProps<{
    type: string;
    dialogMode?: boolean;
    autoSave?: boolean;
}>();

const emit = defineEmits<{
    (e: 'settings:change', changed: boolean): void;
}>();

const { tt } = useI18n();

const {
    loading,
    showHidden,
    filterVendorIds,
    vendorFilterType,
    allVendors,
    allVendorFilterTypes,
    hasAnyAvailableVendor,
    hasAnyVisibleVendor,
    expandVendorCheckboxIcon,
    expandVendorCheckboxDisabled,
    clearVendorFilters,
    loadFilterVendorIds,
    saveFilterVendorIds,
    setVendorFilterType
} = useTransactionVendorFilterSettingPageBase(props.type);

const transactionVendorsStore = useTransactionVendorsStore();

const snackbar = useTemplateRef<SnackBarType>('snackbar');

const expandVendorCategories = ref<string[]>([ 'default' ]);

function init(): void {
    transactionVendorsStore.loadAllVendors({
        force: false
    }).then(() => {
        loading.value = false;

        if (!loadFilterVendorIds()) {
            snackbar.value?.showError('Parameter Invalid');
        }
    }).catch(error => {
        loading.value = false;

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function updateTransactionVendorSelected(transactionVendor: TransactionVendor, value: boolean | null): void {
    if (value) {
        filterVendorIds.value[transactionVendor.id] = true;
    } else {
        delete filterVendorIds.value[transactionVendor.id];
    }

    if (props.autoSave) {
        save();
    }
}

function save(): void {
    const changed = saveFilterVendorIds();
    emit('settings:change', changed);
}

function cancel(): void {
    emit('settings:change', false);
}

init();
</script>

<style>
.vendor-filter-types .v-btn:not(:first-child) {
    border-top-left-radius: inherit;
    border-top-right-radius: inherit;
}

.vendor-filter-types .v-btn:not(:last-child) {
    border-bottom: 0;
    border-bottom-left-radius: inherit;
    border-bottom-right-radius: inherit;
}

.vendor-categories .v-expansion-panel-text__wrapper {
    padding: 0 0 0 20px;
}

.vendor-categories .v-expansion-panel--active:not(:first-child),
.vendor-categories .v-expansion-panel--active + .v-expansion-panel {
    margin-top: 1rem;
}
</style>
