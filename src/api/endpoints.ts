// src/api/endpoints.ts

import { api } from './client';
import type {
  AirtimeCatalog,
  AirtimePurchase,
  AppConfig,
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

export const getBalance = () => api.get<Balance>('/balance');
export const getConfig = () => api.get<AppConfig>('/config');
export const getMe = () => api.get<Me>('/me');
export const getNotifications = () =>
  api.get<NotificationList>('/notifications', { limit: 50 });
export const markNotificationsRead = () => api.post<{ read: boolean }>('/notifications/read');
export const getFunding = () => api.get<FundingOptions>('/wallet/funding');
export const createPermanentAccount = (bvn: string) =>
  api.post<FundingAccount>('/wallet/funding/permanent', { bvn });
export const createTemporaryAccount = (amount: number) =>
  api.post<TemporaryFunding>('/wallet/funding/temporary', { amount });
export const createSupportTicket = (body: SupportTicketInput) =>
  api.post<SupportTicketCreated>('/support', body);
export const getAirtimeCatalog = () => api.get<AirtimeCatalog>('/catalog/airtime');
export const getDataCatalog = () => api.get<DataCatalog>('/catalog/data');
export const getCableCatalog = () => api.get<CableCatalog>('/catalog/cable');
export const getElectricityCatalog = () => api.get<ElectricityCatalog>('/catalog/electricity');
export const verifySmartcard = (operatorId: string, smartcard: string) =>
  api.post<SmartcardVerification>('/verify/smartcard', { operatorId, smartcard });
export const verifyMeter = (discoId: string, meterType: MeterType, meter: string) =>
  api.post<MeterVerification>('/verify/meter', { discoId, meterType, meter });
export const getTransactions = (filters: TransactionFilters = {}) =>
  api.get<TransactionPage>('/transactions', {
    q: filters.q,
    status: filters.status ?? 'all',
    service: filters.service ?? 'all',
    page: filters.page ?? 1,
  });
export const getTransactionStatus = (reference: string) =>
  api.get<TransactionStatus>(`/transactions/${encodeURIComponent(reference)}`);
export const buyAirtime = (body: AirtimePurchase) =>
  api.post<PurchaseResult>('/purchase/airtime', body);
export const buyData = (body: DataPurchase) => api.post<PurchaseResult>('/purchase/data', body);
export const buyCable = (body: CablePurchase) =>
  api.post<PurchaseResult>('/purchase/cable', body);
export const buyElectricity = (body: ElectricityPurchase) =>
  api.post<PurchaseResult>('/purchase/electricity', body);
