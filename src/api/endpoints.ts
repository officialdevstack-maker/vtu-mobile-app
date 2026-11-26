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

export const getBalance = () =>
  isMockMode ? Promise.resolve(mockBalance) : api.get<Balance>('/balance');
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
