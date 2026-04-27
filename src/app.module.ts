import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { GaragesModule } from './garages/garages.module';
import { MaintenanceOrdersModule } from './maintenance-orders/maintenance-orders.module';
import { ManufacturersModule } from './manufacturers/manufacturers.module';
import { MechanicsModule } from './mechanics/mechanics.module';
import { SeedModule } from './seed/seed.module';
import { SparePartsModule } from './spare-parts/spare-parts.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [
    SeedModule,
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
  ],
})
export class AppModule {}
