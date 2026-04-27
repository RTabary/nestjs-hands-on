import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ManufacturersModule } from './manufacturers/manufacturers.module';
import { SeedModule } from './seed/seed.module';
import { SparePartsModule } from './spare-parts/spare-parts.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [SeedModule, ManufacturersModule, SparePartsModule, VehiclesModule],
  controllers: [AppController],
  providers: [
    AppService,
    // Step 04: register ValidationPipe at the module level (not in
    // main.ts) so it applies in tests too — Test.createTestingModule
    // creates the Nest app without running main.ts.
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
})
export class AppModule {}
