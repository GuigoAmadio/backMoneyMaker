import { Injectable } from '@nestjs/common';

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  clears: number;
  totalRequests: number;
  hitRate: number;
  averageHitTime: number;
  averageSetTime: number;
}

@Injectable()
export class CacheMetricsService {
  private hits = 0;
  private misses = 0;
  private sets = 0;
  private deletes = 0;
  private errors = 0;
  private clears = 0;
  private hitTimes: number[] = [];
  private setTimes: number[] = [];

  recordHit(duration: number): void {
    this.hits++;
    this.hitTimes.push(duration);

    // Manter apenas os últimos 1000 tempos para calcular média
    if (this.hitTimes.length > 1000) {
      this.hitTimes = this.hitTimes.slice(-1000);
    }
  }

  recordMiss(): void {
    this.misses++;
  }

  recordSet(duration: number): void {
    this.sets++;
    this.setTimes.push(duration);

    // Manter apenas os últimos 1000 tempos para calcular média
    if (this.setTimes.length > 1000) {
      this.setTimes = this.setTimes.slice(-1000);
    }
  }

  recordDelete(): void {
    this.deletes++;
  }

  recordError(): void {
    this.errors++;
  }

  recordClear(): void {
    this.clears++;
  }

  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
    const averageHitTime =
      this.hitTimes.length > 0
        ? this.hitTimes.reduce((a, b) => a + b, 0) / this.hitTimes.length
        : 0;
    const averageSetTime =
      this.setTimes.length > 0
        ? this.setTimes.reduce((a, b) => a + b, 0) / this.setTimes.length
        : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      deletes: this.deletes,
      errors: this.errors,
      clears: this.clears,
      totalRequests,
      hitRate: Math.round(hitRate * 100) / 100,
      averageHitTime: Math.round(averageHitTime * 100) / 100,
      averageSetTime: Math.round(averageSetTime * 100) / 100,
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.sets = 0;
    this.deletes = 0;
    this.errors = 0;
    this.clears = 0;
    this.hitTimes = [];
    this.setTimes = [];
  }
}
