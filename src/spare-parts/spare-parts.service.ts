import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { SeedService } from '../seed/seed.service';
import { SPARE_PARTS_SEED } from '../seed/spare-parts.seed';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';
import { SparePart } from './entities/spare-part.entity';

@Injectable()
export class SparePartsService implements OnModuleInit {
  private readonly store = new Map<string, SparePart>();
  private nextNum = 1;

  constructor(private readonly seed: SeedService) {}

  onModuleInit(): void {
    if (!this.seed.has('spare-parts')) {
      this.seed.register({ entity: 'spare-parts', records: SPARE_PARTS_SEED });
    }
    for (const part of this.seed.get<SparePart>('spare-parts')) {
      this.store.set(part.id, { ...part });
      const num = parseInt(part.id.slice(1), 10);
      if (Number.isFinite(num) && num >= this.nextNum) {
        this.nextNum = num + 1;
      }
    }
  }

  findAll(): SparePart[] {
    return [...this.store.values()];
  }

  findOne(id: string): SparePart {
    const part = this.store.get(id);
    if (!part) {
      throw new NotFoundException(`SparePart ${id} not found`);
    }
    return part;
  }

  create(dto: CreateSparePartDto): SparePart {
    const id = `P${String(this.nextNum++).padStart(3, '0')}`;
    const now = new Date();
    const part: SparePart = {
      id,
      ...dto,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, part);
    return part;
  }

  update(id: string, dto: UpdateSparePartDto): SparePart {
    const existing = this.findOne(id);
    const updated: SparePart = {
      ...existing,
      ...dto,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    if (!this.store.delete(id)) {
      throw new NotFoundException(`SparePart ${id} not found`);
    }
  }
}
