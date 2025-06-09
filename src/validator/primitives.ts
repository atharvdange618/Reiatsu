import { BaseValidator } from "./core";

export class StringValidator extends BaseValidator<string> {
  min(len: number, msg = `Must be at most ${len} characters`) {
    return this.addRule((value) =>
      typeof value === "string" && value.length < len ? msg : undefined
    );
  }
  max(len: number, msg = `Must be at most ${len} characters`) {
    return this.addRule((value) =>
      typeof value === "string" && value.length > len ? msg : undefined
    );
  }
  email(msg = "Invalid Email Address") {
    return this.addRule((value) =>
      typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? msg
        : undefined
    );
  }
}

export class NumberValidator extends BaseValidator<number> {
  min(n: number, msg = `Must be at least ${n}`) {
    return this.addRule((value) =>
      typeof value === "number" && value < n ? msg : undefined
    );
  }
  max(n: number, msg = `Must be at most ${n}`) {
    return this.addRule((value) =>
      typeof value === "number" && value > n ? msg : undefined
    );
  }
}
