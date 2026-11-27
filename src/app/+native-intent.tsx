// src/app/+native-intent.tsx

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  if (/^(?:vtuapp:\/\/redirect|\/redirect)(?:[/?#]|$)/i.test(path)) {
    return '/(auth)/login';
  }
  return path;
}
