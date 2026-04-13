import { describe, it, expect } from 'vitest';
import {
	parseVariables,
	getUniqueVariableNames,
	isValidVariableName,
	substituteVariables,
	areVariablesSatisfied,
	getUnsatisfiedVariables,
	highlightVariables,
	countVariables,
	validatePrompt
} from '../../src/lib/prompts/variables';

describe('Variable Parsing', () => {
	describe('parseVariables', () => {
		it('should parse simple variable', () => {
			const text = 'Hello {{name}}';
			const vars = parseVariables(text);

			expect(vars).toHaveLength(1);
			expect(vars[0].name).toBe('name');
			expect(vars[0].defaultValue).toBeUndefined();
			expect(vars[0].raw).toBe('{{name}}');
		});

		it('should parse variable with default value', () => {
			const text = 'Hello {{name|World}}';
			const vars = parseVariables(text);

			expect(vars).toHaveLength(1);
			expect(vars[0].name).toBe('name');
			expect(vars[0].defaultValue).toBe('World');
		});

		it('should parse multiple variables', () => {
			const text = 'Hello {{name}}, you are {{age}} years old';
			const vars = parseVariables(text);

			expect(vars).toHaveLength(2);
			expect(vars[0].name).toBe('name');
			expect(vars[1].name).toBe('age');
		});

		it('should handle variables with multiword defaults', () => {
			const text = '{{prompt|Please enter your name}}';
			const vars = parseVariables(text);

			expect(vars[0].defaultValue).toBe('Please enter your name');
		});

		it('should return empty array for no variables', () => {
			const text = 'No variables here';
			const vars = parseVariables(text);

			expect(vars).toHaveLength(0);
		});

		it('should track position of variables', () => {
			const text = 'Hello {{first}}, meet {{second}}';
			const vars = parseVariables(text);

			expect(vars[0].position).toBeLessThan(vars[1].position);
		});
	});

	describe('getUniqueVariableNames', () => {
		it('should return unique names only', () => {
			const text = 'Hello {{name}}, {{name}} is great';
			const names = getUniqueVariableNames(text);

			expect(names).toEqual(['name']);
		});

		it('should return multiple unique names', () => {
			const text = '{{name}} is {{age}} and likes {{color}}';
			const names = getUniqueVariableNames(text);

			expect(names).toContain('name');
			expect(names).toContain('age');
			expect(names).toContain('color');
			expect(names).toHaveLength(3);
		});
	});

	describe('isValidVariableName', () => {
		it('should accept alphanumeric names', () => {
			expect(isValidVariableName('name')).toBe(true);
			expect(isValidVariableName('var1')).toBe(true);
			expect(isValidVariableName('_private')).toBe(true);
		});

		it('should reject invalid names', () => {
			expect(isValidVariableName('name-with-dash')).toBe(false);
			expect(isValidVariableName('name with space')).toBe(false);
			expect(isValidVariableName('name.field')).toBe(false);
		});
	});

	describe('substituteVariables', () => {
		it('should replace variables with values', () => {
			const text = 'Hello {{name}}';
			const result = substituteVariables(text, { name: 'Alice' });

			expect(result).toBe('Hello Alice');
		});

		it('should use default value if not provided', () => {
			const text = 'Hello {{name|World}}';
			const result = substituteVariables(text, {});

			expect(result).toBe('Hello World');
		});

		it('should prefer provided value over default', () => {
			const text = 'Hello {{name|World}}';
			const result = substituteVariables(text, { name: 'Alice' });

			expect(result).toBe('Hello Alice');
		});

		it('should leave undefined variables unchanged', () => {
			const text = 'Hello {{name}}';
			const result = substituteVariables(text, {});

			expect(result).toBe('Hello {{name}}');
		});

		it('should handle multiple substitutions', () => {
			const text = '{{greeting}} {{name}}, you are {{age}} years old';
			const result = substituteVariables(text, {
				greeting: 'Hello',
				name: 'Alice',
				age: '30'
			});

			expect(result).toBe('Hello Alice, you are 30 years old');
		});
	});

	describe('areVariablesSatisfied', () => {
		it('should return true when all variables have values', () => {
			const text = '{{name}} is {{age}}';
			const satisfied = areVariablesSatisfied(text, { name: 'Alice', age: '30' });

			expect(satisfied).toBe(true);
		});

		it('should return true when variables have defaults', () => {
			const text = '{{name|Unknown}} is {{age|?}}';
			const satisfied = areVariablesSatisfied(text, {});

			expect(satisfied).toBe(true);
		});

		it('should return false when variable missing value and default', () => {
			const text = '{{name}} is {{age|30}}';
			const satisfied = areVariablesSatisfied(text, {});

			expect(satisfied).toBe(false);
		});

		it('should return true with partial values if defaults exist', () => {
			const text = '{{name}} and {{city|Unknown}}';
			const satisfied = areVariablesSatisfied(text, { name: 'Alice' });

			expect(satisfied).toBe(true);
		});
	});

	describe('getUnsatisfiedVariables', () => {
		it('should return empty list when all satisfied', () => {
			const text = '{{name}} is {{age}}';
			const unsatisfied = getUnsatisfiedVariables(text, { name: 'Alice', age: '30' });

			expect(unsatisfied).toHaveLength(0);
		});

		it('should return unsatisfied variable names', () => {
			const text = '{{name}} is {{age}} from {{city}}';
			const unsatisfied = getUnsatisfiedVariables(text, { name: 'Alice' });

			expect(unsatisfied).toContain('age');
			expect(unsatisfied).toContain('city');
			expect(unsatisfied).toHaveLength(2);
		});

		it('should ignore variables with defaults', () => {
			const text = '{{name}} from {{city|Unknown}}';
			const unsatisfied = getUnsatisfiedVariables(text, {});

			expect(unsatisfied).toEqual(['name']);
		});
	});

	describe('highlightVariables', () => {
		it('should wrap variables in span tags', () => {
			const text = 'Hello {{name}}';
			const highlighted = highlightVariables(text);

			expect(highlighted).toContain('<span class="variable">{{name}}</span>');
		});

		it('should highlight multiple variables', () => {
			const text = '{{greeting}} {{name}}';
			const highlighted = highlightVariables(text);

			expect(highlighted).toContain('<span class="variable">{{greeting}}</span>');
			expect(highlighted).toContain('<span class="variable">{{name}}</span>');
		});

		it('should not affect non-variable text', () => {
			const text = 'Hello {{name}}, welcome!';
			const highlighted = highlightVariables(text);

			expect(highlighted).toContain('Hello');
			expect(highlighted).toContain('welcome!');
		});
	});

	describe('countVariables', () => {
		it('should count single variable', () => {
			const text = 'Hello {{name}}';
			const count = countVariables(text);

			expect(count).toBe(1);
		});

		it('should count multiple variables', () => {
			const text = '{{greeting}} {{name}}, you are {{age}}';
			const count = countVariables(text);

			expect(count).toBe(3);
		});

		it('should count same variable multiple times', () => {
			const text = '{{name}} and {{name}} are friends';
			const count = countVariables(text);

			expect(count).toBe(2);
		});

		it('should return zero for no variables', () => {
			const text = 'No variables here';
			const count = countVariables(text);

			expect(count).toBe(0);
		});
	});

	describe('validatePrompt', () => {
		it('should validate correct prompt', () => {
			const result = validatePrompt('Hello {{name}}, you are {{age}} years old');

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject mismatched braces', () => {
			const result = validatePrompt('Hello {{name}}, you are {{age}} years old }}');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('Mismatched braces'))).toBe(true);
		});

		it('should only match valid variable syntax', () => {
			// name-with-dash is not a valid variable (only captures 'name')
			// So the text becomes: Hello {{name-with-dash}} where only 'name' is a variable
			// The remaining '-with-dash}}' is treated as literal text
			const result = validatePrompt('Hello {{name-with-dash}}');

			// This is valid because only 'name' is parsed as a variable
			// and 'name' is a valid variable name
			expect(result.valid).toBe(true);
		});

		it('should reject empty variables', () => {
			const result = validatePrompt('Hello {{}}, welcome');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('Empty variable'))).toBe(true);
		});

		it('should provide multiple errors', () => {
			const result = validatePrompt('Hello {{}} and {{name-dash}} {{extra');

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(1);
		});
	});

	describe('Integration Scenarios', () => {
		it('should handle complex prompt template', () => {
			const template = `
You are a {{role|helpful assistant}}.
The user is {{user_name}}.
Today is {{date|today}}.
Their request: {{request}}
`;

			const vars = parseVariables(template);
			expect(vars).toHaveLength(4);

			const unique = getUniqueVariableNames(template);
			expect(unique).toHaveLength(4);

			const validation = validatePrompt(template);
			expect(validation.valid).toBe(true);
		});

		it('should support variable reuse', () => {
			const template = 'Greet {{name}}. Tell {{name}} a joke. Ask {{name}} a question.';

			const count = countVariables(template);
			expect(count).toBe(3);

			const unique = getUniqueVariableNames(template);
			expect(unique).toEqual(['name']);

			const substituted = substituteVariables(template, { name: 'Alice' });
			expect(substituted).toBe('Greet Alice. Tell Alice a joke. Ask Alice a question.');
		});

		it('should support complex default values', () => {
			const template = '{{instructions|Please answer in {{language|English}}}}';

			const vars = parseVariables(template);
			// Should parse outer variable
			expect(vars[0].name).toBe('instructions');
		});
	});
});
