/** 业务校验错误：不扣费，直接 4xx */
export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export function badRequest(message) {
  return new HttpError(400, message);
}
