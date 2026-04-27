import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { SeedService } from '../seed/seed.service';
import { MANUFACTURERS_SEED } from '../seed/manufacturers.seed';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from './dto/update-manufacturer.dto';
import { Manufacturer } from './entities/manufacturer.entity';

@Injectable()
export class ManufacturersService implements OnModuleInit {
  private readonly store = new Map<string, Manufacturer>();
  private nextNum = 1;

  constructor(private readonly seed: SeedService) {}

  onModuleInit(): void {
    if (!this.seed.has('manufacturers')) {
      this.seed.register({
        entity: 'manufacturers',
        records: MANUFACTURERS_SEED,
      });
    }
    for (const m of this.seed.get<Manufacturer>('manufacturers')) {
      this.store.set(m.id, { ...m });
      const num = parseInt(m.id.slice(3), 10);
      if (Number.isFinite(num) && num >= this.nextNum) {
        this.nextNum = num + 1;
      }
    }
  }

  findAll(): Manufacturer[] {
    return [...this.store.values()];
  }

  findOne(id: string): Manufacturer {
    const m = this.store.get(id);
    if (!m) {
      throw new NotFoundException(`Manufacturer ${id} not found`);
    }
    return m;
  }

  /**
   * Used by VehiclesService to validate the manufacturerId FK on
   * create/update. Returns true if a manufacturer exists with that id.
   */
  exists(id: string): boolean {
    return this.store.has(id);
  }

  create(dto: CreateManufacturerDto): Manufacturer {
    const id = `MFR${String(this.nextNum++).padStart(3, '0')}`;
    const now = new Date();
    const m: Manufacturer = {
      id,
      ...dto,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, m);
    return m;
  }

  update(id: string, dto: UpdateManufacturerDto): Manufacturer {
    const existing = this.findOne(id);
    const updated: Manufacturer = {
      ...existing,
      ...dto,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    if (!this.store.delete(id)) {
      throw new NotFoundException(`Manufacturer ${id} not found`);
    }
  }
}
