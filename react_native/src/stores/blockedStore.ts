const blockedAtMap = new Map<string, number>();

export function setBlockedAt(userId: string | number, tsMs: number) {
  blockedAtMap.set(String(userId), tsMs);
}

export function clearBlockedAt(userId: string | number) {
  blockedAtMap.delete(String(userId));
}

export function getBlockedAt(userId?: string | number | null): number {
  if (userId == null) return 0;
  return blockedAtMap.get(String(userId)) ?? 0;
}

export type BlockedRow = {
  userInfo?: { userId?: number | string } | null;
  blockedAt?: string | null;
};

export function syncBlockedMapFromApi(rows: BlockedRow[]) {
  blockedAtMap.clear();
  for (const r of rows ?? []) {
    const uid = r?.userInfo?.userId;
    const iso = r?.blockedAt;
    if (uid == null || !iso) continue;
    const ms = Date.parse(iso);
    if (!Number.isNaN(ms)) setBlockedAt(String(uid), ms);
  }
}
