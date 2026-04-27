# Contract: Stretch S1 — Interceptors

**Branch pair**: `start/S1-interceptors` ↔ `solution/S1-interceptors`
(branched from `solution/08-testing`)

No new endpoints. Adds a global `TurboBoostInterceptor` that:

1. Records request start timestamp.
2. After the response is built, computes elapsed milliseconds.
3. Adds an `X-Response-Time: <n>ms` header to every response.
4. Logs (via Nest's `Logger`) the method + path + duration:
   `LOG: [TurboBoost] GET /vehicles → 12ms`.

## Wiring

Registered in `main.ts`:

```ts
app.useGlobalInterceptors(new TurboBoostInterceptor());
```

The interceptor uses RxJS `tap()` on the response stream — the .NET
parallel callout names `IActionFilter` / `IAsyncActionFilter` and notes
the tap-on-stream vs sync-attribute difference.

## Behavioral change visible to clients

Every response (success or error) now includes `X-Response-Time`.

## Example

```bash
curl -is http://localhost:3000/vehicles | grep -i x-response-time
# → x-response-time: 8ms
```

## Checkpoint test (`test/S1-interceptors.e2e-spec.ts`)

- Asserts a `GET /vehicles` response includes the `x-response-time`
  header with a non-empty value matching `/^\d+ms$/`.
- ≤ 25 lines total.
