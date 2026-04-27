import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { SeedService } from '../seed/seed.service';
import { GARAGES_SEED } from '../seed/garages.seed';
import { CreateGarageDto } from './dto/create-garage.dto';
import { UpdateGarageDto } from './dto/update-garage.dto';
import { Garage } from './entities/garage.entity';

@Injectable()
export class GaragesService implements OnModuleInit {
  private readonly store = new Map<string, Garage>();
  private nextNum = 1;

  constructor(private readonly seed: SeedService) {}

  onModuleInit(): void {
    if (!this.seed.has('garages')) {
      this.seed.register({ entity: 'garages', records: GARAGES_SEED });
    }
    for (const g of this.seed.get<Garage>('garages')) {
      this.store.set(g.id, { ...g, mechanicIds: [...g.mechanicIds] });
      const num = parseInt(g.id.slice(1), 10);
      if (Number.isFinite(num) && num >= this.nextNum) {
        this.nextNum = num + 1;
      }
    }
  }

  findAll(): Garage[] {
    return [...this.store.values()];
  }

  findOne(id: string): Garage {
    const g = this.store.get(id);
    if (!g) throw new NotFoundException(`Garage ${id} not found`);
    return g;
  }

  exists(id: string): boolean {
    return this.store.has(id);
  }

  create(dto: CreateGarageDto): Garage {
    const id = `G${String(this.nextNum++).padStart(3, '0')}`;
    const now = new Date();
    const g: Garage = {
      id,
      ...dto,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, g);
    return g;
  }

  update(id: string, dto: UpdateGarageDto): Garage {
    const existing = this.findOne(id);
    const updated: Garage = { ...existing, ...dto, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    if (!this.store.delete(id)) {
      throw new NotFoundException(`Garage ${id} not found`);
    }
  }
}
