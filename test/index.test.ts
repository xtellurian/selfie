import { describe, it, expect } from '@jest/globals';
import { helloWorld, getVersion, getSystemInfo } from '../src/index.js';

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
});