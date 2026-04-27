import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeedService } from '../seed/seed.service';
import { SPARE_PARTS_SEED } from '../seed/spare-parts.seed';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';
import { SparePart } from './entities/spare-part.entity';

@Injectable()
export class SparePartsService implements OnModuleInit {
  constructor(
    @InjectRepository(SparePart) private readonly repo: Repository<SparePart>,
    private readonly seed: SeedService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.seed.has('spare-parts')) {
      this.seed.register({ entity: 'spare-parts', records: SPARE_PARTS_SEED });
    }
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(
        this.seed.get<SparePart>('spare-parts').map((p) => ({ ...p })),
      );
    }
  }

  findAll(): Promise<SparePart[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<SparePart> {
    const part = await this.repo.findOneBy({ id });
    if (!part) {
      throw new NotFoundException(`SparePart ${id} not found`);
    }
    return part;
  }

  async create(dto: CreateSparePartDto): Promise<SparePart> {
    const id = await this.nextId();
    const now = new Date();
    const part = this.repo.create({
      id,
      ...dto,
      createdAt: now,
      updatedAt: now,
    });
    await this.repo.save(part);
    return part;
  }

  async update(id: string, dto: UpdateSparePartDto): Promise<SparePart> {
    const existing = await this.findOne(id);
    Object.assign(existing, dto, { updatedAt: new Date() });
    await this.repo.save(existing);
    return existing;
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`SparePart ${id} not found`);
    }
  }

  /**
   * Decrement stock by 1. Caller dry-runs the < 0 check first
   * (MaintenanceOrdersService.transition). Floors at 0 even if the
   * caller forgets, as a defensive measure.
   */
  async decrementStock(id: string): Promise<void> {
    const part = await this.findOne(id);
    part.stock = Math.max(0, part.stock - 1);
    part.updatedAt = new Date();
    await this.repo.save(part);
  }

  private async nextId(): Promise<string> {
    const last = await this.repo.find({ order: { id: 'DESC' }, take: 1 });
    let n = 1;
    if (last.length > 0) {
      const parsed = parseInt(last[0].id.slice(1), 10);
      if (Number.isFinite(parsed)) n = parsed + 1;
    }
    return `P${String(n).padStart(3, '0')}`;
  }
}
