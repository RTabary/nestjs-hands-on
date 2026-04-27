export type MechanicSpecialty = 'electrical' | 'engine' | 'body' | 'general';

export class Mechanic {
  id!: string;
  firstName!: string;
  lastName!: string;
  specialty!: MechanicSpecialty;
  garageId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
