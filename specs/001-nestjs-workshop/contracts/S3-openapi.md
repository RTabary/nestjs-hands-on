# Contract: Stretch S3 — OpenAPI

**Branch pair**: `start/S3-openapi` ↔ `solution/S3-openapi`
(branched from `solution/08-testing`)

Adds two new endpoints (provided by `@nestjs/swagger`):

## `GET /api`

- **Auth**: public
- Swagger UI HTML page. Browser-renderable interactive docs for the
  entire API surface.

## `GET /api-json`

- **Auth**: public
- The OpenAPI 3.0 document as JSON.

## What changes structurally

- `package.json` adds `@nestjs/swagger`.
- `main.ts` adds:
  ```ts
  const config = new DocumentBuilder()
    .setTitle('Auto-Parts API')
    .setDescription('NestJS workshop demo — cars, parts, mechanics, garages')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'workshop-key')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  ```
- Every existing DTO gains `@ApiProperty()` decorators on its fields.
- Every controller method gains `@ApiOperation()` + `@ApiResponse()`
  decorators (and `@ApiSecurity('workshop-key')` on protected routes).

## .NET parallel called out

`@nestjs/swagger` ≈ Swashbuckle / NSwag. The decorator-driven approach
mirrors `[SwaggerOperation]` / `[SwaggerResponse]` from Swashbuckle.

## Checkpoint test (`test/S3-openapi.e2e-spec.ts`)

- Asserts `GET /api-json` returns 200 with `Content-Type:
  application/json`.
- Asserts the response body's `paths` includes `/vehicles` and
  `/maintenance-orders/{id}/transition`.
- Asserts the response body's `components.securitySchemes` includes
  `workshop-key`.
- ≤ 35 lines total.
