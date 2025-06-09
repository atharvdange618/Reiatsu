import { StringValidator, NumberValidator } from "./primitives";
import { ObjectValidator, ArrayValidator } from "./compound";
import { BaseValidator } from "./core";

export const Validator = {
  string: () => new StringValidator(),
  number: () => new NumberValidator(),
  object: <T extends Record<string, any>>(shape: {
    [K in keyof T]: BaseValidator<T[K]>;
  }) => new ObjectValidator<T>(shape),
  array: <T>(elementValidator: BaseValidator<T>) =>
    new ArrayValidator<T>(elementValidator),
  register: BaseValidator.register,
};

export type { ValidationResult, ValidationError } from "./core";
