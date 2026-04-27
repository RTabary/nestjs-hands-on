import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiKeyGuard } from './auth/api-key.guard';
import { PitCrewModule } from './auth/pit-crew.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppConfigService } from './config/app-config.service';
import { ConfigurationModule } from './config/configuration.module';
import { GaragesModule } from './garages/garages.module';
import { MaintenanceOrder } from './maintenance-orders/entities/maintenance-order.entity';
import { MaintenanceOrdersModule } from './maintenance-orders/maintenance-orders.module';
import { Manufacturer } from './manufacturers/entities/manufacturer.entity';
import { ManufacturersModule } from './manufacturers/manufacturers.module';
import { Mechanic } from './mechanics/entities/mechanic.entity';
import { MechanicsModule } from './mechanics/mechanics.module';
import { SeedModule } from './seed/seed.module';
import { SparePart } from './spare-parts/entities/spare-part.entity';
import { SparePartsModule } from './spare-parts/spare-parts.module';
import { Garage } from './garages/entities/garage.entity';
import { Vehicle } from './vehicles/entities/vehicle.entity';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [
    ConfigurationModule,
    // forRootAsync lets TypeOrmModule consume AppConfigService for the
    // database path — the same wrapper-service pattern step 07
    // introduced for env config. Stretch S2 keeps the convention.
    TypeOrmModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        type: 'sqlite',
        database: config.getDatabasePath(),
        entities: [
          Vehicle,
          SparePart,
          Manufacturer,
          Garage,
          Mechanic,
          MaintenanceOrder,
        ],
        // synchronize: true is acceptable for the workshop demo —
        // it auto-creates the schema from @Entity decorators on
        // boot. NEVER use this in production; flip to migrations
        // (`typeorm migration:generate`) instead.
        synchronize: true,
      }),
    }),
    SeedModule,
    PitCrewModule,
    ManufacturersModule,
    SparePartsModule,
    VehiclesModule,
    GaragesModule,
    MechanicsModule,
    MaintenanceOrdersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
