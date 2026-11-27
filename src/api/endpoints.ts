// src/api/endpoints.ts

import { api } from './client';
import {
  getMockTransactionStatus,
  getMockTransactions,
  mockAirtimeCatalog,
  mockBalance,
  mockCableCatalog,
  mockDataCatalog,
  mockElectricityCatalog,
  mockFunding,
  mockMe,
  mockNotifications,
  markMockNotificationsRead,
  rejectMockAction,
  rejectMockPurchase,
  verifyMockMeter,
  verifyMockSmartcard,
} from './mock';
import { isMockMode } from './mock-mode';
import type {
  AirtimeCatalog,
  AirtimePurchase,
  Balance,
  CableCatalog,
  CablePurchase,
  DataCatalog,
  DataPurchase,
  ElectricityCatalog,
  ElectricityPurchase,
  FundingAccount,
  FundingOptions,
  Me,
  MeterType,
  MeterVerification,
  NotificationList,
  PurchaseResult,
  SmartcardVerification,
  SupportTicketCreated,
  SupportTicketInput,
  TemporaryFunding,
  TransactionFilters,
  TransactionPage,
  TransactionStatus,
} from './types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isLookupReference(reference: string): boolean {
  return UUID_PATTERN.test(reference);
}

export const getBalance = () =>
  isMockMode ? Promise.resolve(mockBalance) : api.get<Balance>('/balance');
export const getMe = () => (isMockMode ? Promise.resolve(mockMe) : api.get<Me>('/me'));
export const getNotifications = () =>
  isMockMode
    ? Promise.resolve(mockNotifications)
    : api.get<NotificationList>('/notifications', { limit: 50 });
export const markNotificationsRead = () =>
  isMockMode
    ? Promise.resolve(markMockNotificationsRead())
    : api.post<{ read: boolean }>('/notifications/read');
export const getFunding = () =>
  isMockMode ? Promise.resolve(mockFunding) : api.get<FundingOptions>('/wallet/funding');
export const createPermanentAccount = (bvn: string) =>
  isMockMode
    ? rejectMockAction()
    : api.post<FundingAccount>('/wallet/funding/permanent', { bvn });
export const createTemporaryAccount = (amount: number) =>
  isMockMode
    ? rejectMockAction()
    : api.post<TemporaryFunding>('/wallet/funding/temporary', { amount });
export const createSupportTicket = (body: SupportTicketInput) =>
  isMockMode ? rejectMockAction() : api.post<SupportTicketCreated>('/support', body);
export const getAirtimeCatalog = () =>
  isMockMode ? Promise.resolve(mockAirtimeCatalog) : api.get<AirtimeCatalog>('/catalog/airtime');
export const getDataCatalog = () =>
  isMockMode ? Promise.resolve(mockDataCatalog) : api.get<DataCatalog>('/catalog/data');
export const getCableCatalog = () =>
  isMockMode ? Promise.resolve(mockCableCatalog) : api.get<CableCatalog>('/catalog/cable');
export const getElectricityCatalog = () =>
  isMockMode ? Promise.resolve(mockElectricityCatalog) : api.get<ElectricityCatalog>('/catalog/electricity');
export const verifySmartcard = (operatorId: string, smartcard: string) =>
  isMockMode
    ? Promise.resolve(verifyMockSmartcard(smartcard))
    : api.post<SmartcardVerification>('/verify/smartcard', { operatorId, smartcard });
export const verifyMeter = (discoId: string, meterType: MeterType, meter: string) =>
  isMockMode
    ? Promise.resolve(verifyMockMeter(meterType, meter))
    : api.post<MeterVerification>('/verify/meter', { discoId, meterType, meter });
export const getTransactions = (filters: TransactionFilters = {}) =>
  isMockMode
    ? Promise.resolve(getMockTransactions(filters))
    : api.get<TransactionPage>('/transactions', {
        q: filters.q,
        status: filters.status ?? 'all',
        service: filters.service ?? 'all',
        page: filters.page ?? 1,
      });
export const getTransactionStatus = (reference: string) =>
  isMockMode
    ? Promise.resolve(getMockTransactionStatus(reference))
    : api.get<TransactionStatus>(`/transactions/${encodeURIComponent(reference)}`);
export const buyAirtime = (body: AirtimePurchase) =>
  isMockMode ? rejectMockPurchase() : api.post<PurchaseResult>('/purchase/airtime', body);
export const buyData = (body: DataPurchase) =>
  isMockMode ? rejectMockPurchase() : api.post<PurchaseResult>('/purchase/data', body);
export const buyCable = (body: CablePurchase) =>
  isMockMode ? rejectMockPurchase() : api.post<PurchaseResult>('/purchase/cable', body);
export const buyElectricity = (body: ElectricityPurchase) =>
  isMockMode ? rejectMockPurchase() : api.post<PurchaseResult>('/purchase/electricity', body);
