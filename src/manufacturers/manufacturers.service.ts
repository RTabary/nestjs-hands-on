import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeedService } from '../seed/seed.service';
import { MANUFACTURERS_SEED } from '../seed/manufacturers.seed';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from './dto/update-manufacturer.dto';
import { Manufacturer } from './entities/manufacturer.entity';

@Injectable()
export class ManufacturersService implements OnModuleInit {
  constructor(
    @InjectRepository(Manufacturer)
    private readonly repo: Repository<Manufacturer>,
    private readonly seed: SeedService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.seed.has('manufacturers')) {
      this.seed.register({
        entity: 'manufacturers',
        records: MANUFACTURERS_SEED,
      });
    }
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(
        this.seed.get<Manufacturer>('manufacturers').map((m) => ({ ...m })),
      );
    }
  }

  findAll(): Promise<Manufacturer[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Manufacturer> {
    const m = await this.repo.findOneBy({ id });
    if (!m) {
      throw new NotFoundException(`Manufacturer ${id} not found`);
    }
    return m;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }

  async create(dto: CreateManufacturerDto): Promise<Manufacturer> {
    const id = await this.nextId();
    const now = new Date();
    const m = this.repo.create({ id, ...dto, createdAt: now, updatedAt: now });
    await this.repo.save(m);
    return m;
  }

  async update(id: string, dto: UpdateManufacturerDto): Promise<Manufacturer> {
    const existing = await this.findOne(id);
    Object.assign(existing, dto, { updatedAt: new Date() });
    await this.repo.save(existing);
    return existing;
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Manufacturer ${id} not found`);
    }
  }

  private async nextId(): Promise<string> {
    const last = await this.repo.find({ order: { id: 'DESC' }, take: 1 });
    let n = 1;
    if (last.length > 0) {
      const parsed = parseInt(last[0].id.slice(3), 10);
      if (Number.isFinite(parsed)) n = parsed + 1;
    }
    return `MFR${String(n).padStart(3, '0')}`;
  }
}
