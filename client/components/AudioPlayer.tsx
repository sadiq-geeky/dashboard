import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl: string;
  fileName: string;
  onClose: () => void;
  databaseDuration?: number; // Duration in seconds from database
}

export function AudioPlayer({
  audioUrl,
  fileName,
  onClose,
  databaseDuration,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(databaseDuration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [metadataLoaded, setMetadataLoaded] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      // Only use file metadata if database duration is not available
      if (
        !databaseDuration &&
        audio.duration &&
        !isNaN(audio.duration) &&
        isFinite(audio.duration)
      ) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      console.error("Error loading audio file");
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [databaseDuration]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const newTime = parseFloat(e.target.value);
    if (isNaN(newTime)) return;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changePlaybackRate = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    // Handle NaN, undefined, or invalid values
    if (!time || isNaN(time) || !isFinite(time)) {
      return "0:00";
    }

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            Playing: {fileName}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Audio Element */}
        <audio ref={audioRef} src={audioUrl} preload="none" />

        {/* Player Controls - Always show since we use database metadata */}
        {
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`,
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={restart}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Restart"
              >
                <RotateCcw className="h-5 w-5" />
              </button>

              <button
                onClick={() => skip(-10)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back 10s"
              >
                <SkipBack className="h-5 w-5" />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </button>

              <button
                onClick={() => skip(10)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Forward 10s"
              >
                <SkipForward className="h-5 w-5" />
              </button>

              <button
                onClick={() => skip(30)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Forward 30s"
              >
                <SkipForward className="h-5 w-5" />
                <span className="text-xs">30</span>
              </button>
            </div>

            {/* Speed Controls */}
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-500">Speed:</span>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={cn(
                    "px-3 py-1 rounded text-sm transition-colors",
                    playbackRate === rate
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                  )}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <button onClick={toggleMute} className="p-1">
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-gray-500" />
                ) : (
                  <Volume2 className="h-5 w-5 text-gray-500" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500 w-8">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>

            {/* Additional Info */}
            <div className="text-center text-sm text-gray-500">
              Playback Rate: {playbackRate}x | Duration: {formatTime(duration)}{" "}
              {databaseDuration && (
                <span className="text-green-600">(from database)</span>
              )}
              |
              {playbackRate !== 1 &&
                ` Adjusted Duration: ${formatTime(duration / playbackRate)}`}
            </div>
          </div>
        }
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
