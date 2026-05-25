import { describe, expect, it } from "vitest";
import { SecretsGuard } from "./secrets.js";

describe("SecretsGuard", () => {
	const guard = new SecretsGuard("/workspace");

	describe("checkPath — blocked files", () => {
		it("blocks .env", () => {
			expect(guard.checkPath(".env")).not.toBeNull();
		});

		it("blocks .env.production", () => {
			expect(guard.checkPath("/workspace/.env.production")).not.toBeNull();
		});

		it("blocks .env.local", () => {
			expect(guard.checkPath("/workspace/.env.local")).not.toBeNull();
		});

		it("blocks id_rsa", () => {
			expect(guard.checkPath("/home/user/.ssh/id_rsa")).not.toBeNull();
		});

		it("blocks id_ed25519", () => {
			expect(guard.checkPath("/home/user/.ssh/id_ed25519")).not.toBeNull();
		});

		it("blocks .pem files", () => {
			expect(guard.checkPath("/certs/server.pem")).not.toBeNull();
		});

		it("blocks .key files", () => {
			expect(guard.checkPath("/certs/private.key")).not.toBeNull();
		});

		it("blocks .p12 files", () => {
			expect(guard.checkPath("/certs/cert.p12")).not.toBeNull();
		});

		it("blocks .git/config", () => {
			expect(guard.checkPath("/workspace/.git/config")).not.toBeNull();
		});
	});

	describe("checkPath — allowed files", () => {
		it("allows TypeScript source files", () => {
			expect(guard.checkPath("/workspace/src/index.ts")).toBeNull();
		});

		it("allows README.md", () => {
			expect(guard.checkPath("/workspace/README.md")).toBeNull();
		});

		it("allows package.json", () => {
			expect(guard.checkPath("/workspace/package.json")).toBeNull();
		});

		it("allows .json config files", () => {
			expect(guard.checkPath("/workspace/tsconfig.json")).toBeNull();
		});
	});

	describe("sanitizeContent", () => {
		it("masks OpenAI-style API keys (sk-)", () => {
			const result = guard.sanitizeContent(
				"key=sk-abcdefghijklmnopqrstuvwxyz123456",
			);
			expect(result).toContain("sk-***MASKED***");
			expect(result).not.toContain("sk-abcdefghijklmnopqrstuvwxyz123456");
		});

		it("masks GitHub personal access tokens", () => {
			const result = guard.sanitizeContent(`token: ghp_${"a".repeat(36)}`);
			expect(result).toContain("ghp_***MASKED***");
		});

		it("masks AWS access key IDs", () => {
			const result = guard.sanitizeContent("aws key: AKIAIOSFODNN7EXAMPLE");
			expect(result).toContain("AKIA***MASKED***");
		});

		it("masks Bearer tokens", () => {
			const result = guard.sanitizeContent(
				"Authorization: Bearer abcdef123456789012345678901234",
			);
			expect(result).toContain("Bearer ***MASKED***");
		});

		it("masks password= assignments", () => {
			const result = guard.sanitizeContent("password=supersecret123");
			expect(result).toContain("password=***MASKED***");
		});

		it("masks secret= assignments", () => {
			const result = guard.sanitizeContent("secret=mysecretvalue");
			expect(result).toContain("secret=***MASKED***");
		});

		it("does not corrupt normal code content", () => {
			const content = 'const x = 1\nconst y = "hello world"\n';
			expect(guard.sanitizeContent(content)).toBe(content);
		});
	});

	describe("isDestructiveCommand", () => {
		it("detects rm -rf", () => {
			expect(guard.isDestructiveCommand("rm -rf /")).toBe(true);
		});

		it("detects rm -r with space", () => {
			expect(guard.isDestructiveCommand("rm -r /workspace/data")).toBe(true);
		});

		it("detects rmdir", () => {
			expect(guard.isDestructiveCommand("rmdir /tmp/folder")).toBe(true);
		});

		it("detects DROP TABLE (case-insensitive)", () => {
			expect(guard.isDestructiveCommand("DROP TABLE users")).toBe(true);
		});

		it("detects drop database", () => {
			expect(guard.isDestructiveCommand("drop database mydb")).toBe(true);
		});

		it("detects git push --force", () => {
			expect(guard.isDestructiveCommand("git push --force origin main")).toBe(
				true,
			);
		});

		it("detects git push -f", () => {
			expect(guard.isDestructiveCommand("git push -f origin main")).toBe(true);
		});

		it("detects mkfs", () => {
			expect(guard.isDestructiveCommand("mkfs.ext4 /dev/sda1")).toBe(true);
		});

		it("detects dd if=", () => {
			expect(guard.isDestructiveCommand("dd if=/dev/zero of=/dev/sda")).toBe(
				true,
			);
		});

		it("detects chmod 777", () => {
			expect(guard.isDestructiveCommand("chmod 777 /workspace")).toBe(true);
		});

		it("allows ls -la", () => {
			expect(guard.isDestructiveCommand("ls -la")).toBe(false);
		});

		it("allows npm install", () => {
			expect(guard.isDestructiveCommand("npm install")).toBe(false);
		});

		it("allows git status", () => {
			expect(guard.isDestructiveCommand("git status")).toBe(false);
		});

		it("allows git commit", () => {
			expect(
				guard.isDestructiveCommand('git commit -m "feat: add feature"'),
			).toBe(false);
		});

		it("allows cat and echo", () => {
			expect(guard.isDestructiveCommand("cat file.txt")).toBe(false);
			expect(guard.isDestructiveCommand("echo hello")).toBe(false);
		});
	});

	describe("isOutsideWorkspace", () => {
		const wsGuard = new SecretsGuard("/workspace/project");

		it("detects /etc/passwd as outside workspace", () => {
			expect(wsGuard.isOutsideWorkspace("/etc/passwd")).toBe(true);
		});

		it("detects /home/user/secret.txt as outside workspace", () => {
			expect(wsGuard.isOutsideWorkspace("/home/user/secret.txt")).toBe(true);
		});

		it("allows files inside workspace", () => {
			expect(
				wsGuard.isOutsideWorkspace("/workspace/project/src/index.ts"),
			).toBe(false);
		});

		it("allows nested workspace paths", () => {
			expect(
				wsGuard.isOutsideWorkspace("/workspace/project/deep/nested/file.ts"),
			).toBe(false);
		});
	});
});
