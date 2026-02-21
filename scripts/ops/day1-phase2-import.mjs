#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8081/v1';
const DEFAULT_INHOUSE_CSV = 'docs/operations/templates/day1-inhouse-stays-template.csv';
const DEFAULT_FUTURE_CSV = 'docs/operations/templates/day1-future-reservations-template.csv';
const DEFAULT_ROOM_STATUS_CSV = 'docs/operations/templates/day1-room-status-template.csv';
const DEFAULT_OPENING_BALANCES_CSV = 'docs/operations/templates/day1-opening-balances-template.csv';

const DEFAULT_FRONT_DESK_PERMISSIONS = [
  'FRONT_DESK.RESERVATION_VIEW',
  'FRONT_DESK.RESERVATION_CREATE',
  'FRONT_DESK.STAY_CHECKIN',
];
const DEFAULT_FINANCE_PERMISSIONS = ['FINANCE.PAYMENT_VIEW', 'FINANCE.PAYMENT_RECORD'];
const DEFAULT_MANAGER_PERMISSIONS = ['MANAGER.PROPERTY_SETTINGS_EDIT'];

const MODES = new Set(['all', 'inhouse', 'future', 'opening-balances', 'room-status']);
const BOOKING_SOURCES = new Set(['WALK_IN', 'CALL', 'WHATSAPP', 'AGENT', 'ONLINE', 'MANUAL_IMPORT']);
const DEPOSIT_STATUSES = new Set(['NONE', 'PROMISED', 'PAID_AT_CASHIER']);
const PAYMENT_METHODS = new Set(['CASH', 'BANK_TRANSFER', 'POS']);

const OPENING_CHARGE_MARKER = '[DAY1_OPENING_CHARGE]';
const OPENING_DEPOSIT_MARKER = '[DAY1_OPENING_DEPOSIT]';

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function formatError(error) {
  if (error instanceof ApiError) {
    const body = typeof error.body === 'string' ? error.body : JSON.stringify(error.body);
    return `${error.message} [status=${error.status}] ${body}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      parsed[key] = next;
      index += 1;
      continue;
    }

    parsed[key] = 'true';
  }

  return parsed;
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function splitPermissions(value, fallback) {
  const source = value ?? fallback.join(',');
  return source
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function resolveFilePath(inputPath) {
  return path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(process.cwd(), inputPath);
}

function formatNumber(value) {
  return Number(value.toFixed(2));
}

function parseMoney(value, fieldName) {
  const text = String(value ?? '').trim();
  if (text.length === 0) {
    return 0;
  }

  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }

  return formatNumber(parsed);
}

function parseDate(value, fieldName) {
  const text = String(value ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`${fieldName} must use YYYY-MM-DD format`);
  }

  return text;
}

function normalizeString(value) {
  return String(value ?? '').trim();
}

function normalizeName(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizePhone(value) {
  return normalizeString(value).replace(/\s+/g, '');
}

function ensureReason(value, fallback) {
  const normalized = normalizeString(value);
  if (normalized.length >= 5) {
    return normalized.slice(0, 200);
  }
  return fallback;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function hashRecord(record) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(record))
    .digest('hex')
    .slice(0, 24);
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const input = content.replace(/^\uFEFF/, '');

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) {
    return [];
  }

  const header = rows[0].map((value) => normalizeString(value).toLowerCase());
  const records = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const columns = rows[rowIndex];
    if (columns.every((value) => normalizeString(value).length === 0)) {
      continue;
    }

    const record = {};
    for (let columnIndex = 0; columnIndex < header.length; columnIndex += 1) {
      const key = header[columnIndex];
      if (!key) {
        continue;
      }
      record[key] = normalizeString(columns[columnIndex] ?? '');
    }

    record.__row = rowIndex + 1;
    records.push(record);
  }

  return records;
}

function readCsv(csvPath) {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  return parseCsv(content);
}

class ImportRuntime {
  constructor(config) {
    this.config = config;
    this.summary = {
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      warnings: 0,
    };
  }

  async request({ role, method, endpoint, body, idempotencyKey, allowNotFound = false }) {
    const headers = {
      'Content-Type': 'application/json',
      'x-tenant-id': this.config.tenantId,
    };

    if (role === 'frontdesk') {
      headers['x-user-id'] = this.config.frontDeskUserId;
      headers['x-permissions'] = this.config.frontDeskPermissions.join(',');
    } else if (role === 'finance') {
      headers['x-user-id'] = this.config.financeUserId;
      headers['x-permissions'] = this.config.financePermissions.join(',');
    } else if (role === 'manager') {
      headers['x-user-id'] = this.config.managerUserId;
      headers['x-permissions'] = this.config.managerPermissions.join(',');
    } else if (role === 'public') {
      delete headers['Content-Type'];
    } else {
      throw new Error(`Unsupported role: ${role}`);
    }

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const raw = await response.text();
    let parsed = raw;
    try {
      parsed = raw.length > 0 ? JSON.parse(raw) : {};
    } catch {
      parsed = raw;
    }

    if (!response.ok) {
      if (allowNotFound && response.status === 404) {
        return undefined;
      }
      throw new ApiError(`${method} ${endpoint} failed`, response.status, parsed);
    }

    return parsed;
  }

  log(kind, mode, row, message) {
    const rowRef = row ? `row ${row.__row}` : '-';
    const line = `${kind} | ${mode} | ${rowRef} | ${message}`;
    console.log(line);

    if (kind === 'CREATE') {
      this.summary.created += 1;
    } else if (kind === 'UPDATE') {
      this.summary.updated += 1;
    } else if (kind === 'SKIP') {
      this.summary.skipped += 1;
    } else if (kind === 'WARN') {
      this.summary.warnings += 1;
    } else if (kind === 'FAIL') {
      this.summary.failed += 1;
    }
  }

  buildKey(mode, action, record) {
    return `${this.config.idempotencyPrefix}:${mode}:${action}:${hashRecord(record)}`;
  }

  async getRoomBoard() {
    const rooms = await this.request({
      role: 'frontdesk',
      method: 'GET',
      endpoint: `/properties/${this.config.propertyId}/rooms/board`,
    });

    return rooms;
  }

  async getRoomTypeMap() {
    const payload = await this.request({
      role: 'public',
      method: 'GET',
      endpoint: `/public/properties/${this.config.propertyId}`,
    });

    const roomTypeMap = new Map();
    for (const roomType of payload.roomTypes ?? []) {
      roomTypeMap.set(normalizeName(roomType.name), roomType.id);
    }

    return roomTypeMap;
  }

  async listReservations(params = {}) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && String(value).length > 0) {
        query.set(key, String(value));
      }
    }

    const suffix = query.toString().length > 0 ? `?${query.toString()}` : '';
    return this.request({
      role: 'frontdesk',
      method: 'GET',
      endpoint: `/properties/${this.config.propertyId}/reservations${suffix}`,
    });
  }

  async listInvoices(search) {
    const query = new URLSearchParams();
    if (search) {
      query.set('search', search);
    }

    const suffix = query.toString().length > 0 ? `?${query.toString()}` : '';
    return this.request({
      role: 'finance',
      method: 'GET',
      endpoint: `/properties/${this.config.propertyId}/invoices${suffix}`,
    });
  }

  async getInvoice(invoiceId) {
    return this.request({
      role: 'finance',
      method: 'GET',
      endpoint: `/properties/${this.config.propertyId}/invoices/${invoiceId}`,
    });
  }

  async createReservation(mode, row, payload) {
    if (this.config.dryRun) {
      this.log('SKIP', mode, row, 'dry-run: reservation create skipped');
      return undefined;
    }

    const key = this.buildKey(mode, 'reservation-create', row);
    return this.request({
      role: 'frontdesk',
      method: 'POST',
      endpoint: `/properties/${this.config.propertyId}/reservations`,
      body: payload,
      idempotencyKey: key,
    });
  }

  async checkInReservation(mode, row, payload) {
    if (this.config.dryRun) {
      this.log('SKIP', mode, row, 'dry-run: check-in skipped');
      return undefined;
    }

    const key = this.buildKey(mode, 'stay-checkin', row);
    return this.request({
      role: 'frontdesk',
      method: 'POST',
      endpoint: `/properties/${this.config.propertyId}/stays/checkin`,
      body: payload,
      idempotencyKey: key,
    });
  }

  async setRoomStatus(mode, row, roomId, payload) {
    if (this.config.dryRun) {
      this.log('SKIP', mode, row, 'dry-run: room status update skipped');
      return undefined;
    }

    const key = this.buildKey(mode, `room-status-${roomId}`, row);
    return this.request({
      role: 'manager',
      method: 'POST',
      endpoint: `/properties/${this.config.propertyId}/manager/rooms/${roomId}/status`,
      body: payload,
      idempotencyKey: key,
    });
  }

  async addOpeningCharge(mode, row, invoiceId, amount, reason) {
    if (amount <= 0) {
      return;
    }

    const detail = await this.getInvoice(invoiceId);
    const existing = (detail.lineItems ?? []).find((lineItem) =>
      String(lineItem.description ?? '').startsWith(OPENING_CHARGE_MARKER),
    );

    if (existing) {
      if (Number(existing.amount) !== amount) {
        throw new Error(
          `Opening charge already exists with amount ${existing.amount}, expected ${amount}`,
        );
      }

      this.log('SKIP', mode, row, `opening charge already present on invoice ${invoiceId}`);
      return;
    }

    if (this.config.dryRun) {
      this.log('SKIP', mode, row, `dry-run: opening charge ${amount} on invoice ${invoiceId}`);
      return;
    }

    const description = `${OPENING_CHARGE_MARKER} Day 1 opening balance import`;
    const key = this.buildKey(mode, `opening-charge-${invoiceId}`, row);
    await this.request({
      role: 'finance',
      method: 'POST',
      endpoint: `/properties/${this.config.propertyId}/invoices/${invoiceId}/adjustments`,
      idempotencyKey: key,
      body: {
        invoiceId,
        type: 'CHARGE',
        amount,
        description,
        reason,
      },
    });

    this.log('UPDATE', mode, row, `opening charge posted on invoice ${invoiceId}`);
  }

  async addOpeningDeposit(mode, row, invoiceId, amount, method, note) {
    if (amount <= 0) {
      return;
    }

    const detail = await this.getInvoice(invoiceId);
    const existing = (detail.payments ?? []).find(
      (payment) =>
        String(payment.note ?? '').startsWith(OPENING_DEPOSIT_MARKER) &&
        Number(payment.amount) === amount,
    );

    if (existing) {
      this.log('SKIP', mode, row, `opening deposit already present on invoice ${invoiceId}`);
      return;
    }

    if (this.config.dryRun) {
      this.log('SKIP', mode, row, `dry-run: opening deposit ${amount} on invoice ${invoiceId}`);
      return;
    }

    const key = this.buildKey(mode, `opening-deposit-${invoiceId}`, row);
    await this.request({
      role: 'finance',
      method: 'POST',
      endpoint: `/properties/${this.config.propertyId}/payments`,
      idempotencyKey: key,
      body: {
        invoiceId,
        method,
        amount,
        reference: `${OPENING_DEPOSIT_MARKER}:${invoiceId}`,
        note,
      },
    });

    this.log('UPDATE', mode, row, `opening deposit recorded on invoice ${invoiceId}`);
  }

  async resolveInvoice({ reservationId, stayId, invoiceReference, roomNumber, guestFullName }) {
    if (reservationId) {
      const byReservation = await this.listInvoices(reservationId);
      const exact = byReservation.find((invoice) => invoice.reservationId === reservationId);
      if (exact) {
        return exact;
      }
    }

    if (stayId) {
      const byStay = await this.listInvoices(stayId);
      const exact = byStay.find((invoice) => invoice.stayId === stayId);
      if (exact) {
        return exact;
      }
    }

    if (invoiceReference) {
      const byReference = await this.listInvoices(invoiceReference);
      const normalized = normalizeString(invoiceReference).toLowerCase();
      const exact = byReference.find(
        (invoice) =>
          String(invoice.id).toLowerCase() === normalized ||
          String(invoice.invoiceNumber).toLowerCase() === normalized,
      );
      if (exact) {
        return exact;
      }
    }

    if (roomNumber) {
      const rooms = await this.getRoomBoard();
      const room = rooms.find((item) => String(item.roomNumber) === String(roomNumber));
      if (room?.currentStayId) {
        const byStay = await this.listInvoices(room.currentStayId);
        const exact = byStay.find((invoice) => invoice.stayId === room.currentStayId);
        if (exact) {
          return exact;
        }
      }
    }

    if (guestFullName) {
      const reservations = await this.listReservations({ q: guestFullName });
      const reservation = reservations.find(
        (item) => normalizeName(item.guestFullName) === normalizeName(guestFullName),
      );
      if (reservation) {
        const byReservation = await this.listInvoices(reservation.id);
        const exact = byReservation.find((invoice) => invoice.reservationId === reservation.id);
        if (exact) {
          return exact;
        }
      }
    }

    return undefined;
  }

  async importInhouse(csvPath) {
    const mode = 'inhouse';
    const rows = readCsv(csvPath);
    if (rows.length === 0) {
      this.log('SKIP', mode, undefined, 'no rows found');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const rooms = await this.getRoomBoard();
    const roomByNumber = new Map(rooms.map((room) => [String(room.roomNumber), room]));

    for (const row of rows) {
      try {
        const guestFullName = normalizeString(row.guest_full_name);
        const guestPhone = normalizePhone(row.guest_phone);
        const roomNumber = normalizeString(row.room_number);
        const checkInDate = parseDate(row.check_in_date, 'check_in_date');
        const checkOutDate = parseDate(row.expected_check_out_date, 'expected_check_out_date');
        const openingBalance = parseMoney(row.opening_balance_ngn, 'opening_balance_ngn');
        const notes = normalizeString(row.notes);

        if (!guestFullName) {
          throw new Error('guest_full_name is required');
        }
        if (!roomNumber) {
          throw new Error('room_number is required');
        }
        if (checkInDate > today) {
          throw new Error('check_in_date cannot be in the future for in-house import');
        }
        if (checkOutDate <= checkInDate) {
          throw new Error('expected_check_out_date must be after check_in_date');
        }

        const room = roomByNumber.get(roomNumber);
        if (!room) {
          throw new Error(`room_number ${roomNumber} not found`);
        }

        let reservation;
        let stayId = room.currentStayId;

        if (room.status === 'OCCUPIED' && room.currentStayId) {
          this.log('SKIP', mode, row, `room ${roomNumber} already occupied (stay ${room.currentStayId})`);
        } else {
          const reservationSearch = guestPhone || guestFullName;
          const existing = (await this.listReservations({
            from: checkInDate,
            to: checkOutDate,
            q: reservationSearch,
          })).find(
            (candidate) =>
              candidate.status !== 'CANCELLED' &&
              candidate.checkIn === checkInDate &&
              candidate.checkOut === checkOutDate &&
              candidate.roomTypeId === room.roomTypeId &&
              normalizeName(candidate.guestFullName) === normalizeName(guestFullName) &&
              normalizePhone(candidate.guestPhone) === guestPhone,
          );

          if (existing) {
            reservation = existing;
            this.log('SKIP', mode, row, `reservation already exists (${existing.code})`);
          } else {
            reservation = await this.createReservation(mode, row, {
              guest: {
                fullName: guestFullName,
                phone: guestPhone || undefined,
              },
              roomTypeId: room.roomTypeId,
              checkIn: checkInDate,
              checkOut: checkOutDate,
              adults: 1,
              children: 0,
              source: 'MANUAL_IMPORT',
              notes,
              depositStatus: 'NONE',
              status: 'CONFIRMED',
            });

            if (reservation) {
              this.log('CREATE', mode, row, `reservation created (${reservation.code})`);
            }
          }

          if (reservation) {
            const checkInAt = new Date(`${checkInDate}T00:00:00.000Z`).toISOString();
            const stay = await this.checkInReservation(mode, row, {
              reservationId: reservation.id,
              assignRoomId: room.roomId,
              checkInAt,
            });

            if (stay) {
              stayId = stay.id;
              this.log('CREATE', mode, row, `stay opened (${stay.id})`);
            }
          }
        }

        if (openingBalance > 0) {
          const invoice = await this.resolveInvoice({
            reservationId: reservation?.id,
            stayId,
            roomNumber,
            guestFullName,
          });

          if (!invoice) {
            if (this.config.dryRun) {
              this.log('WARN', mode, row, 'dry-run: invoice lookup skipped for opening balance');
              continue;
            }
            throw new Error('invoice not found for opening balance import');
          }

          await this.addOpeningCharge(
            mode,
            row,
            invoice.id,
            openingBalance,
            ensureReason(notes, 'Day 1 in-house opening balance import'),
          );
        }
      } catch (error) {
        this.log('FAIL', mode, row, formatError(error));
      }
    }
  }

  async importFuture(csvPath) {
    const mode = 'future';
    const rows = readCsv(csvPath);
    if (rows.length === 0) {
      this.log('SKIP', mode, undefined, 'no rows found');
      return;
    }

    const roomTypeMap = await this.getRoomTypeMap();

    for (const row of rows) {
      try {
        const guestFullName = normalizeString(row.guest_full_name);
        const guestPhone = normalizePhone(row.guest_phone);
        const checkInDate = parseDate(row.check_in_date, 'check_in_date');
        const checkOutDate = parseDate(row.check_out_date, 'check_out_date');
        const roomTypeValue = normalizeString(row.room_type);
        const notes = normalizeString(row.notes);

        if (!guestFullName) {
          throw new Error('guest_full_name is required');
        }
        if (!roomTypeValue) {
          throw new Error('room_type is required');
        }
        if (checkOutDate <= checkInDate) {
          throw new Error('check_out_date must be after check_in_date');
        }

        const roomTypeId = isUuid(roomTypeValue)
          ? roomTypeValue
          : roomTypeMap.get(normalizeName(roomTypeValue));
        if (!roomTypeId) {
          throw new Error(`room_type ${roomTypeValue} could not be resolved`);
        }

        const source = normalizeString(row.source || 'MANUAL_IMPORT').toUpperCase();
        if (!BOOKING_SOURCES.has(source)) {
          throw new Error(`source ${source} is not supported`);
        }

        const depositStatus = normalizeString(row.deposit_status || 'NONE').toUpperCase();
        if (!DEPOSIT_STATUSES.has(depositStatus)) {
          throw new Error(`deposit_status ${depositStatus} is not supported`);
        }

        const adults = normalizeString(row.adults).length > 0 ? Number(row.adults) : 1;
        const children = normalizeString(row.children).length > 0 ? Number(row.children) : 0;
        if (!Number.isInteger(adults) || adults < 1 || adults > 10) {
          throw new Error('adults must be an integer between 1 and 10');
        }
        if (!Number.isInteger(children) || children < 0 || children > 10) {
          throw new Error('children must be an integer between 0 and 10');
        }

        const reservationSearch = guestPhone || guestFullName;
        const existing = (await this.listReservations({
          from: checkInDate,
          to: checkOutDate,
          q: reservationSearch,
        })).find(
          (candidate) =>
            candidate.status !== 'CANCELLED' &&
            candidate.checkIn === checkInDate &&
            candidate.checkOut === checkOutDate &&
            candidate.roomTypeId === roomTypeId &&
            normalizeName(candidate.guestFullName) === normalizeName(guestFullName) &&
            normalizePhone(candidate.guestPhone) === guestPhone,
        );

        if (existing) {
          this.log('SKIP', mode, row, `reservation already exists (${existing.code})`);
          continue;
        }

        const created = await this.createReservation(mode, row, {
          guest: {
            fullName: guestFullName,
            phone: guestPhone || undefined,
          },
          roomTypeId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          adults,
          children,
          source,
          notes,
          depositStatus,
          status: 'CONFIRMED',
        });

        if (created) {
          this.log('CREATE', mode, row, `reservation created (${created.code})`);
        }
      } catch (error) {
        this.log('FAIL', mode, row, formatError(error));
      }
    }
  }

  async importRoomStatus(csvPath) {
    const mode = 'room-status';
    const rows = readCsv(csvPath);
    if (rows.length === 0) {
      this.log('SKIP', mode, undefined, 'no rows found');
      return;
    }

    const rooms = await this.getRoomBoard();
    const roomByNumber = new Map(rooms.map((room) => [String(room.roomNumber), room]));

    for (const row of rows) {
      try {
        const roomNumber = normalizeString(row.room_number);
        const targetStatus = normalizeString(row.room_status).toUpperCase();
        const notes = normalizeString(row.notes);

        if (!roomNumber) {
          throw new Error('room_number is required');
        }
        if (!targetStatus) {
          throw new Error('room_status is required');
        }

        const room = roomByNumber.get(roomNumber);
        if (!room) {
          throw new Error(`room_number ${roomNumber} not found`);
        }

        if (targetStatus === 'OCCUPIED') {
          if (room.status === 'OCCUPIED') {
            this.log('SKIP', mode, row, `room ${roomNumber} already OCCUPIED`);
          } else {
            this.log(
              'WARN',
              mode,
              row,
              `OCCUPIED is managed through inhouse import/check-in; room is currently ${room.status}`,
            );
          }
          continue;
        }

        if (!['DIRTY', 'VACANT_READY'].includes(targetStatus)) {
          throw new Error('room_status must be DIRTY or VACANT_READY for onboarding endpoint');
        }

        if (room.status === targetStatus) {
          this.log('SKIP', mode, row, `room ${roomNumber} already ${targetStatus}`);
          continue;
        }

        const reason = ensureReason(notes, 'Day 1 room status import');
        await this.setRoomStatus(mode, row, room.roomId, {
          status: targetStatus,
          reason,
        });

        room.status = targetStatus;
        if (this.config.dryRun) {
          continue;
        }
        this.log('UPDATE', mode, row, `room ${roomNumber} set to ${targetStatus}`);
      } catch (error) {
        this.log('FAIL', mode, row, formatError(error));
      }
    }
  }

  async importOpeningBalances(csvPath) {
    const mode = 'opening-balances';
    const rows = readCsv(csvPath);
    if (rows.length === 0) {
      this.log('SKIP', mode, undefined, 'no rows found');
      return;
    }

    for (const row of rows) {
      try {
        const invoiceReference = normalizeString(row.invoice_reference);
        const guestFullName = normalizeString(row.guest_full_name);
        const roomNumber = normalizeString(row.room_number);
        const outstanding = parseMoney(row.outstanding_balance_ngn, 'outstanding_balance_ngn');
        const deposit = parseMoney(row.deposit_received_ngn, 'deposit_received_ngn');
        const notes = normalizeString(row.notes);
        const paymentMethod = normalizeString(row.payment_method || this.config.defaultOpeningDepositMethod).toUpperCase();

        if (outstanding === 0 && deposit === 0) {
          this.log('SKIP', mode, row, 'both outstanding_balance_ngn and deposit_received_ngn are zero');
          continue;
        }

        if (!PAYMENT_METHODS.has(paymentMethod)) {
          throw new Error(`payment_method ${paymentMethod} is not supported`);
        }

        const invoice = await this.resolveInvoice({
          invoiceReference,
          roomNumber,
          guestFullName,
        });

        if (!invoice) {
          if (this.config.dryRun) {
            this.log('WARN', mode, row, 'dry-run: invoice lookup skipped for opening balances');
            continue;
          }
          throw new Error('invoice could not be resolved from invoice_reference/room_number/guest_full_name');
        }

        const totalCharge = formatNumber(outstanding + deposit);
        const chargeReason = ensureReason(notes, 'Day 1 opening balance import');
        await this.addOpeningCharge(mode, row, invoice.id, totalCharge, chargeReason);

        const paymentNote = `${OPENING_DEPOSIT_MARKER} ${notes || 'Day 1 opening deposit import'}`;
        await this.addOpeningDeposit(mode, row, invoice.id, deposit, paymentMethod, paymentNote);
      } catch (error) {
        this.log('FAIL', mode, row, formatError(error));
      }
    }
  }
}

function loadConfig(args) {
  const mode = String(args.mode ?? process.env.IMPORT_MODE ?? 'all').trim().toLowerCase();
  if (!MODES.has(mode)) {
    throw new Error(`--mode must be one of: ${Array.from(MODES).join(', ')}`);
  }

  const tenantId = normalizeString(args['tenant-id'] ?? process.env.TENANT_ID);
  const propertyId = normalizeString(args['property-id'] ?? process.env.PROPERTY_ID);
  const frontDeskUserId = normalizeString(args['frontdesk-user-id'] ?? process.env.FRONT_DESK_USER_ID);
  const financeUserId = normalizeString(args['finance-user-id'] ?? process.env.FINANCE_USER_ID);
  const managerUserId = normalizeString(args['manager-user-id'] ?? process.env.MANAGER_USER_ID);

  if (!tenantId || !propertyId) {
    throw new Error('TENANT_ID and PROPERTY_ID are required');
  }

  if (!frontDeskUserId || !financeUserId || !managerUserId) {
    throw new Error('FRONT_DESK_USER_ID, FINANCE_USER_ID, and MANAGER_USER_ID are required');
  }

  return {
    baseUrl: normalizeBaseUrl(args['base-url'] ?? process.env.BASE_URL ?? DEFAULT_BASE_URL),
    tenantId,
    propertyId,
    frontDeskUserId,
    financeUserId,
    managerUserId,
    frontDeskPermissions: splitPermissions(
      args['frontdesk-perms'] ?? process.env.DAY1_FRONT_DESK_PERMS ?? process.env.FRONT_DESK_PERMS,
      DEFAULT_FRONT_DESK_PERMISSIONS,
    ),
    financePermissions: splitPermissions(
      args['finance-perms'] ?? process.env.DAY1_FINANCE_PERMS ?? process.env.FINANCE_PERMS,
      DEFAULT_FINANCE_PERMISSIONS,
    ),
    managerPermissions: splitPermissions(
      args['manager-perms'] ?? process.env.DAY1_MANAGER_PERMS ?? process.env.MANAGER_PERMS,
      DEFAULT_MANAGER_PERMISSIONS,
    ),
    mode,
    dryRun: parseBoolean(args['dry-run'] ?? process.env.DRY_RUN, false),
    idempotencyPrefix: normalizeString(args['idempotency-prefix'] ?? process.env.IDEMPOTENCY_PREFIX) || 'day1-phase2-import',
    defaultOpeningDepositMethod:
      normalizeString(args['opening-deposit-method'] ?? process.env.OPENING_DEPOSIT_METHOD).toUpperCase() ||
      'CASH',
    inhouseCsv: resolveFilePath(
      args['inhouse-csv'] ?? process.env.DAY1_INHOUSE_CSV ?? DEFAULT_INHOUSE_CSV,
    ),
    futureCsv: resolveFilePath(
      args['future-csv'] ?? process.env.DAY1_FUTURE_CSV ?? DEFAULT_FUTURE_CSV,
    ),
    roomStatusCsv: resolveFilePath(
      args['room-status-csv'] ?? process.env.DAY1_ROOM_STATUS_CSV ?? DEFAULT_ROOM_STATUS_CSV,
    ),
    openingBalancesCsv: resolveFilePath(
      args['opening-balances-csv'] ?? process.env.DAY1_OPENING_BALANCES_CSV ?? DEFAULT_OPENING_BALANCES_CSV,
    ),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const config = loadConfig(args);

  if (!PAYMENT_METHODS.has(config.defaultOpeningDepositMethod)) {
    throw new Error(`OPENING_DEPOSIT_METHOD must be one of: ${Array.from(PAYMENT_METHODS).join(', ')}`);
  }

  const runtime = new ImportRuntime(config);

  console.log('=== DAY 1 PHASE 2 IMPORT ===');
  console.log(`BASE_URL=${config.baseUrl}`);
  console.log(`TENANT_ID=${config.tenantId}`);
  console.log(`PROPERTY_ID=${config.propertyId}`);
  console.log(`MODE=${config.mode}`);
  console.log(`DRY_RUN=${config.dryRun}`);

  const modes =
    config.mode === 'all'
      ? ['inhouse', 'future', 'opening-balances', 'room-status']
      : [config.mode];

  for (const mode of modes) {
    if (mode === 'inhouse') {
      await runtime.importInhouse(config.inhouseCsv);
    } else if (mode === 'future') {
      await runtime.importFuture(config.futureCsv);
    } else if (mode === 'opening-balances') {
      await runtime.importOpeningBalances(config.openingBalancesCsv);
    } else if (mode === 'room-status') {
      await runtime.importRoomStatus(config.roomStatusCsv);
    }
  }

  console.log('=== IMPORT SUMMARY ===');
  console.log(`CREATED=${runtime.summary.created}`);
  console.log(`UPDATED=${runtime.summary.updated}`);
  console.log(`SKIPPED=${runtime.summary.skipped}`);
  console.log(`WARNINGS=${runtime.summary.warnings}`);
  console.log(`FAILED=${runtime.summary.failed}`);

  if (runtime.summary.failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  if (error instanceof ApiError) {
    console.error('FATAL API ERROR:', error.message);
    console.error(`STATUS=${error.status}`);
    console.error('BODY=', JSON.stringify(error.body, null, 2));
  } else {
    console.error('FATAL ERROR:', error.message);
  }
  process.exit(1);
});
