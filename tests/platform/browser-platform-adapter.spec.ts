import { describe, expect, it } from "vitest";
import { BrowserPlatformAdapter } from "../../assets/scripts/platform/BrowserPlatformAdapter";

describe("browser platform adapter", () => {
  it("shares fallback storage across adapter instances", () => {
    const firstAdapter = new BrowserPlatformAdapter();
    const secondAdapter = new BrowserPlatformAdapter();

    firstAdapter.storage.write("round-trip-key", "round-trip-value");
    expect(secondAdapter.storage.read("round-trip-key")).toBe("round-trip-value");

    secondAdapter.storage.remove("round-trip-key");
    expect(firstAdapter.storage.read("round-trip-key")).toBeNull();
  });
});
