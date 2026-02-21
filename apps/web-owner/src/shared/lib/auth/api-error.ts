export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export async function toApiClientError(response: Response): Promise<ApiClientError> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  const payloadRecord = payload as { code?: string; message?: string | string[] } | undefined;
  const messageFromArray = Array.isArray(payloadRecord?.message)
    ? payloadRecord?.message.find((item) => typeof item === 'string')
    : undefined;
  const message =
    (typeof payloadRecord?.message === 'string' ? payloadRecord.message : undefined) ??
    messageFromArray ??
    `Request failed with status ${response.status}`;
  const code =
    (typeof payloadRecord?.code === 'string' ? payloadRecord.code : undefined) ??
    (typeof payloadRecord?.message === 'string' ? payloadRecord.message : undefined) ??
    messageFromArray ??
    `HTTP_${response.status}`;

  return new ApiClientError(response.status, code, message, payload);
}
