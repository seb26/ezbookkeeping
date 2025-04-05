<template>
    <v-select
        persistent-placeholder
        :readonly="readonly"
        :disabled="disabled"
        :clearable="modelValue ? clearable : false"
        :label="label"
        :menu-props="{ contentClass: 'date-select-menu' }"
        v-model="selectedDate"
    >
        <template #selection>
            <span class="text-truncate cursor-pointer">{{ displayName }}</span>
        </template>

        <template #no-data>
            <vue-date-picker inline vertical auto-apply
                             ref="datepicker"
                             month-name-format="long"
                             model-type="MM-dd"
                             :clearable="false"
                             :enable-time-picker="false"
                             :dark="isDarkMode"
                             :week-start="firstDayOfWeek"
                             :day-names="dayNames"
                             v-model="selectedDate"
                             >
                <template #month="{ text }">
                    {{ getMonthShortName(text) }}
                </template>
                <template #month-overlay-value="{ text }">
                    {{ getMonthShortName(text) }}
                </template>
            </vue-date-picker>
        </template>
    </v-select>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useUserStore } from '@/stores/user.ts';
import { ThemeType } from '@/core/theme.ts';
import { arrangeArrayWithNewStartIndex } from '@/lib/common.ts';
import {
    type FiscalYearStartSelectionBaseProps,
    useFiscalYearStartSelectionBase
} from '@/components/base/FiscalYearStartSelectionBase.ts';
import { useI18n } from '@/locales/helpers.ts';
import { FiscalYearStart } from '@/core/fiscalyear';

const props = defineProps({
    modelValue: Number,
    disabled: Boolean,
    readonly: Boolean,
    clearable: Boolean,
    label: String
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void;
}>();

const { getAllMinWeekdayNames, getMonthShortName } = useI18n();
const userStore = useUserStore();
const { getCurrentFiscalYearStart } = useI18n();
const baseProps = computed<FiscalYearStartSelectionBaseProps>(() => ({ modelValue: props.modelValue || userStore.currentUserFiscalYearStart || FiscalYearStart.DefaultNumber }));
const baseSelectionFunctions = useFiscalYearStartSelectionBase(baseProps.value);
const { getterModelValue, setterModelValue } = baseSelectionFunctions;

const displayName = computed(() => {
    return useFiscalYearStartSelectionBase({ modelValue: props.modelValue || userStore.currentUserFiscalYearStart || FiscalYearStart.DefaultNumber }).displayName.value;
});

const theme = useTheme();
const isDarkMode = computed<boolean>(() => theme.global.name.value === ThemeType.Dark);
const firstDayOfWeek = computed<number>(() => userStore.currentUserFirstDayOfWeek);
const dayNames = computed<string[]>(() => arrangeArrayWithNewStartIndex(getAllMinWeekdayNames(), firstDayOfWeek.value));

const selectedDate = computed<string>({
    get: () => {
        return getterModelValue(props.modelValue || userStore.currentUserFiscalYearStart || FiscalYearStart.DefaultNumber);
    },
    set: (value: string) => {
        const numericValue = setterModelValue(value);
        emit('update:modelValue', numericValue);
    }
});

// Initialize the component with the correct value
onMounted(() => {
    if (!props.modelValue) {
        // If no value is provided, use the user store value or default
        const initialValue = userStore.currentUserFiscalYearStart || FiscalYearStart.DefaultNumber;
        emit('update:modelValue', initialValue);
    }
});
</script>

<style>
.date-select-menu {
    max-height: inherit !important;
}

.date-select-menu .dp__menu {
    border: 0;
}
</style>
