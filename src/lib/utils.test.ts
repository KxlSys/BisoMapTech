import { describe, it, expect } from "vitest";
import { getSafeUrl } from "./utils";

describe("getSafeUrl", () => {
  it("returns sanitized URL for valid http and https URLs", () => {
    expect(getSafeUrl("https://example.com")).toBe("https://example.com/");
    expect(getSafeUrl("http://bisomaptech.vercel.app/test")).toBe("http://bisomaptech.vercel.app/test");
    expect(getSafeUrl("  https://github.com/votre-pseudo  ")).toBe("https://github.com/votre-pseudo");
  });

  it("returns null for javascript: URLs (DOM XSS prevention)", () => {
    expect(getSafeUrl("javascript:alert(1)")).toBeNull();
    expect(getSafeUrl("JAVASCRIPT:alert('xss')")).toBeNull();
    expect(getSafeUrl("javascript:/*--*/>/<script>alert(1)</script>")).toBeNull();
  });

  it("returns null for data: or vbscript: URLs", () => {
    expect(getSafeUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(getSafeUrl("vbscript:msgbox(1)")).toBeNull();
  });

  it("returns null for relative or malformed URLs", () => {
    expect(getSafeUrl("not-a-url")).toBeNull();
    expect(getSafeUrl("/relative/path")).toBeNull();
    expect(getSafeUrl("")).toBeNull();
    expect(getSafeUrl(null)).toBeNull();
    expect(getSafeUrl(undefined)).toBeNull();
  });
});
