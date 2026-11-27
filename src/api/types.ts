// src/api/types.ts

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: { code: string; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type TxStatus = 'pending' | 'success' | 'failed';
export type TxService = 'airtime' | 'data' | 'cable' | 'electricity' | 'wallet';
export type TxDirection = 'debit' | 'credit';
export type MeterType = 'prepaid' | 'postpaid';

export type Balance = { balance: number; currency: 'NGN' };
export type AppConfig = {
  minimumVersion: string | null;
  maintenance: boolean;
  maintenanceMessage: string | null;
};

export type Me = {
  id: string;
  name: string;
  username: string;
  phone: string | null;
  email: string | null;
  status: string;
  verified: boolean;
  package: { id: string; name: string };
  hasPin: boolean;
  pinRequired: boolean;
  locked: boolean;
  walletBalance: number;
  cashbackBalance: number;
  unreadCount: number;
  useCashbackDefault: boolean;
  confirmPurchases: boolean;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  at: string;
};
export type NotificationList = { items: AppNotification[] };

export type FundingAccount = { accountNumber: string; bankName: string; accountName: string };
export type PendingFunding = {
  reference: string;
  amountKobo: number;
  accountNumber: string;
  bankName: string;
  status: string;
  expiresAt: string;
};
export type FundingOptions = { permanent: FundingAccount | null; pending: PendingFunding[] };
export type TemporaryFunding = FundingAccount & {
  amount: number;
  reference: string;
  expiresAt: string;
};

export type SupportTicketInput = { subject: string; body: string; transactionId?: string };
export type SupportTicketCreated = { id: string };

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
  detail?: string | null;
  failureReason?: string | null;
  refunded?: boolean;
  cashbackUsed?: number;
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
  skipNetworkCheck?: boolean;
  networkId: string;
  typeId: string;
  amount: number;
  phone: string;
};
export type DataPurchase = PurchaseBase & {
  planId: string;
  phone: string;
  skipNetworkCheck?: boolean;
};
export type CablePurchase = PurchaseBase & { planId: string; smartcard: string; phone: string };
export type ElectricityPurchase = PurchaseBase & {
  discoId: string;
  meterType: MeterType;
  meter: string;
  amount: number;
  phone: string;
};
export type PurchaseResult = { reference: string; status: 'success' | 'pending'; message: string };
