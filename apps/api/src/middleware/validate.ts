import type { Context } from 'hono';
import { ZodError, type ZodType } from 'zod';
import { AppError } from '../lib/errors';

function formatZodError(error: ZodError): string {
  const [issue] = error.issues;
  if (!issue) {
    return 'Invalid request input';
  }

  const path = issue.path.length > 0 ? issue.path.join('.') : 'request';
  return `Invalid request input: ${path} ${issue.message}`;
}

function parseSchema<T>(schema: ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', formatZodError(parsed.error));
  }

  return parsed.data;
}

export async function validateJson<T>(c: Context, schema: ZodType<T>): Promise<T> {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    throw new AppError(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }

  return parseSchema(schema, body);
}

export function validateQuery<T>(c: Context, schema: ZodType<T>): T {
  return parseSchema(schema, c.req.query());
}

export function validateParams<T>(c: Context, schema: ZodType<T>): T {
  return parseSchema(schema, c.req.param());
}
