import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings } from 'lucide-react';

/**
 * @file CustomVideoPlayer.jsx
 * @description Componente de reproductor de video personalizado con controles personalizados.
 * @param {object} props - Propiedades del componente.
 * @param {string} props.src - La URL del video a reproducir.
 * @returns {JSX.Element} El componente del reproductor de video.
 */
export default function CustomVideoPlayer({ src }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true); 
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [wasPlaying, setWasPlaying] = useState(false);

  const controlsTimeoutRef = useRef(null);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isDragging) setShowControls(false);
    }, 2500);
  };

  const handleMouseLeave = () => {
    if (isPlaying && !isDragging) setShowControls(false);
  };

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (isDragging) return;
    
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    setCurrentTime(current);
    setProgress((current / total) * 100);
  };

  const handleProgress = () => {
    if (videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      const total = videoRef.current.duration;
      setBuffered((bufferedEnd / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
  };

  const handleSeekStart = () => {
    setIsDragging(true);
    setWasPlaying(isPlaying);
    videoRef.current.pause();
    setIsPlaying(false);
  };

  const handleSeek = (e) => {
    const seekTo = (e.target.value / 100) * duration;
    videoRef.current.currentTime = seekTo;
    setProgress(e.target.value);
    setCurrentTime(seekTo);
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
    if (wasPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    videoRef.current.volume = val;
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      videoRef.current.volume = volume > 0 ? volume : 1;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const changeSpeed = () => {
    const speeds = [1, 1.5, 2, 0.5];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    videoRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault(); 
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-2xl group w-[95vw] max-w-6xl aspect-video max-h-[85vh] border-4 border-secondary/50"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop 
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay} 
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {!isPlaying && !isDragging && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer pointer-events-none transition-opacity duration-200"
        >
          <div className="bg-accent/90 p-5 rounded-full text-white backdrop-blur-md transform transition-transform scale-100 hover:scale-110">
            <Play size={48} fill="currentColor" />
          </div>
        </div>
      )}

      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-4 px-4 transition-all duration-300
          ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <div className="relative w-full h-1.5 group/timeline cursor-pointer mb-4 flex items-center">
          <div className="absolute w-full h-1.5 bg-white/20 rounded-full"></div>
          <div className="absolute h-1.5 bg-white/40 rounded-full transition-all" style={{ width: `${buffered}%` }}></div>
          <div className="absolute h-1.5 bg-accent rounded-full" style={{ width: `${progress}%` }}></div>
          
          <input 
            type="range" min="0" max="100" 
            step="any" 
            value={progress || 0} 
            onPointerDown={handleSeekStart}
            onChange={handleSeek}
            onPointerUp={handleSeekEnd}
            className="absolute w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="hover:text-accent transition-colors">
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>

            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="hover:text-accent transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <input 
                type="range" min="0" max="1" step="0.05" 
                value={isMuted ? 0 : volume} 
                onChange={handleVolumeChange}
                className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 cursor-pointer accent-accent"
              />
            </div>

            <div className="text-sm font-medium tracking-wide">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={changeSpeed} className="flex items-center gap-1 hover:text-accent transition-colors text-sm font-bold w-12 justify-center">
              <Settings size={18} /> {playbackRate}x
            </button>

            <button onClick={toggleFullscreen} className="hover:text-accent transition-colors">
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}