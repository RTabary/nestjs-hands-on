import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { SeedService } from '../seed/seed.service';
import { VEHICLES_SEED } from '../seed/vehicles.seed';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService implements OnModuleInit {
  private readonly store = new Map<string, Vehicle>();
  private nextNum = 1;

  constructor(private readonly seed: SeedService) {}

  onModuleInit(): void {
    if (!this.seed.has('vehicles')) {
      this.seed.register({ entity: 'vehicles', records: VEHICLES_SEED });
    }
    for (const vehicle of this.seed.get<Vehicle>('vehicles')) {
      this.store.set(vehicle.id, { ...vehicle });
      const num = parseInt(vehicle.id.slice(1), 10);
      if (Number.isFinite(num) && num >= this.nextNum) {
        this.nextNum = num + 1;
      }
    }
  }

  findAll(): Vehicle[] {
    return [...this.store.values()];
  }

  findOne(id: string): Vehicle {
    const vehicle = this.store.get(id);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return vehicle;
  }

  create(dto: CreateVehicleDto): Vehicle {
    const id = `V${String(this.nextNum++).padStart(3, '0')}`;
    const now = new Date();
    const vehicle: Vehicle = {
      id,
      ...dto,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, vehicle);
    return vehicle;
  }

  update(id: string, dto: UpdateVehicleDto): Vehicle {
    const existing = this.findOne(id);
    const updated: Vehicle = {
      ...existing,
      ...dto,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    if (!this.store.delete(id)) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
  }
}
