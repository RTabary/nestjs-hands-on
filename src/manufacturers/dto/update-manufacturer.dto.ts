import { PartialType } from '@nestjs/mapped-types';
import { CreateManufacturerDto } from './create-manufacturer.dto';

// Step 04's first explicit teaching moment for PartialType: derive
// "all fields optional" from the create DTO so the validation rules
// stay in one place.
export class UpdateManufacturerDto extends PartialType(CreateManufacturerDto) {}
