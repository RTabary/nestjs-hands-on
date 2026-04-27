import { Injectable } from '@nestjs/common';
import { SparePart } from './entities/spare-part.entity';
import { SparePartsService } from './spare-parts.service';
import { VehiclesService } from '../vehicles/vehicles.service';

/**
 * The classic "service-to-service constructor injection" demo.
 *
 * CompatibilityService doesn't own any data of its own — it composes
 * VehiclesService and SparePartsService and answers the question
 * "given a vehicle, which parts fit it?". Both dependencies are
 * resolved by NestJS's DI container at construction time, exactly
 * the same way ASP.NET Core's `IServiceProvider` resolves
 * constructor parameters.
 *
 * Lives in src/spare-parts/ but is registered as a provider in
 * VehiclesModule (which imports SparePartsModule) — that avoids the
 * circular module dependency that would otherwise arise from making
 * SparePartsModule depend on VehiclesModule.
 *
 * Step S2 (Persistence) made the underlying services async; this
 * service follows suit so the async chain stays consistent.
 */
@Injectable()
export class CompatibilityService {
  constructor(
    private readonly vehicles: VehiclesService,
    private readonly spareParts: SparePartsService,
  ) {}

  async findCompatible(vehicleId: string): Promise<SparePart[]> {
    // Throws NotFoundException → surfaces as 404 if the vehicle is
    // unknown. Cleaner than re-implementing the lookup here.
    await this.vehicles.findOne(vehicleId);
    const all = await this.spareParts.findAll();
    return all.filter((part) => part.compatibleVehicleIds.includes(vehicleId));
  }
}
