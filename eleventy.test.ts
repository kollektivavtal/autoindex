import { parseFilename } from "./eleventy.config";

describe("parseFilename", () => {
  it("returns the whole basename as the ", () => {
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
});
