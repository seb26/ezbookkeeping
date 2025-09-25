import { TransactionVendor } from '@/models/transaction_vendor.ts';
import { reversed } from '@/core/base.ts';

export function isNoAvailableVendor(vendors: TransactionVendor[], showHidden: boolean): boolean {
    for (const vendor of vendors) {
        if (showHidden || !vendor.hidden) {
            return false;
        }
    }
    return true;
}

export function getAvailableVendorCount(vendors: TransactionVendor[], showHidden: boolean): number {
    let count = 0;
    for (const vendor of vendors) {
        if (showHidden || !vendor.hidden) {
            count++;
        }
    }
    return count;
}

export function getFirstShowingId(vendors: TransactionVendor[], showHidden: boolean): string | null {
    for (const vendor of vendors) {
        if (showHidden || !vendor.hidden) {
            return vendor.id;
        }
    }
    return null;
}

export function getLastShowingId(vendors: TransactionVendor[], showHidden: boolean): string | null {
    for (const vendor of reversed(vendors)) {
        if (showHidden || !vendor.hidden) {
            return vendor.id;
        }
    }
    return null;
}
