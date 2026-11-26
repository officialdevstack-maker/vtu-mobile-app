// src/lib/format.ts

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNaira(value: number): string {
  return nairaFormatter.format(value);
}

export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+234')) return `0${digits.slice(4)}`;
  if (digits.startsWith('234') && digits.length === 13) return `0${digits.slice(3)}`;
  return digits.replace(/\+/g, '');
}

export function isValidPhone(input: string): boolean {
  return /^0\d{10}$/.test(normalizePhone(input));
}

export function groupPhone(phone: string): string {
  const p = normalizePhone(phone);
  return p.length === 11 ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p;
}

export function airtimeDisplayPrice(amount: number, discountPercent: number): number {
  return Math.round(amount * (1 - discountPercent / 100) * 100) / 100;
}

export function formatLagosDate(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}
