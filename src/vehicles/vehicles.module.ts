import { Module } from '@nestjs/common';
import { ManufacturersModule } from '../manufacturers/manufacturers.module';
import { CompatibilityService } from '../spare-parts/compatibility.service';
import { SparePartsModule } from '../spare-parts/spare-parts.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  // SparePartsModule export gives us SparePartsService for the
  // CompatibilityService constructor. ManufacturersModule (added in
  // step 04) gives us ManufacturersService for the manufacturerId FK
  // check on create/update. Both dependencies stay one-way:
  // vehicles → spare-parts and vehicles → manufacturers.
  imports: [SparePartsModule, ManufacturersModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, CompatibilityService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
