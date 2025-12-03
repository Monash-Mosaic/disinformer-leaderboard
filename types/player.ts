export interface Player {
    // keep id as backup for unique identification incase username not unique
    id: string;
    username: string;
    totalGamesPlayed: number;
    totalDisinformerPoints: number;
    totalNetizenPoints: number;
    society: String;
    branch: String;
}