import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from "../errors/AppError";
import { Handler } from "../types/http";
import { Validator } from "../utils/validation";

export const createUserHandler: Handler = async (ctx) => {
  const { name, email, age } = ctx.body || {};

  // Validation
  Validator.required(name, "Name");
  Validator.required(email, "Email");
  Validator.email(email);
  Validator.minLength(name, 2, "Name");
  Validator.maxLength(name, 50, "Name");

  if (age !== undefined) {
    const validAge = Validator.isNumber(age, "Age");
    Validator.range(validAge, 0, 120, "Age");
  }

  // Simulate user creation
  const user = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    email,
    age: age ? Number(age) : undefined,
    createdAt: new Date().toISOString(),
  };

  ctx.status(201).json({
    success: true,
    data: user,
  });
};

export const getUserHandler: Handler = async (ctx) => {
  const { id } = ctx.params;

  if (!id) {
    throw new ValidationError("User ID is required");
  }

  // Simulate user lookup
  if (id === "nonexistent") {
    throw new NotFoundError("User");
  }

  // Simulate authentication check
  const authHeader = ctx.req.headers.authorization;
  if (!authHeader) {
    throw new AuthenticationError();
  }

  ctx.status(200).json({
    success: true,
    data: { id, name: "John Doe", email: "john@example.com" },
  });
};
