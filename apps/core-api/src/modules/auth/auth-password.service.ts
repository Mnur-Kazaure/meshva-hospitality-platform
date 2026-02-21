import { Injectable } from '@nestjs/common';
import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

const PBKDF2_ALGO = 'sha512';
const PBKDF2_ITERATIONS = 120_000;
const PBKDF2_KEYLEN = 64;

@Injectable()
export class AuthPasswordService {
  hashPassword(password: string): string {
    const salt = randomBytes(16).toString('base64url');
    const hash = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_ALGO).toString(
      'base64url',
    );

    return `pbkdf2$${PBKDF2_ALGO}$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
  }

  verifyPassword(password: string, storedHash: string | null | undefined): boolean {
    if (!storedHash) {
      return false;
    }

    const parts = storedHash.split('$');
    if (parts.length !== 5 || parts[0] !== 'pbkdf2') {
      return false;
    }

    const [, algorithm, iterationsRaw, salt, digest] = parts;
    const iterations = Number(iterationsRaw);
    if (!Number.isInteger(iterations) || iterations < 10_000) {
      return false;
    }

    const computed = pbkdf2Sync(password, salt, iterations, PBKDF2_KEYLEN, algorithm).toString(
      'base64url',
    );

    const expectedBuffer = Buffer.from(digest);
    const actualBuffer = Buffer.from(computed);
    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  }

  normalizeEmail(value: string | null | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 ? normalized : undefined;
  }

  normalizePhone(value: string | null | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    const digits = value.replace(/\D/g, '');
    return digits.length > 0 ? digits : undefined;
  }

  hashOpaqueToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
