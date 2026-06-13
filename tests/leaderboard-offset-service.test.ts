import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPaginatedLeaderboard } from "@/services/leaderboard-offset-service";
import { RankingCriteria } from "@/types/leaderboard";

vi.mock("@/utils/firebase.client", () => ({
    playersCollection: { id: "players" },
}));

vi.mock("firebase/firestore", () => ({
    query: vi.fn((base, ...constraints) => ({ base, constraints })),
    orderBy: vi.fn((field, direction) => ({ type: "orderBy", field, direction })),
    where: vi.fn((field, op, value) => ({ type: "where", field, op, value })),
    limit: vi.fn((n) => ({ type: "limit", n })),
    getDocs: vi.fn(),
    getCountFromServer: vi.fn(),
}));

import { getDocs, getCountFromServer, where, orderBy, limit } from "firebase/firestore";

function createDoc(id: string, data: Record<string, unknown>) {
    return {
        id,
        data: () => data,
    };
}

describe("getPaginatedLeaderboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns empty page when there are no players", async () => {
        vi.mocked(getCountFromServer).mockResolvedValue({
            data: () => ({ count: 0 }),
        } as never);

        const result = await getPaginatedLeaderboard(1, RankingCriteria.Disinformer, "");

        expect(result.players).toEqual([]);
        expect(result.totalPages).toBe(0);
        expect(result.currentPage).toBe(1);
        expect(result.hasNextPage).toBe(false);
        expect(result.hasPrevPage).toBe(false);
        expect(getCountFromServer).toHaveBeenCalledTimes(1);
        expect(getDocs).not.toHaveBeenCalled();
    });

    it("maps documents to players with ids and normalized points", async () => {
        const docData = {
            username: "tester",
            totalGamesPlayed: 3,
            totalDisinformerPoints: 42,
            totalNetizenPoints: 7,
            society: "Soc",
            branch: "Br",
            email: "t@example.com",
            username_lowercase: "tester",
            createdAt: { toDate: () => new Date("2024-06-01T12:00:00.000Z") },
            lastGamePlayedAt: null,
        };
        const docs = [createDoc("player-1", docData)];

        vi.mocked(getCountFromServer).mockResolvedValue({
            data: () => ({ count: 1 }),
        } as never);
        vi.mocked(getDocs).mockResolvedValue({ docs } as never);

        const result = await getPaginatedLeaderboard(1, RankingCriteria.Disinformer, "");

        expect(result.players).toHaveLength(1);
        expect(result.players[0]).toMatchObject({
            id: "player-1",
            username: "tester",
            totalDisinformerPoints: 42,
            totalNetizenPoints: 7,
            society: "Soc",
            branch: "Br",
            createdAt: "2024-06-01T12:00:00.000Z",
            lastGamePlayedAt: null,
        });
        expect(result.totalPages).toBe(1);
        expect(result.currentPage).toBe(1);
        expect(result.hasNextPage).toBe(false);
        expect(result.hasPrevPage).toBe(false);
        expect(getDocs).toHaveBeenCalledTimes(1);
    });

    it("applies search filters on the query chain", async () => {
        vi.mocked(getCountFromServer).mockResolvedValue({
            data: () => ({ count: 0 }),
        } as never);

        await getPaginatedLeaderboard(1, RankingCriteria.Netizen, "  Ali  ");

        expect(where).toHaveBeenCalled();
        const whereCalls = vi.mocked(where).mock.calls;
        expect(whereCalls.some((c) => c[0] === "username_lowercase")).toBe(true);
        expect(orderBy).toHaveBeenCalledWith("totalNetizenPoints", "desc");
    });

    it("clamps requested page to total pages", async () => {
        const docs = Array.from({ length: 10 }, (_, i) =>
            createDoc(`id-${i}`, {
                username: `u${i}`,
                totalGamesPlayed: 1,
                totalDisinformerPoints: 100 - i,
                totalNetizenPoints: 0,
                society: "",
                branch: "",
                email: "",
                username_lowercase: `u${i}`,
            })
        );

        vi.mocked(getCountFromServer).mockResolvedValue({
            data: () => ({ count: 10 }),
        } as never);
        vi.mocked(getDocs).mockResolvedValue({ docs } as never);

        const result = await getPaginatedLeaderboard(99, RankingCriteria.Disinformer, "");

        expect(result.currentPage).toBe(1);
        expect(result.totalPages).toBe(1);
        expect(limit).toHaveBeenCalledWith(10);
        expect(getDocs).toHaveBeenCalled();
    });
});
