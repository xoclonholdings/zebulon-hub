import { describe, expect, it } from "vitest";

import { parseFileCategory, safeDownloadName, validateFileForCategory } from "./fileUpload.js";

const file = (originalname: string, mimetype: string, size = 10) => ({ originalname, mimetype, size });

describe("ZCOS file upload validation", () => {
  it.each(["image", "document", "other"])("accepts the %s upload category", (category) => {
    expect(parseFileCategory(category)).toBe(category);
  });

  it("rejects an image routed through Image when it is not an image", () => {
    expect(() => validateFileForCategory(file("notes.txt", "text/plain"), "image")).toThrow("Image accepts image files only");
  });

  it.each(["brief.pdf", "brief.doc", "brief.docx", "brief.txt", "brief.rtf"])("accepts supported document %s", (originalname) => {
    expect(() => validateFileForCategory(file(originalname, "application/octet-stream"), "document")).not.toThrow();
  });

  it("rejects unsupported files routed through Document", () => {
    expect(() => validateFileForCategory(file("archive.zip", "application/zip"), "document")).toThrow("Document accepts PDF, DOC, DOCX, TXT, or RTF files");
  });

  it("keeps Other file available for opaque artifacts", () => {
    expect(() => validateFileForCategory(file("archive.zip", "application/zip"), "other")).not.toThrow();
  });

  it("sanitizes names used in content disposition", () => {
    expect(safeDownloadName("../bad\"name\n.pdf")).toBe("bad_name_.pdf");
  });
});
