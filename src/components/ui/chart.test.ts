import { describe, it, expect } from "vitest"
import { sanitizeCssIdentifier, sanitizeCssValue } from "./chart"

describe("ChartStyle sanitization", () => {
  describe("sanitizeCssIdentifier", () => {
    it("allows valid identifier characters", () => {
      expect(sanitizeCssIdentifier("chart-123_abc")).toBe("chart-123_abc")
    })

    it("strips malicious CSS injection and HTML tags from identifiers", () => {
      expect(sanitizeCssIdentifier('chart"> <script>alert(1)</script>')).toBe("chartscriptalert1script")
      expect(sanitizeCssIdentifier("key}; body { display:none }")).toBe("keybodydisplaynone")
    })
  })

  describe("sanitizeCssValue", () => {
    it("allows valid CSS color values", () => {
      expect(sanitizeCssValue("#ff0000")).toBe("#ff0000")
      expect(sanitizeCssValue("hsl(var(--primary))")).toBe("hsl(var(--primary))")
    })

    it("strips characters that allow breakout from CSS declarations or HTML tags", () => {
      expect(sanitizeCssValue('red; } </style><script>alert("XSS")</script>')).toBe("red  stylescriptalert(XSS)script")
      expect(sanitizeCssValue("red; background: url('http://evil.com')")).toBe("red background: url(http:evil.com)")
    })

    it("handles empty or undefined values gracefully", () => {
      expect(sanitizeCssValue(undefined)).toBe("")
      expect(sanitizeCssValue("")).toBe("")
    })
  })
})
