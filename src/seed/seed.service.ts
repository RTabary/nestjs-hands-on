import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

/**
 * Type a per-entity seed module exposes when it registers fixtures
 * with the SeedService.
 */
export interface SeedRegistration<T> {
  /** Logical entity name, e.g. 'vehicles', 'spare-parts'. */
  entity: string;
  /** Initial roster — copied (shallow) into the SeedService's store. */
  records: ReadonlyArray<T>;
}

/**
 * Central, in-memory seed registry.
 *
 * Per-entity seed files (vehicles.seed.ts, spare-parts.seed.ts, …)
 * call `register()` from their module's constructor or via a Nest
 * provider factory. SeedService stores them in a Map<string, T[]>
 * keyed by entity name; entity services later read their own seed by
 * name to bootstrap their in-memory repository.
 *
 * No external dependencies. No persistence. No restart survival.
 * The S2 (Persistence) stretch step replaces this with TypeORM-backed
 * repositories.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);
  private readonly store = new Map<string, ReadonlyArray<unknown>>();

  register<T>(registration: SeedRegistration<T>): void {
    if (this.store.has(registration.entity)) {
      throw new Error(
        `[SeedService] entity '${registration.entity}' is already registered`,
      );
    }
    this.store.set(registration.entity, registration.records);
  }

  get<T>(entity: string): ReadonlyArray<T> {
    return (this.store.get(entity) as ReadonlyArray<T> | undefined) ?? [];
  }

  has(entity: string): boolean {
    return this.store.has(entity);
  }

  /**
   * Lifecycle hook fired once the application is fully wired but
   * before it starts listening. Currently used only for a banner log.
   * Per-entity seeds are populated during their module construction,
   * not here, so the registry is already filled by this point.
   */
  onApplicationBootstrap(): void {
    const summary = [...this.store.entries()]
      .map(([entity, records]) => `${entity}=${records.length}`)
      .join(', ');
    this.logger.log(`Seed roster ready (${summary || 'empty'})`);
  }
}
