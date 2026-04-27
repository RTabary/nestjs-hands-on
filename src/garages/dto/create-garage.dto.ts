import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateGarageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address!: string;

  @IsArray()
  @ArrayUnique()
  @Matches(/^MEC\d{3}$/, { each: true })
  mechanicIds!: string[];
}
