import { api } from './client';

export type SharedReceipt = { page: string; image: string };

export function shareReceipt(reference: string): Promise<SharedReceipt> {
  return api.post<SharedReceipt>(`/transactions/${encodeURIComponent(reference)}/receipt`);
}
