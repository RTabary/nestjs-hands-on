import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('garages')
export class Garage {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  address!: string;

  @Column({ type: 'simple-array' })
  mechanicIds!: string[];

  @Column({ type: 'datetime' })
  createdAt!: Date;

  @Column({ type: 'datetime' })
  updatedAt!: Date;
}
