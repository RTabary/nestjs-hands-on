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
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';
import { SparePartsService } from './spare-parts.service';

@Controller('spare-parts')
export class SparePartsController {
  constructor(private readonly sparePartsService: SparePartsService) {}

  @Public() @Get() findAll() { return this.sparePartsService.findAll(); }
  @Public() @Get(':id') findOne(@Param('id') id: string) { return this.sparePartsService.findOne(id); }

  @Post() create(@Body() dto: CreateSparePartDto) { return this.sparePartsService.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateSparePartDto) {
    return this.sparePartsService.update(id, dto);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.sparePartsService.remove(id);
  }
}
