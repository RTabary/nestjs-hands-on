import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfigService } from '../config/app-config.service';
import { MaintenanceQueueFullException } from '../common/exceptions/maintenance-queue-full.exception';
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
  constructor(
    @InjectRepository(MaintenanceOrder)
    private readonly repo: Repository<MaintenanceOrder>,
    private readonly seed: SeedService,
    private readonly vehicles: VehiclesService,
    private readonly mechanics: MechanicsService,
    private readonly spareParts: SparePartsService,
    private readonly appConfig: AppConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.seed.has('maintenance-orders')) {
      this.seed.register({
        entity: 'maintenance-orders',
        records: MAINTENANCE_ORDERS_SEED,
      });
    }
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(
        this.seed.get<MaintenanceOrder>('maintenance-orders').map((o) => ({
          ...o,
          partIds: [...o.partIds],
        })),
      );
    }
  }

  findAll(): Promise<MaintenanceOrder[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<MaintenanceOrder> {
    const order = await this.repo.findOneBy({ id });
    if (!order) {
      throw new NotFoundException(`MaintenanceOrder ${id} not found`);
    }
    return order;
  }

  async create(dto: CreateMaintenanceOrderDto): Promise<MaintenanceOrder> {
    await this.assertValidReferences(dto);
    if (dto.scheduledFor.getTime() < Date.now()) {
      throw new BadRequestException(
        'scheduledFor must not be in the past at creation time',
      );
    }
    await this.assertQueueHasRoom();
    const id = await this.nextId();
    const now = new Date();
    const order = this.repo.create({
      id,
      vehicleId: dto.vehicleId,
      mechanicId: dto.mechanicId,
      partIds: [...dto.partIds],
      scheduledFor: dto.scheduledFor,
      status: 'queued' as MaintenanceStatus,
      notes: dto.notes,
      createdAt: now,
      updatedAt: now,
    });
    await this.repo.save(order);
    return order;
  }

  async update(
    id: string,
    dto: UpdateMaintenanceOrderDto,
  ): Promise<MaintenanceOrder> {
    const existing = await this.findOne(id);
    if (dto.vehicleId !== undefined) await this.vehicles.findOne(dto.vehicleId);
    if (dto.mechanicId !== undefined)
      await this.mechanics.findOne(dto.mechanicId);
    if (dto.partIds !== undefined) {
      for (const pid of dto.partIds) await this.spareParts.findOne(pid);
    }
    Object.assign(existing, dto, { updatedAt: new Date() });
    await this.repo.save(existing);
    return existing;
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MaintenanceOrder ${id} not found`);
    }
  }

  async transition(
    id: string,
    target: MaintenanceStatus,
  ): Promise<MaintenanceOrder> {
    const order = await this.findOne(id);
    this.assertTransitionAllowed(order.status, target);

    if (target === 'completed') {
      this.assertFluxCapacitorPresentIfDeLorean(order);
      // Atomic stock decrement: dry-run first then commit. Either every
      // part decrements or nothing.
      for (const partId of order.partIds) {
        const part = await this.spareParts.findOne(partId);
        if (part.stock <= 0) {
          throw new OutOfStockException(partId);
        }
      }
      for (const partId of order.partIds) {
        await this.spareParts.decrementStock(partId);
      }
    }

    order.status = target;
    order.updatedAt = new Date();
    await this.repo.save(order);
    return order;
  }

  private async assertQueueHasRoom(): Promise<void> {
    const limit = this.appConfig.getMaintenanceQueueLimit();
    const queued = await this.repo.count({ where: { status: 'queued' } });
    if (queued >= limit) {
      throw new MaintenanceQueueFullException(limit);
    }
  }

  private async assertValidReferences(
    dto: CreateMaintenanceOrderDto,
  ): Promise<void> {
    await this.vehicles.findOne(dto.vehicleId);
    await this.mechanics.findOne(dto.mechanicId);
    for (const partId of dto.partIds) {
      await this.spareParts.findOne(partId);
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

  private async nextId(): Promise<string> {
    const last = await this.repo.find({ order: { id: 'DESC' }, take: 1 });
    let n = 1;
    if (last.length > 0) {
      const parsed = parseInt(last[0].id.slice(2), 10);
      if (Number.isFinite(parsed)) n = parsed + 1;
    }
    return `MO${String(n).padStart(3, '0')}`;
  }
}
