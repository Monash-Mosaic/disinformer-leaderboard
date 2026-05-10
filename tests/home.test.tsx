import { describe, it, expect, vi, beforeEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "@/components/home/HomePage";
import HomeHeroSection from "@/components/home/HomeHeroSection";
import HomeCarouselSection from "@/components/home/HomeCarouselSection";

vi.mock("next/image", () => ({
  default: function MockNextImage({
    src,
    alt,
    width,
    height,
    className,
    priority: _p,
    draggable: _d,
    sizes: _s,
    ...rest
  }: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    draggable?: boolean;
    sizes?: string;
    [key: string]: unknown;
  }) {
    return (
      <img
        src={src}
        alt={alt ?? ""}
        width={width}
        height={height}
        className={className}
        data-testid={`img-${String(src).replace(/\W+/g, "-")}`}
        {...rest}
      />
    );
  },
}));

describe("HomePage", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders hero and carousel inside main landmark", () => {
    render(<HomePage />);

    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();

    expect(
      within(main).getByRole("heading", { level: 1, name: /DISINFORMER/i }),
    ).toBeInTheDocument();

    expect(
      within(main).getByRole("region", {
        name: /Choose from a wide range of Categories/i,
      }),
    ).toBeInTheDocument();
  });
});

describe("HomeHeroSection", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders title, tagline, coming soon, and decorative assets", () => {
    render(<HomeHeroSection />);

    expect(
      screen.getByRole("heading", { level: 1, name: "DISINFORMER" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Compete in the age of misinformation"),
    ).toBeInTheDocument();
    expect(screen.getByText("COMING SOON")).toBeInTheDocument();

    expect(screen.getByTestId("img--assets-rabbit-png")).toHaveAttribute(
      "src",
      "/assets/rabbit.png",
    );
    expect(screen.getByTestId("img--assets-brain-png")).toHaveAttribute(
      "src",
      "/assets/brain.png",
    );
    expect(screen.getByTestId("img--assets-question-png")).toHaveAttribute(
      "src",
      "/assets/question.png",
    );
    expect(screen.getByTestId("img--assets-video-game-png")).toHaveAttribute(
      "src",
      "/assets/video-game.png",
    );
    expect(screen.getByTestId("img--assets-search-icon-png")).toHaveAttribute(
      "src",
      "/assets/search-icon.png",
    );
  });

  it("labels the hero section for accessibility", () => {
    render(<HomeHeroSection />);

    const region = screen.getByRole("region", { name: "DISINFORMER" });
    expect(region).toBeInTheDocument();
  });
});

describe("HomeCarouselSection", () => {
  beforeEach(() => {
    cleanup();
  });

  it("shows first slide copy and all slide images", () => {
    render(<HomeCarouselSection />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Choose from a wide range of Categories/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("img", {
        name: /choose a category/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /collaborate on the clue/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /disinformer role/i }),
    ).toBeInTheDocument();
  });

  it("advances heading copy when Next is used", async () => {
    const user = userEvent.setup();
    render(<HomeCarouselSection />);

    expect(screen.getByText(/Categories/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next slide/i }));

    expect(screen.getByText(/Together/i)).toBeInTheDocument();
    expect(screen.queryByText(/Categories/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next slide/i }));

    expect(screen.getByText(/Disinformer/i)).toBeInTheDocument();
    expect(screen.queryByText(/Together/i)).not.toBeInTheDocument();
  });

  it("wraps from first slide to last when Previous is pressed", async () => {
    const user = userEvent.setup();
    render(<HomeCarouselSection />);

    await user.click(screen.getByRole("button", { name: /previous slide/i }));

    expect(screen.getByText(/Disinformer/i)).toBeInTheDocument();
  });

  it("jumps to a slide when an indicator is chosen", async () => {
    const user = userEvent.setup();
    render(<HomeCarouselSection />);

    await user.click(screen.getByRole("button", { name: /go to slide 3/i }));

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Persuade others from the answer as Disinformer/i,
      }),
    ).toBeInTheDocument();
  });

  it("moves slides with arrow keys when the region is focused", async () => {
    const user = userEvent.setup();
    render(<HomeCarouselSection />);

    const region = screen.getByRole("region", {
      name: /Choose from a wide range of Categories/i,
    });
    region.focus();

    await user.keyboard("{ArrowRight}");

    expect(screen.getByText(/Together/i)).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");

    expect(screen.getByText(/Categories/i)).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Persuade others from the answer as Disinformer/i,
      }),
    ).toBeInTheDocument();
  });
});
