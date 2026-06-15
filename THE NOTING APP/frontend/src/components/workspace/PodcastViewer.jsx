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
    };

    return (

        <div className="flowchart-wrapper podcast-viewer-wrapper" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="flowchart-header podcast-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div className="podcast-title-area" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="podcast-icon-badge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', background: 'rgba(236, 72, 153, 0.12)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '12px' }}>
                        <Headphones size={20} className="text-[#f472b6]" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Podcast Studio</h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#71717a' }}>
                            {step === 1 && "Configure voice, style and parameters"}
                            {step === 2 && "Review and refine your podcast script"}
                            {step === 3 && "Play, speed control or download podcast"}
                        </p>
                    </div>
                </div>
                {step > 1 && (
                    <button className="podcast-reset-btn" onClick={handleStartOver} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '9999px', padding: '6px 14px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', color: '#fff' }}>
                        <RotateCcw size={14} />
                        <span>Start Over</span>
                    </button>
                )}
            </div>

            {errorMessage && (
                <div className="podcast-error-alert" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 16px 0', padding: '12px 18px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', color: '#fca5a5', fontSize: '0.78rem', fontWeight: '500' }}>
                    <AlertTriangle size={16} />
                    <span>{errorMessage}</span>
                </div>
            )}

            <div className="flowchart-layout-container podcast-layout-container" style={{ flex: 1, display: 'flex', gap: '1.25rem', width: '100%', minHeight: 0, overflow: 'hidden' }}>
                {/* Main Canvas Area (Left) */}
                <div className="flowchart-container podcast-main-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', background: '#09090b', border: '1px solid rgba(63, 63, 70, 0.4)', borderRadius: '16px', padding: '24px' }}>
                    {step === 1 && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflowY: 'auto' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a1a1aa', margin: '0 0 16px 0' }}>Select Script Style</h4>
                            <div className="tone-cards-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {TONES.map(t => (
                                    <div 
                                        key={t.code} 
                                        onClick={() => setTone(t.code)}
                                        className={`tone-card ${tone === t.code ? 'active' : ''}`}
                                        style={{
                                            background: tone === t.code ? 'rgba(236, 72, 153, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                            border: tone === t.code ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.04)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <h5 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{t.label}</h5>
                                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#a1a1aa', lineHeight: '1.4' }}>{t.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a1a1aa', margin: '0 0 12px 0' }}>Review and Edit Dialogue Script</h4>
                            <textarea
                                value={scriptText}
                                onChange={(e) => setScriptText(e.target.value)}
                                className={`script-editor-box ${isOverLimit ? 'border-warn' : ''}`}
                                style={{
                                    flex: 1,
                                    background: 'rgba(0, 0, 0, 0.25)',
                                    border: isOverLimit ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1.5px solid rgba(255, 255, 255, 0.06)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    color: '#fff',
                                    fontSize: '0.85rem',
                                    lineHeight: '1.6',
                                    outline: 'none',
                                    resize: 'none',
                                    overflowY: 'auto'
                                }}
                                placeholder="Write or edit script here..."
                            />
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflowY: 'auto' }}>
                            {/* Visualizer Waveform */}
                            <div className="podcast-visualizer-wave" style={{ background: 'rgba(0, 0, 0, 0.15)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', marginBottom: '24px', boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.2)' }}>
                                <div className="visualizer-bars" style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '48px', marginBottom: '16px' }}>
                                    {visualizerBars.map((_, idx) => {
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
                                <div className="visualizer-overlay-info" style={{ textAlign: 'center' }}>
                                    <FileAudio size={42} className="text-[#f472b6] mb-3 opacity-80" style={{ color: '#f472b6', marginBottom: '12px' }} />
                                    <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#fff' }}>Podcast Ready to Listen</h5>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.68rem', color: '#a1a1aa' }}>Speaker: {SPEAKERS.find(s => s.name === speaker)?.label || speaker} | Speed: {playbackSpeed}x</p>
                                </div>
                            </div>

                            {/* Script Transcript Display */}
                            <div className="transcript-box" style={{ background: 'rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '20px' }}>
                                <h6 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a1a1aa', margin: '0 0 12px 0' }}>Dialogue Script Transcript</h6>
                                <div className="transcript-text" style={{ fontSize: '0.8rem', lineHeight: '1.6', color: '#e4e4e7' }}>
                                    {scriptText.split('\n\n').map((paragraph, index) => (
                                        <p key={index} style={{ marginBottom: '10px' }}>{paragraph}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar (Right) */}
                <div className="flowchart-sidebar podcast-sidebar" style={{ width: '280px', background: 'rgba(10, 10, 12, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
                    {step === 1 && (
                        <div className="sidebar-section">
                            <h4>Configure Voice</h4>

                            {/* Language Selector */}
                            <div className="form-group">
                                <label>Language</label>
                                <select 
                                    value={language} 
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    {LANGUAGES.map(lang => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.flag} {lang.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Speaker Selector */}
                            <div className="form-group">
                                <label>Voice Speaker</label>
                                <select 
                                    value={speaker} 
                                    onChange={(e) => setSpeaker(e.target.value)}
                                >
                                    {SPEAKERS.map(sp => (
                                        <option key={sp.name} value={sp.name}>
                                            {sp.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Pace Slider */}
                            <div className="form-group">
                                <label>Pace ({pace}x)</label>
                                <input 
                                    type="range" 
                                    min="0.5" 
                                    max="2.0" 
                                    step="0.1" 
                                    value={pace} 
                                    onChange={(e) => setPace(parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: '#ec4899' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#71717a', marginTop: '2px' }}>
                                    <span>Slow</span>
                                    <span>Normal</span>
                                    <span>Fast</span>
                                </div>
                            </div>

                            {/* Custom Guidelines */}
                            <div className="form-group">
                                <label>Guidelines (Optional)</label>
                                <textarea
                                    value={customGuidelines}
                                    onChange={(e) => setCustomGuidelines(e.target.value)}
                                    placeholder="E.g., explain like a debate..."
                                    rows={2}
                                    style={{ fontSize: '0.75rem' }}
                                />
                            </div>

                            <button 
                                className="toolbar-btn primary"
                                onClick={handleGenerateScript}
                                disabled={isGeneratingScript || (documents && documents.length === 0)}
                                style={{ width: '100%', background: 'linear-gradient(135deg, #ec4899, #d946ef)' }}
                            >
                                <Wand2 size={12} />
                                <span>{isGeneratingScript ? "Generating..." : "Generate Script"}</span>
                            </button>
                            {documents && documents.length === 0 && (
                                <p style={{ fontSize: '0.65rem', color: '#fbbf24', textAlign: 'center', marginTop: '4px' }}>⚠️ Upload ready source document to begin.</p>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="sidebar-section">
                            <h4>Dialogue Info</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: '#e4e4e7' }}>
                                <div>
                                    <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600' }}>Character Count</span>
                                    <strong style={{ color: isOverLimit ? '#ef4444' : '#fff' }}>{characterCount} / 2500</strong>
                                </div>
                                {isOverLimit && (
                                    <div style={{ color: '#f87171', fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '6px' }}>
                                        ⚠️ Script exceeds Sarvam TTS limits. Please edit it shorter.
                                    </div>
                                )}
                            </div>

                            <div className="toolbar-buttons" style={{ marginTop: '8px' }}>
                                <button
                                    className="toolbar-btn primary"
                                    onClick={handleSynthesizeAudio}
                                    disabled={isSynthesizing || !scriptText.trim() || isOverLimit}
                                    style={{ width: '100%', background: 'linear-gradient(135deg, #ec4899, #d946ef)' }}
                                >
                                    <Volume2 size={12} /> {isSynthesizing ? "Synthesizing..." : "Synthesize Audio"}
                                </button>
                                <button 
                                    className="toolbar-btn secondary"
                                    onClick={() => setStep(1)}
                                    disabled={isSynthesizing}
                                    style={{ width: '100%' }}
                                >
                                    Back to Config
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="sidebar-section">
                            <h4>Audio Controls</h4>
                            
                            {/* Timeline Slider */}
                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#a1a1aa', fontFamily: 'monospace' }}>
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max={duration || 100} 
                                    value={currentTime} 
                                    onChange={handleSeek}
                                    style={{ width: '100%', accentColor: '#ec4899' }}
                                />
                            </div>

                            {/* Main Play Button */}
                            <button 
                                className="toolbar-btn primary" 
                                onClick={handlePlayPause}
                                style={{ width: '100%', background: 'linear-gradient(135deg, #ec4899, #d946ef)' }}
                            >
                                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                <span>{isPlaying ? "Pause" : "Play"}</span>
                            </button>

                            {/* Speed Button Selectors */}
                            <div className="form-group">
                                <label>Playback Speed</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    {[0.8, 1.0, 1.2, 1.5].map(speed => (
                                        <button
                                            key={speed}
                                            onClick={() => handleSpeedChange(speed)}
                                            style={{
                                                fontSize: '0.7rem',
                                                padding: '6px',
                                                borderRadius: '6px',
                                                border: playbackSpeed === speed ? '1px solid #f472b6' : '1px solid rgba(255,255,255,0.06)',
                                                background: playbackSpeed === speed ? 'rgba(236, 72, 153, 0.15)' : 'rgba(0,0,0,0.2)',
                                                color: playbackSpeed === speed ? '#f472b6' : '#a1a1aa',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Volume controls */}
                            <div className="form-group">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button 
                                        onClick={handleToggleMute}
                                        style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0 }}
                                    >
                                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                    </button>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1" 
                                        step="0.05"
                                        value={isMuted ? 0 : volume} 
                                        onChange={handleVolumeChange}
                                        style={{ flex: 1, accentColor: '#ec4899' }}
                                    />
                                </div>
                            </div>

                            {/* Download Button */}
                            <a 
                                href={`${API_BASE}${audioUrl}`} 
                                download={`podcast_${notebookId}.wav`}
                                className="toolbar-btn secondary"
                                style={{ 
                                    textDecoration: 'none', 
                                    color: '#fff', 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center',
                                    border: '1px solid rgba(236, 72, 153, 0.3)',
                                    background: 'rgba(236, 72, 153, 0.05)'
                                }}
                                target="_blank" 
                                rel="noreferrer"
                            >
                                <Download size={12} />
                                <span>Download WAV</span>
                            </a>
                        </div>
                    )}

                    <div className="sidebar-help">
                        <span style={{ fontSize: '1.2rem', color: '#f472b6', marginBottom: '8px' }}>🎙️</span>
                        <p><strong>Podcast Guide:</strong></p>
                        <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <li style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.35' }}>Generate scripts in regional Indian accents.</li>
                            <li style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.35' }}>Keep the script content under 2500 characters.</li>
                            <li style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.35' }}>Listen to voice pace speed controls.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PodcastViewer;
