export type SparePartCategory =
  | 'engine'
  | 'brakes'
  | 'tires'
  | 'electrical'
  | 'body'
  | 'misc';

export class SparePart {
  id!: string;
  partNumber!: string;
  name!: string;
  category!: SparePartCategory;
  priceEur!: number;
  stock!: number;
  compatibleVehicleIds!: string[];
  createdAt!: Date;
  updatedAt!: Date;
}
