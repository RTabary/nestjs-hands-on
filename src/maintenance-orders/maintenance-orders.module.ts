import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MechanicsModule } from '../mechanics/mechanics.module';
import { SparePartsModule } from '../spare-parts/spare-parts.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { MaintenanceOrder } from './entities/maintenance-order.entity';
import { MaintenanceOrdersController } from './maintenance-orders.controller';
import { MaintenanceOrdersService } from './maintenance-orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaintenanceOrder]),
    VehiclesModule,
    MechanicsModule,
    SparePartsModule,
  ],
  controllers: [MaintenanceOrdersController],
  providers: [MaintenanceOrdersService],
  exports: [MaintenanceOrdersService],
})
export class MaintenanceOrdersModule {}
