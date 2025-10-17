import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { AnimatePresence, motion } from 'framer-motion';
import HomeView from './components/HomeView';
import ReelsView from './components/ReelsView';
import LibraryView from './components/LibraryView';
import SettingsView from './components/SettingsView';
import RadioView from './components/RadioView';
import CreateView from './components/CreateView';
import MiniPlayer from './components/MiniPlayer';
import BottomNav from './components/BottomNav';
import PlayerOverlay from './components/PlayerOverlay';
import AssistantView from './components/AssistantView';
import Notification from './components/Notification';
import ProfileView from './components/ProfileView';
import CreatePlaylistModal from './components/CreatePlaylistModal';
import CustomizeAppearanceView from './components/CustomizeAppearanceView';
import CustomizeParticlesView from './components/CustomizeParticlesView';
import LyricsView from './components/LyricsView';
import MoodEmojiModal from './components/MoodEmojiModal';
import EqualizerModal from './components/EqualizerModal';
import NeonGlowModal from './components/NeonGlowModal';
import AssistantSettingsView from './components/AssistantSettingsView';
import HelpView from './components/HelpView';
import AnalyticsView from './components/AnalyticsView';
import WisdomCardView from './components/WisdomCardView';
import AddWisdomModal from './components/AddWisdomModal';
import AddMoodModal from './components/AddMoodModal';
import OnlineDiscoveryView from './components/OnlineDiscoveryView';
import ArtistView from './components/ArtistView';
import ManageRadioHubView from './components/ManageRadioHubView';
import PlaylistManagerModal from './components/PlaylistManagerModal';
import ImportPlaylistModal from './components/ImportPlaylistModal';
import ShareablePreviewModal from './components/ShareablePreviewModal';
import SimpleModeSettingsView from './components/SimpleModeSettingsView';
import PlaylistView from './components/PlaylistView';
import ReelPlaylistView from './components/ReelPlaylistView';
import RingtoneMakerModal from './components/RingtoneMakerModal';
import { MultiStepLoader } from './components/MultiStepLoader';
import UploadToast from './components/UploadToast';
import BackgroundEffects from './components/BackgroundEffects';
import Onboarding from './components/Onboarding';
import Confetti from './components/Confetti';
import { useAssistant } from './hooks/useAssistant';
import { useAudioFx } from './hooks/useAudioFx';
import { useUiSounds } from './hooks/useUiSounds';
import { initDB, getSongs, getPlaylists, savePlaylists, getProfile, saveProfile, getVideos, getReelPlaylists, saveReelPlaylists, getPlayQueue, savePlayQueue, getRadioPlaylists, saveRadioPlaylists, getArtists, saveArtist, fetchRadioAPI, fetchFromAudius, fetchFromArchive, fetchFromJamendo, addOrUpdateSongs, deleteSongFromDB, addOrUpdateVideos, deleteVideoFromDB } from './components/db';
import { navItems, themePairs as themes, fonts, achievements, FAVORITES_PLAYLIST_ID, allWisdom, getRandomCoverArt, defaultMoods } from './constants';
import { truncate, findSongByTitle, addToTopSongs, addToTopArtists, addToTopRadios, fadeAudio } from './utils/helpers';
import type { Song, RadioStation, Notification as NotificationType, Playlist, ProfileData, Achievement, Video, ThemeColors, ReelPlaylist, RadioPlaylist, Artist, ThemePair } from './types';


const loadingStates = [
  { text: "🎵 Tuning your vibe..." },
  { text: "🌈 Blending gradients & glow..." },
  { text: "🎧 Personalizing your sound..." },
  { text: "✨ Animating micro‑interactions..." },
  { text: "🔊 Boosting bass & clarity..." },
];

// --- NEW: Page Transitions ---
const slideTransition = {
  initial: { opacity: 0, x: 30 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -30 },
};

const fadeTransition = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

const zoomTransition = {
    initial: { opacity: 0, scale: 0.95 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 0.95 },
};

const getTransitionForView = (viewName: string) => {
    switch(viewName) {
        case 'Library':
        case 'Settings':
        case 'Profile':
        case 'Analytics':
        case 'Help':
        case 'AssistantSettings':
        case 'CustomizeParticles':
        case 'ManageRadioHub':
        case 'SimpleModeSettings':
        case 'Appearance':
            return slideTransition;
        case 'Reels':
        case 'Explore':
            return zoomTransition;
        case 'Home':
        case 'Create':
        default:
            return fadeTransition;
    }
};

const pageTransitionConfig = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
};


const App = () => {
  const [activeView, setActiveView] = useState('Home');
  const [librarySongs, setLibrarySongs] = useState<Song[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [reelPlaylists, setReelPlaylists] = useState<ReelPlaylist[]>([]);
  const [radioPlaylists, setRadioPlaylists] = useState<RadioPlaylist[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Song | null>(null);
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [playQueue, setPlayQueue] = useState<Song[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [isAssistantVisible, setIsAssistantVisible] = useState(false);
  const [isAssistantOpening, setIsAssistantOpening] = useState(false);
  const [isAssistantInputVisible, setIsAssistantInputVisible] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('all');
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);
  const [sleepTimer, setSleepTimer] = useState<{ mode: 'off' | 'duration' | 'songs'; value: number, timeoutId: number | null, songCount: number, endTime?: number }>({ mode: 'off', value: 0, timeoutId: null, songCount: 0 });
  const [isLyricsVisible, setIsLyricsVisible] = useState(false);
  const [isLyricsMinimized, setIsLyricsMinimized] = useState(false);
  const [isReelViewActive, setIsReelViewActive] = useState(false);
  const [isBottomNavHidden, setIsBottomNavHidden] = useState(false);
  const [viewHistory, setViewHistory] = useState(['Home']);
  const [artistToView, setArtistToView] = useState<string | null>(null);
  const [playlistToViewId, setPlaylistToViewId] = useState<string | null>(null);
  const [reelPlaylistToViewId, setReelPlaylistToViewId] = useState<string | null>(null);
  const [initialReelId, setInitialReelId] = useState<string | null>(null);
  const [isQueueFlashing, setIsQueueFlashing] = useState(false);
  const [isGeneratingAiPlaylist, setIsGeneratingAiPlaylist] = useState(false);
  const [isImportingPlaylist, setIsImportingPlaylist] = useState(false);
  const [dynamicThemeOverrides, setDynamicThemeOverrides] = useState<ThemeColors | null>(null);
  const [recentlyAddedSongId, setRecentlyAddedSongId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const secondaryAudioRef = useRef<HTMLAudioElement>(null);
  const [activeAudio, setActiveAudio] = useState<'primary' | 'secondary'>('primary');
  const listenTimeIntervalRef = useRef<number | null>(null);
  const metronomeIntervalRef = useRef<number | null>(null);
  const { audioFx, initializeAudioFx, applySettings } = useAudioFx();
  const [welcomeAchievement, setWelcomeAchievement] = useState<Achievement | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const metronomeContextRef = useRef<AudioContext | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const blobUrlCache = useRef(new Map<string, string>());
  const { playNotificationSound, playToggleSound } = useUiSounds();
  const assistantOnlineStatusRef = useRef<boolean | undefined>(undefined);
  
  // --- FIX: Robust Playback Transition Logic ---
  const isTransitioningRef = useRef(false);

  const handleNewTrackPlaying = () => {
    // This function is called by the audio element's native `onPlay` event.
    // We only sync the `isPlaying` state. The transition lock is managed elsewhere.
    setIsPlaying(true);
  };
  
  const handleUploadProgress = useCallback((current: number, total: number, fileName: string) => {
        if (total === 0) { // Signal to clear
            setUploadProgress(null);
            return;
        }
        setUploadProgress({ current, total, fileName });
    }, []);

  useEffect(() => {
    // Cleanup all created blob URLs when the app unmounts
    return () => {
        blobUrlCache.current.forEach(url => URL.revokeObjectURL(url));
        blobUrlCache.current.clear();
    };
  }, []);

  useEffect(() => {
      const resetIdleTimer = () => {
          if (idleTimeoutRef.current) {
              clearTimeout(idleTimeoutRef.current);
          }
          document.body.classList.remove('is-idle');
          idleTimeoutRef.current = window.setTimeout(() => {
              document.body.classList.add('is-idle');
          }, 5000);
      };

      const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'touchstart', 'keydown', 'scroll'];
      events.forEach(event => window.addEventListener(event, resetIdleTimer, { passive: true }));
      
      resetIdleTimer(); // Initial call

      return () => {
          events.forEach(event => window.removeEventListener(event, resetIdleTimer));
          if (idleTimeoutRef.current) {
              clearTimeout(idleTimeoutRef.current);
          }
      };
  }, []);

  useEffect(() => {
      if (recentlyAddedSongId) {
          const timer = setTimeout(() => setRecentlyAddedSongId(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [recentlyAddedSongId]);

  const showNotification = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info', icon?: string) => {
    const newNotification = { id: Date.now(), message, type, icon };
    setNotification(newNotification);
    playNotificationSound(type);

    setTimeout(() => {
        setNotification(prev => (prev?.id === newNotification.id ? null : prev));
    }, 3000);
  }, [playNotificationSound]);
  
  const checkAchievements = useCallback((currentProfile: ProfileData | null, type: string, value: any) => {
      if (!currentProfile) return;
      
      const newlyUnlocked: Achievement[] = [];
      const profileWithSongs = { ...currentProfile, librarySongs };
      
      achievements.forEach(ach => {
          const isAlreadyUnlocked = (currentProfile.unlockedAchievements || []).some(unlocked => unlocked.id === ach.id);
          if (!isAlreadyUnlocked && ach.criteria(profileWithSongs, type, value)) {
              newlyUnlocked.push(ach);
          }
      });

      if (newlyUnlocked.length > 0) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 4000);

            const welcome = newlyUnlocked.find(a => a.id === 'welcome');
            const others = newlyUnlocked.filter(a => a.id !== 'welcome');

            if (welcome && !welcomeAchievement) {
                setWelcomeAchievement(welcome);
            }

            others.forEach((ach, index) => {
                setTimeout(() => {
                    showNotification(`Achievement Unlocked: ${ach.name}`, 'success', ach.icon);
                }, index * 3200);
            });

          setProfile(p => {
              if (!p) return null;
              return {
                ...p,
                unlockedAchievements: [...(p.unlockedAchievements || []), ...newlyUnlocked.map(a => ({ id: a.id, date: Date.now() }))]
              };
          });
      }
  }, [librarySongs, showNotification, welcomeAchievement]);
  
  const updateProfile = useCallback((updater: (prev: ProfileData) => ProfileData) => {
    setProfile(prevProfile => {
        if (!prevProfile) return null;
        const newProfile = updater(prevProfile);

        Object.keys(newProfile.analytics || {}).forEach(key => {
            const analyticKey = key as keyof ProfileData['analytics'];
            if (newProfile.analytics?.[analyticKey] !== prevProfile.analytics?.[analyticKey]) {
                checkAchievements(newProfile, key, newProfile.analytics?.[analyticKey]);
            }
        });
        saveProfile(newProfile).catch(err => console.error("Failed to save profile:", err));
        return newProfile;
    });
  }, [checkAchievements]);

    const handleUpdateSong = useCallback((updatedSong: Song) => {
        addOrUpdateSongs([updatedSong]).then(() => {
            setLibrarySongs(s => s.map(song => song.id === updatedSong.id ? updatedSong : song));
            setPlayQueue(q => q.map(s => (s.id === updatedSong.id ? { ...s, ...updatedSong } : s)));
            setNowPlaying(np => (np && np.id === updatedSong.id) ? { ...np, ...updatedSong } : np);
            showNotification("Song details saved.", 'success');
        }).catch(err => {
            console.error("Failed to update song in DB:", err);
            showNotification("Error saving song details.", 'error');
        });
    }, [showNotification]);
    
    const handleAddSongs = useCallback((newSongs: Song[]) => {
        addOrUpdateSongs(newSongs).then(() => {
            setLibrarySongs(prevSongs => {
                const songsToUpdate = new Map<string, Song>();
                const songsToAdd: Song[] = [];

                newSongs.forEach(newSong => {
                    const existing = prevSongs.find(s => s.id === newSong.id);
                    if (existing) {
                        songsToUpdate.set(newSong.id, { ...existing, ...newSong });
                    } else {
                        songsToAdd.push(newSong);
                    }
                });

                let updatedSongs = [...prevSongs];
                if (songsToUpdate.size > 0) {
                    updatedSongs = updatedSongs.map(s => songsToUpdate.has(s.id) ? songsToUpdate.get(s.id)! : s);
                }

                if (songsToAdd.length > 0) {
                    const isDownload = !!songsToAdd[0].source;
                    if (isDownload) {
                        setRecentlyAddedSongId(songsToAdd[0].id);
                        updateProfile(p => ({ ...p, analytics: { ...p.analytics, songsDownloaded: (p.analytics.songsDownloaded || 0) + songsToAdd.length } as ProfileData['analytics'] }));
                    } else {
                        updateProfile(p => ({ ...p, analytics: { ...p.analytics, songsUploaded: (p.analytics.songsUploaded || 0) + songsToAdd.length } as ProfileData['analytics'] }));
                    }
                }

                return [...updatedSongs, ...songsToAdd];
            });
        }).catch(err => {
            console.error("Failed to save new songs to DB", err);
            showNotification("Error saving songs to your library.", "error");
        });
    }, [updateProfile, showNotification]);
  
   const handleUpdatePlaylist = (updatedPlaylist: Playlist) => {
        setPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
        showNotification("Playlist updated!", 'success');
    };

    const handleDeletePlaylist = (playlistId: string) => {
        if(window.confirm(`Are you sure you want to delete this playlist?`)) {
            setPlaylists(p => p.filter(pl => pl.id !== playlistId));
            setPlaylistToViewId(null);
            showNotification("Playlist deleted.", 'success');
        }
    };
    
    const handleUpdateReelPlaylist = (updatedPlaylist: ReelPlaylist) => {
        setReelPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
        showNotification("Reel Playlist updated!", 'success');
    };

    const handleDeleteReelPlaylist = (playlistId: string) => {
        if(window.confirm(`Are you sure you want to delete this reel playlist?`)) {
            setReelPlaylists(p => p.filter(pl => pl.id !== playlistId));
            setReelPlaylistToViewId(null);
            showNotification("Reel Playlist deleted.", 'success');
        }
    };

  const handleNext = useCallback(() => {
    // Guard against multiple rapid calls
    if (isTransitioningRef.current) return;
    if (playQueue.length === 0) return;

    // Lock the transition process. It will be unlocked when the old track is cleaned up.
    isTransitioningRef.current = true;

    let nextIndex;
    if (isShuffled && shuffleOrder.length > 0) {
        const currentShuffleIndex = shuffleOrder.indexOf(currentQueueIndex);
        nextIndex = shuffleOrder[(currentShuffleIndex + 1) % shuffleOrder.length];
    } else {
        nextIndex = (currentQueueIndex + 1) % playQueue.length;
    }
    setCurrentQueueIndex(nextIndex);
  }, [playQueue.length, currentQueueIndex, isShuffled, shuffleOrder]);

  const handlePrev = useCallback(() => {
    const audio = activeAudio === 'primary' ? audioRef.current : secondaryAudioRef.current;
    if (!audio) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (playQueue.length === 0) return;
    let prevIndex;
    if (isShuffled && shuffleOrder.length > 0) {
        const currentShuffleIndex = shuffleOrder.indexOf(currentQueueIndex);
        prevIndex = shuffleOrder[(currentShuffleIndex - 1 + shuffleOrder.length) % shuffleOrder.length];
    } else {
        prevIndex = (currentQueueIndex - 1 + playQueue.length) % playQueue.length;
    }
    setCurrentQueueIndex(prevIndex);
  }, [playQueue.length, currentQueueIndex, isShuffled, shuffleOrder, activeAudio]);
  
    const handleTogglePlay = useCallback(async () => {
        if (audioFx?.context.state === 'suspended') {
            await audioFx.context.resume();
            if (profile) {
                applySettings(profile.settings);
            }
        }
        const audio = activeAudio === 'primary' ? audioRef.current : secondaryAudioRef.current;
        if (!audio || !nowPlaying) return;
    
        const fadeDuration = 300;
    
        if (isPlaying) {
            fadeAudio(audio, 0, fadeDuration, () => {
                audio.pause();
            });
            setIsPlaying(false);
        } else {
            audio.volume = 0;
            audio.play().catch(e => {
                if (e instanceof Error && e.name === 'AbortError') {
                    // This is an expected error when playback is interrupted. Do nothing.
                } else {
                    console.error("Mwijay Music Playback Error:", String(e));
                    showNotification("Playback failed. The audio file might be corrupted or unsupported.", "error");
                }
            });
            fadeAudio(audio, 1, fadeDuration);
        }
    }, [isPlaying, nowPlaying, audioFx, activeAudio, showNotification, profile, applySettings]);

    const handleOpenAssistant = useCallback(() => {
        if (isAssistantOpening || isAssistantVisible) return;
        setIsAssistantOpening(true);
        setTimeout(() => {
            setIsAssistantVisible(true);
            setIsAssistantOpening(false);
        }, 1800);
    }, [isAssistantOpening, isAssistantVisible]);
    
    const onCycleRepeat = useCallback(() => setRepeatMode(r => r === 'none' ? 'all' : r === 'all' ? 'one' : 'none'), []);
    const onToggleShuffle = useCallback(() => setIsShuffled(s => !s), []);

    const handleBack = useCallback(() => {
        if (isPlayerVisible) { setIsPlayerVisible(false); return; }
        if (isLyricsVisible) { setIsLyricsVisible(false); return; }
        if (activeModal) { setActiveModal(null); return; }
        if (isAssistantVisible) { setIsAssistantVisible(false); return; }
        if (playlistToViewId) { setPlaylistToViewId(null); return; }
        if (reelPlaylistToViewId) { setReelPlaylistToViewId(null); return; }
        if (artistToView) { setArtistToView(null); return; }
        
        const history = [...viewHistory];
        history.pop();
        if (history.length > 0) {
            const prevView = history[history.length - 1];
            setActiveView(prevView);
            setViewHistory(history);
        } else {
            if (activeView !== 'Home') {
                setActiveView('Home');
                setViewHistory(['Home']);
            }
        }
    }, [isPlayerVisible, isLyricsVisible, activeModal, isAssistantVisible, artistToView, playlistToViewId, reelPlaylistToViewId, viewHistory, activeView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleBack();
    };
    const handlePopState = () => handleBack();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('popstate', handlePopState);
    };
  }, [handleBack]);

  useEffect(() => {
    if (isLoaded) {
      if (audioRef.current) initializeAudioFx(audioRef.current);
      if (secondaryAudioRef.current) initializeAudioFx(secondaryAudioRef.current);
    }
  }, [isLoaded, initializeAudioFx]);
  
    useEffect(() => {
        const songToPlay = playQueue[currentQueueIndex];

        if (!songToPlay) {
            setNowPlaying(null);
            setAudioSrc('');
            return;
        }

        let newSrc = '';
        if (songToPlay.audioData) {
            if (blobUrlCache.current.has(songToPlay.id)) {
                newSrc = blobUrlCache.current.get(songToPlay.id)!;
            } else {
                try {
                    const blob = new Blob([songToPlay.audioData], { type: songToPlay.mimeType || 'audio/mpeg' });
                    newSrc = URL.createObjectURL(blob);
                    blobUrlCache.current.set(songToPlay.id, newSrc);
                } catch (e) {
                    console.error("Error creating Blob URL:", String(e));
                    showNotification(`"${truncate(songToPlay.title, 20)}" is unplayable. Skipping.`, 'error');
                    setTimeout(handleNext, 500);
                    return;
                }
            }
        } else if (songToPlay.url) {
            newSrc = songToPlay.url;
        } else {
            showNotification(`"${truncate(songToPlay.title, 20)}" has no audio source. Skipping.`, 'error');
            setTimeout(handleNext, 500);
            return;
        }

        setAudioSrc(newSrc);
        setNowPlaying(songToPlay);

        if (songToPlay.duration !== Infinity && songToPlay.source) {
            updateProfile(p => ({ ...p, recentlyPlayedOnline: [songToPlay, ...(p.recentlyPlayedOnline || []).filter(s => s.id !== songToPlay.id)].slice(0, 10) }));
        } else if (songToPlay.duration !== Infinity) {
            updateProfile(p => ({ ...p, recentlyPlayed: [songToPlay.id, ...(p.recentlyPlayed || []).filter(id => id !== songToPlay.id)].slice(0, 20) }));
        }
        
    }, [currentQueueIndex, playQueue, handleNext, showNotification, updateProfile]);


    useEffect(() => {
        if (!audioSrc || !nowPlaying) return;
    
        const primaryAudio = audioRef.current;
        const secondaryAudio = secondaryAudioRef.current;
        if (!primaryAudio || !secondaryAudio) return;
    
        const crossfadeMs = (profile?.settings.crossfadeDuration ?? 0) * 1000;
        const isLiveStream = nowPlaying.duration === Infinity;
    
        setActiveAudio(prevActiveAudio => {
            const fadeOutAudio = prevActiveAudio === 'primary' ? primaryAudio : secondaryAudio;
            const fadeInAudio = prevActiveAudio === 'primary' ? secondaryAudio : primaryAudio;
    
            const cleanupOldAudio = () => {
                fadeOutAudio.pause();
                fadeOutAudio.removeAttribute('src');
                isTransitioningRef.current = false;
            };
    
            fadeInAudio.src = audioSrc;
            fadeInAudio.load();
    
            const shouldCrossfade = crossfadeMs > 0 && !isLiveStream && fadeOutAudio.src;
    
            if (shouldCrossfade) {
                fadeAudio(fadeOutAudio, 0, crossfadeMs, cleanupOldAudio);
            } else {
                cleanupOldAudio();
            }
    
            fadeInAudio.volume = shouldCrossfade ? 0 : 1;
            fadeInAudio.play().catch(e => {
                if (e instanceof Error && e.name !== 'AbortError') {
                    console.error("Mwijay Music Playback Error:", String(e));
                    showNotification("Playback failed. The audio may be corrupted.", "error");
                    isTransitioningRef.current = false;
                }
            });
            if (shouldCrossfade) {
                fadeAudio(fadeInAudio, 1, crossfadeMs);
            }
    
            return prevActiveAudio === 'primary' ? 'secondary' : 'primary';
        });
    
    }, [audioSrc, nowPlaying, profile?.settings.crossfadeDuration, showNotification]);

  
  useEffect(() => {
    const metronomeSettings = profile?.settings.metronome;
    if (!metronomeSettings) return;

    if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
    }

    if (metronomeSettings.enabled) {
        if (!metronomeContextRef.current || metronomeContextRef.current.state === 'closed') {
            metronomeContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const context = metronomeContextRef.current;

        const playSound = (type: string) => {
            if (context.state === 'suspended') context.resume();
            const now = context.currentTime;
            if (type === 'beep') {
                const osc = context.createOscillator();
                const gain = context.createGain();
                osc.connect(gain);
                gain.connect(context.destination);
                osc.frequency.setValueAtTime(880, now);
                gain.gain.setValueAtTime(1, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'click' || type === 'tick') {
                const osc = context.createOscillator();
                const gain = context.createGain();
                osc.connect(gain);
                gain.connect(context.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(type === 'click' ? 1200 : 1000, now);
                gain.gain.setValueAtTime(1, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
                osc.start(now);
                osc.stop(now + 0.02);
            } else if (type === 'kick') {
                const osc = context.createOscillator();
                const gain = context.createGain();
                osc.connect(gain);
                gain.connect(context.destination);
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(0.001, now + 0.1);
                gain.gain.setValueAtTime(1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'snare') {
                const noise = context.createBufferSource();
                const bufferSize = context.sampleRate;
                const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
                const output = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.random() * 2 - 1;
                }
                noise.buffer = buffer;
                const noiseFilter = context.createBiquadFilter();
                noiseFilter.type = 'highpass';
                noiseFilter.frequency.setValueAtTime(1000, now);
                const noiseGain = context.createGain();
                noise.connect(noiseFilter).connect(noiseGain).connect(context.destination);
                noiseGain.gain.setValueAtTime(1, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                noise.start(now);
                noise.stop(now + 0.1);
                const osc = context.createOscillator();
                const oscGain = context.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, now);
                osc.connect(oscGain).connect(context.destination);
                oscGain.gain.setValueAtTime(0.8, now);
                oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'hihat') {
                const noise = context.createBufferSource();
                const bufferSize = context.sampleRate;
                const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
                const output = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.random() * 2 - 1;
                }
                noise.buffer = buffer;
                const noiseFilter = context.createBiquadFilter();
                noiseFilter.type = 'highpass';
                noiseFilter.frequency.setValueAtTime(7000, now);
                const noiseGain = context.createGain();
                noise.connect(noiseFilter).connect(noiseGain).connect(context.destination);
                noiseGain.gain.setValueAtTime(1, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                noise.start(now);
                noise.stop(now + 0.05);
            }
        };
        const interval = (60 / metronomeSettings.bpm) * 1000;
        let beatCount = 0;
        metronomeIntervalRef.current = window.setInterval(() => {
            playSound(metronomeSettings.soundType)
            beatCount++;
            if (beatCount % 60 === 0) { // Update every minute
                updateProfile(p => ({
                    ...p,
                    analytics: { ...p.analytics, metronomeUsageTime: (p.analytics.metronomeUsageTime || 0) + 60 } as ProfileData['analytics']
                }));
            }
        }, interval);
    }

    return () => {
        if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
        if (metronomeContextRef.current && metronomeContextRef.current.state === 'running') {
            metronomeContextRef.current.close().catch(e => console.error("Error closing metronome context:", String(e)));
            metronomeContextRef.current = null;
        }
    };
}, [profile?.settings.metronome, updateProfile]);

  useEffect(() => {
      if (profile?.settings && audioFx) {
          applySettings(profile.settings);
      }
  }, [profile?.settings, audioFx, applySettings]);

  const handleToggleFavorite = useCallback((songId: string) => {
    const song = librarySongs.find(s => s.id === songId) || (nowPlaying && nowPlaying.id === songId ? nowPlaying : null);
    
    if (!song) {
        showNotification("Cannot favorite this song.", 'error');
        return;
    }
    
    const isSongInLibrary = librarySongs.some(s => s.id === songId);
    const isCurrentlyFavorite = song.isFavorite || false;
    const isNowFavorite = !isCurrentlyFavorite;
    const updatedSong = { ...song, isFavorite: isNowFavorite, dateAdded: song.dateAdded || Date.now() };

    addOrUpdateSongs([updatedSong]).then(() => {
        if (!isSongInLibrary && isNowFavorite) {
            setLibrarySongs(prev => [...prev, updatedSong]);
        } else {
            setLibrarySongs(prev => prev.map(s => s.id === songId ? updatedSong : s));
        }

        setNowPlaying(current => (current && current.id === songId) ? updatedSong : current);
        
        // Ensure playQueue is updated to maintain favorite state consistency
        setPlayQueue(q => q.map(s => (s.id === songId ? updatedSong : s)));

        setPlaylists(prev => {
            const favPlaylist = prev.find(p => p.id === FAVORITES_PLAYLIST_ID) || { id: FAVORITES_PLAYLIST_ID, name: 'Favorites', coverImage: getRandomCoverArt(), songIds: [] };
            const otherPlaylists = prev.filter(p => p.id !== FAVORITES_PLAYLIST_ID);
            const newSongIds = isNowFavorite 
                ? [...favPlaylist.songIds, songId]
                : favPlaylist.songIds.filter(id => id !== songId);
            
            const updatedFavPlaylist = { ...favPlaylist, songIds: Array.from(new Set(newSongIds)) };
            const newPlaylists = [updatedFavPlaylist, ...otherPlaylists];
            savePlaylists(newPlaylists); // Save playlists separately
            return newPlaylists;
        });

        if (isNowFavorite) {
            checkAchievements(profile, 'favorite1', 1);
        }
    }).catch(err => {
        console.error("Failed to update favorite status in DB:", err);
        showNotification("Could not save favorite status.", 'error');
    });
}, [librarySongs, nowPlaying, profile, showNotification, checkAchievements]);

  const handleToggleLyrics = useCallback((forceOpen?: 'full' | 'minimized') => {
    if (!nowPlaying) return;
    if (forceOpen === 'full') {
        setIsLyricsVisible(true);
        setIsLyricsMinimized(false);
        return;
    }
     if (forceOpen === 'minimized') {
        setIsLyricsVisible(false);
        setIsLyricsMinimized(true);
        return;
    }
    if (nowPlaying.lyrics) {
        if (isLyricsVisible) {
            setIsLyricsVisible(false);
            setIsLyricsMinimized(true);
        } else {
            setIsLyricsMinimized(m => !m);
        }
        updateProfile(p => {
            if (!p || p.usedFeatures.lyricsViewed) return p;
            return { ...p, usedFeatures: { ...p.usedFeatures, lyricsViewed: true } };
        });
    } else {
        setIsLyricsVisible(true);
        setIsLyricsMinimized(false);
    }
  }, [nowPlaying, isLyricsVisible, updateProfile]);
  
  const handleNavigate = useCallback((view: string) => {
    setViewHistory(hist => {
        if (hist[hist.length - 1] === view) return hist; // Avoid pushing duplicates
        return [...hist, view];
    });
    setActiveView(view);
  }, []);

    const handlePlaySong = useCallback(async (song: Song, context: Song[]) => {
        if (audioFx?.context.state === 'suspended') {
            await audioFx.context.resume();
            if (profile) {
                applySettings(profile.settings);
            }
        }
        const queueWithIds = context.map((s, i) => ({ ...s, queueId: `${s.id}-${Date.now()}-${i}` }));
        const songIndex = queueWithIds.findIndex(s => s.id === song.id);

        setIsPlayerVisible(false);
        setActiveModal(null);
        setIsLyricsVisible(false);

        setPlayQueue(queueWithIds);
        setCurrentQueueIndex(songIndex !== -1 ? songIndex : 0);
        
        setIsShuffled(false);
        setShuffleOrder([]);
        setIsPlaying(true);
    }, [audioFx, profile, applySettings]);

    const handlePlayFromQueue = useCallback((song: Song) => {
        const newIndex = playQueue.findIndex(s => s.queueId === song.queueId);
    
        if (newIndex !== -1 && newIndex !== currentQueueIndex) {
            setCurrentQueueIndex(newIndex);
            if (!isPlaying) {
                setIsPlaying(true);
            }
        } 
        else if (newIndex !== -1 && newIndex === currentQueueIndex) {
            handleTogglePlay();
        }
    }, [playQueue, currentQueueIndex, isPlaying, handleTogglePlay]);

  const handlePlayStation = useCallback(async (station: RadioStation) => {
    if (audioFx?.context.state === 'suspended') {
        await audioFx.context.resume();
    }
    const stationAsSong: Song = {
      id: station.stationuuid,
      title: station.name,
      artist: station.country,
      albumArtUrl: station.favicon || getRandomCoverArt(),
      url: station.url_resolved,
      duration: Infinity,
      isFavorite: false,
    };
    setPlayQueue([stationAsSong]);
    setCurrentQueueIndex(0);
    setIsPlayerVisible(false);
    setIsPlaying(true);
    
    updateProfile(p => {
        if (!p) return p;
        const newAnalytics: ProfileData['analytics'] = {
          ...p.analytics,
          topRadios: addToTopRadios(p.analytics.topRadios, station.stationuuid, station.name)
        };
        const newRecentlyPlayedRadios = [station, ...(p.recentlyPlayedRadios || []).filter(r => r.stationuuid !== station.stationuuid)].slice(0, 10);
        return { ...p, analytics: newAnalytics, recentlyPlayedRadios: newRecentlyPlayedRadios };
    });
  }, [updateProfile, audioFx]);
  
    const handlePlayReelAsAudio = useCallback((video: Video) => {
        const isAlreadyPlaying = nowPlaying?.id === video.id && nowPlaying.isFromReel;

        if (isAlreadyPlaying) {
            handleTogglePlay();
            return;
        }

        if (video.videoData) {
            const blob = new Blob([video.videoData], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            const reelAsSong: Song = {
                id: video.id,
                title: video.title,
                artist: video.uploader || 'Reel Audio',
                albumArtUrl: video.thumbnailUrl || getRandomCoverArt(),
                url: url,
                isFromReel: true,
            };
            setPlayQueue(q => [reelAsSong, ...q.filter(s => s.id !== reelAsSong.id)]);
            setCurrentQueueIndex(0);
            setIsPlayerVisible(false);
            setIsPlaying(true);
        }
    }, [nowPlaying, handleTogglePlay]);

  const handlePlayPlaylistRadio = useCallback((playlist: Playlist) => {
      const playlistSongs = playlist.songIds.map(id => librarySongs.find(s => s.id === id)).filter((s): s is Song => !!s);
      if (playlistSongs.length === 0) {
          showNotification(`Playlist "${playlist.name}" is empty.`, 'info');
          return;
      }
      const shuffledSongs = [...playlistSongs].sort(() => Math.random() - 0.5);
      handlePlaySong(shuffledSongs[0], shuffledSongs);
      showNotification(`Playing radio from "${playlist.name}"`, 'success', 'fa-tower-broadcast');
  }, [librarySongs, handlePlaySong, showNotification]);

  const handleSetSleepTimer = useCallback((mode: 'duration' | 'songs' | 'off', value: number) => {
    if (sleepTimer.timeoutId) clearTimeout(sleepTimer.timeoutId);
    if (mode === 'off') {
        setSleepTimer({ mode: 'off', value: 0, timeoutId: null, songCount: 0 });
        showNotification('Sleep timer cancelled.', 'info');
    } else if (mode === 'duration') {
        const timeoutId = window.setTimeout(() => {
            const audio = activeAudio === 'primary' ? audioRef.current : secondaryAudioRef.current;
            if (audio) {
                 fadeAudio(audio, 0, 3000, () => audio.pause());
                 setIsPlaying(false);
            }
            setSleepTimer({ mode: 'off', value: 0, timeoutId: null, songCount: 0 });
            showNotification('Sleep timer ended.', 'info', 'fa-bed');
        }, value * 60 * 1000);
        setSleepTimer({ mode: 'duration', value, timeoutId, songCount: 0, endTime: Date.now() + value * 60 * 1000 });
        showNotification(`Sleep timer set for ${value} minutes.`, 'success');
    } else {
        setSleepTimer({ mode: 'songs', value, timeoutId: null, songCount: value });
        showNotification(`Music will stop after ${value} songs.`, 'success');
    }
  }, [showNotification, sleepTimer.timeoutId, activeAudio]);
  
  const ai = useMemo(() => {
    const apiKey = (window as any)._env_?.API_KEY || process.env.API_KEY;
    if (apiKey) {
      try {
        return new GoogleGenAI({ apiKey });
      } catch (e) {
        console.error("Failed to initialize GoogleGenAI", String(e));
        return null;
      }
    }
    return null;
  }, []);
  
  const createLocalAiPlaylist = useCallback(() => {
        if (!profile || librarySongs.length < 5) {
            showNotification("Not enough music in your library for a local playlist.", 'info');
            return;
        }

        const topSongIds = new Set((profile.analytics?.topSongs || []).slice(0, 10).map(s => s.id));
        const topArtistNames = new Set((profile.analytics?.topArtists || []).slice(0, 5).map(a => a.name));

        const topSongs = librarySongs.filter(s => topSongIds.has(s.id));
        const songsFromTopArtists = librarySongs.filter(s => topArtistNames.has(s.artist) && !topSongIds.has(s.id));
        const otherSongs = librarySongs.filter(s => !topSongIds.has(s.id) && !topArtistNames.has(s.artist));

        const shuffle = (arr: Song[]) => arr.sort(() => 0.5 - Math.random());
        
        const finalPlaylist = shuffle([
            ...topSongs,
            ...shuffle(songsFromTopArtists).slice(0, 10),
            ...shuffle(otherSongs).slice(0, 5)
        ]).slice(0, 25);

        if (finalPlaylist.length > 0) {
            showNotification("Created a playlist from your local favorites!", 'success');
            handlePlaySong(finalPlaylist[0], finalPlaylist);
        } else {
             // Fallback if filtering results in empty, just shuffle library
            const shuffledLibrary = shuffle([...librarySongs]).slice(0, 25);
            handlePlaySong(shuffledLibrary[0], shuffledLibrary);
        }
    }, [profile, librarySongs, showNotification, handlePlaySong]);

  const handlePlayAiPlaylist = useCallback(async () => {
    if (!profile) return;
    setIsGeneratingAiPlaylist(true);

    if (!ai || !navigator.onLine) {
        showNotification("AI is offline, creating a local playlist instead.", 'info');
        createLocalAiPlaylist();
        setIsGeneratingAiPlaylist(false);
        return;
    }

    try {
      const topSongTitles = (profile.analytics?.topSongs || []).slice(0, 5).map(s => `${s.title} by ${s.artist}`).join(', ');
      
      const prompt = `Based on these songs I like (${topSongTitles.length > 0 ? topSongTitles : "various pop and electronic music"}), generate a playlist of 10 songs with a creative playlist name. The songs should be real songs that exist. Format the response as a JSON object with two keys: "playlistName" (string) and "songs" (an array of strings, where each string is "Song Title by Artist").`;
      
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: "application/json" }
      });
      const aiResponse = JSON.parse(response.text.trim());

      const playlistName = aiResponse?.playlistName || "AI Generated Playlist";
      const songStrings: string[] = Array.isArray(aiResponse?.songs) ? aiResponse.songs : [];
      
      showNotification("Finding songs online...", 'info', 'fa-search');
      
      const newPlaylistSongs: Song[] = (await Promise.all(songStrings.map(async (songStr) => {
        const query = songStr.replace(' by ', ' ');
        let results = await fetchFromJamendo(query, 1, 1);
        if (results.length > 0) return results[0];
        results = await fetchFromAudius(query, 1, 1);
        if (results.length > 0) return results[0];
        results = await fetchFromArchive(query, 1, 1);
        if (results.length > 0) return results[0];
        return null;
      }))).filter((s): s is Song => !!s);
      
      if (newPlaylistSongs.length > 0) {
        showNotification(`Created playlist: ${playlistName}`, 'success', 'fa-wand-magic-sparkles');
        handlePlaySong(newPlaylistSongs[0], newPlaylistSongs);
      } else {
        showNotification("Couldn't find matching songs online, creating a local playlist.", 'info');
        createLocalAiPlaylist();
      }
    } catch (error) {
      console.error("AI Playlist generation failed:", String(error));
      showNotification("Could not create AI playlist, creating a local one instead.", 'error');
      createLocalAiPlaylist();
    } finally {
      setIsGeneratingAiPlaylist(false);
    }
  }, [profile, showNotification, handlePlaySong, ai, createLocalAiPlaylist]);

  const handlePlayRadio = useCallback(async (query?: string) => {
    showNotification("Tuning into the airwaves...", 'info');
    try {
        const path = query 
            ? `/stations/search?name=${encodeURIComponent(query)}&limit=10&order=clickcount&reverse=true&hidebroken=true`
            : '/stations/search?limit=10&order=clickcount&reverse=true&hidebroken=true';
        
        const stations = await fetchRadioAPI(path);
        
        if (stations.length > 0) {
            const station = stations[Math.floor(Math.random() * stations.length)];
            handlePlayStation(station);
        } else {
            showNotification(`Couldn't find any radio stations for "${query || 'your request'}".`, 'error');
        }
    } catch (error) {
        console.error("Error playing radio:", String(error));
        showNotification("Could not connect to radio services.", 'error');
    }
  }, [showNotification, handlePlayStation]);

  const handlePlaySongFromLibrary = useCallback((songTitle: string) => {
    const songToPlay = findSongByTitle(songTitle, librarySongs);
    if (songToPlay) {
        handlePlaySong(songToPlay, [songToPlay, ...librarySongs.filter(s => s.id !== songToPlay.id)]);
        showNotification(`Now playing "${truncate(songToPlay.title, 20)}"`, 'info');
    } else {
        showNotification(`Could not find a song called "${truncate(songTitle, 20)}" in your library.`, 'error');
    }
  }, [librarySongs, handlePlaySong, showNotification]);

  const handleAddToQueueFromAssistant = useCallback((songTitle: string) => {
    const songToAdd = findSongByTitle(songTitle, librarySongs);
    if (songToAdd) {
        setPlayQueue(q => [...q, { ...songToAdd, queueId: `${songToAdd.id}-${Date.now()}` }]);
        setIsQueueFlashing(true);
        setTimeout(() => setIsQueueFlashing(false), 500);
        showNotification(`"${truncate(songToAdd.title, 20)}" added to queue`, 'info', 'fa-plus');
    } else {
        showNotification(`Could not find a song called "${truncate(songTitle, 20)}" in your library.`, 'error');
    }
  }, [librarySongs, showNotification]);
  
  const handleSetBackgroundEffect = useCallback((enabled: boolean, style?: ProfileData['settings']['backgroundEffects']['style']) => {
      updateProfile(p => {
          const newSettings = { ...p.settings.backgroundEffects, enabled };
          if (style) {
              newSettings.style = style;
          }
          const newUsedFeatures = style ? new Set(p.usedFeatures.backgroundEffects).add(style) : p.usedFeatures.backgroundEffects;
          return { 
              ...p, 
              settings: { ...p.settings, backgroundEffects: newSettings },
              usedFeatures: { ...p.usedFeatures, backgroundEffects: newUsedFeatures }
            };
      });
      showNotification(`Background effects updated.`, 'success');
  }, [updateProfile, showNotification]);
  
    const handleThemePairChange = (themeName: string) => {
        const selectedTheme = themes.find(t => t.name === themeName);
        if (!selectedTheme) return;

        updateProfile(p => {
            if (!p) return p;
            
            const newThemes = new Set(p.usedFeatures.themes).add(themeName);
            let newThemeMode = p.themeMode;

            if (selectedTheme.category === 'Light') {
                newThemeMode = 'light';
            } else if (selectedTheme.category === 'Dark') {
                newThemeMode = 'dark';
            }

            return {
                ...p,
                activeThemePair: themeName,
                themeMode: newThemeMode,
                usedFeatures: { ...p.usedFeatures, themes: newThemes }
            };
        });
    };

    const handleFontChange = (fontName: string) => {
        updateProfile(p => {
            if (!p) return p;
            const newFonts = new Set(p.usedFeatures.fonts).add(fontName);
            return {
                ...p,
                activeFont: fontName,
                usedFeatures: { ...p.usedFeatures, fonts: newFonts }
            };
        });
    };

    const handleApplyCustomTheme = (colors: ProfileData['customThemeColors']) => {
        updateProfile(p => {
            if (!p) return p;
            return {
                ...p,
                activeThemePair: 'Custom',
                customThemeColors: colors
            };
        });
        checkAchievements(profile, 'customTheme', 1);
    };
    
    const [initialAssistantSearch, setInitialAssistantSearch] = useState<string | undefined>(undefined);
    
    const handleSearchOnlineMusic = (query: string) => {
        handleNavigate('Explore');
        setInitialAssistantSearch(query);
    };

    const { messages: assistantMessages, sendMessage: sendAssistantMessage, isOnline: isAssistantOnline, toggleOnlineMode } = useAssistant({
      getAppState: () => ({ nowPlaying, isPlaying, librarySongs, isSimpleMode: profile?.settings.simpleMode.enabled ?? false, profile: profile!, isShuffled, repeatMode }),
      controls: {
          togglePlay: handleTogglePlay,
          playNext: handleNext,
          playPrev: handlePrev,
          setSimpleMode: (val: boolean) => updateProfile(p => ({...p, settings: {...p.settings, simpleMode: { ...p.settings.simpleMode, enabled: val }}})),
          playRadio: handlePlayRadio,
          toggleInputView: () => setIsAssistantInputVisible(v => !v),
          setThemeMode: (mode: 'light' | 'dark') => updateProfile(p => ({...p, themeMode: mode})),
          setSleepTimer: handleSetSleepTimer,
          changeFont: (fontName: string) => updateProfile(p => ({...p, activeFont: fontName})),
          applyCustomTheme: (colors: ProfileData['customThemeColors']) => { updateProfile(p => ({...p, activeThemePair: 'Custom', customThemeColors: colors})); },
          playSongFromLibrary: handlePlaySongFromLibrary,
          addToQueue: handleAddToQueueFromAssistant,
          toggleFavorite: () => { if (nowPlaying) handleToggleFavorite(nowPlaying.id) },
          navigateToView: handleNavigate,
          openAudioEffects: () => { if (nowPlaying) setActiveModal('equalizer') },
          setBackgroundEffect: handleSetBackgroundEffect,
          searchOnlineMusic: handleSearchOnlineMusic,
          playAiPlaylist: handlePlayAiPlaylist,
          toggleShuffle: onToggleShuffle,
          cycleRepeat: onCycleRepeat,
      },
      showNotification,
  });

    const handleToggleTheme = useCallback(() => {
        if (!profile) return;
        
        const currentThemePair = themes.find(t => t.name === profile.activeThemePair);
        const newMode = profile.themeMode === 'dark' ? 'light' : 'dark';

        if (currentThemePair?.category === 'Dark' && newMode === 'light') {
            updateProfile(p => ({ ...p, activeThemePair: 'Classic Light', themeMode: 'light' }));
            showNotification('Switched to a light theme', 'info');
        } else if (currentThemePair?.category === 'Light' && newMode === 'dark') {
            updateProfile(p => ({ ...p, activeThemePair: 'Default Dark', themeMode: 'dark' }));
            showNotification('Switched to a dark theme', 'info');
        } else {
            updateProfile(p => ({ ...p, themeMode: newMode }));
        }
    }, [profile, updateProfile, showNotification]);

  // Effect for assistant online/offline sound
  useEffect(() => {
    // Don't play sound on initial render
    if (assistantOnlineStatusRef.current === undefined) {
        assistantOnlineStatusRef.current = isAssistantOnline;
        return;
    }
    
    // Play sound only when status changes
    if (assistantOnlineStatusRef.current !== isAssistantOnline) {
        playToggleSound();
        assistantOnlineStatusRef.current = isAssistantOnline;
    }
  }, [isAssistantOnline, playToggleSound]);

  // --- START: Media Session API Integration ---
    useEffect(() => {
        if ('mediaSession' in navigator) {
            if (!nowPlaying) {
                navigator.mediaSession.metadata = null;
                navigator.mediaSession.playbackState = 'none';
                return;
            }

            navigator.mediaSession.metadata = new MediaMetadata({
                title: nowPlaying.title,
                artist: nowPlaying.artist,
                artwork: [{ src: nowPlaying.albumArtUrl, sizes: '512x512', type: 'image/png' }],
            });

            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        }
    }, [nowPlaying, isPlaying]);
    
    useEffect(() => {
        if ('mediaSession' in navigator && isPlaying && isFinite(duration) && duration > 0) {
            navigator.mediaSession.setPositionState({
                duration: duration,
                playbackRate: audioRef.current?.playbackRate || 1,
                position: progress,
            });
        }
    }, [progress, duration, isPlaying]);

    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        const getActiveAudio = () => activeAudio === 'primary' ? audioRef.current : secondaryAudioRef.current;
        
        const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
            ['play', handleTogglePlay],
            ['pause', handleTogglePlay],
            ['nexttrack', handleNext],
            ['previoustrack', handlePrev],
            ['seekbackward', (details) => {
                const audio = getActiveAudio();
                if (!audio) return;
                const seekOffset = details.seekOffset || 10;
                audio.currentTime = Math.max(0, audio.currentTime - seekOffset);
                setProgress(audio.currentTime);
            }],
            ['seekforward', (details) => {
                const audio = getActiveAudio();
                if (!audio) return;
                const seekOffset = details.seekOffset || 10;
                audio.currentTime = Math.min(audio.currentTime + seekOffset, duration);
                setProgress(audio.currentTime);
            }],
            ['seekto', (details) => {
                const audio = getActiveAudio();
                if (!audio || details.seekTime == null) return;
                if (details.fastSeek && 'fastSeek' in audio) {
                    audio.fastSeek(details.seekTime);
                } else {
                    audio.currentTime = details.seekTime;
                }
                setProgress(audio.currentTime);
            }],
        ];

        for (const [action, handler] of actionHandlers) {
            try { navigator.mediaSession.setActionHandler(action, handler); } 
            catch (error) { console.warn(`The media session action "${action}" is not supported.`); }
        }

        return () => {
             for (const [action] of actionHandlers) {
                try { navigator.mediaSession.setActionHandler(action, null); } catch (e) { /* no-op */ }
            }
        };
    }, [handleTogglePlay, handleNext, handlePrev, activeAudio, duration]);
  // --- END: Media Session API Integration ---

  useEffect(() => {
    const loadData = async () => {
      await initDB();
      const [songs, playlists, loadedProfile, videos, reelPlaylists, queue, radioPlaylists, artists] = await Promise.all([
          getSongs(), getPlaylists(), getProfile(), getVideos(), getReelPlaylists(), getPlayQueue(), getRadioPlaylists(), getArtists()
      ]);
      setLibrarySongs(songs.map(s => ({...s, isFavorite: false})));
      setPlaylists(playlists);
      setVideos(videos);
      setReelPlaylists(reelPlaylists);
      setRadioPlaylists(radioPlaylists);
      setPlayQueue(queue);
      setProfile(loadedProfile);
      setArtists(artists);

      const favPlaylist = playlists.find(p => p.id === FAVORITES_PLAYLIST_ID);
      if (favPlaylist) {
          setLibrarySongs(currentSongs => currentSongs.map(s => favPlaylist.songIds.includes(s.id) ? { ...s, isFavorite: true } : s));
      }
      
      setTimeout(() => setIsLoaded(true), 4000);
    };
    loadData();
  }, []);
  
  useEffect(() => { if (isLoaded) savePlaylists(playlists); }, [playlists, isLoaded]);
  useEffect(() => { if (isLoaded) saveReelPlaylists(reelPlaylists); }, [reelPlaylists, isLoaded]);
  useEffect(() => { if (isLoaded) saveRadioPlaylists(radioPlaylists); }, [radioPlaylists, isLoaded]);
  useEffect(() => { if (isLoaded) savePlayQueue(playQueue); }, [playQueue, isLoaded]);

  useEffect(() => {
    if (!profile?.settings.dynamicThemeEnabled || !nowPlaying?.albumArtUrl) {
        setDynamicThemeOverrides(null);
        return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = nowPlaying.albumArtUrl;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        
        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);

        try {
            const imageData = ctx.getImageData(0, 0, 64, 64).data;
            const colorCounts: { [key: string]: number } = {};
            let darkestColor = { r: 255, g: 255, b: 255, l: 255 };

            const isGray = (r: number, g: number, b: number, tolerance = 20) => Math.abs(r - g) < tolerance && Math.abs(g - b) < tolerance;
            const getLuminance = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

            for (let i = 0; i < imageData.length; i += 4 * 4) {
                const r = imageData[i], g = imageData[i+1], b = imageData[i+2];
                const l = getLuminance(r, g, b);
                if (l < darkestColor.l) darkestColor = { r, g, b, l };
                if (imageData[i+3] < 128 || (r > 245 && g > 245 && b > 245) || (r < 10 && g < 10 && b < 10) || isGray(r,g,b)) continue;
                const key = `${r},${g},${b}`;
                colorCounts[key] = (colorCounts[key] || 0) + 1;
            }

            const sortedColors = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);
            
            const primary = sortedColors[0] ? `rgb(${sortedColors[0]})` : '#C8F052';
            const secondaryStart = sortedColors[1] ? `rgb(${sortedColors[1]})` : '#A050FF';
            const secondaryEnd = sortedColors[2] ? `rgb(${sortedColors[2]})` : '#6955FF';
            
            const surfaceR = Math.floor(darkestColor.r * 0.4 + 10);
            const surfaceG = Math.floor(darkestColor.g * 0.4 + 10);
            const surfaceB = Math.floor(darkestColor.b * 0.4 + 10);
            const surfaceColor = `rgb(${surfaceR}, ${surfaceG}, ${surfaceB})`;
            
            const surfaceLuminance = getLuminance(surfaceR, surfaceG, surfaceB);
            const textPrimary = surfaceLuminance > 100 ? '#000000' : '#FFFFFF';
            const textSecondary = surfaceLuminance > 100 ? '#333333' : '#B3B3B3';

            setDynamicThemeOverrides({
                '--primary-accent': primary,
                '--secondary-accent-start': secondaryStart,
                '--secondary-accent-end': secondaryEnd,
                '--surface-color': surfaceColor,
                '--bg-color': `rgb(${Math.floor(surfaceR * 0.7)}, ${Math.floor(surfaceG * 0.7)}, ${Math.floor(surfaceB * 0.7)})`,
                '--chip-bg': `rgba(${surfaceR + 20}, ${surfaceG + 20}, ${surfaceB + 20}, 1)`,
                '--text-primary': textPrimary,
                '--text-secondary': textSecondary,
            });
        } catch (e) {
            console.error("Error getting dominant color:", String(e));
            setDynamicThemeOverrides(null);
        }
    };
    img.onerror = () => setDynamicThemeOverrides(null);
}, [nowPlaying?.albumArtUrl, profile?.settings.dynamicThemeEnabled]);


useEffect(() => {
    if (!profile) return;
    const root = document.documentElement;
    
    const theme = themes.find(t => t.name === profile.activeThemePair);
    let colors: ThemeColors;
    
    if (theme) {
        colors = theme[profile.themeMode];
    } else if (profile.activeThemePair === 'Custom') {
        const base = profile.themeMode === 'light' 
          ? { '--bg-color': '#F9FAFB', '--surface-color': '#FFFFFF', '--text-primary': '#111827', '--text-secondary': '#374151', '--chip-bg': '#E5E7EB', '--surface-border-color': 'rgba(17, 24, 39, 0.1)' }
          : { '--bg-color': '#111827', '--surface-color': '#1F2937', '--text-primary': '#F9FAFB', '--text-secondary': '#D1D5DB', '--chip-bg': '#374151', '--surface-border-color': 'rgba(249, 250, 251, 0.1)' };
        colors = { ...base, '--primary-accent': profile.customThemeColors.primary, '--secondary-accent-start': profile.customThemeColors.secondary, '--secondary-accent-end': profile.customThemeColors.accent, }
    } else {
        const defaultTheme = themes.find(t => t.name === 'Default Dark') as ThemePair;
        colors = defaultTheme[profile.themeMode];
    }

    let finalColors = { ...colors };
    if (profile.settings.dynamicThemeEnabled && dynamicThemeOverrides) {
        finalColors = { ...finalColors, ...dynamicThemeOverrides };
    }

    Object.entries(finalColors).forEach(([key, value]) => { root.style.setProperty(key, value); });

    const font = fonts.find(f => f.name === profile.activeFont);
    if (font) { root.style.setProperty('--font-family', font.family); }
}, [profile?.activeThemePair, profile?.themeMode, profile?.activeFont, profile?.customThemeColors, dynamicThemeOverrides, profile?.settings.dynamicThemeEnabled]);
  
  useEffect(() => {
    if (listenTimeIntervalRef.current) clearInterval(listenTimeIntervalRef.current);
    if (isPlaying && nowPlaying) {
        listenTimeIntervalRef.current = window.setInterval(() => {
            updateProfile(p => {
                if (!p) return p;
                const isRadio = nowPlaying.duration === Infinity;
                const dayIndex = new Date().getDay();
                const newWeeklyActivity = [...(p.analytics?.weeklyActivity || Array(7).fill(0))];
                newWeeklyActivity[dayIndex] = (newWeeklyActivity[dayIndex] || 0) + 1;

                return {
                  ...p,
                  analytics: {
                    ...p.analytics,
                    listenTime: isRadio ? (p.analytics.listenTime || 0) : (p.analytics.listenTime || 0) + 1,
                    radioListenTime: isRadio ? (p.analytics.radioListenTime || 0) + 1 : (p.analytics.radioListenTime || 0),
                    weeklyActivity: newWeeklyActivity,
                  } as ProfileData['analytics']
                };
            });
        }, 1000);
    }
    return () => { if (listenTimeIntervalRef.current) clearInterval(listenTimeIntervalRef.current); };
  }, [isPlaying, nowPlaying, updateProfile]);

  const isSeeking = useRef(false);
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const audio = activeAudio === 'primary' ? audioRef.current : secondaryAudioRef.current;
      if (!audio) return;
      const newTime = parseFloat(e.target.value);
      setProgress(newTime);
      audio.currentTime = newTime;
  };

  const logSongCompletion = useCallback(() => {
      if (nowPlaying && nowPlaying.duration !== Infinity) {
          updateProfile(p => {
              if (!p) return p;
              const newAnalytics: ProfileData['analytics'] = {
                  ...p.analytics,
                  songsPlayed: (p.analytics.songsPlayed || 0) + 1,
                  topSongs: addToTopSongs(p.analytics.topSongs || [], nowPlaying),
                  topArtists: addToTopArtists(p.analytics.topArtists || [], nowPlaying.artist, nowPlaying.albumArtUrl),
              };
              return { ...p, analytics: newAnalytics };
          });
      }
  }, [nowPlaying, updateProfile]);
  
  const prepareToTransitionNext = useCallback(() => {
      if (sleepTimer.mode === 'songs' && sleepTimer.songCount > 0) {
        const newSongCount = sleepTimer.songCount - 1;
        if (newSongCount <= 0) {
          const activeAudioEl = activeAudio === 'primary' ? audioRef.current : secondaryAudioRef.current;
          if (activeAudioEl) {
            fadeAudio(activeAudioEl, 0, 3000, () => activeAudioEl.pause());
          }
          setIsPlaying(false);
          setSleepTimer({ mode: 'off', value: 0, timeoutId: null, songCount: 0 });
          showNotification('Sleep timer ended.', 'info', 'fa-bed');
          return false; // Stop transition
        } else {
          setSleepTimer(s => ({ ...s, songCount: newSongCount }));
        }
      }
      return true; // Proceed with transition
    }, [sleepTimer, activeAudio, showNotification]);

  const handleTimeUpdate = () => {
    if (isSeeking.current) return;
    const audio = activeAudio === 'primary' ? audioRef.current : secondaryAudioRef.current;
    if (audio) {
      setProgress(audio.currentTime);
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);

        const crossfadeSeconds = profile?.settings.crossfadeDuration ?? 0;
        
        if (crossfadeSeconds > 0 && repeatMode !== 'one' && playQueue.length > 1 && (audio.duration - audio.currentTime) <= crossfadeSeconds) {
            if (prepareToTransitionNext()) {
                handleNext();
            }
        }
      }
    }
  };
  
  const handleEnded = useCallback(() => {
      if (isTransitioningRef.current) {
          return;
      }
      logSongCompletion();

      if (!prepareToTransitionNext()) {
          setIsPlaying(false);
          return;
      }
  
      if (repeatMode === 'one') {
          const audio = activeAudio === 'primary' ? audioRef.current : secondaryAudioRef.current;
          if (audio) {
              audio.currentTime = 0;
              audio.play();
          }
      } else if (repeatMode === 'all' || (repeatMode === 'none' && currentQueueIndex < playQueue.length - 1)) {
          handleNext();
      } else {
          setIsPlaying(false);
      }
  }, [prepareToTransitionNext, activeAudio, repeatMode, currentQueueIndex, playQueue.length, handleNext, logSongCompletion]);

  return (
    <>
        {!isLoaded && <MultiStepLoader loadingStates={loadingStates} loading={!isLoaded} />}
        
        {isLoaded && !profile?.onboarded && (
            <Onboarding onComplete={(data) => {
                const newProfile = { ...profile!, name: data.name, avatarUrl: data.avatarUrl, onboarded: true };
                setProfile(newProfile); // Set profile immediately
                saveProfile(newProfile); // Save to DB
                // Manually trigger welcome achievement check
                setWelcomeAchievement({ id: 'welcome', name: 'Welcome Aboard!', description: 'You have started your Mwijay Music journey.', icon: 'fa-rocket', emoji: '🚀', criteria: () => true });
            }} />
        )}

        {isLoaded && profile?.onboarded && (
            <div className="h-full w-full relative overflow-hidden">
                <audio ref={audioRef} onPlay={handleNewTrackPlaying} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleTimeUpdate} onEnded={handleEnded} />
                <audio ref={secondaryAudioRef} onPlay={handleNewTrackPlaying} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleTimeUpdate} onEnded={handleEnded} />

                {profile && <BackgroundEffects settings={profile.settings.backgroundEffects} />}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeView}
                        className="h-full w-full absolute"
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={getTransitionForView(activeView)}
                        transition={pageTransitionConfig}
                    >
                        {/* Conditional rendering of views */}
                        {activeView === 'Home' && profile && <HomeView profile={profile} librarySongs={librarySongs} onNavigate={handleNavigate} onPlaySong={handlePlaySong} onOpenAssistant={handleOpenAssistant} onToggleTheme={handleToggleTheme} onOpenAddMoodModal={() => setActiveModal('addMood')} isAssistantOpening={isAssistantOpening} />}
                        {activeView === 'Library' && profile && <LibraryView songs={librarySongs} playlists={playlists} onAddSongs={handleAddSongs} onUpdateSong={handleUpdateSong} onPlaySong={handlePlaySong} onAddToQueue={(song) => { setPlayQueue(q => [...q, {...song, queueId: `${song.id}-${Date.now()}`}]); setIsQueueFlashing(true); setTimeout(() => setIsQueueFlashing(false), 500); }} onCreatePlaylist={() => setActiveModal('createPlaylist')} onToggleFavorite={handleToggleFavorite} onViewPlaylist={(id) => { setPlaylistToViewId(id); }} onDeletePlaylist={handleDeletePlaylist} showNotification={showNotification} onOpenSongDetails={(song) => setModalData({ song, type: 'share' })} onViewArtist={(name) => { setArtistToView(name); }} onOpenPlaylistManager={() => setActiveModal('playlistManager')} onDeleteSong={(id) => { deleteSongFromDB(id); setLibrarySongs(s => s.filter(song => song.id !== id)); showNotification('Song deleted.', 'success'); }} onPlayPlaylistRadio={handlePlayPlaylistRadio} recentlyAddedSongId={recentlyAddedSongId} onUploadProgress={handleUploadProgress} />}
                        {activeView === 'Reels' && profile && <ReelsView videos={videos} reelPlaylists={reelPlaylists} onUpdate={(updater) => setVideos(updater)} onUpdateReelPlaylists={setReelPlaylists} isLibraryPlaying={isPlaying} onReelActiveChange={setIsReelViewActive} showNotification={showNotification} onToggleNavVisibility={setIsBottomNavHidden} profile={profile} onUpdateProfile={updateProfile} onPlayReelAsAudio={handlePlayReelAsAudio} nowPlaying={nowPlaying} onOpenAssistant={handleOpenAssistant} isAssistantOnline={isAssistantOnline} onViewReelPlaylist={(id) => { setReelPlaylistToViewId(id); }} initialVideoId={initialReelId} onUploadProgress={handleUploadProgress} />}
                        {activeView === 'Settings' && profile && <SettingsView profile={profile} onUpdateProfile={updateProfile} onOpenNeonGlowModal={() => setActiveModal('neonGlow')} onNavigate={handleNavigate} />}
                        {activeView === 'Explore' && profile && <OnlineDiscoveryView profile={profile} librarySongs={librarySongs} onPlaySong={handlePlaySong} onAddSongs={handleAddSongs} showNotification={showNotification} onNavigate={handleNavigate} onPlayAiPlaylist={handlePlayAiPlaylist} isGeneratingAiPlaylist={isGeneratingAiPlaylist} onUpdateProfile={updateProfile} initialSearchQuery={initialAssistantSearch || undefined} onClearInitialSearch={() => setInitialAssistantSearch(undefined)} onOpenSongDetails={(song) => setModalData({ song, type: 'share' })} />}
                        {activeView === 'Radio' && profile && <RadioView profile={profile} onPlayStation={handlePlayStation} favoriteStations={profile.favoriteRadioStations || []} onToggleFavorite={(station) => updateProfile(p => ({...p, favoriteRadioStations: (p.favoriteRadioStations || []).some(s => s.stationuuid === station.stationuuid) ? (p.favoriteRadioStations || []).filter(s => s.stationuuid !== station.stationuuid) : [...(p.favoriteRadioStations || []), station]}))} radioPlaylists={radioPlaylists} onUpdateRadioPlaylists={setRadioPlaylists} showNotification={showNotification} onNavigate={handleNavigate} />}
                        {activeView === 'Profile' && profile && <ProfileView profile={profile} onUpdateProfile={updateProfile} onOpenAppearance={() => handleNavigate('Appearance')} onBack={handleBack} onPlayTopSong={(song) => handlePlaySongFromLibrary(song.id)} onNavigate={handleNavigate} />}
                        {activeView === 'Create' && profile && <CreateView librarySongs={librarySongs} onUpdateSong={handleUpdateSong} showNotification={showNotification} onGenerate={() => checkAchievements(profile, 'ai-lyricist', 1)} />}
                        {activeView === 'Appearance' && profile && <CustomizeAppearanceView profile={profile} onClose={handleBack} onThemePairChange={handleThemePairChange} onFontChange={handleFontChange} onApplyCustomTheme={handleApplyCustomTheme} />}
                        {activeView === 'CustomizeParticles' && profile && <CustomizeParticlesView profile={profile} onUpdateProfile={updateProfile} onBack={handleBack} />}
                        {activeView === 'AssistantSettings' && profile && <AssistantSettingsView onBack={handleBack} profile={profile} onUpdateProfile={updateProfile} />}
                        {activeView === 'Help' && <HelpView onBack={handleBack} />}
                        {activeView === 'Analytics' && profile && <AnalyticsView profile={profile} onBack={handleBack} />}
                        {activeView === 'SimpleModeSettings' && profile && <SimpleModeSettingsView profile={profile} onUpdateProfile={updateProfile} onBack={handleBack} onAddWisdom={() => setActiveModal('addWisdom')} />}
                        
                        {artistToView && <ArtistView artistName={artistToView} allSongs={librarySongs} onPlaySong={handlePlaySong} onBack={() => setArtistToView(null)} onSaveArtist={(artist) => saveArtist(artist).then(() => setArtists(a => [...a.filter(art => art.name !== artist.name), artist]))} />}
                        {playlistToViewId && <PlaylistView playlist={playlists.find(p => p.id === playlistToViewId)!} allSongs={librarySongs} onPlaySong={handlePlaySong} onBack={() => setPlaylistToViewId(null)} onUpdatePlaylist={handleUpdatePlaylist} onDeletePlaylist={handleDeletePlaylist} />}
                        {reelPlaylistToViewId && <ReelPlaylistView playlist={reelPlaylists.find(p => p.id === reelPlaylistToViewId)!} allVideos={videos} onPlayReel={(videoId) => { setInitialReelId(videoId); handleNavigate('Reels'); }} onBack={() => setReelPlaylistToViewId(null)} onUpdatePlaylist={handleUpdateReelPlaylist} onDeletePlaylist={handleDeleteReelPlaylist} />}
                        
                        {activeView === 'ManageRadioHub' && profile && <ManageRadioHubView profile={profile} onUpdateProfile={updateProfile} onBack={handleBack} />}
                    </motion.div>
                </AnimatePresence>

                {nowPlaying && <MiniPlayer song={nowPlaying} isPlaying={isPlaying} progress={progress} onTogglePlay={handleTogglePlay} onShowPlayer={() => setIsPlayerVisible(true)} onToggleFavorite={() => handleToggleFavorite(nowPlaying.id)} onNext={handleNext} isHidden={isBottomNavHidden} />}
                {profile && <BottomNav items={navItems} activeItem={activeView} onItemClick={handleNavigate} isHidden={isBottomNavHidden} profile={profile} />}

                <AnimatePresence>
                    {isPlayerVisible && nowPlaying && profile && (
                        // Fix: Corrected a typo in the `PlayerOverlay` props, changing `onToggleLyrics` to `handleToggleLyrics` to pass the correct handler function.
                        <PlayerOverlay isVisible={isPlayerVisible} song={nowPlaying} isPlaying={isPlaying} progress={progress} duration={duration} onClose={() => setIsPlayerVisible(false)} onTogglePlay={handleTogglePlay} onNext={handleNext} onPrev={handlePrev} onSeek={handleSeek} onSeekStart={() => isSeeking.current = true} onSeekEnd={() => isSeeking.current = false} onSeekBy={(d) => { const audio = activeAudio === 'primary' ? audioRef.current : secondaryAudioRef.current; if(audio) audio.currentTime += d; }} onToggleFavorite={() => handleToggleFavorite(nowPlaying.id)} playQueue={playQueue} currentQueueIndex={currentQueueIndex} setPlayQueue={setPlayQueue} onPlayFromQueue={handlePlayFromQueue} repeatMode={repeatMode} isShuffled={isShuffled} onCycleRepeat={onCycleRepeat} onToggleShuffle={onToggleShuffle} onSetSleepTimer={handleSetSleepTimer} sleepTimer={sleepTimer} profile={profile} onUpdateProfile={updateProfile} onToggleLyrics={handleToggleLyrics} onOpenMoodModal={() => setActiveModal('moodEmoji')} onOpenEqualizer={() => setActiveModal('equalizer')} isLyricsMinimized={isLyricsMinimized} favoriteStations={profile.favoriteRadioStations || []} onToggleFavoriteStation={(station) => updateProfile(p => ({...p, favoriteRadioStations: (p.favoriteRadioStations || []).some(s => s.stationuuid === station.stationuuid) ? (p.favoriteRadioStations || []).filter(s => s.stationuuid !== station.stationuuid) : [...(p.favoriteRadioStations || []), station]}))} onViewArtist={(name) => { setIsPlayerVisible(false); setArtistToView(name); handleNavigate('Artist'); }} isQueueFlashing={isQueueFlashing} onSharePreview={() => setModalData({ song: nowPlaying, type: 'share' })} onExitSimpleMode={() => updateProfile(p => ({...p, settings: {...p.settings, simpleMode: { ...p.settings.simpleMode, enabled: false }}}))} visualizerColor={profile.settings.visualizerSettings.useAlbumArtColor ? dynamicThemeOverrides?.['--primary-accent'] ?? null : null} />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                     {isLyricsVisible && nowPlaying && profile && (
                        <LyricsView song={nowPlaying} profile={profile} onClose={() => setIsLyricsVisible(false)} onMinimize={() => { setIsLyricsVisible(false); setIsLyricsMinimized(true); }} onUpdateSong={handleUpdateSong} onUpdateProfile={updateProfile} progress={progress} duration={duration} />
                    )}
                </AnimatePresence>
                
                 <AnimatePresence>
                    {isAssistantVisible && profile && (
                      <AssistantView messages={assistantMessages} onSendMessage={sendAssistantMessage} onClose={() => setIsAssistantVisible(false)} onToggleInputView={() => setIsAssistantInputVisible(v => !v)} isInputVisible={isAssistantInputVisible} profile={profile} showNotification={showNotification} isOnline={isAssistantOnline} toggleOnlineMode={toggleOnlineMode} />
                    )}
                </AnimatePresence>
            </div>
        )}

        {/* Modals */}
        {activeModal === 'createPlaylist' && <CreatePlaylistModal songs={librarySongs} onClose={() => setActiveModal(null)} onSave={(playlist) => { setPlaylists(p => [...p, playlist]); setActiveModal(null); checkAchievements({...profile!, librarySongs}, 'playlist1', (playlists.length + 1)); }} />}
        {activeModal === 'moodEmoji' && nowPlaying && profile && <MoodEmojiModal song={nowPlaying} onClose={() => setActiveModal(null)} onSetMood={(songId, emoji) => handleUpdateSong({...nowPlaying, moodEmoji: nowPlaying.moodEmoji === emoji ? undefined : emoji})} allMoods={[...defaultMoods, ...(profile.customMoods || [])]} onAddMood={() => { setActiveModal(null); setTimeout(() => setActiveModal('addMood'), 300); }} />}
        {activeModal === 'equalizer' && nowPlaying && profile && <EqualizerModal profile={profile} song={nowPlaying} onClose={() => setActiveModal(null)} onUpdateProfile={updateProfile} onUpdateSong={handleUpdateSong} showNotification={showNotification} />}
        {activeModal === 'neonGlow' && profile && <NeonGlowModal profile={profile} onClose={() => setActiveModal(null)} onUpdateProfile={updateProfile} />}
        {activeModal === 'addWisdom' && profile && <AddWisdomModal onClose={() => setActiveModal(null)} onSave={(wisdom) => updateProfile(p => ({...p, customWisdom: [...(p.customWisdom || []), wisdom]}))} />}
        {activeModal === 'addMood' && profile && <AddMoodModal onClose={() => setActiveModal(null)} onSave={(mood) => updateProfile(p => ({...p, customMoods: [...(p.customMoods || []), mood]}))} />}
        {activeModal === 'playlistManager' && <PlaylistManagerModal onClose={() => setActiveModal(null)} onImportClick={() => { setActiveModal(null); setTimeout(() => setActiveModal('importPlaylist'), 300); }} onExportClick={() => { const data = JSON.stringify({ playlists, songs: librarySongs.filter(s => s.audioData) }, null, 2); const blob = new Blob([data], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'mwijay_music_backup.json'; a.click(); URL.revokeObjectURL(url); showNotification('Exporting playlists and songs...', 'success'); }} />}
        {activeModal === 'importPlaylist' && <ImportPlaylistModal onClose={() => setActiveModal(null)} onImport={() => setIsImportingPlaylist(true)} isLoading={isImportingPlaylist} />}
        {modalData?.type === 'share' && <ShareablePreviewModal song={modalData.song} onClose={() => setModalData(null)} />}
        {modalData?.type === 'ringtone' && <RingtoneMakerModal song={modalData.song} onClose={() => setModalData(null)} showNotification={showNotification} />}
        
        {/* Global Components */}
        <UploadToast progress={uploadProgress} onClose={() => setUploadProgress(null)} />
        {notification && <Notification message={notification.message} type={notification.type} icon={notification.icon} />}
        
        {showConfetti && <Confetti />}
        
        {welcomeAchievement && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-black/80 backdrop-blur-md p-6 rounded-2xl text-center pointer-events-auto max-w-sm"
                >
                    <p className="text-5xl">{welcomeAchievement.emoji}</p>
                    <h3 className="text-xl font-bold text-[var(--primary-accent)] mt-4">{welcomeAchievement.name}</h3>
                    <p className="text-sm text-neutral-300">{welcomeAchievement.description}</p>
                    <button onClick={() => setWelcomeAchievement(null)} className="mt-4 bg-[var(--primary-accent)] text-black font-bold py-2 px-6 rounded-full">Awesome!</button>
                </motion.div>
            </div>
        )}
    </>
  );
};

export default App;