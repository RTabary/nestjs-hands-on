import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { GaragesService } from '../garages/garages.service';
import { SeedService } from '../seed/seed.service';
import { MECHANICS_SEED } from '../seed/mechanics.seed';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { Mechanic } from './entities/mechanic.entity';

@Injectable()
export class MechanicsService implements OnModuleInit {
  private readonly store = new Map<string, Mechanic>();
  private nextNum = 1;

  constructor(
    private readonly seed: SeedService,
    private readonly garages: GaragesService,
  ) {}

  onModuleInit(): void {
    if (!this.seed.has('mechanics')) {
      this.seed.register({ entity: 'mechanics', records: MECHANICS_SEED });
    }
    for (const m of this.seed.get<Mechanic>('mechanics')) {
      this.store.set(m.id, { ...m });
      const num = parseInt(m.id.slice(3), 10);
      if (Number.isFinite(num) && num >= this.nextNum) {
        this.nextNum = num + 1;
      }
    }
  }

  findAll(): Mechanic[] { return [...this.store.values()]; }

  findOne(id: string): Mechanic {
    const m = this.store.get(id);
    if (!m) throw new NotFoundException(`Mechanic ${id} not found`);
    return m;
  }

  create(dto: CreateMechanicDto): Mechanic {
    if (!this.garages.exists(dto.garageId)) {
      throw new BadRequestException(`garageId '${dto.garageId}' does not exist`);
    }
    const id = `MEC${String(this.nextNum++).padStart(3, '0')}`;
    const now = new Date();
    const m: Mechanic = { id, ...dto, createdAt: now, updatedAt: now };
    this.store.set(id, m);
    return m;
  }

  update(id: string, dto: UpdateMechanicDto): Mechanic {
    const existing = this.findOne(id);
    if (dto.garageId !== undefined && !this.garages.exists(dto.garageId)) {
      throw new BadRequestException(`garageId '${dto.garageId}' does not exist`);
    }
    const updated: Mechanic = { ...existing, ...dto, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    if (!this.store.delete(id)) {
      throw new NotFoundException(`Mechanic ${id} not found`);
    }
  }
}
