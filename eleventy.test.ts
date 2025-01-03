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

  it("allows em dash as a separator", () => {
    const result = parseFilename("Testavtalet – Bilaga.pdf");
    expect(result).toEqual({
      agreementName: "Testavtalet",
      documentName: "Bilaga",
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
});
