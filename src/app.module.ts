import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [SeedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
