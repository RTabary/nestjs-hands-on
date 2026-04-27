import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SeedModule } from './seed/seed.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [SeedModule, VehiclesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
