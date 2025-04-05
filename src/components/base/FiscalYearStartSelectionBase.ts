import { computed } from 'vue';

import { FiscalYearStart } from '@/core/fiscalyear';

import { useI18n } from '@/locales/helpers.ts';

import { formatMonthDay } from '@/lib/datetime';

import { useUserStore } from '@/stores/user.ts';

export interface FiscalYearStartSelectionBaseProps {
    modelValue?: number;
}

export interface FiscalYearStartSelectionBaseEmits {
    (e: 'update:modelValue', value: number): void;
}

export function useFiscalYearStartSelectionBase(props: FiscalYearStartSelectionBaseProps, emit?: FiscalYearStartSelectionBaseEmits) {
    const { getCurrentFiscalYearStart, getLocalizedLongMonthDayFormat } = useI18n();
    const userStore = useUserStore();

    const getDefaultValue = (): number => {
        return userStore.currentUserFiscalYearStart || FiscalYearStart.DefaultNumber;
    };

    const effectiveModelValue = computed<number>(() => {
        return props.modelValue !== undefined ? props.modelValue : getDefaultValue();
    });

    function getterModelValue(input?: number): string {
        const valueToUse = input !== undefined ? input : effectiveModelValue.value;
        
        if (valueToUse !== 0 && valueToUse !== undefined) {
            const fy = FiscalYearStart.fromNumber(valueToUse);
            if (fy) {
                return fy.toMonthDashDayString();
            }
        }
        return getCurrentFiscalYearStart().toMonthDashDayString();
    }

    function setterModelValue(input: string): number {
        const fy = FiscalYearStart.fromMonthDashDayString(input);
        if (fy) {
            return fy.toNumber();
        }
        return getCurrentFiscalYearStart().toNumber();
    }
    
    const displayName = computed<string>(() => {
        let fy = getCurrentFiscalYearStart();

        if (effectiveModelValue.value !== 0 && effectiveModelValue.value !== undefined) {
            const testFy = FiscalYearStart.fromNumber(effectiveModelValue.value);
            if (testFy) {
                fy = testFy;
            }
        }
        
        const monthDay = fy.toMonthDashDayString();
        return formatMonthDay(
            monthDay,
            getLocalizedLongMonthDayFormat(),
        );
    });

    const disabledDates = (date: Date) => {
        // Disable February 29 (leap day)
        return date.getMonth() === 1 && date.getDate() === 29; 
    };

    const selectedDate = computed<string>({
        get: () => getterModelValue(),
        set: (value: string) => {
            if (emit) {
                const numericValue = setterModelValue(value);
                emit('update:modelValue', numericValue);
            }
        }
    });

    const initializeWithDefaultValue = () => {
        if (emit && props.modelValue === undefined) {
            emit('update:modelValue', getDefaultValue());
        }
    };

    return {
        // computed states
        displayName,
        disabledDates,
        effectiveModelValue,
        selectedDate,
        // functions
        getterModelValue,
        setterModelValue,
        initializeWithDefaultValue,
        getDefaultValue
    }
}



//toUIDate(input: number): string {
//return FiscalYearStart.fromUint16(input).toMonthDashDayString();
//}
//
//toUserProfileFormat(input: string): number {
//return FiscalYearStart.fromMonthDashDayString(input).toUint16();
//}