import { describe, it, expect, jest } from '@jest/globals';
import { helloWorld, getVersion, getSystemInfo, hello } from '../src/index.js';

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

  describe('hello', () => {
    let consoleSpy: jest.SpiedFunction<typeof console.log>;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log hello message with provided name', () => {
      hello('World');
      expect(consoleSpy).toHaveBeenCalledWith('hello World');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should log hello message with different names', () => {
      hello('Alice');
      expect(consoleSpy).toHaveBeenCalledWith('hello Alice');
      
      hello('Bob');
      expect(consoleSpy).toHaveBeenCalledWith('hello Bob');
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle empty string name', () => {
      hello('');
      expect(consoleSpy).toHaveBeenCalledWith('hello ');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle names with spaces', () => {
      hello('John Doe');
      expect(consoleSpy).toHaveBeenCalledWith('hello John Doe');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle names with special characters', () => {
      hello('José-María');
      expect(consoleSpy).toHaveBeenCalledWith('hello José-María');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle numeric string names', () => {
      hello('123');
      expect(consoleSpy).toHaveBeenCalledWith('hello 123');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(1000);
      hello(longName);
      expect(consoleSpy).toHaveBeenCalledWith(`hello ${longName}`);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should return undefined', () => {
      const result = hello('test');
      expect(result).toBeUndefined();
    });
  });
});