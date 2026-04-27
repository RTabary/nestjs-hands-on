import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { MissingFluxCapacitorException } from '../common/exceptions/missing-flux-capacitor.exception';
import { OutOfStockException } from '../common/exceptions/out-of-stock.exception';
import { MechanicsService } from '../mechanics/mechanics.service';
import { SeedService } from '../seed/seed.service';
import { MAINTENANCE_ORDERS_SEED } from '../seed/maintenance-orders.seed';
import { SparePartsService } from '../spare-parts/spare-parts.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CreateMaintenanceOrderDto } from './dto/create-maintenance-order.dto';
import { UpdateMaintenanceOrderDto } from './dto/update-maintenance-order.dto';
import {
  MaintenanceOrder,
  MaintenanceStatus,
} from './entities/maintenance-order.entity';

const FLUX_CAPACITOR_PART_ID = 'P020';
const DELOREAN_VEHICLE_ID = 'V009';

@Injectable()
export class MaintenanceOrdersService implements OnModuleInit {
  private readonly store = new Map<string, MaintenanceOrder>();
  private nextNum = 1;

  constructor(
    private readonly seed: SeedService,
    private readonly vehicles: VehiclesService,
    private readonly mechanics: MechanicsService,
    private readonly spareParts: SparePartsService,
  ) {}

  onModuleInit(): void {
    if (!this.seed.has('maintenance-orders')) {
      this.seed.register({
        entity: 'maintenance-orders',
        records: MAINTENANCE_ORDERS_SEED,
      });
    }
    for (const order of this.seed.get<MaintenanceOrder>('maintenance-orders')) {
      this.store.set(order.id, { ...order });
      const num = parseInt(order.id.slice(2), 10);
      if (Number.isFinite(num) && num >= this.nextNum) {
        this.nextNum = num + 1;
      }
    }
  }

  findAll(): MaintenanceOrder[] {
    return [...this.store.values()];
  }

  findOne(id: string): MaintenanceOrder {
    const order = this.store.get(id);
    if (!order) {
      throw new NotFoundException(`MaintenanceOrder ${id} not found`);
    }
    return order;
  }

  create(dto: CreateMaintenanceOrderDto): MaintenanceOrder {
    this.assertValidReferences(dto);
    if (dto.scheduledFor.getTime() < Date.now()) {
      throw new BadRequestException(
        'scheduledFor must not be in the past at creation time',
      );
    }
    const id = `MO${String(this.nextNum++).padStart(3, '0')}`;
    const now = new Date();
    const order: MaintenanceOrder = {
      id,
      vehicleId: dto.vehicleId,
      mechanicId: dto.mechanicId,
      partIds: [...dto.partIds],
      scheduledFor: dto.scheduledFor,
      status: 'queued',
      notes: dto.notes,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, order);
    return order;
  }

  update(id: string, dto: UpdateMaintenanceOrderDto): MaintenanceOrder {
    const existing = this.findOne(id);
    if (dto.vehicleId !== undefined) this.vehicles.findOne(dto.vehicleId);
    if (dto.mechanicId !== undefined) this.mechanics.findOne(dto.mechanicId);
    if (dto.partIds !== undefined) {
      for (const pid of dto.partIds) this.spareParts.findOne(pid);
    }
    const updated: MaintenanceOrder = {
      ...existing,
      ...dto,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    if (!this.store.delete(id)) {
      throw new NotFoundException(`MaintenanceOrder ${id} not found`);
    }
  }

  transition(id: string, target: MaintenanceStatus): MaintenanceOrder {
    const order = this.findOne(id);
    this.assertTransitionAllowed(order.status, target);

    if (target === 'completed') {
      this.assertFluxCapacitorPresentIfDeLorean(order);
      // Atomic stock decrement: do an existence-and-stock dry run
      // first, then commit. Either every part decrements or nothing.
      for (const partId of order.partIds) {
        const part = this.spareParts.findOne(partId);
        if (part.stock <= 0) {
          throw new OutOfStockException(partId);
        }
      }
      for (const partId of order.partIds) {
        this.spareParts.decrementStock(partId);
      }
    }

    const updated: MaintenanceOrder = {
      ...order,
      status: target,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return updated;
  }

  private assertValidReferences(dto: CreateMaintenanceOrderDto): void {
    this.vehicles.findOne(dto.vehicleId); // throws 404
    this.mechanics.findOne(dto.mechanicId);
    for (const partId of dto.partIds) {
      this.spareParts.findOne(partId);
    }
  }

  private assertTransitionAllowed(
    current: MaintenanceStatus,
    target: MaintenanceStatus,
  ): void {
    const allowed: Record<MaintenanceStatus, MaintenanceStatus[]> = {
      queued: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    if (!allowed[current].includes(target)) {
      throw new BadRequestException(
        `Illegal transition: ${current} → ${target}`,
      );
    }
  }

  private assertFluxCapacitorPresentIfDeLorean(order: MaintenanceOrder): void {
    if (
      order.vehicleId === DELOREAN_VEHICLE_ID &&
      !order.partIds.includes(FLUX_CAPACITOR_PART_ID)
    ) {
      throw new MissingFluxCapacitorException(order.vehicleId);
    }
  }
}
