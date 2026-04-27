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
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { MechanicsService } from './mechanics.service';

@Controller('mechanics')
export class MechanicsController {
  constructor(private readonly mechanics: MechanicsService) {}

  @Get() findAll() { return this.mechanics.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.mechanics.findOne(id); }
  @Post() create(@Body() dto: CreateMechanicDto) { return this.mechanics.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateMechanicDto) {
    return this.mechanics.update(id, dto);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.mechanics.remove(id);
  }
}
