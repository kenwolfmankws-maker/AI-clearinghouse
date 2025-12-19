import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, Pause, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Card } from './ui/card';

interface AudioGreetingPlayerProps {
  greetingUrl: string;
  backgroundMusicUrl?: string;
}

export const AudioGreetingPlayer: React.FC<AudioGreetingPlayerProps> = ({
  greetingUrl,
  backgroundMusicUrl,
}) => {
  const [greetingPlayed, setGreetingPlayed] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  const greetingAudioRef = useRef<HTMLAudioElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Auto-play greeting after a short delay
    const timer = setTimeout(() => {
      playGreeting();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const playGreeting = async () => {
    if (greetingAudioRef.current && !greetingPlayed) {
      try {
        greetingAudioRef.current.volume = volume;
        await greetingAudioRef.current.play();
        setGreetingPlayed(true);
        setShowControls(true);
      } catch (error) {
        console.log('Auto-play blocked, user interaction required');
      }
    }
  };

  const handleGreetingEnd = () => {
    if (backgroundMusicUrl && musicAudioRef.current) {
      startBackgroundMusic();
    }
  };

  const startBackgroundMusic = async () => {
    if (musicAudioRef.current) {
      try {
        musicAudioRef.current.volume = volume * 0.5; // Lower volume for background
        await musicAudioRef.current.play();
        setMusicPlaying(true);
      } catch (error) {
        console.log('Background music play failed');
      }
    }
  };

  const toggleMusic = () => {
    if (musicAudioRef.current) {
      if (musicPlaying) {
        musicAudioRef.current.pause();
      } else {
        musicAudioRef.current.play();
      }
      setMusicPlaying(!musicPlaying);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (greetingAudioRef.current) greetingAudioRef.current.muted = newMuted;
    if (musicAudioRef.current) musicAudioRef.current.muted = newMuted;
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    if (greetingAudioRef.current) greetingAudioRef.current.volume = newVolume;
    if (musicAudioRef.current) musicAudioRef.current.volume = newVolume * 0.5;
  };

  return (
    <>
      <audio ref={greetingAudioRef} src={greetingUrl} onEnded={handleGreetingEnd} />
      {backgroundMusicUrl && (
        <audio ref={musicAudioRef} src={backgroundMusicUrl} loop />
      )}
      
      {showControls && (
        <Card className="fixed bottom-6 right-6 z-50 bg-slate-800/95 border-slate-700 p-4 w-64">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300 font-medium">Audio Controls</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleMute}
                className="h-8 w-8 p-0"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-slate-400" />
                ) : (
                  <Volume2 className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-slate-400" />
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.1}
                className="flex-1"
              />
            </div>
            
            {backgroundMusicUrl && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Background Music</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleMusic}
                  className="h-8 w-8 p-0"
                >
                  {musicPlaying ? (
                    <Pause className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Play className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  );
};
