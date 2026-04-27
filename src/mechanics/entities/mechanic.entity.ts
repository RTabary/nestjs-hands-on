import { Column, Entity, PrimaryColumn } from 'typeorm';

export type MechanicSpecialty = 'electrical' | 'engine' | 'body' | 'general';

@Entity('mechanics')
export class Mechanic {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar' })
  firstName!: string;

  @Column({ type: 'varchar' })
  lastName!: string;

  @Column({ type: 'varchar' })
  specialty!: MechanicSpecialty;

  @Column({ type: 'varchar' })
  garageId!: string;

  @Column({ type: 'datetime' })
  createdAt!: Date;

  @Column({ type: 'datetime' })
  updatedAt!: Date;
}
