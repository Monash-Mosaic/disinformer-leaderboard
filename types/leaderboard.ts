export enum RankingCriteria {
    Disinformer = 'disinformer',
    Netizen = 'netizen'
}

export interface Player {
    id: string;
    username: string;
    totalGamesPlayed: number;
    totalDisinformerPoints: number;
    totalNetizenPoints: number;
    society: string;
    branch: string;
    email: string;
    username_lowercase: string;
    // Convert to ISO string for easier serialization
    lastGamePlayedAt?: string | null;
    // Convert to ISO string for easier serialization
    createdAt?: string | null;
    avatar?: string | null;
    surveysCompleted?: number;
}