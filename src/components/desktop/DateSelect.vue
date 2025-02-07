<template>
    <v-select
        persistent-placeholder
        :readonly="readonly"
        :disabled="disabled"
        :label="label"
        :menu-props="{ 'contentClass': 'date-select-menu' }"
        v-model="dateValue"
    >
        <template #selection>
            <span class="text-truncate cursor-pointer">{{ displayTime }}</span>
        </template>

        <template #no-data>
            <vue-date-picker inline vertical auto-apply disable-year-select
                             ref="datepicker"
                             month-name-format="long"
                             :enable-time-picker="false"
                             :clearable="true"
                             :dark="isDarkMode"
                             :week-start="firstDayOfWeek"
                             :year-range="yearRange"
                             :min-date="minDate ? minDate : null"
                             :max-date="maxDate ? maxDate : null"
                             :hide-offset-dates="hideOffsetDates"
                             :day-names="dayNames"
                             :year-first="isYearFirst"
                             v-model="dateValue">
                <template #month="{ text }">
                    {{ getMonthShortName(text) }}
                </template>
                <template #month-overlay-value="{ text }">
                    {{ getMonthShortName(text) }}
                </template>
                <template #am-pm-button="{ toggle, value }">
                    <button class="dp__pm_am_button" tabindex="0" @click="toggle">{{ tt(`dateValue.${value}.content`) }}</button>
                </template>
            </vue-date-picker>
        </template>
    </v-select>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTheme } from 'vuetify';

import { useI18n } from '@/locales/helpers.ts';

import { useUserStore } from '@/stores/user.ts';

import { ThemeType } from '@/core/theme.ts';
import { arrangeArrayWithNewStartIndex } from '@/lib/common.ts';
import {
    getCurrentYear,
    getTimezoneOffsetMinutes,
    getBrowserTimezoneOffsetMinutes,
    getLocalDatetimeFromUnixTime,
    getActualUnixTimeForStore,
    getUnixTime
} from '@/lib/datetime.ts';
import type { YearMonthDayUnixTime } from '@/core/datetime';

const props = defineProps<{
    modelValue: number;
    disabled?: boolean;
    readonly?: boolean;
    label?: string;
    minDate?: YearMonthDayUnixTime;
    maxDate?: YearMonthDayUnixTime;
    hideOffsetDates?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void;
    (e: 'error', message: string): void;
}>();

const theme = useTheme();
const { tt, getAllMinWeekdayNames, getMonthShortName, formatUnixTimeToLongMonthDay, formatUnixTimeToLongDateTime, isLongDateMonthAfterYear } = useI18n();

const userStore = useUserStore();

const minDate = computed<Date>(() => {
    return getLocalDatetimeFromUnixTime(props.minDate?.minUnixTime ?? 0);
});

const maxDate = computed<Date>(() => {
    return getLocalDatetimeFromUnixTime(props.maxDate?.minUnixTime ?? 0);
});

const yearRange = ref<number[]>([
    2000,
    getCurrentYear() + 1
]);

const hideOffsetDates = computed<boolean>(() => props.hideOffsetDates ?? false);

const dateValue = computed<Date>({
    get: () => {
        return getLocalDatetimeFromUnixTime(props.modelValue);
    },
    set: (value: Date) => {
        const unixTime = getUnixTime(value);

        if (unixTime < 0) {
            emit('error', 'Date is too early');
            return;
        }

        emit('update:modelValue', unixTime);
    }
});

const isDarkMode = computed<boolean>(() => theme.global.name.value === ThemeType.Dark);
const firstDayOfWeek = computed<number>(() => userStore.currentUserFirstDayOfWeek);
const dayNames = computed<string[]>(() => arrangeArrayWithNewStartIndex(getAllMinWeekdayNames(), firstDayOfWeek.value));
const isYearFirst = computed<boolean>(() => isLongDateMonthAfterYear());
const displayTime = computed<string>(() => formatUnixTimeToLongDateTime(getActualUnixTimeForStore(getUnixTime(dateValue.value), getTimezoneOffsetMinutes(), getBrowserTimezoneOffsetMinutes())));
</script>

<style>
.date-select-menu {
    max-height: inherit !important;
}

.date-select-menu .dp__menu {
    border: 0;
}
</style>
