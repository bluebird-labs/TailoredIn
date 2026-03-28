export namespace TypeUtil {
  export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[]
      ? DeepPartial<U>[]
      : T[P] extends Readonly<infer U>[]
        ? Readonly<DeepPartial<U>>[]
        : DeepPartial<T[P]>;
  };

  export type ReturnTypeOrPromise<T> = T extends (...args: infer P) => infer R ? (...args: P) => R | Promise<R> : never;

  export type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

  export type DeepPartialWithRequired<T, K extends keyof T> = DeepPartial<Omit<T, K>> & Required<Pick<T, K>>;

  export type CamelCase<T extends string> = T extends `${infer FirstWord}_${infer Rest}`
    ? `${FirstWord}${Capitalize<CamelCase<Rest>>}`
    : T;

  export type CamelCaseKeys<T extends object> = {
    [K in keyof T as CamelCase<K & string>]: T[K];
  };

  export type RequiredNonNull<T> = T extends object
    ? { [K in keyof T]-?: Exclude<T[K], null | undefined> }
    : Exclude<T, null | undefined>;

  export type WithRequiredNonNull<T, K extends keyof T> = Omit<T, K> & RequiredNonNull<Pick<T, K>>;
}
