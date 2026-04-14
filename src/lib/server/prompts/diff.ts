import { diff_match_patch } from 'diff-match-patch';

const dmp = new diff_match_patch();

export interface DiffResult {
	diffs: Array<[number, string]>;
	additions: number;
	deletions: number;
}

/**
 * Compute character-level diff between two texts
 * Returns array of [type, text] where type is 0 (equal), 1 (insert), -1 (delete)
 */
export function computeDiff(oldText: string, newText: string): DiffResult {
	const diffs = dmp.diff_main(oldText, newText);
	dmp.diff_cleanupSemantic(diffs);

	let additions = 0;
	let deletions = 0;

	for (const [type, text] of diffs) {
		if (type === 1) {
			additions += text.length;
		} else if (type === -1) {
			deletions += text.length;
		}
	}

	return {
		diffs,
		additions,
		deletions
	};
}

/**
 * Format diff as HTML for display
 * Returns HTML string with <ins> and <del> tags
 */
export function formatDiffAsHtml(diff: DiffResult): string {
	return diff.diffs
		.map(([type, text]) => {
			const escaped = escapeHtml(text);
			if (type === 1) {
				return `<ins class="diff-addition">${escaped}</ins>`;
			} else if (type === -1) {
				return `<del class="diff-deletion">${escaped}</del>`;
			}
			return escaped;
		})
		.join('');
}

/**
 * Format diff as unified text for display
 * Shows additions prefixed with + and deletions with -
 */
export function formatDiffAsText(diff: DiffResult): string {
	const lines: string[] = [];

	for (const [type, text] of diff.diffs) {
		if (type === 1) {
			lines.push(`+ ${text}`);
		} else if (type === -1) {
			lines.push(`- ${text}`);
		} else {
			lines.push(`  ${text}`);
		}
	}

	return lines.join('\n');
}

function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return text.replace(/[&<>"']/g, (char) => map[char]);
}
