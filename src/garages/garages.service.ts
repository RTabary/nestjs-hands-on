import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeedService } from '../seed/seed.service';
import { GARAGES_SEED } from '../seed/garages.seed';
import { CreateGarageDto } from './dto/create-garage.dto';
import { UpdateGarageDto } from './dto/update-garage.dto';
import { Garage } from './entities/garage.entity';

@Injectable()
export class GaragesService implements OnModuleInit {
  constructor(
    @InjectRepository(Garage) private readonly repo: Repository<Garage>,
    private readonly seed: SeedService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.seed.has('garages')) {
      this.seed.register({ entity: 'garages', records: GARAGES_SEED });
    }
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(
        this.seed.get<Garage>('garages').map((g) => ({
          ...g,
          mechanicIds: [...g.mechanicIds],
        })),
      );
    }
  }

  findAll(): Promise<Garage[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Garage> {
    const g = await this.repo.findOneBy({ id });
    if (!g) throw new NotFoundException(`Garage ${id} not found`);
    return g;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }

  async create(dto: CreateGarageDto): Promise<Garage> {
    const id = await this.nextId();
    const now = new Date();
    const g = this.repo.create({ id, ...dto, createdAt: now, updatedAt: now });
    await this.repo.save(g);
    return g;
  }

  async update(id: string, dto: UpdateGarageDto): Promise<Garage> {
    const existing = await this.findOne(id);
    Object.assign(existing, dto, { updatedAt: new Date() });
    await this.repo.save(existing);
    return existing;
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Garage ${id} not found`);
    }
  }

  private async nextId(): Promise<string> {
    const last = await this.repo.find({ order: { id: 'DESC' }, take: 1 });
    let n = 1;
    if (last.length > 0) {
      const parsed = parseInt(last[0].id.slice(1), 10);
      if (Number.isFinite(parsed)) n = parsed + 1;
    }
    return `G${String(n).padStart(3, '0')}`;
  }
}
