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
import { CreateGarageDto } from './dto/create-garage.dto';
import { UpdateGarageDto } from './dto/update-garage.dto';
import { GaragesService } from './garages.service';

@Controller('garages')
export class GaragesController {
  constructor(private readonly garages: GaragesService) {}

  @Get() findAll() { return this.garages.findAll(); }

  @Get(':id') findOne(@Param('id') id: string) { return this.garages.findOne(id); }

  @Post() create(@Body() dto: CreateGarageDto) { return this.garages.create(dto); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateGarageDto) {
    return this.garages.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.garages.remove(id);
  }
}
