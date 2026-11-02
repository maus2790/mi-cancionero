export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface SongWithConfig {
    id: number;
    songId: number;
    title: string;
    artist: string | null;
    key: string | null;
    content: string;
    order: number;
    transposition: number;
    fontSize: FontSize;
}

export interface SetlistWithSongs {
    id: number;
    name: string;
    description: string | null;
    userId: number;
    createdAt: Date;
    songs: SongWithConfig[];
}