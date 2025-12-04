export enum RankingCriteria {
    Disinformer = 'disinformer',
    Netizen = 'netizen'
}

export interface Player {
    // keep id as backup for unique identification incase username not unique
    id: string;
    username: string;
    totalGamesPlayed: number;
    totalDisinformerPoints: number;
    totalNetizenPoints: number;
    society: string;
    branch: string;
}