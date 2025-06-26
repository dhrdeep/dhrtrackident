import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Timer, ExternalLink, Music, Radio } from 'lucide-react';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

interface StreamStatus {
  currentTrack: string;
  artist: string;
  djName: string;
  bitrate: string;
  uptime: string;
  trackImage: string;
  isLive: boolean;
}

const LandingPageMediaPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showSleepTimerMenu, setShowSleepTimerMenu] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    currentTrack: 'Deep House Vibes',
    artist: 'Various Artists',
    djName: 'Deep House Radio',
    bitrate: '128kbps',
    uptime: '24/7',
    trackImage: DHR_LOGO_URL,
    isLive: true
  });
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const sleepTimerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle artwork loading errors
  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  // Mobile background audio support
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && audioRef.current?.paused && isPlaying) {
        audioRef.current.play().catch(() => {
          console.log('Auto-play prevented by browser policy');
        });
      }
    };

    // Mobile-specific audio context handling
    const handleBeforeUnload = () => {
      if (audioRef.current && isPlaying) {
        // Keep audio playing in background on mobile
        audioRef.current.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isPlaying]);

  // Initialize audio context for mobile
  useEffect(() => {
    const initializeAudio = () => {
      if (audioRef.current?.paused) {
        audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
      }
    };

    document.addEventListener('click', initializeAudio, { once: true });
    document.addEventListener('touchstart', initializeAudio, { once: true });
    
    return () => {
      document.removeEventListener('click', initializeAudio);
      document.removeEventListener('touchstart', initializeAudio);
    };
  }, []);

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      setConnectionStatus('connecting');
      
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Play error:', error);
        setConnectionStatus('error');
      }
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
      setConnectionStatus('idle');
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume;
    }
  };

  const handleSleepTimerClick = () => {
    setShowSleepTimerMenu(!showSleepTimerMenu);
  };

  const setSleepTimer = (minutes: number) => {
    if (sleepTimerTimeoutRef.current) {
      clearTimeout(sleepTimerTimeoutRef.current);
    }
    
    sleepTimerTimeoutRef.current = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        setConnectionStatus('idle');
      }
    }, minutes * 60000);
    
    alert(`Sleep timer set for ${minutes} minutes.`);
    setShowSleepTimerMenu(false);
  };

  const cancelSleepTimer = () => {
    if (sleepTimerTimeoutRef.current) {
      clearTimeout(sleepTimerTimeoutRef.current);
      sleepTimerTimeoutRef.current = null;
    }
    alert('Sleep timer canceled.');
    setShowSleepTimerMenu(false);
  };

  const handlePopOut = () => {
    window.open(window.location.href, 'DHR Player', 'width=600,height=400');
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-orange-400';
      case 'connecting': return 'text-orange-300';
      case 'error': return 'text-red-400';
      case 'idle': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl p-8 max-w-4xl mx-auto text-white shadow-2xl border border-orange-400/20 backdrop-blur-xl">
      {/* Audio Element */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onPlay={() => {
          setIsPlaying(true);
          setConnectionStatus('connected');
        }}
        onPause={() => {
          if (!isPlaying) {
            setConnectionStatus('idle');
          }
        }}
        onError={() => {
          setConnectionStatus('error');
        }}
        className="hidden"
        preload="none"
      >
        <source src="https://streaming.shoutcast.com/dhr" type="audio/mpeg" />
      </audio>

      {/* Main Player Layout */}
      <div className="grid lg:grid-cols-3 gap-8 items-center">
        
        {/* Left Section - Track Info & Controls */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Station Header */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-3 mb-2">
              <Radio className="h-6 w-6 text-orange-400" />
              <h2 className="text-2xl font-bold text-orange-400">{streamStatus.djName}</h2>
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' && streamStatus.isLive ? 'bg-orange-400 shadow-lg shadow-orange-400/50 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-orange-300 animate-pulse' :
                connectionStatus === 'error' ? 'bg-red-400' :
                'bg-gray-400'
              }`}></div>
            </div>
            <p className="text-gray-400 text-sm">
              {streamStatus.isLive ? '🔴 LIVE' : 'The Deepest Beats On The Net'}
            </p>
          </div>

          {/* Current Track Display */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-orange-400/20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={streamStatus.trackImage}
                  alt="Track Artwork"
                  className="w-16 h-16 rounded-lg shadow-lg border border-orange-400/30 object-cover"
                  onError={handleArtworkError}
                />
                {isPlaying && connectionStatus === 'connected' && (
                  <div className="absolute inset-0 rounded-lg bg-orange-400/20 animate-pulse"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-lg font-semibold text-white truncate">
                  {streamStatus.currentTrack}
                </div>
                <div className="text-orange-200 truncate">
                  {streamStatus.artist}
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Music className="h-4 w-4" />
                    <span>{streamStatus.bitrate}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>Uptime: {streamStatus.uptime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex items-center justify-center lg:justify-start space-x-6">
            
            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              className={`w-16 h-16 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200 border-2 flex items-center justify-center ${
                connectionStatus === 'error'
                  ? 'bg-red-600 hover:bg-red-700 border-red-500'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-orange-400'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
            </button>

            {/* Volume Control */}
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleMute}
                className="text-orange-400 hover:text-orange-300 transition-colors p-2 rounded-lg hover:bg-orange-500/20"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              
              <span className="text-sm text-orange-300 w-10">
                {Math.round(volume * 100)}%
              </span>
            </div>

            {/* Utility Buttons */}
            <div className="flex space-x-2 relative">
              <button
                onClick={handleSleepTimerClick}
                className="p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 hover:text-orange-300 transition-all duration-200 border border-orange-400/30"
                title="Sleep Timer"
              >
                <Timer className="h-4 w-4" />
              </button>
              
              <button
                onClick={handlePopOut}
                className="p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 hover:text-orange-300 transition-all duration-200 border border-orange-400/30"
                title="Pop-Out Player"
              >
                <ExternalLink className="h-4 w-4" />
              </button>

              {/* Sleep Timer Menu */}
              {showSleepTimerMenu && (
                <div className="absolute top-12 right-0 bg-gray-900/95 backdrop-blur-xl p-4 rounded-xl z-20 border border-orange-400/30 shadow-2xl min-w-40">
                  <div className="space-y-2">
                    {[15, 30, 60].map(minutes => (
                      <button
                        key={minutes}
                        onClick={() => setSleepTimer(minutes)}
                        className="block w-full text-left px-3 py-2 text-white hover:text-orange-400 hover:bg-orange-500/20 rounded-lg transition-all duration-200 text-sm"
                      >
                        {minutes} Minutes
                      </button>
                    ))}
                    <button
                      onClick={cancelSleepTimer}
                      className="block w-full text-left px-3 py-2 text-white hover:text-orange-400 hover:bg-orange-500/20 rounded-lg transition-all duration-200 text-sm border-t border-gray-700 pt-3 mt-3"
                    >
                      Cancel Timer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Stream Status Widget */}
        <div className="space-y-4">
          
          {/* DHR Logo */}
          <div className="text-center">
            <img
              src={DHR_LOGO_URL}
              alt="DHR Logo"
              className="w-24 h-24 mx-auto rounded-2xl shadow-2xl border-2 border-orange-400/50"
              onError={handleArtworkError}
            />
          </div>

          {/* Stream Stats */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-4 border border-orange-400/20 space-y-4">
            
            {/* Connection Status */}
            <div className="text-center">
              <div className={`text-sm font-medium ${getConnectionStatusColor()}`}>
                {connectionStatus === 'connected' && streamStatus.isLive ? '🔴 LIVE' :
                 connectionStatus === 'connecting' ? '⏳ Connecting...' :
                 connectionStatus === 'error' ? '❌ Error' : '⚫ Offline'}
              </div>
              {streamStatus.djName !== 'Deep House Radio' && (
                <div className="text-xs text-gray-400 mt-1">
                  DJ: {streamStatus.djName}
                </div>
              )}
            </div>

            {/* Stream Quality Info */}
            <div className="text-center">
              <div className="bg-gray-700/30 rounded-lg p-2">
                <div className="text-orange-400 font-semibold">{streamStatus.bitrate}</div>
                <div className="text-gray-400 text-xs">Stream Quality</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            background: linear-gradient(to right, #f97316, #ea580c);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #fb923c;
            box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
          }
          
          .slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: linear-gradient(to right, #f97316, #ea580c);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #fb923c;
            box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
          }

          .slider::-webkit-slider-track {
            background: #374151;
            border-radius: 4px;
            height: 8px;
          }

          .slider::-moz-range-track {
            background: #374151;
            border-radius: 4px;
            height: 8px;
          }
        `
      }} />
    </div>
  );
};

export default LandingPageMediaPlayer;