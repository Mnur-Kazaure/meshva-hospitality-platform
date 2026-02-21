import { Controller, Get, Header } from '@nestjs/common';
import { ObservabilityService } from './observability.service';

@Controller()
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Get('health')
  health() {
    return this.observabilityService.getLiveness();
  }

  @Get('ready')
  ready() {
    return this.observabilityService.getReadiness();
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  metrics() {
    return this.observabilityService.renderPrometheusMetrics();
  }
}
