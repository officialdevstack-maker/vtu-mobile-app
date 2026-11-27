import { api } from './client';
import { ApiError } from './errors';
import { isMockMode } from './mock-mode';

export type SharedReceipt = { page: string; image: string };

export function shareReceipt(reference: string): Promise<SharedReceipt> {
  if (isMockMode) {
    return Promise.reject(
      new ApiError(0, 'mock_mode', 'This action is disabled while demo data is active.'),
    );
  }
  return api.post<SharedReceipt>(
    `/transactions/${encodeURIComponent(reference)}/receipt`,
  );
}
