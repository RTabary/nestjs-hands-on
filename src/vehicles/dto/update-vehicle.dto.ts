import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from './create-vehicle.dto';

// PartialType derives "all fields optional" while preserving every
// validation decorator from CreateVehicleDto. One source of truth.
export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
