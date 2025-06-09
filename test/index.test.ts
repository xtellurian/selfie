import { describe, it, expect } from '@jest/globals';
import { helloWorld, getVersion, getSystemInfo, multiply } from '../src/index.js';

describe('Selfie Library', () => {
  describe('helloWorld', () => {
    it('should return hello world message', () => {
      const result = helloWorld();
      expect(result).toBe('Hello, World! Selfie agentic build system is running.');
    });
  });

  describe('getVersion', () => {
    it('should return current version', () => {
      const result = getVersion();
      expect(result).toBe('1.0.0');
    });
  });

  describe('getSystemInfo', () => {
    it('should return system information', () => {
      const result = getSystemInfo();
      expect(result).toEqual({
        name: 'Selfie',
        version: '1.0.0',
        description: 'Agentic build system that builds itself'
      });
    });

    it('should have all required properties', () => {
      const result = getSystemInfo();
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('description');
    });
  });

  describe('multiply', () => {
    it('should multiply two positive numbers correctly', () => {
      const result = multiply(3, 4);
      expect(result).toBe(12);
    });

    it('should multiply two negative numbers correctly', () => {
      const result = multiply(-2, -5);
      expect(result).toBe(10);
    });

    it('should multiply positive and negative numbers correctly', () => {
      const result = multiply(6, -3);
      expect(result).toBe(-18);
    });

    it('should handle multiplication by zero', () => {
      expect(multiply(5, 0)).toBe(0);
      expect(multiply(0, 10)).toBe(0);
    });

    it('should handle decimal numbers', () => {
      const result = multiply(2.5, 4);
      expect(result).toBe(10);
    });
  });
});