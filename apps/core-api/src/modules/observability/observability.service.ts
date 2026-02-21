import { Inject, Injectable } from '@nestjs/common';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';
import { PostgresService } from '../persistence/db/postgres.service';

interface HttpLogInput {
  requestId?: string;
  tenantId?: string;
  propertyId?: string;
  userId?: string;
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  message: string;
}

interface RouteLatencyMetric {
  count: number;
  sumMs: number;
  maxMs: number;
  buckets: number[];
}

const LATENCY_BUCKETS_MS = [50, 100, 250, 500, 1000, 2500, 5000];

@Injectable()
export class ObservabilityService {
  private readonly serviceName = process.env.SERVICE_NAME ?? 'core-api';
  private readonly environment = process.env.NODE_ENV ?? 'development';
  private readonly bootedAt = Date.now();
  private readonly requestCountByStatus = new Map<string, number>();
  private readonly latencyByRoute = new Map<string, RouteLatencyMetric>();

  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly postgresService: PostgresService,
  ) {}

  logHttpRequest(input: HttpLogInput): void {
    const safeRoute = this.normalizeRoute(input.route);
    const statusClass = this.toStatusClass(input.statusCode);
    const metricKey = this.requestMetricKey(input.method, safeRoute, statusClass);
    this.requestCountByStatus.set(metricKey, (this.requestCountByStatus.get(metricKey) ?? 0) + 1);
    this.recordLatencyMetric(input.method, safeRoute, input.durationMs);

    const level = input.statusCode >= 500 ? 'error' : input.statusCode >= 400 ? 'warn' : 'info';
    this.writeLog(level, {
      requestId: input.requestId,
      tenantId: input.tenantId,
      propertyId: input.propertyId,
      userId: input.userId,
      route: safeRoute,
      action: `${input.method.toUpperCase()} ${safeRoute}`,
      statusCode: input.statusCode,
      message: input.message,
      durationMs: Number(input.durationMs.toFixed(2)),
    });
  }

  getLiveness() {
    return {
      status: 'healthy',
      service: this.serviceName,
      uptimeSeconds: Math.floor((Date.now() - this.bootedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    const checks: Record<string, string> = {
      application: 'ok',
      database: 'ok',
      queue: 'ok',
      redis: process.env.REDIS_URL ? 'not_checked' : 'not_configured',
    };

    if ((process.env.PERSISTENCE_MODE ?? 'memory').toLowerCase() === 'postgres') {
      try {
        await this.postgresService.query('SELECT 1');
      } catch (error) {
        checks.database = 'error';
        this.writeLog('error', {
          action: 'READINESS_DATABASE_CHECK',
          message: 'Database readiness check failed',
          error: this.serializeError(error),
        });
      }
    }

    try {
      await this.repository.listQueueJobs({ limit: 1 });
    } catch (error) {
      checks.queue = 'error';
      this.writeLog('error', {
        action: 'READINESS_QUEUE_CHECK',
        message: 'Queue readiness check failed',
        error: this.serializeError(error),
      });
    }

    const hasFailure = Object.values(checks).some((value) => value === 'error');

    return {
      status: hasFailure ? 'unhealthy' : 'healthy',
      service: this.serviceName,
      checks,
      uptimeSeconds: Math.floor((Date.now() - this.bootedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  renderPrometheusMetrics(): string {
    const lines: string[] = [];
    const uptimeSeconds = (Date.now() - this.bootedAt) / 1000;
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    lines.push('# HELP meshva_process_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE meshva_process_uptime_seconds gauge');
    lines.push(`meshva_process_uptime_seconds ${uptimeSeconds.toFixed(3)}`);
    lines.push('');
    lines.push('# HELP meshva_process_resident_memory_bytes Resident memory size in bytes');
    lines.push('# TYPE meshva_process_resident_memory_bytes gauge');
    lines.push(`meshva_process_resident_memory_bytes ${memoryUsage.rss}`);
    lines.push('');
    lines.push('# HELP meshva_process_heap_used_bytes Heap used in bytes');
    lines.push('# TYPE meshva_process_heap_used_bytes gauge');
    lines.push(`meshva_process_heap_used_bytes ${memoryUsage.heapUsed}`);
    lines.push('');
    lines.push('# HELP meshva_process_cpu_user_seconds_total CPU user time in seconds');
    lines.push('# TYPE meshva_process_cpu_user_seconds_total counter');
    lines.push(`meshva_process_cpu_user_seconds_total ${(cpuUsage.user / 1_000_000).toFixed(6)}`);
    lines.push('');
    lines.push('# HELP meshva_http_requests_total Total HTTP requests');
    lines.push('# TYPE meshva_http_requests_total counter');
    for (const [key, value] of this.requestCountByStatus.entries()) {
      const [method, route, statusClass] = key.split('|');
      lines.push(
        `meshva_http_requests_total{method="${this.escapeLabel(method)}",route="${this.escapeLabel(route)}",status_class="${this.escapeLabel(statusClass)}"} ${value}`,
      );
    }
    lines.push('');
    lines.push('# HELP meshva_http_request_duration_ms Request latency in milliseconds');
    lines.push('# TYPE meshva_http_request_duration_ms histogram');

    for (const [key, metric] of this.latencyByRoute.entries()) {
      const [method, route] = key.split('|');
      for (let index = 0; index < LATENCY_BUCKETS_MS.length; index += 1) {
        const bucketUpperBound = LATENCY_BUCKETS_MS[index];
        lines.push(
          `meshva_http_request_duration_ms_bucket{method="${this.escapeLabel(method)}",route="${this.escapeLabel(route)}",le="${bucketUpperBound}"} ${metric.buckets[index]}`,
        );
      }

      lines.push(
        `meshva_http_request_duration_ms_bucket{method="${this.escapeLabel(method)}",route="${this.escapeLabel(route)}",le="+Inf"} ${metric.count}`,
      );
      lines.push(
        `meshva_http_request_duration_ms_sum{method="${this.escapeLabel(method)}",route="${this.escapeLabel(route)}"} ${metric.sumMs.toFixed(3)}`,
      );
      lines.push(
        `meshva_http_request_duration_ms_count{method="${this.escapeLabel(method)}",route="${this.escapeLabel(route)}"} ${metric.count}`,
      );
    }

    return `${lines.join('\n')}\n`;
  }

  private writeLog(level: 'info' | 'warn' | 'error', payload: Record<string, unknown>) {
    const serialized = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      environment: this.environment,
      ...payload,
    });

    if (level === 'error') {
      // eslint-disable-next-line no-console
      console.error(serialized);
      return;
    }

    // eslint-disable-next-line no-console
    console.log(serialized);
  }

  private normalizeRoute(route: string): string {
    const trimmed = route.trim();
    if (!trimmed) {
      return '/';
    }

    return trimmed.split('?')[0] ?? '/';
  }

  private toStatusClass(statusCode: number): string {
    if (statusCode >= 500) {
      return '5xx';
    }
    if (statusCode >= 400) {
      return '4xx';
    }
    if (statusCode >= 300) {
      return '3xx';
    }
    if (statusCode >= 200) {
      return '2xx';
    }
    return '1xx';
  }

  private requestMetricKey(method: string, route: string, statusClass: string): string {
    return `${method.toUpperCase()}|${route}|${statusClass}`;
  }

  private latencyMetricKey(method: string, route: string): string {
    return `${method.toUpperCase()}|${route}`;
  }

  private recordLatencyMetric(method: string, route: string, durationMs: number): void {
    const key = this.latencyMetricKey(method, route);
    const existing = this.latencyByRoute.get(key) ?? {
      count: 0,
      sumMs: 0,
      maxMs: 0,
      buckets: LATENCY_BUCKETS_MS.map(() => 0),
    };

    existing.count += 1;
    existing.sumMs += durationMs;
    existing.maxMs = Math.max(existing.maxMs, durationMs);

    for (let index = 0; index < LATENCY_BUCKETS_MS.length; index += 1) {
      if (durationMs <= LATENCY_BUCKETS_MS[index]) {
        existing.buckets[index] += 1;
      }
    }

    this.latencyByRoute.set(key, existing);
  }

  private escapeLabel(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  private serializeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
