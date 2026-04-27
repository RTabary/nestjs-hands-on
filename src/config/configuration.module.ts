import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppConfigService } from './app-config.service';
import { appConfig } from './configuration';

/**
 * Global configuration module.
 *
 * Wraps @nestjs/config's ConfigModule.forRoot with:
 *   - the workshop's custom config factory (configuration.ts);
 *   - a Joi validation schema that fails the boot if WORKSHOP_API_KEY
 *     is missing — fail-fast on config errors;
 *   - dynamic envFilePath: .env.test in test runs, .env otherwise.
 *
 * Marked @Global so any service can inject AppConfigService without
 * re-importing this module everywhere.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      load: [appConfig],
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        WORKSHOP_API_KEY: Joi.string().required(),
        MAINTENANCE_QUEUE_LIMIT: Joi.number().default(10),
      }),
      validationOptions: {
        abortEarly: false,
      },
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigurationModule {}
