import { ZodError } from 'zod';

export namespace ZodUtil {
  export const zodErrorToMessage = (error: ZodError): string => {
    const path = error.errors[0].path;
    const message = error.errors[0].message;
    return `${path}: ${message}`;
  };
}
