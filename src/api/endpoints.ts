// src/api/endpoints.ts

import { api } from './client';
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
  MeterType,
  MeterVerification,
  PurchaseResult,
  SmartcardVerification,
  TransactionFilters,
  TransactionPage,
  TransactionStatus,
} from './types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isLookupReference(reference: string): boolean {
  return UUID_PATTERN.test(reference);
}

export const getBalance = () => api.get<Balance>('/balance');
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
export const buyCable = (body: CablePurchase) => api.post<PurchaseResult>('/purchase/cable', body);
export const buyElectricity = (body: ElectricityPurchase) =>
  api.post<PurchaseResult>('/purchase/electricity', body);
