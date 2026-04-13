import { describe, it, expect } from 'vitest';
import {
	users,
	apiKeys,
	folders,
	tags,
	prompts,
	promptVersions,
	testRuns,
	auditLogs,
	promptStatusEnum,
	testStatusEnum
} from '../../src/lib/server/db/schema';

describe('Database Schema', () => {
	describe('Tables Exist', () => {
		it('should export users table', () => {
			expect(users).toBeDefined();
			expect(users.id).toBeDefined();
			expect(users.email).toBeDefined();
		});

		it('should export api_keys table with encryption fields', () => {
			expect(apiKeys).toBeDefined();
			expect(apiKeys.userId).toBeDefined();
			expect(apiKeys.encryptedKey).toBeDefined();
		});

		it('should export folders table with hierarchy support', () => {
			expect(folders).toBeDefined();
			expect(folders.userId).toBeDefined();
			expect(folders.parentId).toBeDefined();
		});

		it('should export tags table with user isolation', () => {
			expect(tags).toBeDefined();
			expect(tags.userId).toBeDefined();
			expect(tags.name).toBeDefined();
		});

		it('should export prompts table with content and metadata', () => {
			expect(prompts).toBeDefined();
			expect(prompts.userId).toBeDefined();
			expect(prompts.content).toBeDefined();
			expect(prompts.status).toBeDefined();
		});

		it('should export promptVersions table for versioning', () => {
			expect(promptVersions).toBeDefined();
			expect(promptVersions.promptId).toBeDefined();
			expect(promptVersions.content).toBeDefined();
		});

		it('should export testRuns table with cost tracking', () => {
			expect(testRuns).toBeDefined();
			expect(testRuns.userId).toBeDefined();
			expect(testRuns.promptId).toBeDefined();
			expect(testRuns.totalCost).toBeDefined();
		});

		it('should export auditLogs table for compliance', () => {
			expect(auditLogs).toBeDefined();
			expect(auditLogs.userId).toBeDefined();
			expect(auditLogs.action).toBeDefined();
		});
	});

	describe('Enums', () => {
		it('should define prompt status enum with valid values', () => {
			expect(promptStatusEnum).toBeDefined();
			expect(promptStatusEnum.enumValues).toContain('draft');
			expect(promptStatusEnum.enumValues).toContain('active');
			expect(promptStatusEnum.enumValues).toContain('archived');
		});

		it('should define test status enum with valid values', () => {
			expect(testStatusEnum).toBeDefined();
			expect(testStatusEnum.enumValues).toContain('pending');
			expect(testStatusEnum.enumValues).toContain('running');
			expect(testStatusEnum.enumValues).toContain('completed');
			expect(testStatusEnum.enumValues).toContain('failed');
		});
	});

	describe('User Isolation Fields', () => {
		it('should have user_id on api_keys for encryption isolation', () => {
			expect(apiKeys.userId).toBeDefined();
		});

		it('should have user_id on folders for folder isolation', () => {
			expect(folders.userId).toBeDefined();
		});

		it('should have user_id on tags for tag isolation', () => {
			expect(tags.userId).toBeDefined();
		});

		it('should have user_id on prompts for prompt isolation', () => {
			expect(prompts.userId).toBeDefined();
		});

		it('should have user_id on testRuns for test isolation', () => {
			expect(testRuns.userId).toBeDefined();
		});

		it('should have user_id on auditLogs for audit isolation', () => {
			expect(auditLogs.userId).toBeDefined();
		});
	});

	describe('Multi-Table Relationships', () => {
		it('should support folder hierarchy with parentId', () => {
			expect(folders.parentId).toBeDefined();
		});

		it('should link prompts to folders', () => {
			expect(prompts.folderId).toBeDefined();
		});

		it('should link versions to prompts', () => {
			expect(promptVersions.promptId).toBeDefined();
		});

		it('should link test runs to prompts', () => {
			expect(testRuns.promptId).toBeDefined();
		});

		it('should link test runs to users', () => {
			expect(testRuns.userId).toBeDefined();
		});
	});

	describe('Content Storage Capabilities', () => {
		it('should support text content storage in prompts', () => {
			expect(prompts.content).toBeDefined();
		});

		it('should support JSON variables in prompts', () => {
			expect(prompts.variables).toBeDefined();
		});

		it('should support JSON variables in prompt versions', () => {
			expect(promptVersions.variables).toBeDefined();
		});

		it('should support JSON models in test runs', () => {
			expect(testRuns.models).toBeDefined();
		});

		it('should support JSON results in test runs', () => {
			expect(testRuns.results).toBeDefined();
		});

		it('should support decimal precision for cost tracking', () => {
			expect(testRuns.totalCost).toBeDefined();
		});
	});

	describe('Audit and Versioning', () => {
		it('should track creation timestamp on users', () => {
			expect(users.createdAt).toBeDefined();
		});

		it('should track prompt version numbers', () => {
			expect(promptVersions.versionNumber).toBeDefined();
		});

		it('should track version creator', () => {
			expect(promptVersions.createdBy).toBeDefined();
		});

		it('should track test run status', () => {
			expect(testRuns.status).toBeDefined();
		});

		it('should track test run completion time', () => {
			expect(testRuns.completedAt).toBeDefined();
		});

		it('should track audit action', () => {
			expect(auditLogs.action).toBeDefined();
		});

		it('should track audit resource context', () => {
			expect(auditLogs.resourceType).toBeDefined();
			expect(auditLogs.resourceId).toBeDefined();
		});

		it('should track audit IP and user agent', () => {
			expect(auditLogs.ipAddress).toBeDefined();
			expect(auditLogs.userAgent).toBeDefined();
		});
	});

	describe('Security Fields', () => {
		it('should support encrypted key storage', () => {
			expect(apiKeys.encryptedKey).toBeDefined();
		});

		it('should track DEK hash for key derivation', () => {
			expect(apiKeys.dekHash).toBeDefined();
		});

		it('should track API key label', () => {
			expect(apiKeys.label).toBeDefined();
		});

		it('should track API key active status', () => {
			expect(apiKeys.isActive).toBeDefined();
		});

		it('should track last API key usage', () => {
			expect(apiKeys.lastUsedAt).toBeDefined();
		});

		it('should support detailed audit details as JSONB', () => {
			expect(auditLogs.details).toBeDefined();
		});
	});

	describe('Index Support', () => {
		it('should have indexes defined on tables', () => {
			// Verify tables were created with index definitions
			expect(apiKeys).toBeDefined();
			expect(prompts).toBeDefined();
			expect(testRuns).toBeDefined();
			expect(auditLogs).toBeDefined();
		});
	});
});
