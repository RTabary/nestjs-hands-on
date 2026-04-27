import { IsIn, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import type { MechanicSpecialty } from '../entities/mechanic.entity';

export class CreateMechanicDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  lastName!: string;

  @IsIn(['electrical', 'engine', 'body', 'general'])
  specialty!: MechanicSpecialty;

  @IsString()
  @Matches(/^G\d{3}$/, { message: 'garageId must match the format G000' })
  garageId!: string;
}
