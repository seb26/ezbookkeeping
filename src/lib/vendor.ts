import { TransactionVendor } from '@/models/transaction_vendor.ts';

export function isNoAvailableVendor(vendors: TransactionVendor[], showHidden: boolean): boolean {
    for (let i = 0; i < vendors.length; i++) {
        if (showHidden || !vendors[i].hidden) {
            return false;
        }
    }

    return true;
}

export function getAvailableVendorCount(vendors: TransactionVendor[], showHidden: boolean): number {
    let count = 0;

    for (let i = 0; i < vendors.length; i++) {
        if (showHidden || !vendors[i].hidden) {
            count++;
        }
    }

    return count;
}

export function getFirstShowingId(vendors: TransactionVendor[], showHidden: boolean): string | null {
    for (let i = 0; i < vendors.length; i++) {
        if (showHidden || !vendors[i].hidden) {
            return vendors[i].id;
        }
    }

    return null;
}

export function getLastShowingId(vendors: TransactionVendor[], showHidden: boolean): string | null {
    for (let i = vendors.length - 1; i >= 0; i--) {
        if (showHidden || !vendors[i].hidden) {
            return vendors[i].id;
        }
    }

    return null;
}
