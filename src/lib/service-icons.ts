import type { TxService } from '@/api/types';

type IconName = { ios: string; android: string; web: string };

export const SERVICE_ICON = {
  airtime: { ios: 'phone.fill', android: 'call', web: 'call' },
  data: { ios: 'wifi', android: 'wifi', web: 'wifi' },
  cable: { ios: 'tv.fill', android: 'tv', web: 'tv' },
  electricity: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' },
  wallet: {
    ios: 'creditcard.fill',
    android: 'account_balance_wallet',
    web: 'account_balance_wallet',
  },
} as const satisfies Record<TxService, IconName>;
