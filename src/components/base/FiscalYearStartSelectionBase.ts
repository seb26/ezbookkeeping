import { computed } from 'vue';

import { FiscalYearStart } from '@/core/fiscalyear';

import { useI18n } from '@/locales/helpers.ts';

import { formatMonthDay } from '@/lib/datetime';

export interface FiscalYearStartSelectionBaseProps {
    modelValue?: number;
}

export function useFiscalYearStartSelectionBase(props: FiscalYearStartSelectionBaseProps) {
    const { getCurrentFiscalYearStart, getLocalizedLongMonthDayFormat } = useI18n();

    function getterModelValue(input: number | undefined): string {
        if (input !== 0 && input !== undefined) {
            const fy = FiscalYearStart.fromNumber(input);
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

        if (props.modelValue !== 0 && props.modelValue !== undefined) {
            const testFy = FiscalYearStart.fromNumber(props.modelValue);
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

    return {
      // computed states
      displayName,
      // functions
      getterModelValue,
      setterModelValue,
    }
}



//toUIDate(input: number): string {
//return FiscalYearStart.fromUint16(input).toMonthDashDayString();
//}
//
//toUserProfileFormat(input: string): number {
//return FiscalYearStart.fromMonthDashDayString(input).toUint16();
//}