import { BaseValidator } from "./core";

export class StringValidator extends BaseValidator<string> {
  min(len: number, msg?: string) {
    const message = msg || `Must be at least ${len} characters`;
    return this.addRule((value) =>
      typeof value === "string" && value.length < len ? message : undefined
    );
  }

  max(len: number, msg?: string) {
    const message = msg || `Must be at most ${len} characters`;
    return this.addRule((value) =>
      typeof value === "string" && value.length > len ? message : undefined
    );
  }

  /**
   * Validates email format using a more comprehensive regex pattern.
   */
  email(msg = "Invalid email address") {
    return this.addRule((value) => {
      if (typeof value !== "string") return msg;

      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

      return !emailRegex.test(value) ? msg : undefined;
    });
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
