import type { ProfileData, Song } from '../types';

export const truncate = (str: string, len: number) => str.length > len ? `${str.substring(0, len)}...` : str;

export const findSongByTitle = (title: string, songs: Song[]): Song | null => {
    if (!title) return null;
    const searchTerm = title.toLowerCase();
    
    let song = songs.find(s => s.title.toLowerCase() === searchTerm);
    if (song) return song;

    song = songs.find(s => s.title.toLowerCase().startsWith(searchTerm));
    if (song) return song;

    song = songs.find(s => s.title.toLowerCase().includes(searchTerm));
    if (song) return song;

    song = songs.find(s => s.artist.toLowerCase().includes(searchTerm));
    if (song) return song;

    return null;
}

export const addToTopSongs = (
    topSongs: ProfileData['analytics']['topSongs'], 
    song: Song
): ProfileData['analytics']['topSongs'] => {
    const existing = (topSongs || []).find(s => s.id === song.id);
    if (existing) {
        return (topSongs || [])
            .map(s => s.id === song.id ? { ...s, playCount: s.playCount + 1 } : s)
            .sort((a, b) => b.playCount - a.playCount);
    } else {
        return [...(topSongs || []), { id: song.id, title: song.title, artist: song.artist, albumArtUrl: song.albumArtUrl, playCount: 1 }]
            .sort((a, b) => b.playCount - a.playCount)
            .slice(0, 50);
    }
};

export const addToTopArtists = (
    topArtists: ProfileData['analytics']['topArtists'],
    artistName: string,
    albumArtUrl: string
): ProfileData['analytics']['topArtists'] => {
    const existing = (topArtists || []).find(a => a.name === artistName);
    if (existing) {
        return (topArtists || [])
            .map(a => a.name === artistName ? { ...a, playCount: a.playCount + 1 } : a)
            .sort((a, b) => b.playCount - a.playCount);
    } else {
        return [...(topArtists || []), { name: artistName, playCount: 1, albumArtUrl }]
            .sort((a, b) => b.playCount - a.playCount)
            .slice(0, 50);
    }
};

export const addToTopRadios = (
    topRadios: ProfileData['analytics']['topRadios'],
    stationId: string,
    name: string
): ProfileData['analytics']['topRadios'] => {
    const existing = (topRadios || []).find(r => r.stationId === stationId);
    if (existing) {
        return (topRadios || [])
            .map(r => r.stationId === stationId ? { ...r, playCount: r.playCount + 1 } : r)
            .sort((a, b) => b.playCount - a.playCount);
    } else {
        return [...(topRadios || []), { stationId, name, playCount: 1 }]
            .sort((a, b) => b.playCount - a.playCount)
            .slice(0, 50);
    }
};

export const fadeAudio = (audio: HTMLAudioElement, targetVolume: number, duration: number, onComplete?: () => void) => {
    const startVolume = audio.volume;
    const startTime = performance.now();

    const animateFade = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        const newVolume = startVolume + (targetVolume - startVolume) * progress;
        audio.volume = Math.max(0, Math.min(1, newVolume));

        if (progress < 1) {
            requestAnimationFrame(animateFade);
        } else {
            if (onComplete) onComplete();
        }
    };
    requestAnimationFrame(animateFade);
};
