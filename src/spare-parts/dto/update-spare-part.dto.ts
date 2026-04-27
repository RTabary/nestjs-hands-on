import type { SparePartCategory } from '../entities/spare-part.entity';

export class UpdateSparePartDto {
  partNumber?: string;
  name?: string;
  category?: SparePartCategory;
  priceEur?: number;
  stock?: number;
  compatibleVehicleIds?: string[];
}
