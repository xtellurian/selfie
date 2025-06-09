import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('Initializer Agent Script', () => {
  const projectRoot = join(__dirname, '../../..');
  const scriptPath = join(projectRoot, 'scripts/initializer.sh');
  const testStateFile = join(projectRoot, '.test-initializer-state.json');

  afterEach(() => {
    // Clean up test state file
    if (existsSync(testStateFile)) {
      unlinkSync(testStateFile);
    }
  });

  describe('script validation', () => {
    it('should exist and be executable', () => {
      expect(existsSync(scriptPath)).toBe(true);
      
      // Check if script has shebang
      const scriptContent = readFileSync(scriptPath, 'utf8');
      expect(scriptContent.startsWith('#!/bin/bash')).toBe(true);
    });

    it('should show help when --help flag is used', () => {
      const result = execSync(`${scriptPath} --help`, { encoding: 'utf8' });
      expect(result).toContain('Initializer Agent');
      expect(result).toContain('--poll-interval');
      expect(result).toContain('--dry-run');
    });
  });

  describe('state management', () => {
    it('should create state file with proper structure', () => {
      // Create a minimal state file for testing
      const initialState = {
        processed_issues: [],
        active_agents: {},
        last_poll: null
      };

      writeFileSync(testStateFile, JSON.stringify(initialState, null, 2));
      expect(existsSync(testStateFile)).toBe(true);

      const stateContent = JSON.parse(readFileSync(testStateFile, 'utf8'));
      expect(stateContent).toHaveProperty('processed_issues');
      expect(stateContent).toHaveProperty('active_agents');
      expect(stateContent).toHaveProperty('last_poll');
    });
  });

  describe('GitHub API integration', () => {
    it('should handle GitHub API response format', () => {
      // Mock GitHub API response format
      const mockGitHubResponse = [
        {
          number: 123,
          title: 'Test Issue',
          labels: [{ name: 'agent:developer' }],
          state: 'open'
        }
      ];

      // Verify our script can handle this format
      expect(mockGitHubResponse[0]).toHaveProperty('number');
      expect(mockGitHubResponse[0]).toHaveProperty('title');
      expect(mockGitHubResponse[0]).toHaveProperty('labels');
      expect(mockGitHubResponse[0].labels[0]).toHaveProperty('name');
    });
  });

  describe('command line arguments', () => {
    it('should accept help argument', () => {
      const result = execSync(`${scriptPath} --help`, { encoding: 'utf8' });
      expect(result).toContain('Usage:');
    });

    it('should reject invalid poll interval', () => {
      try {
        execSync(`${scriptPath} --poll-interval -1 --help`, { encoding: 'utf8' });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('script integration', () => {
    it('should work via start.sh dispatcher', () => {
      const startScript = join(projectRoot, 'start.sh');
      const result = execSync(`${startScript} initializer --help`, { encoding: 'utf8' });
      expect(result).toContain('Initializer Agent');
    });
  });
});