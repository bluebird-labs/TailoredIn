export type Result<T, E = Error> = OkResult<T> | ErrResult<E>;

interface OkResult<T> {
  readonly isOk: true;
  readonly isErr: false;
  readonly value: T;
}

interface ErrResult<E> {
  readonly isOk: false;
  readonly isErr: true;
  readonly error: E;
}

export function ok<T>(value: T): OkResult<T> {
  return { isOk: true, isErr: false, value };
}

export function err<E>(error: E): ErrResult<E> {
  return { isOk: false, isErr: true, error };
}
