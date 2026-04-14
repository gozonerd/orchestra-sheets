import { describe, it, expect } from 'vitest';
import { computeDiff, formatDiffAsHtml, formatDiffAsText } from '../../src/lib/server/prompts/diff';

describe('Diff Computation', () => {
	describe('computeDiff', () => {
		it('should return empty diff for identical texts', () => {
			const text = 'Hello world';
			const result = computeDiff(text, text);

			expect(result.additions).toBe(0);
			expect(result.deletions).toBe(0);
			expect(result.diffs).toHaveLength(1);
			expect(result.diffs[0][0]).toBe(0); // Equal
		});

		it('should detect single character insertion', () => {
			const result = computeDiff('Hello', 'Hello!');

			expect(result.additions).toBe(1);
			expect(result.deletions).toBe(0);
			expect(result.diffs.some(([type]) => type === 1)).toBe(true); // Has insertion
		});

		it('should detect single character deletion', () => {
			const result = computeDiff('Hello!', 'Hello');

			expect(result.deletions).toBe(1);
			expect(result.additions).toBe(0);
			expect(result.diffs.some(([type]) => type === -1)).toBe(true); // Has deletion
		});

		it('should detect word replacement', () => {
			const result = computeDiff('Hello world', 'Hello universe');

			expect(result.diffs.some(([type]) => type === -1)).toBe(true); // Deletion
			expect(result.diffs.some(([type]) => type === 1)).toBe(true); // Insertion
		});

		it('should handle empty source text', () => {
			const result = computeDiff('', 'Hello');

			expect(result.additions).toBe(5);
			expect(result.deletions).toBe(0);
		});

		it('should handle empty target text', () => {
			const result = computeDiff('Hello', '');

			expect(result.deletions).toBe(5);
			expect(result.additions).toBe(0);
		});

		it('should count multi-line additions', () => {
			const old = 'Line 1\nLine 2';
			const new_text = 'Line 1\nLine 2\nLine 3';

			const result = computeDiff(old, new_text);

			expect(result.additions).toBeGreaterThan(0);
		});

		it('should handle special characters', () => {
			const result = computeDiff('Hello {{name}}', 'Hello {{greeting}}');

			expect(result.diffs.some(([type]) => type !== 0)).toBe(true);
		});

		it('should track both additions and deletions in replacement', () => {
			const result = computeDiff('The quick brown fox', 'A fast red fox');

			expect(result.additions).toBeGreaterThan(0);
			expect(result.deletions).toBeGreaterThan(0);
		});
	});

	describe('formatDiffAsHtml', () => {
		it('should wrap additions in <ins> tags', () => {
			const result = computeDiff('Hello', 'Hello!');
			const html = formatDiffAsHtml(result);

			expect(html).toContain('<ins class="diff-addition">');
			expect(html).toContain('</ins>');
		});

		it('should wrap deletions in <del> tags', () => {
			const result = computeDiff('Hello!', 'Hello');
			const html = formatDiffAsHtml(result);

			expect(html).toContain('<del class="diff-deletion">');
			expect(html).toContain('</del>');
		});

		it('should escape HTML special characters', () => {
			const result = computeDiff('Hello', 'Hello <world>');
			const html = formatDiffAsHtml(result);

			expect(html).not.toContain('<world>');
			expect(html).toContain('&lt;world&gt;');
		});

		it('should escape ampersands', () => {
			const result = computeDiff('A & B', 'A && B');
			const html = formatDiffAsHtml(result);

			expect(html).toContain('&amp;');
		});

		it('should preserve unchanged text without tags', () => {
			const result = computeDiff('Hello world', 'Hello world!');
			const html = formatDiffAsHtml(result);

			// "Hello world" should appear without tags
			expect(html).toContain('Hello world');
		});
	});

	describe('formatDiffAsText', () => {
		it('should prefix additions with +', () => {
			const result = computeDiff('Hello', 'Hello!');
			const text = formatDiffAsText(result);

			expect(text).toContain('+ ');
		});

		it('should prefix deletions with -', () => {
			const result = computeDiff('Hello!', 'Hello');
			const text = formatDiffAsText(result);

			expect(text).toContain('- ');
		});

		it('should prefix unchanged lines with spaces', () => {
			const result = computeDiff('Hello world', 'Hello world!');
			const text = formatDiffAsText(result);

			expect(text).toContain('  '); // Two spaces for context
		});

		it('should handle complex changes', () => {
			const result = computeDiff('The quick brown fox', 'A fast red fox');
			const text = formatDiffAsText(result);

			expect(text).toContain('+ ');
			expect(text).toContain('- ');
		});
	});
});
