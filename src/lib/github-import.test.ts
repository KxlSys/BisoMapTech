import { describe, it, expect } from "vitest";
import { matchTechOption } from "./github-import";

describe("matchTechOption", () => {
  it("reconnaît un langage GitHub qui porte déjà le nom du référentiel", () => {
    expect(matchTechOption("Python")).toBe("Python");
    expect(matchTechOption("rust")).toBe("Rust");
  });

  it("applique les alias des langages nommés différemment sur GitHub", () => {
    expect(matchTechOption("HTML")).toBe("HTML/CSS");
    expect(matchTechOption("SCSS")).toBe("HTML/CSS");
    expect(matchTechOption("Dockerfile")).toBe("Docker");
    expect(matchTechOption("HCL")).toBe("Terraform");
    expect(matchTechOption("Shell")).toBe("Bash");
  });

  it("ignore la casse et la ponctuation des topics", () => {
    expect(matchTechOption("node-js")).toBe("Node.js");
    expect(matchTechOption("nextjs")).toBe("Next.js");
    expect(matchTechOption("tailwind-css")).toBe("Tailwind CSS");
    expect(matchTechOption("React Native")).toBe("React Native");
  });

  it("renvoie null pour ce qui ne correspond à aucune techno connue", () => {
    expect(matchTechOption("hacktoberfest")).toBeNull();
    expect(matchTechOption("")).toBeNull();
    expect(matchTechOption("   ")).toBeNull();
  });
});
