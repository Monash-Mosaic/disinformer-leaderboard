import { describe, it, expect, vi, beforeEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Navbar from "@/components/navbar";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("Navbar", () => {
  beforeEach(() => {
    cleanup();
    mockUsePathname.mockReturnValue("/");
  });

  it("renders main navigation links", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Leaderboard" })).toHaveAttribute(
      "href",
      "/leaderboard-offsetbased",
    );
    expect(screen.getByRole("link", { name: "Report Bugs" })).toHaveAttribute(
      "href",
      "#",
    );
  });

  it("highlights Home on the home route", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Navbar />);

    expect(screen.getByRole("link", { name: "Home" })).toHaveClass(
      "text-[#ff4805]",
    );
    expect(screen.getByRole("link", { name: "Leaderboard" })).toHaveClass(
      "text-[#2d4143]",
    );
  });

  it("highlights Leaderboard on the leaderboard route", () => {
    mockUsePathname.mockReturnValue("/leaderboard-offsetbased");
    render(<Navbar />);

    expect(screen.getByRole("link", { name: "Leaderboard" })).toHaveClass(
      "text-[#ff4805]",
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveClass(
      "text-[#2d4143]",
    );
  });
});
