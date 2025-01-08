import { parseFilename } from "./eleventy.config";

describe("parseFilename", () => {
  it("returns the whole basename as both names", () => {
    const result = parseFilename("Testavtalet.pdf");
    expect(result).toEqual({
      agreementName: "Testavtalet",
      documentName: "Testavtalet",
      documentRank: 0,
    });
  });

  it("allows document rank as a separator", () => {
    const result = parseFilename("Testavtalet (2) Bilaga.pdf");
    expect(result).toEqual({
      agreementName: "Testavtalet",
      documentName: "Bilaga",
      documentRank: 2,
    });
  });

  it("detects language at the end of the basename", () => {
    const result = parseFilename("Testavtalet (2) Bilaga (en).pdf");
    expect(result).toEqual({
      agreementName: "Testavtalet",
      documentName: "Bilaga",
      documentRank: 2,
      documentLanguage: "en",
    });
  });
});
