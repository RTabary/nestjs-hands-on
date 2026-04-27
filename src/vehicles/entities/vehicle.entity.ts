import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('vehicles')
export class Vehicle {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar' })
  make!: string;

  @Column({ type: 'varchar' })
  model!: string;

  @Column({ type: 'integer' })
  year!: number;

  @Column({ type: 'varchar' })
  vin!: string;

  @Column({ type: 'integer' })
  mileageKm!: number;

  @Column({ type: 'varchar' })
  manufacturerId!: string;

  @Column({ type: 'datetime' })
  createdAt!: Date;

  @Column({ type: 'datetime' })
  updatedAt!: Date;
}
