/**
 * Input validation utilities
 */

import type { JsonValue } from '@/types/index.js';

/**
 * Validate that a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate that a value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

/**
 * Validate that a value is a valid URL
 */
export function isValidUrl(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that a value is a valid email address
 */
export function isValidEmail(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Validate that a value is a valid ISO 8601 date string
 */
export function isValidIsoDate(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString() === value;
}

/**
 * Validate that an object has required properties
 */
export function hasRequiredProperties<T extends Record<string, unknown>>(
  obj: unknown,
  requiredKeys: readonly (keyof T)[]
): obj is T {
  if (!obj || typeof obj !== 'object') return false;
  
  return requiredKeys.every(key => key in obj);
}

/**
 * Sanitize a string by removing potentially dangerous characters
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/[<>'"&]/g, '') // Remove basic HTML/JS injection chars
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Validate and sanitize JSON input
 */
export function validateJsonInput<T extends JsonValue>(
  input: unknown,
  validator?: (value: unknown) => value is T
): T | null {
  try {
    // If it's already parsed JSON
    if (typeof input === 'object' && input !== null) {
      return validator ? (validator(input) ? input : null) : input as T;
    }
    
    // If it's a JSON string
    if (typeof input === 'string') {
      const parsed = JSON.parse(input);
      return validator ? (validator(parsed) ? parsed : null) : parsed as T;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams(
  url: URL,
  schema: Record<string, {
    required?: boolean;
    type: 'string' | 'number' | 'boolean';
    validator?: (value: string) => boolean;
  }>
): { valid: boolean; errors: string[]; params: Record<string, unknown> } {
  const errors: string[] = [];
  const params: Record<string, unknown> = {};
  
  for (const [key, config] of Object.entries(schema)) {
    const value = url.searchParams.get(key);
    
    if (config.required && value === null) {
      errors.push(`Missing required parameter: ${key}`);
      continue;
    }
    
    if (value === null) continue;
    
    switch (config.type) {
      case 'string':
        if (config.validator && !config.validator(value)) {
          errors.push(`Invalid value for parameter ${key}: ${value}`);
        } else {
          params[key] = sanitizeString(value);
        }
        break;
        
      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push(`Parameter ${key} must be a number: ${value}`);
        } else {
          params[key] = numValue;
        }
        break;
        
      case 'boolean':
        if (value !== 'true' && value !== 'false') {
          errors.push(`Parameter ${key} must be true or false: ${value}`);
        } else {
          params[key] = value === 'true';
        }
        break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    params,
  };
}