/**
 * Variable Parsing for Prompt Templates
 *
 * Supports {{variable}} syntax with optional default values
 * Examples:
 *   {{name}}
 *   {{count|5}}
 *   {{prompt|Please enter text}}
 */

export interface Variable {
	name: string;
	defaultValue?: string;
	position: number;
	raw: string;
}

/**
 * Parse variables from prompt text
 * Finds all {{variable}} and {{variable|default}} patterns
 */
export function parseVariables(text: string): Variable[] {
	const variableRegex = /\{\{(\w+)(?:\|([^}]*))?\}\}/g;
	const variables: Variable[] = [];
	let match;

	while ((match = variableRegex.exec(text)) !== null) {
		variables.push({
			name: match[1],
			defaultValue: match[2],
			position: match.index,
			raw: match[0]
		});
	}

	return variables;
}

/**
 * Extract unique variable names (for form generation)
 */
export function getUniqueVariableNames(text: string): string[] {
	const variables = parseVariables(text);
	return [...new Set(variables.map((v) => v.name))];
}

/**
 * Validate variable name (alphanumeric + underscore)
 */
export function isValidVariableName(name: string): boolean {
	return /^\w+$/.test(name);
}

/**
 * Replace variables in prompt with provided values
 * Uses default value if variable not in values map
 */
export function substituteVariables(text: string, values: Record<string, string>): string {
	return text.replace(/\{\{(\w+)(?:\|([^}]*))?\}\}/g, (match, name, defaultValue) => {
		return values[name] ?? defaultValue ?? match;
	});
}

/**
 * Check if prompt has all required variables satisfied
 */
export function areVariablesSatisfied(text: string, values: Record<string, string>): boolean {
	const variables = parseVariables(text);

	for (const variable of variables) {
		// Variable is satisfied if:
		// 1. It has a value in the map, OR
		// 2. It has a default value
		if (!values[variable.name] && !variable.defaultValue) {
			return false;
		}
	}

	return true;
}

/**
 * Get all unsatisfied variables (missing values and no defaults)
 */
export function getUnsatisfiedVariables(text: string, values: Record<string, string>): string[] {
	const variables = parseVariables(text);
	const unsatisfied = new Set<string>();

	for (const variable of variables) {
		if (!values[variable.name] && !variable.defaultValue) {
			unsatisfied.add(variable.name);
		}
	}

	return Array.from(unsatisfied);
}

/**
 * Highlight variables in text (for UI display)
 * Returns text with HTML markup for highlighting
 */
export function highlightVariables(text: string): string {
	return text.replace(/\{\{(\w+)(?:\|([^}]*))?\}\}/g, (match) => {
		return `<span class="variable">${match}</span>`;
	});
}

/**
 * Count variable occurrences
 */
export function countVariables(text: string): number {
	const variableRegex = /\{\{(\w+)(?:\|([^}]*))?\}\}/g;
	return (text.match(variableRegex) || []).length;
}

/**
 * Validate prompt template structure
 */
export function validatePrompt(text: string): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Check for unclosed braces
	const openBraces = (text.match(/\{\{/g) || []).length;
	const closeBraces = (text.match(/\}\}/g) || []).length;

	if (openBraces !== closeBraces) {
		errors.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`);
	}

	// Check for invalid variable names
	const variables = parseVariables(text);
	for (const variable of variables) {
		if (!isValidVariableName(variable.name)) {
			errors.push(`Invalid variable name: ${variable.name} (alphanumeric and _ only)`);
		}
	}

	// Check for empty variables
	if (text.includes('{{}}')) {
		errors.push('Empty variable found: {{}}');
	}

	return {
		valid: errors.length === 0,
		errors
	};
}
