import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Garage } from './entities/garage.entity';
import { GaragesController } from './garages.controller';
import { GaragesService } from './garages.service';

@Module({
  imports: [TypeOrmModule.forFeature([Garage])],
  controllers: [GaragesController],
  providers: [GaragesService],
  exports: [GaragesService],
})
export class GaragesModule {}
