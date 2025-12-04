import { Player, RankingCriteria } from "@/types/leaderboard";
import { playersCollection } from "@/utils/firebase.client";
import { DocumentData, Query, getDocs } from "firebase/firestore";

// TODO: refactor pagination and search functionality to backend for efficiency
// TODO: Real-time updates of leaderboard

export async function getPlayers(mode: RankingCriteria = RankingCriteria.Disinformer, query?: Query): Promise<Player[]> {
    try {
        const querySnapshot = await getDocs(query ?? playersCollection);

        const localPlayers = querySnapshot.docs.map((doc: DocumentData) => {
            const data = doc.data();
            return {
                ...data,
                // default to 0 if points are undefined
                totalDisinformerPoints: data.totalDisinformerPoints ?? 0,
                // default to 0 if points are undefined
                totalNetizenPoints: data.totalNetizenPoints ?? 0,
                id: doc.id,
            };
        }) as Player[];

        // Sort based on mode
        if (mode === 'netizen') {
            localPlayers.sort((a, b) => b.totalNetizenPoints - a.totalNetizenPoints); // Descending
        }
        else {
            // default to disinformer mode
            localPlayers.sort((a, b) => b.totalDisinformerPoints - a.totalDisinformerPoints); // Descending
        }

        // Return sorted players according to the mode
        return localPlayers;
    } catch (error) {
        throw error;
    }
}