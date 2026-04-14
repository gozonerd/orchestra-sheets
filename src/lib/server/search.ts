export interface SearchQuery {
	q?: string;
	folderId?: number;
	tagIds?: number[];
}

export interface SearchResult {
	id: number;
	name: string;
	description: string;
	contentPreview: string;
	folderId: number | null;
	createdAt: Date;
}

/**
 * Search prompts with optional filters
 * Supports full-text search in name and description
 */
export function buildSearchFilter(query: SearchQuery) {
	const filters: string[] = [];
	const params: any[] = [];

	// Text search
	if (query.q && query.q.trim().length > 0) {
		const searchTerm = `%${query.q.trim()}%`;
		filters.push('(name ILIKE $1 OR description ILIKE $1)');
		params.push(searchTerm);
	}

	// Folder filter
	if (query.folderId !== undefined && query.folderId !== null) {
		const paramIndex = params.length + 1;
		filters.push(`folderId = $${paramIndex}`);
		params.push(query.folderId);
	}

	// Tag filter (requires JOIN with pivot table)
	// This is handled separately in the API route

	return {
		whereClause: filters.length > 0 ? filters.join(' AND ') : '1=1',
		params
	};
}

/**
 * Highlight search term in text
 * Wraps matches with <mark> tags
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
	if (!searchTerm || searchTerm.trim().length === 0) {
		return text;
	}

	const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
	return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Escape regex special characters
 */
export function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate content preview (first 100 chars)
 */
export function generatePreview(content: string, maxLength: number = 100): string {
	return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
}
