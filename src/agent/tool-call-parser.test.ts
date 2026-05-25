import { describe, expect, it } from "vitest";
import {
	extractToolCallsFromMarkdown,
	removeJsonBlocks,
	toInternalToolCalls,
} from "./tool-call-parser.js";
import type { ParsedFallbackToolCall } from "./tool-call-parser.js";

describe("extractToolCallsFromMarkdown", () => {
	it("returns empty array for text with no json blocks", () => {
		const result = extractToolCallsFromMarkdown(
			"Just some plain text without code blocks.",
		);
		expect(result).toEqual([]);
	});

	it('extracts a single tool call with "tool" key', () => {
		const text =
			'```json\n{"tool": "read_file", "arguments": {"path": "/foo"}}\n```';
		const result = extractToolCallsFromMarkdown(text);
		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe("read_file");
	});

	it('extracts a single tool call with "name" key', () => {
		const text =
			'```json\n{"name": "write_file", "arguments": {"path": "/bar", "content": "hello"}}\n```';
		const result = extractToolCallsFromMarkdown(text);
		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe("write_file");
	});

	it("extracts arguments as JSON string", () => {
		const text =
			'```json\n{"tool": "my_tool", "arguments": {"key": "value"}}\n```';
		const result = extractToolCallsFromMarkdown(text);
		expect(result[0]?.argsJson).toBe('{"key":"value"}');
	});

	it('handles "parameters" key as alternative to "arguments"', () => {
		const text = '```json\n{"name": "my_tool", "parameters": {"x": 42}}\n```';
		const result = extractToolCallsFromMarkdown(text);
		expect(result[0]?.argsJson).toBe('{"x":42}');
	});

	it("extracts multiple tool calls from an array", () => {
		const text = `\`\`\`json
[{"tool": "tool_a", "arguments": {}}, {"tool": "tool_b", "arguments": {}}]
\`\`\``;
		const result = extractToolCallsFromMarkdown(text);
		expect(result).toHaveLength(2);
		expect(result[0]?.name).toBe("tool_a");
		expect(result[1]?.name).toBe("tool_b");
	});

	it("extracts multiple blocks from text", () => {
		const text = `First block:
\`\`\`json
{"tool": "tool_one", "arguments": {}}
\`\`\`
Second block:
\`\`\`json
{"tool": "tool_two", "arguments": {}}
\`\`\``;
		const result = extractToolCallsFromMarkdown(text);
		expect(result).toHaveLength(2);
	});

	it("ignores invalid JSON blocks silently", () => {
		const text = "```json\n{invalid json}\n```";
		const result = extractToolCallsFromMarkdown(text);
		expect(result).toEqual([]);
	});

	it("ignores blocks without tool or name key", () => {
		const text = '```json\n{"key": "value"}\n```';
		const result = extractToolCallsFromMarkdown(text);
		expect(result).toEqual([]);
	});

	it("uses empty object when arguments are missing", () => {
		const text = '```json\n{"tool": "no_args_tool"}\n```';
		const result = extractToolCallsFromMarkdown(text);
		expect(result[0]?.argsJson).toBe("{}");
	});
});

describe("toInternalToolCalls", () => {
	it("returns empty array for empty input", () => {
		expect(toInternalToolCalls([])).toEqual([]);
	});

	it("converts a single ParsedFallbackToolCall to ToolCall format", () => {
		const parsed: ParsedFallbackToolCall[] = [
			{ name: "my_tool", argsJson: '{"x":1}' },
		];
		const result = toInternalToolCalls(parsed);
		expect(result).toHaveLength(1);
		expect(result[0]?.type).toBe("function");
		expect(result[0]?.function.name).toBe("my_tool");
		expect(result[0]?.function.arguments).toBe('{"x":1}');
	});

	it("generates unique id for each tool call", () => {
		const parsed: ParsedFallbackToolCall[] = [
			{ name: "tool_a", argsJson: "{}" },
			{ name: "tool_b", argsJson: "{}" },
		];
		const result = toInternalToolCalls(parsed);
		expect(result[0]?.id).not.toBe(result[1]?.id);
	});

	it('id starts with "fallback_"', () => {
		const parsed: ParsedFallbackToolCall[] = [{ name: "tool", argsJson: "{}" }];
		const result = toInternalToolCalls(parsed);
		expect(result[0]?.id).toMatch(/^fallback_/);
	});

	it("converts multiple tool calls", () => {
		const parsed: ParsedFallbackToolCall[] = [
			{ name: "a", argsJson: '{"k":"v"}' },
			{ name: "b", argsJson: '{"n":2}' },
			{ name: "c", argsJson: "{}" },
		];
		const result = toInternalToolCalls(parsed);
		expect(result).toHaveLength(3);
		expect(result.map((r) => r.function.name)).toEqual(["a", "b", "c"]);
	});

	it('each result has type "function"', () => {
		const parsed: ParsedFallbackToolCall[] = [
			{ name: "x", argsJson: "{}" },
			{ name: "y", argsJson: "{}" },
		];
		const result = toInternalToolCalls(parsed);
		for (const r of result) {
			expect(r.type).toBe("function");
		}
	});
});

describe("removeJsonBlocks", () => {
	it("returns text unchanged if no json blocks present", () => {
		const text = "Hello world";
		expect(removeJsonBlocks(text)).toBe("Hello world");
	});

	it("removes a single json block", () => {
		const text = 'Before\n```json\n{"key": "val"}\n```\nAfter';
		const result = removeJsonBlocks(text);
		expect(result).not.toContain("```json");
		expect(result).toContain("Before");
		expect(result).toContain("After");
	});

	it("removes multiple json blocks", () => {
		const text = '```json\n{"a":1}\n```\ntext\n```json\n{"b":2}\n```';
		const result = removeJsonBlocks(text);
		expect(result).not.toContain("```json");
	});

	it("preserves non-json code blocks", () => {
		const text = "```typescript\nconst x = 1;\n```";
		const result = removeJsonBlocks(text);
		expect(result).toContain("```typescript");
	});

	it("returns empty string when input is all json blocks", () => {
		const text = '```json\n{"x":1}\n```';
		const result = removeJsonBlocks(text);
		expect(result.trim()).toBe("");
	});

	it("handles blocks with extra whitespace around backticks", () => {
		const text = '```json  \n{"x":1}\n  ```';
		const result = removeJsonBlocks(text);
		expect(result).not.toContain('{"x":1}');
	});
});
