export interface Folder {
	id: number;
	name: string;
	userId: string;
	parentId: number | null;
	createdAt: Date;
	updatedAt: Date;
	children?: Folder[];
}

export interface Tag {
	id: number;
	name: string;
	color: string;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Prompt {
	id: number;
	name: string;
	description: string;
	content: string;
	folderId: number | null;
	userId: string;
	status: 'draft' | 'active' | 'archived';
	createdAt: Date;
	updatedAt: Date;
	version: number;
}

export interface PromptVersion {
	id: number;
	promptId: number;
	versionNumber: number;
	content: string;
	createdAt: Date;
	createdBy: string;
}

export interface SearchResult {
	id: number;
	name: string;
	description: string;
	contentPreview: string;
	folderId: number | null;
	createdAt: Date;
}

export interface ApiKeyInfo {
	id: string;
	name: string;
	lastFourCharacters: string;
	provider: string;
	createdAt: Date;
}
