// src/api/types.ts

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: { code: string; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type TxStatus = 'pending' | 'success' | 'failed';
export type TxService = 'airtime' | 'data' | 'cable' | 'electricity' | 'wallet';
export type TxDirection = 'debit' | 'credit';
export type MeterType = 'prepaid' | 'postpaid';

export type Balance = { balance: number; currency: 'NGN' };

export type AirtimeRange = { min: number; max: number; discount: number };
export type AirtimeType = { id: string; label: string; ranges: AirtimeRange[] };
export type AirtimeNetwork = { id: string; name: string; types: AirtimeType[] };
export type AirtimeCatalog = { networks: AirtimeNetwork[] };

export type DataPlan = { id: string; typeId: string; size: string; validity: string; price: number };
export type DataNetwork = {
  id: string;
  name: string;
  types: { id: string; label: string }[];
  plans: DataPlan[];
};
export type DataCatalog = { networks: DataNetwork[] };

export type CablePlan = { id: string; name: string; validity: string; price: number };
export type CableOperator = { id: string; name: string; plans: CablePlan[] };
export type CableCatalog = { operators: CableOperator[] };

export type Disco = { id: string; name: string; min: number; max: number; discount: number };
export type ElectricityCatalog = { discos: Disco[] };

export type SmartcardVerification = { valid: true; name: string } | { valid: false };
export type MeterVerification =
  | { valid: true; name: string; address: string }
  | { valid: false };

export type TransactionItem = {
  reference: string;
  service: TxService;
  title: string;
  amount: number;
  direction: TxDirection;
  status: TxStatus;
  at: string;
};
export type TransactionPage = { page: number; pageSize: number; total: number; items: TransactionItem[] };
export type TransactionStatus = {
  reference: string;
  status: TxStatus;
  title: string;
  failureReason: string | null;
};
export type TransactionFilters = {
  q?: string;
  status?: TxStatus | 'all';
  service?: TxService | 'all';
  page?: number;
};

type PurchaseBase = {
  reference: string;
  pin: string;
  useCashback?: boolean;
  promoCode?: string | null;
};

export type AirtimePurchase = PurchaseBase & {
  networkId: string;
  typeId: string;
  amount: number;
  phone: string;
};
export type DataPurchase = PurchaseBase & { planId: string; phone: string };
export type CablePurchase = PurchaseBase & { planId: string; smartcard: string; phone: string };
export type ElectricityPurchase = PurchaseBase & {
  discoId: string;
  meterType: MeterType;
  meter: string;
  amount: number;
  phone: string;
};
export type PurchaseResult = { reference: string; status: 'success' | 'pending'; message: string };
