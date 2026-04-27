import { IsInt, IsNotEmpty, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  make!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  model!: string;

  @IsInt()
  @Min(1900)
  @Max(2027)
  year!: number;

  // 17-character ISO 3779 VIN; I/O/Q excluded.
  @IsString()
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/, {
    message: 'vin must be a 17-character ISO 3779 VIN (no I/O/Q letters)',
  })
  vin!: string;

  @IsInt()
  @Min(0)
  mileageKm!: number;

  @IsString()
  @Matches(/^MFR\d{3}$/, {
    message: 'manufacturerId must match the format MFR000',
  })
  manufacturerId!: string;
}
