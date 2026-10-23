import { describe, it, expect } from "vitest";
import {
  isSafeUrl,
  sanitizeUrl,
  isSafeInternalRedirect,
  sanitizeInternalRedirect,
} from "./url-utils";

describe("url-utils", () => {
  describe("isSafeUrl", () => {
    it("returns true for valid http and https URLs", () => {
      expect(isSafeUrl("https://github.com/user")).toBe(true);
      expect(isSafeUrl("http://example.com")).toBe(true);
    });

    it("returns true for valid blob URLs", () => {
      expect(isSafeUrl("blob:https://example.com/uuid")).toBe(true);
      expect(isSafeUrl("blob:http://localhost:3000/1234-5678")).toBe(true);
    });

    it("returns false for javascript: URLs", () => {
      expect(isSafeUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeUrl("javascript%3Aalert(1)")).toBe(false);
      expect(isSafeUrl("JAVAscript:alert(1)")).toBe(false);
      expect(isSafeUrl(" java\x00script:alert(1)")).toBe(false);
      expect(isSafeUrl("jav\tascript:alert(1)")).toBe(false);
    });

    it("handles whitespace and control character trimming for safe URLs", () => {
      expect(isSafeUrl("  https://github.com/user  ")).toBe(true);
      expect(isSafeUrl("\thttps://example.com\n")).toBe(true);
      expect(isSafeUrl("\x00https://example.com")).toBe(true);
    });

    it("returns false for data: and vbscript: URLs", () => {
      expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeUrl("data:image/svg+xml;utf8,<svg onload=alert(1)></svg>")).toBe(false);
      expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
      expect(isSafeUrl("DATA:text/html,xss")).toBe(false);
      expect(isSafeUrl("VBSCRIPT:msgbox(1)")).toBe(false);
    });

    it("handles avatar URLs appropriately", () => {
      expect(isSafeUrl("https://example.com/avatars/user.png")).toBe(true);
      expect(isSafeUrl("http://ui-avatars.com/api/?name=Test")).toBe(true);
      expect(isSafeUrl("javascript:alert('avatar_xss')")).toBe(false);
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

  describe("isSafeInternalRedirect", () => {
    it("returns true for valid internal paths", () => {
      expect(isSafeInternalRedirect("/")).toBe(true);
      expect(isSafeInternalRedirect("/matching")).toBe(true);
      expect(isSafeInternalRedirect("/matching?vue=projets")).toBe(true);
      expect(isSafeInternalRedirect("/contributeurs/john_doe#section")).toBe(true);
    });

    it("returns false for external URLs", () => {
      expect(isSafeInternalRedirect("https://evil.com")).toBe(false);
      expect(isSafeInternalRedirect("http://evil.com/login")).toBe(false);
      expect(isSafeInternalRedirect("https://bisomaptech.vercel.app")).toBe(false);
    });

    it("returns false for protocol-relative URLs", () => {
      expect(isSafeInternalRedirect("//evil.com")).toBe(false);
      expect(isSafeInternalRedirect("//evil.com/path")).toBe(false);
    });

    it("returns false for Windows backslash path tricks", () => {
      expect(isSafeInternalRedirect("/\\evil.com")).toBe(false);
      expect(isSafeInternalRedirect("/\\/evil.com")).toBe(false);
    });

    it("returns false for javascript and data URIs", () => {
      expect(isSafeInternalRedirect("javascript:alert(1)")).toBe(false);
      expect(isSafeInternalRedirect("data:text/html,abc")).toBe(false);
    });

    it("returns false for null, undefined, empty, or whitespace strings", () => {
      expect(isSafeInternalRedirect("")).toBe(false);
      expect(isSafeInternalRedirect("   ")).toBe(false);
      expect(isSafeInternalRedirect(null)).toBe(false);
      expect(isSafeInternalRedirect(undefined)).toBe(false);
    });
  });

  describe("sanitizeInternalRedirect", () => {
    it("returns the path if it is a safe internal redirect", () => {
      expect(sanitizeInternalRedirect("/matching?vue=projets")).toBe("/matching?vue=projets");
      expect(sanitizeInternalRedirect("/contributeurs")).toBe("/contributeurs");
    });

    it("returns fallback '/' for unsafe or external URLs", () => {
      expect(sanitizeInternalRedirect("https://evil.com")).toBe("/");
      expect(sanitizeInternalRedirect("//evil.com")).toBe("/");
      expect(sanitizeInternalRedirect("javascript:alert(1)")).toBe("/");
    });

    it("returns custom fallback when provided", () => {
      expect(sanitizeInternalRedirect("https://evil.com", "/onboarding")).toBe("/onboarding");
    });
  });
});
