// src/api/account.ts

import { api } from './client';

export type CashbackEntry = {
  reference: string;
  direction: 'credit' | 'debit';
  amount: number;
  source: string;
  service: string | null;
  at: string;
};
export type Cashback = {
  balance: number;
  settings: { enabled: boolean };
  history: CashbackEntry[];
};

export type Referrals = {
  code: string;
  invited: number;
  rewarded: number;
  earned: number;
  waitingOnFirstPurchase: boolean;
  hasReferrer: boolean;
};

export type PromoService = 'airtime' | 'data' | 'cable' | 'electricity';
export type PromoPreview = { code: string; discount: number; finalPrice: number };

export type PackageItem = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  upgradeFee: number;
  isDefault: boolean;
  customers: number;
};
export type Packages = { current: string; items: PackageItem[] };

export const getCashback = () => api.get<Cashback>('/cashback');

export const getReferrals = () => api.get<Referrals>('/referrals');

export const applyReferralCode = (code: string) => api.post<unknown>('/referrals', { code });

export const setPin = (pin: string) => api.post<unknown>('/pin', { pin });

export const changePin = (body: { currentPin: string; nextPin: string }) =>
  api.post<unknown>('/pin/change', body);

export const requestPinReset = () =>
  api.post<{ resetUrl: string }>('/pin/reset/request');

export const requestAccountDeletion = () =>
  api.delete<{ deletionRequested: boolean }>('/me/account');

export const getPackages = () => api.get<Packages>('/packages');

export const upgradePackage = (body: { packageId: string; pin: string }) =>
  api.post<unknown>('/packages/upgrade', body);

export const previewPromo = (body: {
  code: string;
  service: PromoService;
  price: number;
}) => api.post<PromoPreview>('/promo/preview', body);
