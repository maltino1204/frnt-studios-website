import { describe, expect, it } from "vitest";
import { z } from "zod";
import { endSentence, parse } from "@/server/services/_shared";

const messageOf = (schema: z.ZodType, value: unknown) => {
  try {
    parse(schema, value);
    return null;
  } catch (e) {
    return (e as { fieldErrors?: Record<string, string> }).fieldErrors?._ ?? null;
  }
};

describe("German validation messages (audit-1 R17)", () => {
  it("phrases string length limits as human German", () => {
    expect(messageOf(z.string().max(500), "x".repeat(501))).toBe("Bitte höchstens 500 Zeichen.");
    expect(messageOf(z.string().min(10), "kurz")).toBe("Bitte mindestens 10 Zeichen.");
    expect(messageOf(z.string().min(1), "")).toBe("Bitte ausfüllen.");
  });
  it("phrases number and array limits", () => {
    expect(messageOf(z.number().max(0.5), 0.6)).toBe("Bitte höchstens 0,5 angeben.");
    expect(messageOf(z.number().min(3), 1)).toBe("Bitte mindestens 3 angeben.");
    expect(messageOf(z.number().positive(), 0)).toBe("Bitte einen Wert größer als 0 angeben.");
    expect(messageOf(z.array(z.string()).max(3), ["a", "b", "c", "d"])).toBe("Bitte höchstens 3 Einträge wählen.");
    expect(messageOf(z.array(z.string()).min(1), [])).toBe("Bitte mindestens einen Eintrag wählen.");
  });
  it("covers missing values, formats and enums", () => {
    expect(messageOf(z.string(), undefined)).toBe("Bitte ausfüllen.");
    expect(messageOf(z.email(), "keine-mail")).toBe("Bitte eine gültige E-Mail-Adresse angeben.");
    expect(messageOf(z.enum(["a", "b"]), "c")).toBe("Bitte einen gültigen Wert wählen.");
  });
  it("keeps schema-level messages", () => {
    expect(messageOf(z.string().max(5, "Höchstens 5 Zeichen."), "zu lang")).toBe("Höchstens 5 Zeichen.");
  });
  it("never produces a double period after abbreviated names", () => {
    expect(`… von ${endSentence("Hanna B.")}`).toBe("… von Hanna B.");
    expect(`… von ${endSentence("Hanna")}`).toBe("… von Hanna.");
  });
});
