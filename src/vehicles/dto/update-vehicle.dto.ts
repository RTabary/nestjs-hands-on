// All fields optional. Step 04 will refactor this to derive from
// CreateVehicleDto via PartialType from @nestjs/mapped-types.
export class UpdateVehicleDto {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  mileageKm?: number;
}
