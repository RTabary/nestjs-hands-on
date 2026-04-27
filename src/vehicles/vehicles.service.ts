import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ManufacturersService } from '../manufacturers/manufacturers.service';
import { SeedService } from '../seed/seed.service';
import { VEHICLES_SEED } from '../seed/vehicles.seed';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService implements OnModuleInit {
  constructor(
    @InjectRepository(Vehicle) private readonly repo: Repository<Vehicle>,
    private readonly seed: SeedService,
    private readonly manufacturers: ManufacturersService,
  ) {}

  /**
   * Idempotent boot-time seed: only fires if the table is empty.
   * Survives restart on file-backed SQLite; on `:memory:` (test mode)
   * each fresh boot reseeds.
   */
  async onModuleInit(): Promise<void> {
    if (!this.seed.has('vehicles')) {
      this.seed.register({ entity: 'vehicles', records: VEHICLES_SEED });
    }
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(
        this.seed.get<Vehicle>('vehicles').map((v) => ({ ...v })),
      );
    }
  }

  findAll(): Promise<Vehicle[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.repo.findOneBy({ id });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return vehicle;
  }

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    await this.assertManufacturerExists(dto.manufacturerId);
    const id = await this.nextId();
    const now = new Date();
    const vehicle = this.repo.create({
      id,
      ...dto,
      createdAt: now,
      updatedAt: now,
    });
    await this.repo.save(vehicle);
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const existing = await this.findOne(id);
    if (dto.manufacturerId !== undefined) {
      await this.assertManufacturerExists(dto.manufacturerId);
    }
    Object.assign(existing, dto, { updatedAt: new Date() });
    await this.repo.save(existing);
    return existing;
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
  }

  /**
   * Generate the next ID as 'V' + zero-padded next number. Reads
   * max(id) from the DB so it works whether the table was seeded,
   * empty, or had rows deleted.
   */
  private async nextId(): Promise<string> {
    const last = await this.repo.find({ order: { id: 'DESC' }, take: 1 });
    let n = 1;
    if (last.length > 0) {
      const parsed = parseInt(last[0].id.slice(1), 10);
      if (Number.isFinite(parsed)) n = parsed + 1;
    }
    return `V${String(n).padStart(3, '0')}`;
  }

  private async assertManufacturerExists(manufacturerId: string): Promise<void> {
    if (!(await this.manufacturers.exists(manufacturerId))) {
      throw new BadRequestException(
        `manufacturerId '${manufacturerId}' does not exist`,
      );
    }
  }
}
