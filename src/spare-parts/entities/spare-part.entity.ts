import { Column, Entity, PrimaryColumn } from 'typeorm';

export type SparePartCategory =
  | 'engine'
  | 'brakes'
  | 'tires'
  | 'electrical'
  | 'body'
  | 'misc';

@Entity('spare_parts')
export class SparePart {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar' })
  partNumber!: string;

  @Column({ type: 'varchar' })
  name!: string;

  // Stored as the raw string literal — TS union type pins the value space
  // at compile time; SQLite just sees a varchar.
  @Column({ type: 'varchar' })
  category!: SparePartCategory;

  // 'real' = SQLite double precision, preserves the flux capacitor's
  // 88_888.88 across round-trips (an integer column would truncate).
  @Column({ type: 'real' })
  priceEur!: number;

  @Column({ type: 'integer' })
  stock!: number;

  // simple-array serialises a string[] as a comma-separated text column —
  // good enough for this many-to-many flag. A real schema would normalise
  // to a join table, but that's out of scope for the workshop demo.
  @Column({ type: 'simple-array' })
  compatibleVehicleIds!: string[];

  @Column({ type: 'datetime' })
  createdAt!: Date;

  @Column({ type: 'datetime' })
  updatedAt!: Date;
}
