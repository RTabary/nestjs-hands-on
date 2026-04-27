import type { SparePartCategory } from '../entities/spare-part.entity';

// No validation decorators yet — added step 04.
export class CreateSparePartDto {
  partNumber!: string;
  name!: string;
  category!: SparePartCategory;
  priceEur!: number;
  stock!: number;
  compatibleVehicleIds!: string[];
}
