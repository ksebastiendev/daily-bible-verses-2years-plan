import { describe, expect, it } from "vitest";
import { isVerifiedChallenger } from "./eligibility";

describe("isVerifiedChallenger", () => {
  it("returns true when all conditions are met", () => {
    expect(
      isVerifiedChallenger({ email_verified: true, phone: "22990000001", location: "Cotonou" }),
    ).toBe(true);
  });

  it("returns false when email not verified", () => {
    expect(
      isVerifiedChallenger({ email_verified: false, phone: "22990000001", location: "Cotonou" }),
    ).toBe(false);
  });

  it("returns false when email_verified is undefined", () => {
    expect(
      isVerifiedChallenger({ phone: "22990000001", location: "Cotonou" }),
    ).toBe(false);
  });

  it("returns false when phone is missing", () => {
    expect(
      isVerifiedChallenger({ email_verified: true, phone: "", location: "Cotonou" }),
    ).toBe(false);
  });

  it("returns false when phone is only whitespace", () => {
    expect(
      isVerifiedChallenger({ email_verified: true, phone: "  ", location: "Cotonou" }),
    ).toBe(false);
  });

  it("returns false when location is missing", () => {
    expect(
      isVerifiedChallenger({ email_verified: true, phone: "22990000001", location: "" }),
    ).toBe(false);
  });

  it("returns false when location is only whitespace", () => {
    expect(
      isVerifiedChallenger({ email_verified: true, phone: "22990000001", location: "  " }),
    ).toBe(false);
  });

  it("returns false when all fields missing", () => {
    expect(isVerifiedChallenger({})).toBe(false);
  });

  it("trims phone and location before checking", () => {
    expect(
      isVerifiedChallenger({ email_verified: true, phone: " 22990000001 ", location: " Cotonou " }),
    ).toBe(true);
  });
});
