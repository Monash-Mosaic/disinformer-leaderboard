import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Suspense } from "react";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LeaderboardTableOffsetBased from "@/components/leaderboard/LeaderboardTableOffsetBased";
import { RankingCriteria } from "@/types/leaderboard";
import type { LeaderboardPageResult } from "@/types/pagination";
import { fetchLeaderboardAction } from "@/app/leaderboard-offsetbased/actions";

vi.mock("@/app/leaderboard-offsetbased/actions", () => ({
    fetchLeaderboardAction: vi.fn(),
}));

vi.mock("@/services/leaderboard-offset-realtime-service", () => ({
    subscribeToLeaderboardChanges: vi.fn(() => () => {}),
}));

vi.mock("next/navigation", () => ({
    usePathname: () => "/leaderboard-offsetbased",
    useSearchParams: () => new URLSearchParams(),
}));

const basePlayer = {
    id: "p1",
    username: "alice",
    totalGamesPlayed: 2,
    totalDisinformerPoints: 100,
    totalNetizenPoints: 20,
    society: "Society A",
    branch: "Branch X",
    email: "alice@example.com",
    username_lowercase: "alice",
};

function makePageResult(overrides: Partial<LeaderboardPageResult> = {}): LeaderboardPageResult {
    return {
        players: [basePlayer],
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
        cursors: {},
        ...overrides,
    };
}

function createDeferredDataPromise() {
    let resolveData!: (value: LeaderboardPageResult) => void;
    const dataPromise = new Promise<LeaderboardPageResult>((resolve) => {
        resolveData = resolve;
    });
    return { dataPromise, resolveData };
}

async function renderLeaderboardWithData(data: LeaderboardPageResult) {
    const { dataPromise, resolveData } = createDeferredDataPromise();
    let view: ReturnType<typeof render>;
    await act(async () => {
        view = render(
            <Suspense fallback={<div data-testid="suspense-fallback">loading</div>}>
                <LeaderboardTableOffsetBased
                    dataPromise={dataPromise}
                    initialPage={1}
                    initialMode={RankingCriteria.Disinformer}
                    initialSearch=""
                    enableRealtime={false}
                />
            </Suspense>
        );
        resolveData(data);
    });
    return view!;
}

describe("LeaderboardTableOffsetBased", () => {
    beforeEach(() => {
        vi.mocked(fetchLeaderboardAction).mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("renders disinformer heading and player row", async () => {
        await renderLeaderboardWithData(makePageResult());

        expect(await screen.findByRole("heading", { name: /disinformer leaderboards/i })).toBeInTheDocument();
        expect(screen.getByText("alice")).toBeInTheDocument();
        expect(screen.getByText("100")).toBeInTheDocument();
        expect(screen.getByText("Society A")).toBeInTheDocument();
        expect(screen.getByText("Branch X")).toBeInTheDocument();
    });

    it("shows no results when the first page has no players", async () => {
        await renderLeaderboardWithData(makePageResult({ players: [] }));

        expect(screen.getAllByText(/no results found/i).length).toBeGreaterThanOrEqual(1);
    });

    it("submits search and refetches via the server action", async () => {
        const user = userEvent.setup();
        const emptyFirst = makePageResult({ players: [] });
        const afterSearch = makePageResult({
            players: [{ ...basePlayer, id: "p2", username: "alice2" }],
        });

        vi.mocked(fetchLeaderboardAction).mockResolvedValueOnce(afterSearch);

        await renderLeaderboardWithData(emptyFirst);

        expect(screen.getAllByText(/no results found/i).length).toBeGreaterThanOrEqual(1);

        const input = screen.getByPlaceholderText(/find username/i);
        await user.type(input, "alice");
        await user.keyboard("{Enter}");

        await waitFor(() => {
            expect(fetchLeaderboardAction).toHaveBeenCalledWith(1, RankingCriteria.Disinformer, "alice");
        });
        expect(await screen.findByText("alice2")).toBeInTheDocument();
    });

    it("toggles to netizen mode and updates the heading", async () => {
        const user = userEvent.setup();
        const netizenPage = makePageResult({
            players: [{ ...basePlayer, totalNetizenPoints: 55 }],
        });
        vi.mocked(fetchLeaderboardAction).mockResolvedValueOnce(netizenPage);

        await renderLeaderboardWithData(makePageResult());

        expect(
            (await screen.findAllByRole("heading", { name: /disinformer leaderboards/i }))[0]
        ).toBeInTheDocument();

        const toggleRegion = screen.getAllByText("Disinformer")[0].closest("div");
        expect(toggleRegion).toBeTruthy();
        const toggleButton = within(toggleRegion as HTMLElement).getByRole("button");
        await user.click(toggleButton);

        await waitFor(() => {
            expect(fetchLeaderboardAction).toHaveBeenCalledWith(1, RankingCriteria.Netizen, "");
        });
        expect(
            (await screen.findAllByRole("heading", { name: /netizen leaderboards/i }))[0]
        ).toBeInTheDocument();
        expect(screen.getByText("55")).toBeInTheDocument();
    });
});
