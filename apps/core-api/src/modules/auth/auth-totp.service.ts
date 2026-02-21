import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

@Injectable()
export class AuthTotpService {
  generateSecret(length = 20): string {
    const bytes = randomBytes(length);
    return this.base32Encode(bytes);
  }

  buildOtpAuthUrl(params: {
    secret: string;
    accountName: string;
    issuer?: string;
  }): string {
    const issuer = params.issuer ?? 'Meshva Hospitality';
    const label = encodeURIComponent(`${issuer}:${params.accountName}`);
    const query = new URLSearchParams({
      secret: params.secret,
      issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: '30',
    });

    return `otpauth://totp/${label}?${query.toString()}`;
  }

  verifyCode(secret: string, code: string, window = 1): boolean {
    const normalized = code.trim();
    if (!/^\d{6}$/.test(normalized)) {
      return false;
    }

    const nowCounter = Math.floor(Date.now() / 1000 / 30);
    for (let offset = -window; offset <= window; offset += 1) {
      if (this.generateCode(secret, nowCounter + offset) === normalized) {
        return true;
      }
    }

    return false;
  }

  private generateCode(secret: string, counter: number): string {
    const key = this.base32Decode(secret);
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    buffer.writeUInt32BE(counter >>> 0, 4);

    const hmac = createHmac('sha1', key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return String(binary % 1_000_000).padStart(6, '0');
  }

  private base32Encode(buffer: Buffer): string {
    let bits = '';
    for (const byte of buffer.values()) {
      bits += byte.toString(2).padStart(8, '0');
    }

    let output = '';
    for (let index = 0; index < bits.length; index += 5) {
      const chunk = bits.slice(index, index + 5).padEnd(5, '0');
      output += BASE32_ALPHABET[Number.parseInt(chunk, 2)];
    }

    return output;
  }

  private base32Decode(value: string): Buffer {
    const cleaned = value.toUpperCase().replace(/=+$/g, '').replace(/\s+/g, '');
    let bits = '';

    for (const char of cleaned) {
      const index = BASE32_ALPHABET.indexOf(char);
      if (index < 0) {
        throw new Error('Invalid base32 secret');
      }
      bits += index.toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let index = 0; index + 8 <= bits.length; index += 8) {
      bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
    }

    return Buffer.from(bytes);
  }
}
