import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw || raw.trim().length === 0) {
    return [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:3010',
      'http://127.0.0.1:3010',
      'http://localhost:3020',
      'http://127.0.0.1:3020',
      'http://localhost:3030',
      'http://127.0.0.1:3030',
      'http://localhost:3040',
      'http://127.0.0.1:3040',
      'http://localhost:3050',
      'http://127.0.0.1:3050',
      'http://localhost:3060',
      'http://127.0.0.1:3060',
      'http://localhost:3070',
      'http://127.0.0.1:3070',
      'http://localhost:3080',
      'http://127.0.0.1:3080',
    ];
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  const allowedOrigins = new Set(parseAllowedOrigins(process.env.AUTH_ALLOWED_ORIGINS));
  app.enableCors({
    credentials: true,
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin denied'));
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}

void bootstrap();
