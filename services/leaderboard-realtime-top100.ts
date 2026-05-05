import {
    query,
    orderBy,
    limit,
    onSnapshot,
    Query,
} from "firebase/firestore";
import { playersCollection } from "@/utils/firebase.client";
import { RankingCriteria, Player } from "@/types/leaderboard";

export function subscribeToTop100Leaderboard(
    mode: RankingCriteria,
    onUpdate: (players: Player[]) => void,
    onError: (error: Error) => void
): () => void {
    const sortField =
        mode === RankingCriteria.Netizen
            ? "totalNetizenPoints"
            : "totalDisinformerPoints";

    const q: Query = query(
        playersCollection,
        orderBy(sortField, "desc"),
        orderBy("totalGamesPlayed", "asc"),
        orderBy("username_lowercase", "asc"),
        limit(100)
    );

    let debounceTimer: any;

    const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
                const players: Player[] = snapshot.docs.map((doc) => {
                    const data = doc.data();

                    return {
                        id: doc.id,
                        username: data.username ?? "",
                        totalGamesPlayed: data.totalGamesPlayed ?? 0,
                        totalDisinformerPoints: data.totalDisinformerPoints ?? 0,
                        totalNetizenPoints: data.totalNetizenPoints ?? 0,
                        society: data.society ?? "",
                        branch: data.branch ?? "",
                    } as Player;
                });

                onUpdate(players);
            }, 200); // debounce to avoid UI flicker
        },
        (error) => {
            onError(error);
        }
    );

    return unsubscribe;
}