import {
  CameraIcon,
  MicIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  SkipBackIcon,
  SkipForwardIcon,
  VideoIcon,
  VolumeXIcon,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { spotifyApi, loginUrl, getTokenFromUrl } from "../../lib/spotify";

export const Iphone = (): JSX.Element => {
  const [time, setTime] = useState(30); // Initial time in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime, setInitialTime] = useState(30);
  const [dashOffset, setDashOffset] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyApi.CurrentlyPlayingResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioContext] = useState(new (window.AudioContext || (window as any).webkitAudioContext)());
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  useEffect(() => {
    // Load and decode audio file
    fetch('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(buffer => setAudioBuffer(buffer))
      .catch(error => console.error('Error loading audio:', error));
  }, [audioContext]);

  const playSound = () => {
    if (audioBuffer && audioContext) {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    }
  };

  const handleVoiceMemo = async () => {
    try {
      if (!isRecordingAudio) {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
        setAudioStream(audioStream);
        
        const recorder = new MediaRecorder(audioStream);
        const chunks: BlobPart[] = [];
        
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `voice-memo-${new Date().toISOString()}.wav`;
          a.click();
          URL.revokeObjectURL(url);
        };
        
        recorder.start();
        setAudioRecorder(recorder);
        setIsRecordingAudio(true);
      } else {
        audioRecorder?.stop();
        audioStream?.getTracks().forEach(track => track.stop());
        setAudioStream(null);
        setAudioRecorder(null);
        setIsRecordingAudio(false);
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      
      const blob = await imageCapture.takePhoto();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-${new Date().toISOString()}.jpg`;
      a.click();
      
      URL.revokeObjectURL(url);
      track.stop();
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  useEffect(() => {
    const hash = getTokenFromUrl();
    const _token = hash.access_token;
    
    if (_token) {
      setToken(_token);
      spotifyApi.setAccessToken(_token);
      window.location.hash = "";
    }
  }, []);

  const getCurrentTrack = useCallback(async () => {
    if (!token) return;
    try {
      const track = await spotifyApi.getMyCurrentPlayingTrack();
      setCurrentTrack(track);
      setIsPlaying(track.is_playing);
    } catch (error) {
      console.error("Error fetching current track:", error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      getCurrentTrack();
      const interval = setInterval(getCurrentTrack, 1000);
      return () => clearInterval(interval);
    }
  }, [token, getCurrentTrack]);

  const handlePlayPause = async () => {
    if (!token) {
      window.location.href = loginUrl;
      return;
    }
    try {
      if (isPlaying) {
        await spotifyApi.pause();
      } else {
        await spotifyApi.play();
      }
      getCurrentTrack();
    } catch (error) {
      console.error("Error controlling playback:", error);
    }
  };

  const handleSkip = async (direction: 'next' | 'previous') => {
    if (!token) return;
    try {
      if (direction === 'next') {
        await spotifyApi.skipToNext();
      } else {
        await spotifyApi.skipToPrevious();
      }
      getCurrentTrack();
    } catch (error) {
      console.error("Error skipping track:", error);
    }
  };

  const handleMuteToggle = async () => {
    setIsMuted(!isMuted);
    audio.muted = !isMuted;
    
    if (token) {
      try {
        if (!isMuted) {
          // Muting
          await spotifyApi.setVolume(0);
        } else {
          // Unmuting - restore to 100%
          await spotifyApi.setVolume(100);
        }
      } catch (error) {
        console.error("Error controlling volume:", error);
      }
    }
  };

  const handleVideoRecording = async () => {
    try {
      if (!isRecording) {
        // Store current timer state before opening camera
        const currentTimerState = {
          time: time,
          isRunning: isRunning
        };

        // Start recording
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: true
        });
        setStream(videoStream);
        
        const recorder = new MediaRecorder(videoStream);
        const chunks: BlobPart[] = [];
        
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          // Restore timer state after recording
          const blob = new Blob(chunks);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `video-${new Date().toISOString()}.mp4`;
          a.click();
          URL.revokeObjectURL(url);
        };
        
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        
        // Open native camera app if available
        if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
          try {
            await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
          } catch (err) {
            console.log('Native camera app not available');
          }
        }
      } else {
        // Stop recording
        mediaRecorder?.stop();
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
        setMediaRecorder(null);
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  // Data for bottom toolbar
  const toolbarItems = [
    { 
      icon: <VolumeXIcon className={`w-12 h-12 ${isMuted ? 'text-[#ff6b6b]' : 'text-white'}`} />, 
      alt: "Volume off",
      onClick: handleMuteToggle 
    },
    { 
      icon: <MicIcon className={`w-12 h-12 ${isRecordingAudio ? 'text-[#ff6b6b]' : 'text-white'}`} />, 
      alt: "Mic",
      onClick: handleVoiceMemo
    },
    { 
      icon: <CameraIcon className="w-12 h-12 text-white" />, 
      alt: "Photo camera",
      onClick: handleTakePhoto
    },
    { 
      icon: <VideoIcon className={`w-12 h-12 ${isRecording ? 'text-[#ff6b6b]' : 'text-white'}`} />, 
      alt: "Videocam",
      onClick: handleVideoRecording 
    },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime === 0) {
            playSound();
            setIsRunning(false);
            setTime(initialTime);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, time, audio]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (time === 0) return;
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(initialTime);
  };

  const adjustTime = (amount: number) => {
    if (!isRunning) {
      const newTime = Math.max(0, time + amount);
      setTime(newTime);
      setInitialTime(newTime);
    }
  };

  useEffect(() => {
    // Calculate the progress for the SVG circle
    const circumference = 2 * Math.PI * 131; // radius of 131px from the SVG
    const progress = time === initialTime ? 0 : 1 - (time / initialTime);
    setDashOffset(circumference * progress);
  }, [time, initialTime]);

  return (
    <div className="flex min-h-screen items-center gap-2.5 p-6 relative bg-[#181818]">
      <div className="flex flex-col items-start gap-6 relative flex-1 self-stretch grow">
        {/* Header */}
        <header className="flex items-center justify-center relative self-stretch w-full">
          <h1 className="relative w-[171px] h-[60px] mt-[-1.00px] font-black text-white text-[50px] tracking-[0] leading-normal whitespace-nowrap">
            TRNRS
          </h1>
        </header>

        {/* Timer Card */}
        <Card className="flex flex-col items-center gap-3 p-4 relative flex-1 self-stretch w-full bg-[#1f1f1f] rounded-2xl border-none">
          <CardContent className="flex flex-col items-center p-0 w-full gap-3">
            {/* Timer Display */}
            <div className="flex items-center justify-center gap-2.5 relative flex-1 self-stretch w-full grow rounded-[1000px] min-h-[300px]">
              {/* Timer Circle */}
              <div className="absolute w-[264px] h-[264px] inset-0 m-auto">
                <svg width="264" height="264" viewBox="0 0 264 264">
                  <circle
                    cx="132"
                    cy="132"
                    r="131"
                    fill="none"
                    stroke={time <= initialTime * 0.1 ? "#ff6b6b" : "#3dd598"}
                    strokeWidth="2"
                    strokeDasharray={2 * Math.PI * 131}
                    strokeDashoffset={String(dashOffset)}
                    transform="rotate(-90 132 132)"
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease-in-out' }}
                  />
                </svg>
              </div>

              <div className="flex flex-col items-start relative flex-1 grow">
                <div className="flex flex-col items-center gap-2.5 relative self-stretch w-full">
                  <div 
                    className={`relative self-stretch mt-[-1.00px] font-bold text-[46px] text-center tracking-[0] leading-normal ${
                      time <= initialTime * 0.1 ? 'text-[#ff6b6b]' : 'text-white'
                    }`}
                    style={{ transition: 'color 0.3s ease-in-out' }}
                  >
                    {formatTime(time)}
                  </div>

                  <div className="flex items-start justify-center gap-4 relative self-stretch w-full">
                    <Button
                      variant="ghost"
                      onClick={() => adjustTime(-5)}
                      className="inline-flex items-center justify-center p-4 bg-[#2a2a2a] rounded-[100px] hover:bg-[#333333]"
                    >
                      <MinusIcon className="w-6 h-6 text-white" />
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => adjustTime(5)}
                      className="inline-flex items-center justify-center p-4 bg-[#2a2a2a] rounded-[100px] hover:bg-[#333333]"
                    >
                      <PlusIcon className="w-6 h-6 text-white" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="gap-2.5 flex items-start relative self-stretch w-full">
              <Button
                variant="ghost"
                onClick={handleReset}
                className="flex h-16 items-center justify-center gap-2.5 relative flex-1 grow bg-[#2a2a2a] rounded-[100px] hover:bg-[#333333]"
              >
                <RefreshCwIcon className="w-6 h-6 text-white" />
                <span className="font-medium text-white text-base text-center tracking-[0] leading-normal whitespace-nowrap">
                  Reset
                </span>
              </Button>

              <Button 
                onClick={handleStart}
                className={`flex h-16 items-center justify-center gap-2.5 relative flex-1 grow rounded-[100px] border-none ${
                  time === 0 ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#3dd598] hover:bg-[#35c089]'
                }`}
                disabled={time === 0}
              >
                {isRunning ? (
                  <PauseIcon className="w-6 h-6 text-white" />
                ) : (
                  <PlayIcon className="w-6 h-6 text-white" />
                )}
                <span className="font-medium text-white text-base text-center tracking-[0] leading-normal whitespace-nowrap">
                  {isRunning ? 'Pause' : 'Start'}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Media Player Card */}
        <Card className="flex flex-col h-[164px] items-center gap-3 p-4 relative self-stretch w-full bg-[#1f1f1f] rounded-2xl border-none">
          <CardContent className="flex flex-col gap-3 p-0 w-full">
            {token ? (
              <>
                <div className="flex items-center gap-3 relative self-stretch w-full">
                  <div
                    className="relative w-20 h-20 rounded-xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${currentTrack?.item?.album?.images[0]?.url})` }}
                  />
                  <div className="flex flex-col h-10 items-start gap-px relative flex-1 grow">
                    <h3 className="relative self-stretch mt-[-1.00px] font-normal text-white text-lg tracking-[0] leading-normal">
                      {currentTrack?.item?.name || "No track playing"}
                    </h3>
                    <p className="relative self-stretch font-normal text-white text-sm tracking-[0] leading-normal">
                      {currentTrack?.item?.artists?.[0]?.name || "Unknown artist"}
                    </p>
                  </div>
                </div>
                <div className="justify-around gap-1 flex items-start relative self-stretch w-full">
                  <div className="inline-flex items-center gap-1 relative">
                    <Button
                      variant="ghost"
                      className="p-0 h-auto"
                      onClick={() => handleSkip('previous')}
                      aria-label="Previous"
                    >
                      <SkipBackIcon className="w-10 h-10 text-white" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto"
                      onClick={handlePlayPause}
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? (
                        <PauseIcon className="w-10 h-10 text-white" />
                      ) : (
                        <PlayIcon className="w-10 h-10 text-white" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto"
                      onClick={() => handleSkip('next')}
                      aria-label="Next"
                    >
                      <SkipForwardIcon className="w-10 h-10 text-white" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <Button
                  variant="ghost"
                  className="text-white"
                  onClick={() => window.location.href = loginUrl}
                >
                  Connect to Spotify
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Toolbar */}
        <div className="flex h-16 items-start justify-between relative self-stretch w-full">
          {toolbarItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={item.onClick}
              className="inline-flex items-center gap-2.5 p-4 bg-[#1f1f1f] rounded-[100px] hover:bg-[#2a2a2a]"
              aria-label={item.alt}
            >
              {item.icon}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};