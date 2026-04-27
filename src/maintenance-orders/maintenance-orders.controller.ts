import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { CreateMaintenanceOrderDto } from './dto/create-maintenance-order.dto';
import { TransitionStatusDto } from './dto/transition-status.dto';
import { UpdateMaintenanceOrderDto } from './dto/update-maintenance-order.dto';
import { MaintenanceOrdersService } from './maintenance-orders.service';

@Controller('maintenance-orders')
export class MaintenanceOrdersController {
  constructor(private readonly orders: MaintenanceOrdersService) {}

  @Public() @Get() findAll() { return this.orders.findAll(); }
  @Public() @Get(':id') findOne(@Param('id') id: string) { return this.orders.findOne(id); }

  @Post() create(@Body() dto: CreateMaintenanceOrderDto) {
    return this.orders.create(dto);
  }
  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceOrderDto,
  ) {
    return this.orders.update(id, dto);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.orders.remove(id);
  }

  @Post(':id/transition')
  @HttpCode(HttpStatus.OK)
  transition(@Param('id') id: string, @Body() dto: TransitionStatusDto) {
    return this.orders.transition(id, dto.status);
  }
}
