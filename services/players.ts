import { Player } from "@/types/player";
import { playersCollection } from "@/utils/firebase.client";
import { DocumentData, Query, getDocs } from "firebase/firestore";

export async function getPlayers(mode?: 'disinformer' | 'netizen', query?: Query): Promise<Player[]> {
    try {
        const querySnapshot = await getDocs(query ?? playersCollection);

        const localPlayers = querySnapshot.docs.map((doc: DocumentData) => {
            const data = doc.data();
            return {
                ...data,
                // default to 0 if points are undefined
                disinformerPoints: data.disinformerPoints ?? 0,
                // default to 0 if points are undefined
                netizenPoints: data.netizenPoints ?? 0,
                id: doc.id,
            };
        }) as Player[];

        // Sort based on mode
        if (mode === 'disinformer') {
            localPlayers.sort((a, b) => b.disinformerPoints - a.disinformerPoints); // Descending
        } else if (mode === 'netizen') {
            localPlayers.sort((a, b) => b.netizenPoints - a.netizenPoints); // Descending
        }
        // If no mode, return unsorted

        return localPlayers;
    } catch (error) {
        throw error;
    }
}