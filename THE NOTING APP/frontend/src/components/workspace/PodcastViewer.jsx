import React, { useState, useEffect, useRef } from 'react';
import { 
    Headphones, Play, Pause, RotateCcw, Volume2, VolumeX, Download, 
    Languages, Mic, Gauge, Wand2, AlertTriangle, FileAudio, Settings
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://the-noting-app.onrender.com' : 'http://localhost:5000');

// BCP-47 language options supported by Sarvam AI
const LANGUAGES = [
    { code: 'en-IN', label: 'English (Indian accent)', flag: '🇮🇳' },
    { code: 'hi-IN', label: 'Hindi (हिंदी)', flag: '🇮🇳' },
    { code: 'bn-IN', label: 'Bengali (বাংলা)', flag: '🇮🇳' },
    { code: 'ta-IN', label: 'Tamil (தமிழ்)', flag: '🇮🇳' },
    { code: 'te-IN', label: 'Telugu (తెలుగు)', flag: '🇮🇳' },
    { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳' },
    { code: 'ml-IN', label: 'Malayalam (മലയാളം)', flag: '🇮🇳' },
    { code: 'mr-IN', label: 'Marathi (मராठी)', flag: '🇮🇳' },
    { code: 'gu-IN', label: 'Gujarati (ગુજરાતી)', flag: '🇮🇳' },
    { code: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ)', flag: '🇮🇳' },
    { code: 'od-IN', label: 'Odia (ଓଡ଼ିଆ)', flag: '🇮🇳' }
];

// Available voices in Bulbul v3 with their gender / characteristics description
const SPEAKERS = [
    // Female voices
    { name: 'ritu', label: 'Ritu (Conversational, Female)', gender: 'female' },
    { name: 'priya', label: 'Priya (Professional, Female)', gender: 'female' },
    { name: 'neha', label: 'Neha (Clear & Consistent, Female)', gender: 'female' },
    { name: 'pooja', label: 'Pooja (Expressive, Female)', gender: 'female' },
    { name: 'simran', label: 'Simran (Dynamic, Female)', gender: 'female' },
    { name: 'kavya', label: 'Kavya (Friendly, Female)', gender: 'female' },
    { name: 'ishita', label: 'Ishita (Entertainment/Dynamic, Female)', gender: 'female' },
    { name: 'shreya', label: 'Shreya (News/Authoritative, Female)', gender: 'female' },
    // Male voices
    { name: 'aditya', label: 'Aditya (Balanced, Male - Default)', gender: 'male' },
    { name: 'rahul', label: 'Rahul (Friendly, Male)', gender: 'male' },
    { name: 'dev', label: 'Dev (Confident, Male)', gender: 'male' },
    { name: 'rohan', label: 'Rohan (Clear, Male)', gender: 'male' },
    { name: 'amit', label: 'Amit (Warm, Male)', gender: 'male' },
    { name: 'shubh', label: 'Shubh (Conversational, Male)', gender: 'male' },
    { name: 'manan', label: 'Manan (Consistent, Male)', gender: 'male' }
];

// Tones for script generation
const TONES = [
    { code: 'conversational', label: 'Podcast Dialogue (Engaging Host)', desc: 'Friendly host sharing the concepts with listeners.' },
    { code: 'educational', label: 'Lecture Explainer (Structured)', desc: 'Informative walkthrough explaining key terms clearly.' },
    { code: 'summary', label: 'Executive Summary (Briefing)', desc: 'High-level, formal synthesis of findings and details.' },
    { code: 'dramatic', label: 'Storytelling Narrative (Dynamic)', desc: 'Highlighting dramatic implications and breakthroughs.' }
];

const PodcastViewer = ({ notebookId, documents, selectedDocIds }) => {
    // Customization states
    const [language, setLanguage] = useState('en-IN');
    const [tone, setTone] = useState('conversational');
    const [speaker, setSpeaker] = useState('aditya');
    const [pace, setPace] = useState(1.0);
    const [customGuidelines, setCustomGuidelines] = useState('');

    // Workflow states
    const [step, setStep] = useState(1); // 1: Config, 2: Script Edit, 3: Audio Player
    const [scriptText, setScriptText] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Audio controls state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1.0);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

    // DOM References
    const audioRef = useRef(null);
    const animationRef = useRef(null);
    const visualizerBars = Array.from({ length: 24 });

    // Format time (seconds to mm:ss)
    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Keep track of audio progress
    const updateProgress = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            animationRef.current = requestAnimationFrame(updateProgress);
        }
    };

    // Setup audio listeners when audioUrl changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            setCurrentTime(0);
        }
        
        if (audioUrl) {
            const audio = new Audio(`${API_BASE}${audioUrl}`);
            audioRef.current = audio;
            
            audio.addEventListener('loadedmetadata', () => {
                setDuration(audio.duration);
            });

            audio.addEventListener('ended', () => {
                setIsPlaying(false);
                setCurrentTime(0);
                cancelAnimationFrame(animationRef.current);
            });

            audio.playbackRate = playbackSpeed;
            audio.volume = isMuted ? 0 : volume;

            return () => {
                audio.pause();
                cancelAnimationFrame(animationRef.current);
            };
        }
    }, [audioUrl]);

    // Handle play / pause toggle
    const handlePlayPause = () => {
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            cancelAnimationFrame(animationRef.current);
        } else {
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                    animationRef.current = requestAnimationFrame(updateProgress);
                })
                .catch(err => {
                    console.error("Audio playback error:", err);
                    setErrorMessage("Failed to play audio. Please try again.");
                });
        }
    };

    // Seek in audio file
    const handleSeek = (e) => {
        const val = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = val;
            setCurrentTime(val);
        }
    };

    // Handle volume change
    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        setIsMuted(val === 0);
        if (audioRef.current) {
            audioRef.current.volume = val;
            audioRef.current.muted = val === 0;
        }
    };

    // Toggle mute
    const handleToggleMute = () => {
        const nextMute = !isMuted;
        setIsMuted(nextMute);
        if (audioRef.current) {
            audioRef.current.muted = nextMute;
            audioRef.current.volume = nextMute ? 0 : volume;
        }
    };

    // Change playback speed in player
    const handleSpeedChange = (speed) => {
        setPlaybackSpeed(speed);
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
    };

    // Generate podcast script via LLM
    const handleGenerateScript = async () => {
        setIsGeneratingScript(true);
        setErrorMessage('');
        try {
            const response = await fetch(`${API_BASE}/api/podcast/generate-script`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notebookId,
                    selectedDocIds: selectedDocIds && selectedDocIds.length > 0 ? selectedDocIds : undefined,
                    tone,
                    language,
                    customGuidelines
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate script');
            }

            setScriptText(data.script);
            setStep(2); // Move to script editing step
        } catch (err) {
            console.error(err);
            setErrorMessage(err.message || 'An error occurred during script generation.');
        } finally {
            setIsGeneratingScript(false);
        }
    };

    // Synthesize script to audio using Sarvam API via server
    const handleSynthesizeAudio = async () => {
        if (!scriptText || !scriptText.trim()) return;
        if (scriptText.length > 2500) {
            setErrorMessage("Script exceeds the Sarvam TTS limit of 2,500 characters. Please edit the script to make it shorter.");
            return;
        }

        setIsSynthesizing(true);
        setErrorMessage('');
        try {
            const response = await fetch(`${API_BASE}/api/podcast/synthesize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: scriptText,
                    languageCode: language,
                    speaker,
                    pace
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to synthesize audio');
            }

            setAudioUrl(data.audioUrl);
            setStep(3); // Move to player step
        } catch (err) {
            console.error(err);
            setErrorMessage(err.message || 'An error occurred during voice synthesis.');
        } finally {
            setIsSynthesizing(false);
        }
    };

    // Go back to edit configuration
    const handleStartOver = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
        setAudioUrl('');
        setScriptText('');
        setStep(1);
    };

    // Character counter metrics
    const characterCount = scriptText.length;
    const isOverLimit = characterCount > 2500;

    return (
        <div className="podcast-viewer">
            {/* Header */}
            <div className="podcast-header">
                <div className="podcast-title-area">
                    <div className="podcast-icon-badge">
                        <Headphones size={20} className="text-[#f472b6]" />
                    </div>
                    <div>
                        <h3>Podcast Studio</h3>
                        <p className="podcast-subtitle">
                            {step === 1 && "Configure voice, style and parameters"}
                            {step === 2 && "Review and refine your podcast script"}
                            {step === 3 && "Play, speed control or download podcast"}
                        </p>
                    </div>
                </div>
                {step > 1 && (
                    <button className="podcast-reset-btn" onClick={handleStartOver}>
                        <RotateCcw size={14} />
                        <span>Start Over</span>
                    </button>
                )}
            </div>

            {errorMessage && (
                <div className="podcast-error-alert">
                    <AlertTriangle size={16} />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Step 1: Configuration UI */}
            {step === 1 && (
                <div className="podcast-content-grid">
                    <div className="podcast-config-form">
                        <h4><Settings size={14} style={{ marginRight: 6 }} /> Configure Details</h4>
                        
                        {/* Language Selector */}
                        <div className="config-group">
                            <label className="config-label">
                                <Languages size={14} />
                                <span>Language</span>
                            </label>
                            <div className="select-wrapper">
                                <select 
                                    value={language} 
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="podcast-select"
                                >
                                    {LANGUAGES.map(lang => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.flag} {lang.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Speaker Selector */}
                        <div className="config-group">
                            <label className="config-label">
                                <Mic size={14} />
                                <span>Voice Speaker (Indian Accent)</span>
                            </label>
                            <div className="select-wrapper">
                                <select 
                                    value={speaker} 
                                    onChange={(e) => setSpeaker(e.target.value)}
                                    className="podcast-select"
                                >
                                    {SPEAKERS.map(sp => (
                                        <option key={sp.name} value={sp.name}>
                                            {sp.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Pace Slider */}
                        <div className="config-group">
                            <label className="config-label">
                                <Gauge size={14} />
                                <span>Voice Pace (Speed multiplier: {pace}x)</span>
                            </label>
                            <div className="range-container">
                                <input 
                                    type="range" 
                                    min="0.5" 
                                    max="2.0" 
                                    step="0.1" 
                                    value={pace} 
                                    onChange={(e) => setPace(parseFloat(e.target.value))}
                                    className="podcast-range"
                                />
                                <div className="range-ticks">
                                    <span>0.5x (Slow)</span>
                                    <span>1.0x (Normal)</span>
                                    <span>2.0x (Fast)</span>
                                </div>
                            </div>
                        </div>

                        {/* Custom Instructions */}
                        <div className="config-group">
                            <label className="config-label">
                                <span>Additional Guidelines (Optional)</span>
                            </label>
                            <textarea
                                value={customGuidelines}
                                onChange={(e) => setCustomGuidelines(e.target.value)}
                                placeholder="E.g., focus on key statistics, explain like it's a debate, summarize details for a student..."
                                className="podcast-textarea"
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="podcast-tone-selector">
                        <h4>Select Script Style</h4>
                        <div className="tone-cards-grid">
                            {TONES.map(t => (
                                <div 
                                    key={t.code} 
                                    onClick={() => setTone(t.code)}
                                    className={`tone-card ${tone === t.code ? 'active' : ''}`}
                                >
                                    <h5>{t.label}</h5>
                                    <p>{t.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="podcast-generate-container">
                            <button 
                                className={`podcast-action-btn ${isGeneratingScript ? 'loading' : ''}`}
                                onClick={handleGenerateScript}
                                disabled={isGeneratingScript || (documents && documents.length === 0)}
                            >
                                <Wand2 size={16} />
                                <span>{isGeneratingScript ? "Generating Script..." : "Generate Script"}</span>
                            </button>
                            {documents && documents.length === 0 && (
                                <p className="podcast-warning-text">⚠️ Please upload at least one ready source document to begin.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Script Review & Edit UI */}
            {step === 2 && (
                <div className="podcast-script-container">
                    <div className="podcast-script-header">
                        <h4>Review generated dialogue script:</h4>
                        <div className="char-badge-container">
                            <span className={`char-badge ${isOverLimit ? 'over-limit' : ''}`}>
                                {characterCount} / 2500 characters
                            </span>
                            {isOverLimit && <span className="warning-pill">Too long</span>}
                        </div>
                    </div>
                    
                    <p className="podcast-tip-text">
                        💡 You can manually edit the text box below. Make sure it sounds natural, reads continuously, and does NOT contain speaker markers or bracketed sound effects.
                    </p>

                    <textarea
                        value={scriptText}
                        onChange={(e) => setScriptText(e.target.value)}
                        className={`script-editor-box ${isOverLimit ? 'border-warn' : ''}`}
                        rows={12}
                        placeholder="Write or edit script here..."
                    />

                    <div className="podcast-synthesis-actions">
                        <button 
                            className="podcast-back-btn"
                            onClick={() => setStep(1)}
                            disabled={isSynthesizing}
                        >
                            Back to Config
                        </button>
                        <button
                            className={`podcast-action-btn pink-gradient ${isSynthesizing ? 'loading' : ''}`}
                            onClick={handleSynthesizeAudio}
                            disabled={isSynthesizing || !scriptText.trim() || isOverLimit}
                        >
                            <Volume2 size={16} />
                            <span>{isSynthesizing ? "Synthesizing Voice..." : "Synthesize Audio"}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Audio Player & Visualization */}
            {step === 3 && (
                <div className="podcast-player-container">
                    {/* Visualizer Waveform */}
                    <div className="podcast-visualizer-wave">
                        <div className="visualizer-bars">
                            {visualizerBars.map((_, idx) => {
                                // Dynamic height scale for styling
                                const baseHeight = 15 + Math.sin(idx * 0.4) * 15 + Math.cos(idx * 0.2) * 10;
                                const style = isPlaying ? {
                                    height: `${Math.max(10, baseHeight)}px`,
                                    animationDelay: `${idx * 0.05}s`,
                                    animationDuration: `${0.6 + (idx % 3) * 0.15}s`
                                } : {
                                    height: `${Math.max(6, baseHeight * 0.35)}px`
                                };
                                return (
                                    <div 
                                        key={idx} 
                                        className={`visual-bar ${isPlaying ? 'animating' : ''}`}
                                        style={style}
                                    />
                                );
                            })}
                        </div>
                        <div className="visualizer-overlay-info">
                            <FileAudio size={42} className="text-[#f472b6] mb-3 opacity-80" />
                            <h5>Podcast Ready to Listen</h5>
                            <p>Speaker: {SPEAKERS.find(s => s.name === speaker)?.label || speaker} | Speed: {playbackSpeed}x</p>
                        </div>
                    </div>

                    {/* Audio Controls */}
                    <div className="custom-audio-player">
                        {/* Timeline */}
                        <div className="player-timeline">
                            <span className="time-display">{formatTime(currentTime)}</span>
                            <input 
                                type="range" 
                                min="0" 
                                max={duration || 100} 
                                value={currentTime} 
                                onChange={handleSeek}
                                className="timeline-slider"
                            />
                            <span className="time-display">{formatTime(duration)}</span>
                        </div>

                        {/* Control Buttons Grid */}
                        <div className="player-controls-row">
                            {/* Speed Control */}
                            <div className="player-speed-selector">
                                <span>Speed:</span>
                                <div className="speed-buttons">
                                    {[0.8, 1.0, 1.2, 1.5].map(speed => (
                                        <button
                                            key={speed}
                                            className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                                            onClick={() => handleSpeedChange(speed)}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Center Play Button */}
                            <button className="player-main-play-btn" onClick={handlePlayPause}>
                                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />}
                            </button>

                            {/* Volume & Download Area */}
                            <div className="player-utility-controls">
                                <div className="volume-control">
                                    <button className="mute-btn" onClick={handleToggleMute}>
                                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                    </button>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1" 
                                        step="0.05"
                                        value={isMuted ? 0 : volume} 
                                        onChange={handleVolumeChange}
                                        className="volume-slider"
                                    />
                                </div>

                                <a 
                                    href={`${API_BASE}${audioUrl}`} 
                                    download={`podcast_${notebookId}.wav`}
                                    className="player-download-btn"
                                    title="Download Podcast"
                                    target="_blank" 
                                    rel="noreferrer"
                                >
                                    <Download size={16} />
                                    <span>Download</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Script Transcript Display */}
                    <div className="transcript-box">
                        <h6>Dialogue Script Transcript</h6>
                        <div className="transcript-text">
                            {scriptText.split('\n\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PodcastViewer;
