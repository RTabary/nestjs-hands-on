import { Module } from '@nestjs/common';
import { CompatibilityService } from '../spare-parts/compatibility.service';
import { SparePartsModule } from '../spare-parts/spare-parts.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  // SparePartsModule export gives us SparePartsService for the
  // CompatibilityService constructor. We register CompatibilityService
  // as a provider HERE (in vehicles, not spare-parts) so the
  // dependency direction stays one-way: vehicles → spare-parts.
  // Reversing it would create a circular module import.
  imports: [SparePartsModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, CompatibilityService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
