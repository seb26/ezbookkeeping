export class TransactionVendor implements TransactionVendorInfoResponse {
    public id: string;
    public name: string;
    public hidden: boolean;

    private constructor(id: string, name: string, hidden: boolean) {
        this.id = id;
        this.name = name;
        this.hidden = hidden;
    }

    public toCreateRequest(): TransactionVendorCreateRequest {
        return {
            name: this.name,
        };
    }

    public toModifyRequest(): TransactionVendorModifyRequest {
        return {
            id: this.id,
            name: this.name,
        };
    }

    public static of(vendorResponse: TransactionVendorInfoResponse): TransactionVendor {
        return new TransactionVendor(vendorResponse.id, vendorResponse.name, vendorResponse.hidden);
    }

    public static ofMulti(vendorResponses: TransactionVendorInfoResponse[]): TransactionVendor[] {
        const vendors: TransactionVendor[] = [];

        for (const vendorResponse of vendorResponses) {
            vendors.push(TransactionVendor.of(vendorResponse));
        }

        return vendors;
    }

    public static createNewVendor(name?: string): TransactionVendor {
        return new TransactionVendor('', name || '', false);
    }
}

export interface TransactionVendorCreateRequest {
    readonly name: string;
}

export interface TransactionVendorModifyRequest {
    readonly id: string;
    readonly name: string;
}

export interface TransactionVendorHideRequest {
    readonly id: string;
    readonly hidden: boolean;
}

export interface TransactionVendorDeleteRequest {
    readonly id: string;
}

export interface TransactionVendorInfoResponse {
    readonly id: string;
    readonly name: string;
    readonly hidden: boolean;
} 