import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPaginatedLeaderboard } from "@/services/leaderboard-offset-service";
import { RankingCriteria } from "@/types/leaderboard";

vi.mock("@/utils/firebase.admin", () => ({
    getDb: vi.fn(),
}));

import { getDb } from "@/utils/firebase.admin";

function createDoc(id: string, data: Record<string, unknown>) {
    return {
        id,
        data: () => data,
    };
}

function createFirestoreQueryMocks(totalCount: number, pageDocs: ReturnType<typeof createDoc>[]) {
    const countGet = vi.fn().mockResolvedValue({
        data: () => ({ count: totalCount }),
    });

    const pageGet = vi.fn().mockResolvedValue({
        docs: pageDocs,
    });

    const query = {
        where: vi.fn(function (this: typeof query) {
            return this;
        }),
        orderBy: vi.fn(function (this: typeof query) {
            return this;
        }),
        count: vi.fn(() => ({ get: countGet })),
        select: vi.fn(function (this: typeof query) {
            return this;
        }),
        offset: vi.fn(function (this: typeof query) {
            return this;
        }),
        limit: vi.fn(function (this: typeof query) {
            return this;
        }),
        get: pageGet,
    };

    return { query, countGet, pageGet };
}

describe("getPaginatedLeaderboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns empty page when there are no players", async () => {
        const { query, countGet, pageGet } = createFirestoreQueryMocks(0, []);
        vi.mocked(getDb).mockReturnValue({
            collection: vi.fn(() => query),
        } as never);

        const result = await getPaginatedLeaderboard(1, RankingCriteria.Disinformer, "");

        expect(result.players).toEqual([]);
        expect(result.totalPages).toBe(0);
        expect(result.currentPage).toBe(1);
        expect(result.hasNextPage).toBe(false);
        expect(result.hasPrevPage).toBe(false);
        expect(countGet).toHaveBeenCalledTimes(1);
        expect(pageGet).not.toHaveBeenCalled();
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
        const { query, pageGet } = createFirestoreQueryMocks(1, docs);

        vi.mocked(getDb).mockReturnValue({
            collection: vi.fn(() => query),
        } as never);

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
        expect(pageGet).toHaveBeenCalledTimes(1);
    });

    it("applies search filters on the query chain", async () => {
        const { query } = createFirestoreQueryMocks(0, []);
        vi.mocked(getDb).mockReturnValue({
            collection: vi.fn(() => query),
        } as never);

        await getPaginatedLeaderboard(1, RankingCriteria.Netizen, "  Ali  ");

        expect(query.where).toHaveBeenCalled();
        const calls = query.where.mock.calls as unknown[][];
        expect(calls.some((c) => c[0] === "username_lowercase")).toBe(true);
        expect(query.orderBy).toHaveBeenCalledWith("totalNetizenPoints", "desc");
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
        const { query, pageGet } = createFirestoreQueryMocks(10, docs);
        vi.mocked(getDb).mockReturnValue({
            collection: vi.fn(() => query),
        } as never);

        const result = await getPaginatedLeaderboard(99, RankingCriteria.Disinformer, "");

        expect(result.currentPage).toBe(1);
        expect(result.totalPages).toBe(1);
        expect(query.offset).toHaveBeenCalledWith(0);
        expect(pageGet).toHaveBeenCalled();
    });
});
