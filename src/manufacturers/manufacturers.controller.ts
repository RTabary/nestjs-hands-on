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
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from './dto/update-manufacturer.dto';
import { ManufacturersService } from './manufacturers.service';

@Controller('manufacturers')
export class ManufacturersController {
  constructor(private readonly manufacturers: ManufacturersService) {}

  @Get()
  findAll() {
    return this.manufacturers.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.manufacturers.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateManufacturerDto) {
    return this.manufacturers.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateManufacturerDto) {
    return this.manufacturers.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.manufacturers.remove(id);
  }
}
