import { ValidationError } from "../errors/AppError";

export class Validator {
  static required(value: any, fieldName: string) {
    if (value === undefined || value === null || value === "") {
      throw new ValidationError(`${fieldName} is required`);
    }
    return value;
  }

  static email(value: string, fieldName: string = "Email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid email address`);
    }
    return value;
  }

  static minLength(value: string, min: number, fieldName: string) {
    if (value.length < min) {
      throw new ValidationError(
        `${fieldName} must be at least ${min} characters long`
      );
    }
    return value;
  }

  static maxLength(value: string, max: number, fieldName: string) {
    if (value.length > max) {
      throw new ValidationError(
        `${fieldName} must not exceed ${max} characters`
      );
    }
    return value;
  }

  static isNumber(value: any, fieldName: string) {
    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationError(`${fieldName} must be a valid number`);
    }
    return num;
  }

  static range(value: number, min: number, max: number, fieldName: string) {
    if (value < min || value > max) {
      throw new ValidationError(
        `${fieldName} must be between ${min} and ${max}`
      );
    }
    return value;
  }
}
