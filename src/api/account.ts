// src/api/account.ts

import { api } from './client';
import { ApiError } from './errors';
import { isMockMode } from './mock-mode';

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

const mockCashback: Cashback = {
  balance: 75,
  settings: { enabled: true },
  history: [
    {
      reference: 'demo-cb-1',
      direction: 'credit',
      amount: 25,
      source: 'earn',
      service: 'data',
      at: '2026-11-25T11:16:00+01:00',
    },
    {
      reference: 'demo-cb-2',
      direction: 'credit',
      amount: 50,
      source: 'earn',
      service: 'airtime',
      at: '2026-11-24T09:10:00+01:00',
    },
  ],
};

const mockReferrals: Referrals = {
  code: 'DEMO1234',
  invited: 3,
  rewarded: 2,
  earned: 150,
  waitingOnFirstPurchase: false,
  hasReferrer: true,
};

function rejectMockAction(): Promise<never> {
  return Promise.reject(
    new ApiError(0, 'mock_mode', 'This action is disabled while demo data is active.'),
  );
}

export const getCashback = () =>
  isMockMode ? Promise.resolve(mockCashback) : api.get<Cashback>('/cashback');

export const getReferrals = () =>
  isMockMode ? Promise.resolve(mockReferrals) : api.get<Referrals>('/referrals');

export const applyReferralCode = (code: string) =>
  isMockMode ? rejectMockAction() : api.post<unknown>('/referrals', { code });

export const setPin = (pin: string) =>
  isMockMode ? rejectMockAction() : api.post<unknown>('/pin', { pin });

export const changePin = (body: { currentPin: string; nextPin: string }) =>
  isMockMode ? rejectMockAction() : api.post<unknown>('/pin/change', body);

export const requestPinReset = () =>
  isMockMode ? rejectMockAction() : api.post<{ resetUrl: string }>('/pin/reset/request');

export const requestAccountDeletion = () =>
  isMockMode
    ? rejectMockAction()
    : api.delete<{ deletionRequested: boolean }>('/me/account');
