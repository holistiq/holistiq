import {
  formatExpirationDate,
  toISODateString,
  getFormulationLabel,
  getCertificationLabel,
  getFormulationTypes,
  getCertificationTypes,
} from "../supplementUtils";

describe("supplementUtils", () => {
  describe("formatExpirationDate", () => {
    it("should format a valid ISO date string", () => {
      const result = formatExpirationDate("2025-12-31T00:00:00.000Z");
      expect(result).toBe("Dec 31, 2025");
    });

    it("should handle undefined input", () => {
      const result = formatExpirationDate(undefined);
      expect(result).toBe("");
    });

    it("should return the original string if parsing fails", () => {
      const result = formatExpirationDate("invalid-date");
      expect(result).toBe("invalid-date");
    });

    it("should handle different date formats", () => {
      const result = formatExpirationDate("2025/12/31");
      expect(result).toBe("Dec 31, 2025");
    });
  });

  describe("toISODateString", () => {
    it("should convert a Date object to ISO string", () => {
      const date = new Date("2025-12-31T00:00:00.000Z");
      const result = toISODateString(date);
      expect(result).toBe("2025-12-31T00:00:00.000Z");
    });

    it("should convert a date string to ISO string", () => {
      const result = toISODateString("2025-12-31");
      expect(result?.substring(0, 10)).toBe("2025-12-31");
    });

    it("should handle undefined input", () => {
      const result = toISODateString(undefined);
      expect(result).toBeUndefined();
    });

    it("should return undefined for invalid dates", () => {
      const result = toISODateString("invalid-date");
      expect(result).toBeUndefined();
    });
  });

  describe("getFormulationTypes", () => {
    it("should return an array of formulation types", () => {
      const types = getFormulationTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
      expect(types[0]).toHaveProperty("value");
      expect(types[0]).toHaveProperty("label");
    });
  });

  describe("getCertificationTypes", () => {
    it("should return an array of certification types", () => {
      const types = getCertificationTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
      expect(types[0]).toHaveProperty("value");
      expect(types[0]).toHaveProperty("label");
    });
  });

  describe("getFormulationLabel", () => {
    it("should return the label for a valid formulation type", () => {
      const result = getFormulationLabel("extended-release");
      expect(result).toBe("Extended Release");
    });

    it("should return the original value if not found", () => {
      const result = getFormulationLabel("unknown-type");
      expect(result).toBe("unknown-type");
    });

    it("should handle undefined input", () => {
      const result = getFormulationLabel(undefined);
      expect(result).toBe("");
    });
  });

  describe("getCertificationLabel", () => {
    it("should return the label for a valid certification type", () => {
      const result = getCertificationLabel("usp");
      expect(result).toBe("USP Verified");
    });

    it("should return the original value if not found", () => {
      const result = getCertificationLabel("unknown-cert");
      expect(result).toBe("unknown-cert");
    });

    it("should handle undefined input", () => {
      const result = getCertificationLabel(undefined);
      expect(result).toBe("");
    });
  });
});
