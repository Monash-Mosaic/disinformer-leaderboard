import { cleanup, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import PrivacyPolicyPage, { metadata } from "@/app/privacy-policy/page";

describe("PrivacyPolicyPage", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders the authoritative policy title, date, and all numbered sections", () => {
    render(<PrivacyPolicyPage />);

    const main = screen.getByRole("main");
    expect(
      within(main).getByRole("heading", {
        level: 1,
        name: "Privacy Policy for Disinformer",
      }),
    ).toBeInTheDocument();
    expect(within(main).getByText("Last updated: 2 September 2026")).toBeInTheDocument();
    expect(within(main).getAllByRole("heading", { level: 2 })).toHaveLength(13);
    expect(metadata.title).toBe("Privacy Policy | Disinformer");
  });

  it("uses the verified policy reference URLs", () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByRole("link", { name: "Google Privacy Policy" })).toHaveAttribute(
      "href",
      "https://policies.google.com/privacy",
    );
    expect(
      screen.getByRole("link", { name: "Firebase Privacy and Security" }),
    ).toHaveAttribute("href", "https://firebase.google.com/support/privacy");
    expect(
      screen.getByRole("link", {
        name: "IFRC Policy on the Protection of Personal Data",
      }),
    ).toHaveAttribute(
      "href",
      "https://www.ifrc.org/document/IFRC-Data-Protection-Policy",
    );
  });
});
