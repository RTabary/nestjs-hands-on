# Contract: Step 04 — DTOs & Validation Pipes

**Branch pair**: `start/04-dtos-validation-pipes` ↔ `solution/04-dtos-validation-pipes`
**Cumulative API surface after this step**: 16 endpoints (5 new + 11 from steps 01–03).

This step has two parallel deliverables:

1. **New**: full Manufacturer CRUD.
2. **Modified across the API**: every existing `POST` / `PATCH` body
   on Vehicles + SpareParts now goes through the global
   `ValidationPipe` and rejects malformed payloads with `400 Bad
   Request`. The Vehicle entity gains a required `manufacturerId` FK.

## New endpoints

### `GET /manufacturers`
- **Auth**: public · **Response (200)**: `Manufacturer[]`.

### `GET /manufacturers/:id`
- **Auth**: public · **Response (200)**: `Manufacturer` · **404** if missing.

### `POST /manufacturers`
- **Auth**: public · **Request**: `CreateManufacturerDto` (validated).
- **Response (201)**: created `Manufacturer`.
- **400** with structured body if validation fails:
  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": ["country must be a valid ISO 3166-1 alpha-2 code"]
  }
  ```
  (The unified error envelope only lands in step 05; for now the
  default Nest 400 shape applies.)

### `PATCH /manufacturers/:id`
- **Auth**: public · **Request**: `UpdateManufacturerDto` (validated, partial).

### `DELETE /manufacturers/:id`
- **Auth**: public · **Response (204)**.

## Modified existing endpoints

### `POST /vehicles` and `PATCH /vehicles/:id`
- **Request body** now validated:
  - `make`, `model`: `@IsString() @IsNotEmpty() @MaxLength(50)`
  - `year`: `@IsInt() @Min(1900) @Max(2027)`
  - `vin`: `@Matches(/^[A-HJ-NPR-Z0-9]{17}$/)` (excludes I, O, Q per real VIN rules)
  - `mileageKm`: `@IsInt() @Min(0)`
  - `manufacturerId`: `@Matches(/^MFR\d{3}$/)` and existence-checked at the service layer
- Returns 400 on any failure.

### `POST /spare-parts` and `PATCH /spare-parts/:id`
- Validation per data-model.md E2.

## Wiring

`ValidationPipe` registered globally in `main.ts` with:
```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
}));
```
This is the explicit teaching moment for the .NET parallel callout
(`[ApiController]` + `IValidator<T>` model binding).

## Checkpoint test (`test/04-validation.e2e-spec.ts`)

- Asserts a `POST /vehicles` with `vin: "TOO_SHORT"` returns 400.
- Asserts a valid `POST /vehicles` returns 201.
- Asserts `POST /manufacturers` with `country: "France"` returns 400
  (must be 2-letter code).
- Asserts `POST /manufacturers` with `country: "FR"` returns 201.
- ≤ 45 lines total.
