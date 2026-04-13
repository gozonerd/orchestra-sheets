import {
	pgTable,
	pgEnum,
	serial,
	text,
	timestamp,
	varchar,
	jsonb,
	boolean,
	decimal,
	index,
	uniqueIndex
} from 'drizzle-orm/pg-core';

// Enums
export const promptStatusEnum = pgEnum('prompt_status', ['draft', 'active', 'archived']);
export const testStatusEnum = pgEnum('test_status', ['pending', 'running', 'completed', 'failed']);

// Users table
export const users = pgTable('users', {
	id: varchar('id', { length: 255 }).primaryKey(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	name: varchar('name', { length: 255 }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// API Keys table (encrypted storage)
export const apiKeys = pgTable(
	'api_keys',
	{
		id: serial('id').primaryKey(),
		userId: varchar('user_id', { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		provider: varchar('provider', { length: 50 }).notNull(),
		encryptedKey: text('encrypted_key').notNull(),
		dekHash: varchar('dek_hash', { length: 255 }),
		label: varchar('label', { length: 255 }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		lastUsedAt: timestamp('last_used_at'),
		isActive: boolean('is_active').default(true)
	},
	(table) => ({
		userIdIdx: index('api_keys_user_id_idx').on(table.userId),
		userProviderUnique: uniqueIndex('api_keys_user_provider_unique').on(
			table.userId,
			table.provider
		)
	})
);

// Folders table
export const folders = pgTable(
	'folders',
	{
		id: serial('id').primaryKey(),
		userId: varchar('user_id', { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		parentId: serial('parent_id').references((): any => folders.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 255 }).notNull(),
		description: text('description'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		userIdIdx: index('folders_user_id_idx').on(table.userId)
	})
);

// Tags table
export const tags = pgTable(
	'tags',
	{
		id: serial('id').primaryKey(),
		userId: varchar('user_id', { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 100 }).notNull(),
		color: varchar('color', { length: 7 }),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => ({
		userIdIdx: index('tags_user_id_idx').on(table.userId),
		userNameUnique: uniqueIndex('tags_user_name_unique').on(table.userId, table.name)
	})
);

// Prompts table
export const prompts = pgTable(
	'prompts',
	{
		id: serial('id').primaryKey(),
		userId: varchar('user_id', { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		folderId: serial('folder_id').references(() => folders.id, { onDelete: 'set null' }),
		name: varchar('name', { length: 255 }).notNull(),
		description: text('description'),
		content: text('content').notNull(),
		status: promptStatusEnum('status').default('draft'),
		variables: jsonb('variables'),
		tags: serial('tags').array(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		userIdIdx: index('prompts_user_id_idx').on(table.userId),
		folderIdIdx: index('prompts_folder_id_idx').on(table.folderId)
	})
);

// Prompt Versions table
export const promptVersions = pgTable(
	'prompt_versions',
	{
		id: serial('id').primaryKey(),
		promptId: serial('prompt_id')
			.notNull()
			.references(() => prompts.id, { onDelete: 'cascade' }),
		versionNumber: serial('version_number'),
		content: text('content').notNull(),
		variables: jsonb('variables'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		createdBy: varchar('created_by', { length: 255 }).references(() => users.id)
	},
	(table) => ({
		promptIdIdx: index('prompt_versions_prompt_id_idx').on(table.promptId)
	})
);

// Test Runs table
export const testRuns = pgTable(
	'test_runs',
	{
		id: serial('id').primaryKey(),
		userId: varchar('user_id', { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		promptId: serial('prompt_id')
			.notNull()
			.references(() => prompts.id, { onDelete: 'cascade' }),
		status: testStatusEnum('status').default('pending'),
		models: jsonb('models').notNull(),
		testInputs: jsonb('test_inputs'),
		results: jsonb('results'),
		totalCost: decimal('total_cost', { precision: 10, scale: 6 }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		completedAt: timestamp('completed_at')
	},
	(table) => ({
		userIdIdx: index('test_runs_user_id_idx').on(table.userId),
		promptIdIdx: index('test_runs_prompt_id_idx').on(table.promptId)
	})
);

// Audit Log table
export const auditLogs = pgTable(
	'audit_logs',
	{
		id: serial('id').primaryKey(),
		userId: varchar('user_id', { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		action: varchar('action', { length: 100 }).notNull(),
		resourceType: varchar('resource_type', { length: 100 }),
		resourceId: varchar('resource_id', { length: 255 }),
		details: jsonb('details'),
		ipAddress: varchar('ip_address', { length: 45 }),
		userAgent: text('user_agent'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => ({
		userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
		createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt)
	})
);

// Session table (for Auth.js)
export const sessions = pgTable('session', {
	sessionToken: varchar('sessionToken', { length: 255 }).primaryKey(),
	userId: varchar('userId', { length: 255 })
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expires: timestamp('expires').notNull()
});

// Verification tokens table (for Auth.js)
export const verificationTokens = pgTable(
	'verificationToken',
	{
		identifier: varchar('identifier', { length: 255 }).notNull(),
		token: varchar('token', { length: 255 }).notNull(),
		expires: timestamp('expires').notNull()
	},
	(table) => ({
		identifierTokenUnique: uniqueIndex('verificationToken_identifier_token_unique').on(
			table.identifier,
			table.token
		)
	})
);
