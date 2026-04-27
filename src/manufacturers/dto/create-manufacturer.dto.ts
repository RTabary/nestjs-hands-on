import {
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateManufacturerDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 60)
  name!: string;

  // ISO 3166-1 alpha-2: two uppercase letters.
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, {
    message: 'country must be a valid ISO 3166-1 alpha-2 code',
  })
  country!: string;

  @IsInt()
  @Min(1850)
  @Max(2027)
  foundedYear!: number;
}
