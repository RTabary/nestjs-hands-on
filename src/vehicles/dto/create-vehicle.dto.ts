// No validation decorators yet — added in step 04 (DTOs & Validation Pipes).
export class CreateVehicleDto {
  make!: string;
  model!: string;
  year!: number;
  vin!: string;
  mileageKm!: number;
}
