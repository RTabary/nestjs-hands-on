import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('manufacturers')
export class Manufacturer {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  country!: string;

  @Column({ type: 'integer' })
  foundedYear!: number;

  @Column({ type: 'datetime' })
  createdAt!: Date;

  @Column({ type: 'datetime' })
  updatedAt!: Date;
}
