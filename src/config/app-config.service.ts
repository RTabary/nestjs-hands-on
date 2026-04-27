import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from './configuration';

/**
 * Typed wrapper around @nestjs/config's ConfigService.
 *
 * `ConfigService` is the framework-provided generic accessor —
 * powerful but stringly-typed (`config.get<string>('apiKey')`).
 * AppConfigService gives the rest of the app a method per setting
 * with the right return type and a single place to change the key
 * names.
 *
 * The .NET parallel is `IOptions<TConfig>` typed-section binding:
 * IConfiguration is to ConfigService as IOptions<AppConfig> is to
 * AppConfigService.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  getPort(): number {
    return this.config.get('port', { infer: true });
  }

  getApiKey(): string {
    return this.config.get('apiKey', { infer: true });
  }

  getMaintenanceQueueLimit(): number {
    return this.config.get('maintenanceQueueLimit', { infer: true });
  }
}
