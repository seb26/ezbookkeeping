import type { TypeAndName } from './base.ts';

export enum TransactionType {
    ModifyBalance = 1,
    Income = 2,
    Expense = 3,
    Transfer = 4
}

export class TransactionEditScopeType implements TypeAndName {
    private static readonly allInstances: TransactionEditScopeType[] = [];

    public static readonly None = new TransactionEditScopeType(0, 'None');
    public static readonly All = new TransactionEditScopeType(1, 'All');
    public static readonly TodayOrLater = new TransactionEditScopeType(2, 'Today or later');
    public static readonly Recent24HoursOrLater = new TransactionEditScopeType(3, 'Recent 24 hours or later');
    public static readonly ThisWeekOrLater = new TransactionEditScopeType(4, 'This week or later');
    public static readonly ThisMonthOrLater = new TransactionEditScopeType(5, 'This month or later');
    public static readonly ThisYearOrLater = new TransactionEditScopeType(6, 'This year or later');

    public readonly type: number;
    public readonly name: string;

    private constructor(type: number, name: string) {
        this.type = type;
        this.name = name;

        TransactionEditScopeType.allInstances.push(this);
    }

    public static values(): TransactionEditScopeType[] {
        return TransactionEditScopeType.allInstances;
    }
}

export class TransactionTagFilterType implements TypeAndName {
    private static readonly allInstances: TransactionTagFilterType[] = [];

    public static readonly HasAny = new TransactionTagFilterType(0, 'With Any Selected Tags');
    public static readonly HasAll = new TransactionTagFilterType(1, 'With All Selected Tags');
    public static readonly NotHasAny = new TransactionTagFilterType(2, 'Without Any Selected Tags');
    public static readonly NotHasAll = new TransactionTagFilterType(3, 'Without All Selected Tags');

    public static readonly Default = TransactionTagFilterType.HasAny;

    public readonly type: number;
    public readonly name: string;

    private constructor(type: number, name: string) {
        this.type = type;
        this.name = name;

        TransactionTagFilterType.allInstances.push(this);
    }

    public static values(): TransactionTagFilterType[] {
        return TransactionTagFilterType.allInstances;
    }
}

export class TransactionVendorFilterType implements TypeAndName {
    private static readonly allInstances: TransactionVendorFilterType[] = [];

    public static readonly All = new TransactionVendorFilterType(0, 'All');
    public static readonly HasVendor = new TransactionVendorFilterType(1, 'Has Any Vendor');
    public static readonly NoVendor = new TransactionVendorFilterType(2, 'Has No Vendor');
    public static readonly IncludeVendors = new TransactionVendorFilterType(3, 'Include Selected Vendors');
    public static readonly ExcludeVendors = new TransactionVendorFilterType(4, 'Exclude Selected Vendors');

    public static readonly Default = TransactionVendorFilterType.All;

    public readonly type: number;
    public readonly name: string;

    private constructor(type: number, name: string) {
        this.type = type;
        this.name = name;

        TransactionVendorFilterType.allInstances.push(this);
    }

    public static values(): TransactionVendorFilterType[] {
        return TransactionVendorFilterType.allInstances;
    }
}
