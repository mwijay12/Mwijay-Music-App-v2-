import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Video, ReelPlaylist, ProfileData, Song } from '../types.ts';
import { addOrUpdateVideos } from './db.ts';
import VideoPlayer from './VideoPlayer.tsx';
import ManageReelsView from './ManageReelsView.tsx';

interface ReelsViewProps {
    videos: Video[];
    reelPlaylists: ReelPlaylist[];
    onUpdate: (updater: (prev: Video[]) => Video[]) => void;
    onUpdateReelPlaylists: (playlists: ReelPlaylist[]) => void;
    isLibraryPlaying: boolean;
    onReelActiveChange: (isActive: boolean) => void;
    showNotification: (msg: string, type?: 'success' | 'info' | 'error') => void;
    onToggleNavVisibility: (isHidden: boolean) => void;
    profile: ProfileData;
    onUpdateProfile: (updater: (prev: ProfileData) => ProfileData) => void;
    onPlayReelAsAudio: (video: Video) => void;
    nowPlaying: Song | null;
    onOpenAssistant: () => void;
    isAssistantOnline: boolean;
    onViewReelPlaylist: (playlistId: string) => void;
    initialVideoId?: string | null;
    onUploadProgress: (current: number, total: number, fileName: string) => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const generateThumbnail = (videoFile: File): Promise<string> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoFile);
        video.onloadeddata = () => {
            video.currentTime = 1; // Seek to 1 second
        };
        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            } else {
                resolve('');
            }
            URL.revokeObjectURL(video.src);
        };
        video.onerror = () => {
             resolve(''); // Resolve with empty string on error
        }
    });
};


const ReelsView: React.FC<ReelsViewProps> = ({
    videos,
    reelPlaylists,
    onUpdate,
    onUpdateReelPlaylists,
    isLibraryPlaying,
    onReelActiveChange,
    showNotification,
    onToggleNavVisibility,
    profile,
    onUpdateProfile,
    onPlayReelAsAudio,
    nowPlaying,
    onOpenAssistant,
    isAssistantOnline,
    onViewReelPlaylist,
    initialVideoId,
    onUploadProgress,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [isManaging, setIsManaging] = useState(false);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const reelsContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialVideoId) {
            const videoElement = document.getElementById(`reel-${initialVideoId}`);
            if (videoElement) {
                videoElement.scrollIntoView({ behavior: 'auto' });
            }
        }
    }, [initialVideoId]);

    const processFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const videoFiles = Array.from(files).filter((file: File) => file.type.startsWith('video/'));
        if (videoFiles.length === 0) {
            showNotification('No valid video files found.', 'error');
            return;
        }

        onUploadProgress(0, videoFiles.length, videoFiles[0].name);

        const allNewVideos: Video[] = [];
        for (let i = 0; i < videoFiles.length; i++) {
            const file = videoFiles[i];
            const newVideo = await new Promise<Video | null>((resolve) => {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const videoData = e.target?.result as ArrayBuffer;
                    const thumbnailUrl = await generateThumbnail(file);
                    resolve({
                        id: `video-${file.name}-${file.lastModified}`,
                        title: file.name.replace(/\.[^/.]+$/, ""),
                        videoData,
                        isFavorite: false,
                        comments: [],
                        thumbnailUrl,
                    });
                };
                 reader.onerror = () => {
                    console.error(`Failed to read file ${file.name}`);
                    resolve(null);
                };
                reader.readAsArrayBuffer(file);
            });
            if (newVideo) {
                allNewVideos.push(newVideo);
            }
            onUploadProgress(i + 1, videoFiles.length, file.name);
        }

        if (allNewVideos.length > 0) {
            const CHUNK_SIZE = 5; // Videos are larger, so smaller chunks
            for (let i = 0; i < allNewVideos.length; i += CHUNK_SIZE) {
                const chunk = allNewVideos.slice(i, i + CHUNK_SIZE);
                try {
                    await addOrUpdateVideos(chunk);
                } catch (e) {
                    showNotification(`Error saving reels to database.`, 'error');
                }
            }
            onUpdate((prevVideos) => [...prevVideos, ...allNewVideos]);
            showNotification(`${allNewVideos.length} reel(s) added successfully!`, 'success');
        }

        onUploadProgress(videoFiles.length, videoFiles.length, 'Complete');
        setTimeout(() => onUploadProgress(0, 0, ''), 2500);

        if (allNewVideos.length > 0) {
            const firstNewVideoId = allNewVideos[0].id;
            setTimeout(() => {
                const newReelElement = document.getElementById(`reel-${firstNewVideoId}`);
                newReelElement?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        await processFiles(event.target.files);
        if(event.target) event.target.value = ''; // Reset input
    };
    
    const handleFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        await processFiles(event.target.files);
        if(event.target) event.target.value = ''; // Reset input
    };
    
    const handleUpdateSingleVideo = useCallback((updatedVideo: Video) => {
        addOrUpdateVideos([updatedVideo]).then(() => {
            onUpdate(prevVideos => prevVideos.map(v => v.id === updatedVideo.id ? updatedVideo : v));
        }).catch(err => {
            showNotification("Error saving reel update.", 'error');
            console.error("Failed to update reel:", err);
        });
    }, [onUpdate, showNotification]);

    const handlePlaybackComplete = () => {
        const container = reelsContainerRef.current;
        if (container && videos.length > 1) {
            const nextIndex = (currentVideoIndex + 1) % videos.length;
            const nextVideoElement = document.getElementById(`reel-${videos[nextIndex].id}`);
            if (nextVideoElement) {
                nextVideoElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };
    
    useEffect(() => {
        const container = reelsContainerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const index = videos.findIndex(v => `reel-${v.id}` === entry.target.id);
                        if (index !== -1) {
                            setCurrentVideoIndex(index);
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );

        const videoElements = Array.from(container.children);
        videoElements.forEach((el: Element) => observer.observe(el));
        
        return () => observer.disconnect();
    }, [videos]);


    if (isManaging) {
        return <ManageReelsView
            videos={videos}
            reelPlaylists={reelPlaylists}
            onUpdateVideo={handleUpdateSingleVideo}
            onUpdateReelPlaylists={onUpdateReelPlaylists}
            onBack={() => setIsManaging(false)}
            onPlayReel={(videoId) => {
                const index = videos.findIndex(v => v.id === videoId);
                if (index !== -1) {
                    setIsManaging(false);
                    setTimeout(() => {
                        const el = document.getElementById(`reel-${videoId}`);
                        el?.scrollIntoView();
                    }, 0);
                }
            }}
            showNotification={showNotification}
            onViewReelPlaylist={onViewReelPlaylist}
        />;
    }

    return (
        <div className="h-full w-full bg-[var(--bg-color)] relative">
            <header className="absolute top-0 left-0 right-0 z-40 flex justify-between items-center p-4 text-[var(--text-primary)] bg-gradient-to-b from-black/50 to-transparent">
                <h1 className="font-bold text-xl">Mwijay Reels</h1>
                <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="video/*" multiple className="hidden" />
                    <input type="file" ref={folderInputRef} onChange={handleFolderSelect} {...{ webkitdirectory: "true", mozdirectory: "true", directory: "true" } as any} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="bg-[var(--chip-bg)] text-white w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105" title="Upload Reel"><i className="fas fa-plus text-xl"></i></button>
                    <button onClick={() => folderInputRef.current?.click()} className="bg-[var(--chip-bg)] text-white w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105" title="Upload Folder"><i className="fas fa-folder-open"></i></button>
                    <button onClick={() => setIsManaging(true)} className="bg-[var(--chip-bg)] text-white font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-transform hover:scale-105" title="Manage Reels">
                        <i className="fas fa-folder-open"></i>
                        <span className="hidden sm:inline">Manage</span>
                    </button>
                </div>
            </header>

            {videos.length > 0 ? (
                <div ref={reelsContainerRef} className="h-full w-full overflow-y-auto snap-y snap-mandatory">
                    {videos.map((video) => (
                        <div key={video.id} id={`reel-${video.id}`} className="h-full w-full snap-start relative flex items-center justify-center">
                            <VideoPlayer
                                video={video}
                                onUpdate={handleUpdateSingleVideo}
                                isLibraryPlaying={isLibraryPlaying}
                                onReelActiveChange={onReelActiveChange}
                                onToggleNavVisibility={onToggleNavVisibility}
                                onPlayAsAudio={onPlayReelAsAudio}
                                nowPlaying={nowPlaying}
                                profile={profile}
                                onUpdateProfile={onUpdateProfile}
                                onPlaybackComplete={handlePlaybackComplete}
                                onOpenAssistant={onOpenAssistant}
                                isAssistantOnline={isAssistantOnline}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-center text-white p-4">
                    <i className="fas fa-video-slash text-5xl text-neutral-500 mb-4"></i>
                    <h2 className="font-bold text-xl">No Mwijay Reels Yet</h2>
                    <p className="text-neutral-400 mt-2">Tap the <i className="fas fa-plus"></i> icon at the top to upload your first reel to Mwijay Music.</p>
                </div>
            )}
        </div>
    );
};

export default ReelsView;