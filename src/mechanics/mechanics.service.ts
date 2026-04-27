import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GaragesService } from '../garages/garages.service';
import { SeedService } from '../seed/seed.service';
import { MECHANICS_SEED } from '../seed/mechanics.seed';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { Mechanic } from './entities/mechanic.entity';

@Injectable()
export class MechanicsService implements OnModuleInit {
  constructor(
    @InjectRepository(Mechanic) private readonly repo: Repository<Mechanic>,
    private readonly seed: SeedService,
    private readonly garages: GaragesService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.seed.has('mechanics')) {
      this.seed.register({ entity: 'mechanics', records: MECHANICS_SEED });
    }
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(
        this.seed.get<Mechanic>('mechanics').map((m) => ({ ...m })),
      );
    }
  }

  findAll(): Promise<Mechanic[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Mechanic> {
    const m = await this.repo.findOneBy({ id });
    if (!m) throw new NotFoundException(`Mechanic ${id} not found`);
    return m;
  }

  async create(dto: CreateMechanicDto): Promise<Mechanic> {
    if (!(await this.garages.exists(dto.garageId))) {
      throw new BadRequestException(
        `garageId '${dto.garageId}' does not exist`,
      );
    }
    const id = await this.nextId();
    const now = new Date();
    const m = this.repo.create({ id, ...dto, createdAt: now, updatedAt: now });
    await this.repo.save(m);
    return m;
  }

  async update(id: string, dto: UpdateMechanicDto): Promise<Mechanic> {
    const existing = await this.findOne(id);
    if (dto.garageId !== undefined && !(await this.garages.exists(dto.garageId))) {
      throw new BadRequestException(
        `garageId '${dto.garageId}' does not exist`,
      );
    }
    Object.assign(existing, dto, { updatedAt: new Date() });
    await this.repo.save(existing);
    return existing;
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Mechanic ${id} not found`);
    }
  }

  private async nextId(): Promise<string> {
    const last = await this.repo.find({ order: { id: 'DESC' }, take: 1 });
    let n = 1;
    if (last.length > 0) {
      const parsed = parseInt(last[0].id.slice(3), 10);
      if (Number.isFinite(parsed)) n = parsed + 1;
    }
    return `MEC${String(n).padStart(3, '0')}`;
  }
}
