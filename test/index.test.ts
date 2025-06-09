import { describe, it, expect } from '@jest/globals';
import { helloWorld, getVersion, getSystemInfo, add } from '../src/index.js';

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

  describe('add', () => {
    describe('basic addition', () => {
      it('should add two positive integers', () => {
        expect(add(1, 2)).toBe(3);
        expect(add(5, 7)).toBe(12);
        expect(add(100, 200)).toBe(300);
      });

      it('should add two positive decimals', () => {
        expect(add(1.5, 2.5)).toBe(4);
        expect(add(0.1, 0.2)).toBeCloseTo(0.3);
        expect(add(3.14, 2.86)).toBeCloseTo(6);
      });

      it('should add negative numbers', () => {
        expect(add(-1, -2)).toBe(-3);
        expect(add(-5, -10)).toBe(-15);
        expect(add(-1.5, -2.5)).toBe(-4);
      });

      it('should add positive and negative numbers', () => {
        expect(add(5, -3)).toBe(2);
        expect(add(-10, 15)).toBe(5);
        expect(add(2.5, -1.5)).toBe(1);
      });

      it('should handle zero', () => {
        expect(add(0, 0)).toBe(0);
        expect(add(0, 5)).toBe(5);
        expect(add(-3, 0)).toBe(-3);
        expect(add(0, -7)).toBe(-7);
      });
    });

    describe('edge cases', () => {
      it('should handle very large numbers', () => {
        expect(add(Number.MAX_SAFE_INTEGER, 0)).toBe(Number.MAX_SAFE_INTEGER);
        expect(add(Number.MAX_SAFE_INTEGER, 1)).toBe(Number.MAX_SAFE_INTEGER + 1);
      });

      it('should handle very small numbers', () => {
        expect(add(Number.MIN_SAFE_INTEGER, 0)).toBe(Number.MIN_SAFE_INTEGER);
        expect(add(Number.MIN_SAFE_INTEGER, -1)).toBe(Number.MIN_SAFE_INTEGER - 1);
      });

      it('should handle Number.EPSILON', () => {
        expect(add(Number.EPSILON, 0)).toBe(Number.EPSILON);
        expect(add(1, Number.EPSILON)).toBe(1 + Number.EPSILON);
      });
    });

    describe('error handling', () => {
      it('should throw TypeError for non-number first parameter', () => {
        expect(() => add('1' as any, 2)).toThrow(TypeError);
        expect(() => add('1' as any, 2)).toThrow('Both parameters must be numbers');
        expect(() => add(null as any, 2)).toThrow(TypeError);
        expect(() => add(undefined as any, 2)).toThrow(TypeError);
        expect(() => add([] as any, 2)).toThrow(TypeError);
        expect(() => add({} as any, 2)).toThrow(TypeError);
        expect(() => add(true as any, 2)).toThrow(TypeError);
      });

      it('should throw TypeError for non-number second parameter', () => {
        expect(() => add(1, '2' as any)).toThrow(TypeError);
        expect(() => add(1, '2' as any)).toThrow('Both parameters must be numbers');
        expect(() => add(1, null as any)).toThrow(TypeError);
        expect(() => add(1, undefined as any)).toThrow(TypeError);
        expect(() => add(1, [] as any)).toThrow(TypeError);
        expect(() => add(1, {} as any)).toThrow(TypeError);
        expect(() => add(1, false as any)).toThrow(TypeError);
      });

      it('should throw TypeError for both parameters being non-numbers', () => {
        expect(() => add('1' as any, '2' as any)).toThrow(TypeError);
        expect(() => add('1' as any, '2' as any)).toThrow('Both parameters must be numbers');
      });

      it('should throw RangeError for infinite numbers', () => {
        expect(() => add(Infinity, 1)).toThrow(RangeError);
        expect(() => add(Infinity, 1)).toThrow('Parameters must be finite numbers');
        expect(() => add(-Infinity, 1)).toThrow(RangeError);
        expect(() => add(1, Infinity)).toThrow(RangeError);
        expect(() => add(1, -Infinity)).toThrow(RangeError);
        expect(() => add(Infinity, Infinity)).toThrow(RangeError);
        expect(() => add(-Infinity, -Infinity)).toThrow(RangeError);
      });

      it('should throw RangeError for NaN', () => {
        expect(() => add(NaN, 1)).toThrow(RangeError);
        expect(() => add(NaN, 1)).toThrow('Parameters must be finite numbers');
        expect(() => add(1, NaN)).toThrow(RangeError);
        expect(() => add(NaN, NaN)).toThrow(RangeError);
      });
    });

    describe('mathematical properties', () => {
      it('should be commutative (a + b = b + a)', () => {
        expect(add(3, 7)).toBe(add(7, 3));
        expect(add(-5, 2)).toBe(add(2, -5));
        expect(add(1.5, 2.5)).toBe(add(2.5, 1.5));
      });

      it('should be associative when chained', () => {
        // (a + b) + c = a + (b + c)
        const a = 2, b = 3, c = 4;
        expect(add(add(a, b), c)).toBe(add(a, add(b, c)));
        
        const x = -1.5, y = 2.7, z = -0.8;
        expect(add(add(x, y), z)).toBeCloseTo(add(x, add(y, z)));
      });

      it('should have zero as identity element', () => {
        expect(add(5, 0)).toBe(5);
        expect(add(0, 5)).toBe(5);
        expect(add(-3, 0)).toBe(-3);
        expect(add(0, -3)).toBe(-3);
        expect(add(0, 0)).toBe(0);
      });
    });
  });
});