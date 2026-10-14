export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const unauthorized = (message = 'Autenticação necessária.') =>
  new ApiError(401, 'UNAUTHORIZED', message);

export const forbidden = (message = 'O perfil não possui permissão para esta operação.') =>
  new ApiError(403, 'FORBIDDEN', message);

export const notFound = (message = 'Recurso não encontrado.') =>
  new ApiError(404, 'NOT_FOUND', message);

export const conflict = (code: string, message: string) =>
  new ApiError(409, code, message);

export const invalidRequest = (message: string) =>
  new ApiError(422, 'VALIDATION_ERROR', message);
