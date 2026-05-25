import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Message } from "../types.js";
import { SessionStorage } from "./sessions.js";

let tmpDir: string;
let storage: SessionStorage;

beforeEach(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "chinacode-sessions-"));
	storage = new SessionStorage(join(tmpDir, "test.db"));
});

afterEach(() => {
	storage.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

describe("SessionStorage.createSession", () => {
	it("returns a non-empty string id", () => {
		const id = storage.createSession("/workspace", "qwen-plus");
		expect(id).toBeTruthy();
		expect(typeof id).toBe("string");
	});

	it("creates unique ids for each session", () => {
		const id1 = storage.createSession("/workspace", "qwen-plus");
		const id2 = storage.createSession("/workspace", "qwen-plus");
		expect(id1).not.toBe(id2);
	});
});

describe("SessionStorage.getSession", () => {
	it("retrieves a created session by id", () => {
		const id = storage.createSession("/workspace", "qwen-plus");
		const session = storage.getSession(id);
		expect(session).not.toBeNull();
		expect(session?.id).toBe(id);
		expect(session?.model).toBe("qwen-plus");
		expect(session?.directory).toBe("/workspace");
	});

	it("initializes with zero cost and message count", () => {
		const id = storage.createSession("/workspace", "qwen-plus");
		const session = storage.getSession(id);
		expect(session?.totalCost).toBe(0);
		expect(session?.messageCount).toBe(0);
	});

	it("returns null for unknown session id", () => {
		expect(storage.getSession("completely-unknown-id")).toBeNull();
	});

	it("stores and retrieves directory correctly", () => {
		const id = storage.createSession("/my/project/path", "qwen-max");
		const session = storage.getSession(id);
		expect(session?.directory).toBe("/my/project/path");
	});
});

describe("SessionStorage.updateSession", () => {
	it("updates totalCost", () => {
		const id = storage.createSession("/workspace", "qwen-plus");
		storage.updateSession(id, [], 0.0042);
		const session = storage.getSession(id);
		expect(session?.totalCost).toBeCloseTo(0.0042);
	});

	it("updates message count from messages array length", () => {
		const id = storage.createSession("/workspace", "qwen-plus");
		const messages: Message[] = [
			{ role: "user", content: "Hello" },
			{ role: "assistant", content: "Hi there" },
		];
		storage.updateSession(id, messages, 0.001);
		const session = storage.getSession(id);
		expect(session?.messageCount).toBe(2);
	});

	it("updates updatedAt timestamp", () => {
		const id = storage.createSession("/workspace", "qwen-plus");
		const beforeUpdate = Date.now();
		storage.updateSession(id, [], 0);
		const session = storage.getSession(id);
		expect(session?.updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
	});

	it("stores messages as JSON string", () => {
		const id = storage.createSession("/workspace", "qwen-plus");
		const messages: Message[] = [{ role: "user", content: "test message" }];
		storage.updateSession(id, messages, 0);
		const session = storage.getSession(id);
		expect(session?.messages).toContain("test message");
	});
});

describe("SessionStorage.listSessions", () => {
	it("returns empty array when no sessions", () => {
		expect(storage.listSessions()).toHaveLength(0);
	});

	it("lists all created sessions", () => {
		storage.createSession("/proj1", "qwen-plus");
		storage.createSession("/proj2", "qwen-max");
		expect(storage.listSessions()).toHaveLength(2);
	});

	it("orders by updated_at descending", async () => {
		const id1 = storage.createSession("/proj1", "qwen-plus");
		await new Promise((r) => setTimeout(r, 5));
		const id2 = storage.createSession("/proj2", "qwen-max");
		await new Promise((r) => setTimeout(r, 5));
		// Update id2 last so it has the highest updated_at
		storage.updateSession(id2, [], 0.01);
		const sessions = storage.listSessions();
		expect(sessions[0]?.id).toBe(id2);
		expect(sessions[1]?.id).toBe(id1);
	});

	it("respects limit parameter", () => {
		for (let i = 0; i < 5; i++) {
			storage.createSession(`/proj${i}`, "qwen-plus");
		}
		const sessions = storage.listSessions(3);
		expect(sessions).toHaveLength(3);
	});
});

describe("SessionStorage.formatSessionList", () => {
	it('returns "Nenhuma sessão" for empty list', () => {
		const output = storage.formatSessionList([]);
		expect(output).toContain("Nenhuma sessão");
	});

	it("includes table header with column names", () => {
		const id = storage.createSession("/workspace", "qwen-plus");
		const sessions = storage.listSessions();
		const output = storage.formatSessionList(sessions);
		expect(output).toContain("ID");
		expect(output).toContain("Modelo");
		expect(output).toContain("Custo");
	});

	it("includes session data in table rows", () => {
		storage.createSession("/workspace", "qwen-plus");
		const sessions = storage.listSessions();
		const output = storage.formatSessionList(sessions);
		expect(output).toContain("qwen-plus");
		expect(output).toContain("/workspace");
	});

	it("includes separator line", () => {
		storage.createSession("/workspace", "qwen-plus");
		const sessions = storage.listSessions();
		const output = storage.formatSessionList(sessions);
		expect(output).toContain("─");
	});
});
