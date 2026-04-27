/**
 * The shape AppConfigService exposes — typed so consumers don't
 * sprinkle string keys across the codebase.
 */
export interface AppConfig {
  port: number;
  apiKey: string;
  maintenanceQueueLimit: number;
}

/**
 * Custom configuration factory. Reads from process.env (which
 * @nestjs/config will have already populated from .env / .env.test
 * by the time this fires) and produces a typed namespace.
 *
 * `process.env.PORT` and the queue limit fall back to documented
 * defaults; WORKSHOP_API_KEY has no default (the Joi schema in
 * AppModule's ConfigModule.forRoot makes it required at boot).
 */
export const appConfig = (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiKey: process.env.WORKSHOP_API_KEY ?? '',
  maintenanceQueueLimit: parseInt(
    process.env.MAINTENANCE_QUEUE_LIMIT ?? '10',
    10,
  ),
});
