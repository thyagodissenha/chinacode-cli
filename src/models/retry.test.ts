import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calcRetryDelay, sleep } from "./retry.js";

describe("sleep", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns a Promise", () => {
		const result = sleep(100);
		expect(result).toBeInstanceOf(Promise);
		vi.runAllTimers();
	});

	it("resolves after the specified delay", async () => {
		let resolved = false;
		sleep(1000).then(() => {
			resolved = true;
		});
		expect(resolved).toBe(false);
		vi.advanceTimersByTime(1000);
		await Promise.resolve();
		expect(resolved).toBe(true);
	});

	it("does not resolve before the specified delay", async () => {
		let resolved = false;
		sleep(500).then(() => {
			resolved = true;
		});
		vi.advanceTimersByTime(499);
		await Promise.resolve();
		expect(resolved).toBe(false);
		vi.advanceTimersByTime(1);
		await Promise.resolve();
		expect(resolved).toBe(true);
	});

	it("resolves with undefined", async () => {
		const promise = sleep(0);
		vi.runAllTimers();
		const result = await promise;
		expect(result).toBeUndefined();
	});
});

describe("calcRetryDelay", () => {
	it("returns at least 500ms (minimum)", () => {
		// attempt 0, base 1000 → exp = 1000, jitter ±30% = ±300 → min result is 700, but min clamp is 500
		for (let i = 0; i < 20; i++) {
			const delay = calcRetryDelay(0);
			expect(delay).toBeGreaterThanOrEqual(500);
		}
	});

	it("returns an integer (Math.round applied)", () => {
		for (let i = 0; i < 10; i++) {
			const delay = calcRetryDelay(1);
			expect(Number.isInteger(delay)).toBe(true);
		}
	});

	it("grows exponentially with attempt number", () => {
		// With fixed jitter by mocking Math.random to 0.5 (neutral: jitter = exp*0.3*(0) = 0)
		vi.spyOn(Math, "random").mockReturnValue(0.5); // 0.5*2-1 = 0 → zero jitter
		const d0 = calcRetryDelay(0, 1000, 30000); // base = 1000, jitter = 0
		const d1 = calcRetryDelay(1, 1000, 30000); // base = 2000
		const d2 = calcRetryDelay(2, 1000, 30000); // base = 4000
		expect(d1).toBeGreaterThan(d0);
		expect(d2).toBeGreaterThan(d1);
		vi.restoreAllMocks();
	});

	it("caps at maxMs", () => {
		vi.spyOn(Math, "random").mockReturnValue(0.5); // zero jitter
		const delay = calcRetryDelay(100, 1000, 30000); // 2^100 * 1000 would be huge
		expect(delay).toBeLessThanOrEqual(30000);
		vi.restoreAllMocks();
	});

	it("respects custom baseMs", () => {
		vi.spyOn(Math, "random").mockReturnValue(0.5);
		const delay = calcRetryDelay(0, 2000, 60000);
		expect(delay).toBe(2000);
		vi.restoreAllMocks();
	});

	it("respects custom maxMs", () => {
		vi.spyOn(Math, "random").mockReturnValue(0.5);
		const delay = calcRetryDelay(10, 1000, 5000);
		expect(delay).toBeLessThanOrEqual(5000);
		vi.restoreAllMocks();
	});

	it("jitter can increase delay above base (random = 1)", () => {
		vi.spyOn(Math, "random").mockReturnValue(1); // jitter = exp * 0.3 * 1 = +30%
		const delay = calcRetryDelay(0, 1000, 30000);
		// exp = 1000, jitter = 300, total = 1300
		expect(delay).toBe(1300);
		vi.restoreAllMocks();
	});

	it("jitter can decrease delay (random = 0)", () => {
		vi.spyOn(Math, "random").mockReturnValue(0); // jitter = exp * 0.3 * (-1) = -30%
		const delay = calcRetryDelay(0, 1000, 30000);
		// exp = 1000, jitter = -300, total = 700, max(500, 700) = 700
		expect(delay).toBe(700);
		vi.restoreAllMocks();
	});

	it("still meets minimum 500 even with negative jitter pulling below", () => {
		vi.spyOn(Math, "random").mockReturnValue(0); // max negative jitter
		// attempt=0, base=500 → exp=500, jitter=-150, total=350 → clamp to 500
		const delay = calcRetryDelay(0, 500, 30000);
		expect(delay).toBeGreaterThanOrEqual(500);
		vi.restoreAllMocks();
	});
});
