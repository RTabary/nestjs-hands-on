import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDate,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateMaintenanceOrderDto {
  @IsString()
  @Matches(/^V\d{3}$/, { message: 'vehicleId must match the format V000' })
  vehicleId!: string;

  @IsString()
  @Matches(/^MEC\d{3}$/, { message: 'mechanicId must match the format MEC000' })
  mechanicId!: string;

  @IsArray()
  @ArrayUnique()
  @Matches(/^P\d{3}$/, { each: true })
  partIds!: string[];

  // class-transformer turns the incoming string into a Date instance.
  @Type(() => Date)
  @IsDate()
  scheduledFor!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
