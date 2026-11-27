import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type PendingPurchase = { reference: string; startedAt: number };

const KEY = 'spur_pending_purchases';
const MAX_ENTRIES = 10;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let webMemory: PendingPurchase[] = [];
let queue: Promise<unknown> = Promise.resolve();

export class PendingPurchaseStoreError extends Error {
  constructor() {
    super('We could not securely save this purchase attempt. Please try again.');
    this.name = 'PendingPurchaseStoreError';
  }
}

function isEntry(value: unknown): value is PendingPurchase {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Partial<PendingPurchase>;
  return (
    typeof entry.reference === 'string' &&
    UUID_PATTERN.test(entry.reference) &&
    typeof entry.startedAt === 'number' &&
    Number.isFinite(entry.startedAt)
  );
}

async function read(): Promise<PendingPurchase[]> {
  if (Platform.OS === 'web') return webMemory;

  let raw: string | null;
  try {
    raw = await SecureStore.getItemAsync(KEY);
  } catch {
    throw new PendingPurchaseStoreError();
  }
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new PendingPurchaseStoreError();
  }
  if (!Array.isArray(parsed) || !parsed.every(isEntry)) {
    throw new PendingPurchaseStoreError();
  }
  return parsed.slice(-MAX_ENTRIES);
}

async function write(items: PendingPurchase[]): Promise<void> {
  if (Platform.OS === 'web') {
    webMemory = items;
    return;
  }

  try {
    if (items.length === 0) await SecureStore.deleteItemAsync(KEY);
    else await SecureStore.setItemAsync(KEY, JSON.stringify(items));
  } catch {
    throw new PendingPurchaseStoreError();
  }
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task);
  queue = run.catch(() => undefined);
  return run;
}

export function listPending(): Promise<PendingPurchase[]> {
  return enqueue(async () => {
    const now = Date.now();
    const items = await read();
    const fresh = items.filter((item) => now - item.startedAt < MAX_AGE_MS);
    if (fresh.length !== items.length) await write(fresh);
    return fresh;
  });
}

export function addPending(reference: string): Promise<void> {
  return enqueue(async () => {
    if (!UUID_PATTERN.test(reference)) throw new PendingPurchaseStoreError();
    const now = Date.now();
    const items = (await read()).filter(
      (item) => item.reference !== reference && now - item.startedAt < MAX_AGE_MS,
    );
    items.push({ reference, startedAt: now });
    await write(items.slice(-MAX_ENTRIES));
  });
}

export function removePending(reference: string): Promise<void> {
  return enqueue(async () => {
    const items = await read();
    const next = items.filter((item) => item.reference !== reference);
    if (next.length !== items.length) await write(next);
  });
}
