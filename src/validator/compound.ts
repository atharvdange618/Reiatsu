import { BaseValidator, ValidationResult, ValidationError } from "./core";

export class ObjectValidator<
  T extends Record<string, any>
> extends BaseValidator<T> {
  constructor(private shape: { [K in keyof T]: BaseValidator<T[K]> }) {
    super();
  }

  async validate(obj: any): Promise<ValidationResult<T>> {
    const errors: ValidationError = {};
    const result: any = {};

    for (const key in this.shape) {
      const validator = this.shape[key];
      const { value, error } = await validator.validate(
        obj ? obj[key] : undefined
      );

      if (error) {
        const errorValues = Object.values(error);
        if (errorValues.length > 0) {
          errors[key] = errorValues[0];
        }
      } else {
        result[key] = value;
      }
    }

    if (Object.keys(errors).length) return { error: errors };
    return { value: result };
  }
}

export class ArrayValidator<T> extends BaseValidator<T[]> {
  constructor(private elementValidator: BaseValidator<T>) {
    super();
  }
  async validate(arr: any): Promise<ValidationResult<T[]>> {
    const errors: ValidationError = {};
    const values: T[] = [];
    if (!Array.isArray(arr)) return { error: { _type: "Expected an array" } };

    for (let i = 0; i < arr.length; i++) {
      const { value, error } = await this.elementValidator.validate(arr[i]);
      if (error) {
        const errorValues = Object.values(error);
        if (errorValues.length > 0) {
          errors[i] = errorValues[0];
        }
      } else {
        values.push(value as T);
      }
    }
    if (Object.keys(errors).length) return { error: errors };
    return { value: values };
  }
}
