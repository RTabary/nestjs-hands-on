import type { Vehicle } from '../vehicles/entities/vehicle.entity';

/**
 * Initial Vehicle roster for the workshop.
 *
 * Twelve entries covering a plausible mix of makes/models, with three
 * deliberate "winks" (Aston Martin DB5 V008, DeLorean DMC-12 V009,
 * Reliant Robin V010) — see research.md R10 for the rationale.
 *
 * VINs are 17-character ISO 3779 with the I/O/Q exclusion (the regex
 * step 04 introduces: /^[A-HJ-NPR-Z0-9]{17}$/). Synthetic — do NOT
 * look up real registrations from these.
 *
 * manufacturerId resolves against MANUFACTURERS_SEED in the same
 * directory (also introduced step 04).
 *
 * The boot timestamp is constant across all seed entries so test
 * assertions on createdAt are deterministic.
 */
const SEED_TIMESTAMP = new Date('2026-04-27T00:00:00.000Z');

export const VEHICLES_SEED: ReadonlyArray<Vehicle> = [
  { id: 'V001', make: 'Renault',      model: 'Clio',     year: 2018, vin: 'VF1RJB00859123456', mileageKm: 78_500,  manufacturerId: 'MFR001', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'V002', make: 'Toyota',       model: 'Corolla',  year: 2021, vin: 'JTDKARFP3M3045678', mileageKm: 31_200,  manufacturerId: 'MFR002', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'V003', make: 'Toyota',       model: 'Hilux',    year: 2015, vin: 'MR0FZ29G701112233', mileageKm: 184_900, manufacturerId: 'MFR002', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'V004', make: 'Ford',         model: 'Focus',    year: 2010, vin: '1FAHP3FN2AW234567', mileageKm: 156_400, manufacturerId: 'MFR003', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'V005', make: 'Ford',         model: 'Mustang',  year: 1969, vin: '9F02M345678WKSH00', mileageKm: 92_300,  manufacturerId: 'MFR003', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'V006', make: 'BMW',          model: 'M3',       year: 2008, vin: 'WBSWD93538PY81234', mileageKm: 88_700,  manufacturerId: 'MFR004', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'V007', make: 'BMW',          model: 'i3',       year: 2019, vin: 'WBY8P2C58K7E45678', mileageKm: 22_400,  manufacturerId: 'MFR004', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'V008', make: 'Aston Martin', model: 'DB5',      year: 1964, vin: 'SCFAB1234567WRKS0', mileageKm: 18_200,  manufacturerId: 'MFR005', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'V009', make: 'DeLorean',     model: 'DMC-12',   year: 1981, vin: 'SCEDT26T2BD000088', mileageKm: 88_888,  manufacturerId: 'MFR006', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'V010', make: 'Reliant',      model: 'Robin',    year: 1976, vin: 'WRKSHP000NRBN0001', mileageKm: 41_700,  manufacturerId: 'MFR007', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'V011', make: 'Tesla',        model: 'Roadster', year: 2010, vin: '5YJSA1DG0BFP00234', mileageKm: 64_300,  manufacturerId: 'MFR008', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: 'V012', make: 'Smart',        model: 'ForTwo',   year: 2014, vin: 'WMEEJ9AAXEK801234', mileageKm: 49_800,  manufacturerId: 'MFR009', createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
];
