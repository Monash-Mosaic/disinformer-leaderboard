import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LeaderboardTableOffsetBased from "@/components/leaderboard/LeaderboardTableOffsetBased";
import { RankingCriteria } from "@/types/leaderboard";
import type { LeaderboardPageResult } from "@/types/pagination";
import { getPaginatedLeaderboard } from "@/services/leaderboard-offset-service";

vi.mock("@/services/leaderboard-offset-service", () => ({
    getPaginatedLeaderboard: vi.fn(),
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

function renderLeaderboard(data: LeaderboardPageResult) {
    vi.mocked(getPaginatedLeaderboard).mockResolvedValue(data);
    return render(
        <LeaderboardTableOffsetBased
            initialPage={1}
            initialMode={RankingCriteria.Disinformer}
            initialSearch=""
            enableRealtime={false}
        />
    );
}

describe("LeaderboardTableOffsetBased", () => {
    beforeEach(() => {
        vi.mocked(getPaginatedLeaderboard).mockReset();
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("renders disinformer heading and player row", async () => {
        renderLeaderboard(makePageResult());

        await waitFor(() => {
            expect(screen.getByText("alice")).toBeInTheDocument();
        });
        expect(screen.getByText("100")).toBeInTheDocument();
        expect(screen.getByText("Society A")).toBeInTheDocument();
        expect(screen.getByText("Branch X")).toBeInTheDocument();
    });

    it("shows no results when the first page has no players", async () => {
        renderLeaderboard(makePageResult({ players: [] }));

        expect(await screen.findAllByText(/no results found/i)).toHaveLength(1);
    });

    it("submits search and refetches via the client service", async () => {
        const user = userEvent.setup();
        const emptyFirst = makePageResult({ players: [] });
        const afterSearch = makePageResult({
            players: [{ ...basePlayer, id: "p2", username: "alice2" }],
        });

        vi.mocked(getPaginatedLeaderboard)
            .mockResolvedValueOnce(emptyFirst)
            .mockResolvedValue(afterSearch);

        render(
            <LeaderboardTableOffsetBased
                initialPage={1}
                initialMode={RankingCriteria.Disinformer}
                initialSearch=""
                enableRealtime={false}
            />
        );

        expect(await screen.findAllByText(/no results found/i)).toHaveLength(1);

        const input = screen.getAllByPlaceholderText(/find username/i)[0];
        await user.type(input, "alice");
        await user.keyboard("{Enter}");

        await waitFor(() => {
            expect(getPaginatedLeaderboard).toHaveBeenCalledWith(1, RankingCriteria.Disinformer, "alice");
        });
        expect(await screen.findByText("alice2")).toBeInTheDocument();
    });

    it("toggles to netizen mode and updates the heading", async () => {
        const user = userEvent.setup();
        const netizenPage = makePageResult({
            players: [{ ...basePlayer, totalNetizenPoints: 55 }],
        });

        vi.mocked(getPaginatedLeaderboard).mockImplementation(async (_page, mode) => {
            if (mode === RankingCriteria.Netizen) {
                return netizenPage;
            }
            return makePageResult();
        });

        render(
            <LeaderboardTableOffsetBased
                initialPage={1}
                initialMode={RankingCriteria.Disinformer}
                initialSearch=""
                enableRealtime={false}
            />
        );

        await waitFor(() => {
            expect(screen.getByText("alice")).toBeInTheDocument();
        });

        const toggleRegion = screen.getAllByText("Disinformer")[0].closest("div");
        expect(toggleRegion).toBeTruthy();
        const toggleButton = within(toggleRegion as HTMLElement).getByRole("button");
        await user.click(toggleButton);

        await waitFor(() => {
            expect(getPaginatedLeaderboard).toHaveBeenCalledWith(1, RankingCriteria.Netizen, "");
        });
        expect(
            (await screen.findAllByRole("heading", { name: /netizen leaderboards/i }))[0]
        ).toBeInTheDocument();
        expect(screen.getByText("55")).toBeInTheDocument();
    });
});
