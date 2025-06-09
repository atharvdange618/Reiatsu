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
