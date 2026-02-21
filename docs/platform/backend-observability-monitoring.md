# Backend Observability & Monitoring (Baseline)

## Scope
Production baseline for `apps/core-api`:
- Structured request logs (JSON)
- Correlation IDs (`x-request-id`)
- Liveness/readiness probes
- Prometheus-style runtime metrics

## Endpoints
- `GET /v1/health`
  - Liveness probe (`status=healthy` if process is up)
- `GET /v1/ready`
  - Readiness probe with dependency checks:
    - `application`
    - `database` (`SELECT 1` when `PERSISTENCE_MODE=postgres`)
    - `queue` (queue read probe through repository)
    - `redis` (`not_configured` when absent)
- `GET /v1/metrics`
  - Prometheus text output:
    - process uptime/memory/cpu
    - `meshva_http_requests_total`
    - `meshva_http_request_duration_ms` (histogram)

## Structured Log Contract
Each HTTP request writes one JSON log line with:
- `timestamp`
- `level` (`info|warn|error` by status code)
- `service`
- `environment`
- `requestId`
- `tenantId`
- `propertyId`
- `userId`
- `route`
- `action`
- `statusCode`
- `message`
- `durationMs`

## Correlation ID
- Incoming `x-request-id` is accepted if present.
- If absent, API generates UUIDv4.
- Response always includes `x-request-id`.

## Notes
- Auth/RBAC and smoke tests remain unchanged; observability is additive.
- Guest smoke script now honors `BASE_URL` for non-default port runs.
