import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManufacturersModule } from '../manufacturers/manufacturers.module';
import { CompatibilityService } from '../spare-parts/compatibility.service';
import { SparePartsModule } from '../spare-parts/spare-parts.module';
import { Vehicle } from './entities/vehicle.entity';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle]),
    SparePartsModule,
    ManufacturersModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService, CompatibilityService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
