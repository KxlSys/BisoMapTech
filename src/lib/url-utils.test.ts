import { describe, it, expect } from "vitest";
import { isSafeUrl, sanitizeUrl } from "./url-utils";

describe("url-utils", () => {
  describe("isSafeUrl", () => {
    it("returns true for valid http and https URLs", () => {
      expect(isSafeUrl("https://github.com/user")).toBe(true);
      expect(isSafeUrl("http://example.com")).toBe(true);
    });

    it("returns true for valid blob URLs", () => {
      expect(isSafeUrl("blob:https://example.com/uuid")).toBe(true);
    });

    it("returns false for javascript: URLs", () => {
      expect(isSafeUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeUrl("javascript%3Aalert(1)")).toBe(false);
      expect(isSafeUrl("JAVAscript:alert(1)")).toBe(false);
    });

    it("returns false for data: and vbscript: URLs", () => {
      expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
    });

    it("returns false for invalid or relative URLs without base", () => {
      expect(isSafeUrl("not-a-url")).toBe(false);
      expect(isSafeUrl("")).toBe(false);
      expect(isSafeUrl(null)).toBe(false);
      expect(isSafeUrl(undefined)).toBe(false);
    });
  });

  describe("sanitizeUrl", () => {
    it("returns the original URL if safe", () => {
      const safe = "https://github.com/kaleldamba";
      expect(sanitizeUrl(safe)).toBe(safe);
    });

    it("returns default fallback '#' for unsafe URLs", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBe("#");
      expect(sanitizeUrl("data:text/html,abc")).toBe("#");
      expect(sanitizeUrl("invalid")).toBe("#");
    });

    it("returns custom fallback when specified", () => {
      expect(sanitizeUrl("javascript:alert(1)", "about:blank")).toBe("about:blank");
    });
  });
});
