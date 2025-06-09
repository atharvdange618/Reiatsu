type RuleFunction = (
  value: any,
  context?: any
) => string | void | Promise<string | void>;

interface ValidatorSchema<T = any> {
  validate(value: any): Promise<ValidationResult<T>>;
  rules: RuleFunction[];
  addRule(rule: RuleFunction): this;
}

export type ValidationError = {
  [field: string]: string | string[];
};

export type ValidationResult<T> = {
  value?: T;
  error?: ValidationError;
};

const customRules: { [name: string]: RuleFunction } = {};

/**
 * BaseValidator is a generic class that provides a foundation for building custom validation logic.
 * It manages a list of validation rules and supports marking fields as required.
 *
 * @typeParam T - The type of value being validated.
 *
 * @implements ValidatorSchema<T>
 *
 * @example
 * ```typescript
 * const validator = new BaseValidator<string>().required("Name is required");
 * const result = await validator.validate("");
 * // result.error._field === "Name is required"
 * ```
 *
 * @property rules - An array of functions representing validation rules.
 * @property _isRequired - Indicates if the field is required.
 *
 * @method addRule
 * Adds a custom validation rule to the validator.
 * @param rule - The validation function to add.
 * @returns The current instance for chaining.
 *
 * @method required
 * Marks the field as required and adds a required rule.
 * @param msg - The error message to use if the field is missing.
 * @returns The current instance for chaining.
 *
 * @method validate
 * Validates the provided value against all rules.
 * @param value - The value to validate.
 * @returns A promise resolving to a ValidationResult containing either the validated value or error(s).
 *
 * @static register
 * Registers a custom rule globally and adds a corresponding method to the prototype for chaining.
 * @param name - The name of the custom rule.
 * @param fn - The rule function.
 */
export class BaseValidator<T = any> implements ValidatorSchema<T> {
  rules: RuleFunction[] = [];
  protected _isRequired: boolean = false;

  addRule(rule: RuleFunction) {
    this.rules.push(rule);
    return this;
  }

  required(msg = "Field is required") {
    this._isRequired = true;
    return this.addRule((value) =>
      value == null || value === "" ? msg : undefined
    );
  }

  async validate(value: any): Promise<ValidationResult<T>> {
    const errors: string[] = [];

    if (this._isRequired && (value == null || value === "")) {
      errors.push("Field is required");
      return {
        error: {
          _field: errors.length === 1 ? errors[0] : errors,
        },
      };
    }

    for (const rule of this.rules) {
      const result = await rule(value);
      if (typeof result === "string") errors.push(result);
    }

    if (errors.length) {
      return {
        error: {
          _field: errors.length === 1 ? errors[0] : errors,
        },
      };
    }

    return { value };
  }

  static register(name: string, fn: RuleFunction) {
    customRules[name] = fn;
    (BaseValidator.prototype as any)[name] = function (...args: any[]) {
      return this.addRule((value: any) => fn(value, ...args));
    };
  }
}
