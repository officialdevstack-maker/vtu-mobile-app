import { ApiError } from './errors';
import type {
  AirtimeCatalog,
  AppNotification,
  Balance,
  CableCatalog,
  DataCatalog,
  ElectricityCatalog,
  FundingOptions,
  MeterType,
  MeterVerification,
  Me,
  NotificationList,
  SmartcardVerification,
  TransactionFilters,
  TransactionItem,
  TransactionPage,
  TransactionStatus,
} from './types';

export const mockBalance: Balance = {
  balance: 16500,
  currency: 'NGN',
};

export const mockMe: Me = {
  id: 'demo-user',
  name: 'Demo Customer',
  username: 'demo',
  phone: null,
  email: null,
  status: 'active',
  verified: true,
  package: { id: 'basic', name: 'Basic' },
  hasPin: true,
  pinRequired: true,
  locked: false,
  walletBalance: 16500,
  cashbackBalance: 0,
  unreadCount: 2,
  useCashbackDefault: false,
  confirmPurchases: true,
};

const mockNotificationItems: AppNotification[] = [
  {
    id: 'demo-n1',
    title: 'Purchase successful',
    body: 'Your MTN 5 GB data purchase went through.',
    read: false,
    at: '2026-11-25T11:16:00+01:00',
  },
  {
    id: 'demo-n2',
    title: 'Wallet funded',
    body: 'Your wallet was credited with ₦20,000.00.',
    read: false,
    at: '2026-11-25T09:31:00+01:00',
  },
  {
    id: 'demo-n3',
    title: 'Welcome to Spur VTU',
    body: 'Buy airtime, data, cable TV and electricity from one wallet.',
    read: true,
    at: '2026-11-20T10:00:00+01:00',
  },
];

export const mockNotifications: NotificationList = { items: mockNotificationItems };

export const mockFunding: FundingOptions = {
  permanent: {
    accountNumber: '0123456789',
    bankName: 'Demo Bank',
    accountName: 'Demo Customer',
  },
  pending: [],
};

const mockTransactions: TransactionItem[] = [
  {
    reference: 'demo-wallet-credit',
    service: 'wallet',
    title: 'Wallet funding',
    amount: 20000,
    direction: 'credit',
    status: 'success',
    at: '2026-11-25T09:30:00+01:00',
  },
  {
    reference: 'demo-data-purchase',
    service: 'data',
    title: 'MTN 5 GB data',
    amount: 2500,
    direction: 'debit',
    status: 'success',
    at: '2026-11-25T11:15:00+01:00',
  },
  {
    reference: 'demo-airtime-purchase',
    service: 'airtime',
    title: 'Airtime purchase',
    amount: 1000,
    direction: 'debit',
    status: 'pending',
    at: '2026-11-26T08:45:00+01:00',
  },
];

export const mockAirtimeCatalog: AirtimeCatalog = {
  networks: [
    {
      id: 'mtn',
      name: 'MTN',
      types: [{ id: 'mtn-prepaid', label: 'Prepaid', ranges: [{ min: 50, max: 100000, discount: 2 }] }],
    },
    {
      id: 'airtel',
      name: 'Airtel',
      types: [{ id: 'airtel-prepaid', label: 'Prepaid', ranges: [{ min: 50, max: 100000, discount: 2 }] }],
    },
    {
      id: 'glo',
      name: 'Glo',
      types: [{ id: 'glo-prepaid', label: 'Prepaid', ranges: [{ min: 50, max: 100000, discount: 2 }] }],
    },
    {
      id: '9mobile',
      name: '9mobile',
      types: [{ id: '9mobile-prepaid', label: 'Prepaid', ranges: [{ min: 50, max: 100000, discount: 2 }] }],
    },
  ],
};

export const mockDataCatalog: DataCatalog = {
  networks: [
    {
      id: 'mtn',
      name: 'MTN',
      types: [{ id: 'mtn-prepaid', label: 'Prepaid' }],
      plans: [
        { id: 'mtn-data-1gb', typeId: 'mtn-prepaid', size: '1 GB', validity: '30 days', price: 500 },
        { id: 'mtn-data-5gb', typeId: 'mtn-prepaid', size: '5 GB', validity: '30 days', price: 2500 },
      ],
    },
    {
      id: 'airtel',
      name: 'Airtel',
      types: [{ id: 'airtel-prepaid', label: 'Prepaid' }],
      plans: [
        { id: 'airtel-data-1gb', typeId: 'airtel-prepaid', size: '1 GB', validity: '30 days', price: 500 },
        { id: 'airtel-data-5gb', typeId: 'airtel-prepaid', size: '5 GB', validity: '30 days', price: 2500 },
      ],
    },
  ],
};

export const mockCableCatalog: CableCatalog = {
  operators: [
    {
      id: 'dstv',
      name: 'DStv',
      plans: [
        { id: 'dstv-padi', name: 'Padi', validity: '30 days', price: 4400 },
        { id: 'dstv-yanga', name: 'Yanga', validity: '30 days', price: 6000 },
      ],
    },
    {
      id: 'gotv',
      name: 'GOtv',
      plans: [{ id: 'gotv-jinja', name: 'Jinja', validity: '30 days', price: 3300 }],
    },
  ],
};

export const mockElectricityCatalog: ElectricityCatalog = {
  discos: [
    { id: 'ikedc', name: 'Ikeja Electric', min: 500, max: 100000, discount: 0 },
    { id: 'ekedc', name: 'Eko Electric', min: 500, max: 100000, discount: 0 },
  ],
};

export function getMockTransactions(filters: TransactionFilters = {}): TransactionPage {
  const search = filters.q?.trim().toLowerCase();
  const filtered = mockTransactions.filter((item) => {
    const matchesStatus = !filters.status || filters.status === 'all' || item.status === filters.status;
    const matchesService =
      !filters.service || filters.service === 'all' || item.service === filters.service;
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search) ||
      item.reference.toLowerCase().includes(search);
    return matchesStatus && matchesService && matchesSearch;
  });
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = 20;

  return {
    page,
    pageSize,
    total: filtered.length,
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
  };
}

export function getMockTransactionStatus(reference: string): TransactionStatus {
  const transaction = mockTransactions.find((item) => item.reference === reference);
  if (!transaction) throw new ApiError(404, 'not_found', 'Transaction not found in demo data.');

  return {
    reference: transaction.reference,
    status: transaction.status,
    title: transaction.title,
    failureReason: null,
  };
}

export function verifyMockSmartcard(smartcard: string): SmartcardVerification {
  return /^\d{10,11}$/.test(smartcard)
    ? { valid: true, name: 'Demo Customer' }
    : { valid: false };
}

export function verifyMockMeter(meterType: MeterType, meter: string): MeterVerification {
  return /^\d{10,13}$/.test(meter)
    ? { valid: true, name: 'Demo Customer', address: `Demo ${meterType} meter address` }
    : { valid: false };
}

export function rejectMockPurchase(): Promise<never> {
  return Promise.reject(
    new ApiError(0, 'mock_mode', 'Purchases are disabled while demo data is active.'),
  );
}

export function rejectMockAction(): Promise<never> {
  return Promise.reject(
    new ApiError(0, 'mock_mode', 'This action is disabled while demo data is active.'),
  );
}

export function markMockNotificationsRead(): { read: true } {
  mockNotificationItems.forEach((item) => {
    item.read = true;
  });
  mockMe.unreadCount = 0;
  return { read: true };
}
