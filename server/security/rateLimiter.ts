import { ApiError } from '../errors';

interface Entry {
  count: number;
  resetAt: number;
}

export class FixedWindowRateLimiter {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly maximum: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string) {
    const currentTime = this.now();
    const existing = this.entries.get(key);
    const entry = !existing || existing.resetAt <= currentTime
      ? { count: 0, resetAt: currentTime + this.windowMs }
      : existing;
    if (entry.count >= this.maximum) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1000));
      throw new ApiError(
        429,
        'RATE_LIMITED',
        `Muitas tentativas. Tente novamente em ${retryAfterSeconds} segundos.`,
      );
    }
    entry.count += 1;
    this.entries.set(key, entry);
  }

  reset(key: string) {
    this.entries.delete(key);
  }
}
