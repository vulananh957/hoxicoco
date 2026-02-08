import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, ObstacleType, Player, Obstacle, Particle } from '../types';
import { soundManager } from '../utils/SoundManager';

const Play: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21" />
  </svg>
);

const RotateCcw: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9" />
    <polyline points="3 3 3 9 9 9" />
  </svg>
);

const Volume2: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19 8a5 5 0 0 1 0 8" />
    <path d="M15 5a9 9 0 0 1 0 14" />
  </svg>
);

const VolumeX: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="19" y1="9" x2="23" y2="13" />
    <line x1="23" y1="9" x2="19" y2="13" />
  </svg>
);

const Trophy: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 21h8" />
    <path d="M17 3v4a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V3" />
    <path d="M5 8a4 4 0 0 1 3 3" />
    <path d="M19 8a4 4 0 0 0-3 3" />
  </svg>
);

const Skull: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18v1a2 2 0 0 0 4 0v-1" />
    <path d="M20 13a8 8 0 1 0-16 0v2a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-2z" />
    <line x1="9" y1="13" x2="9.01" y2="13" />
    <line x1="15" y1="13" x2="15.01" y2="13" />
  </svg>
);

const GRAVITY_FORCE = 1.2; // Increased gravity for faster falls/rises
const INITIAL_SPEED = 11; // Higher starting speed
const MAX_SPEED = 30; // Insane max speed
const SPEED_INCREMENT = 1.0; // Faster acceleration

export const NeonRunner: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // React State for UI
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0); // Mocked daily high score
  const [deathMsg, setDeathMsg] = useState("");
  const [muted, setMuted] = useState(false);

  // Game Mutable State (Refs for performance)
  const stateRef = useRef({
    player: {
      x: 100,
      y: 300,
      width: 40,
      height: 40,
      vy: 0,
      gravityDirection: 1, // 1 is down, -1 is up
      color: '#ffffff', // Changed to White for TP
      isGrounded: false
    } as Player,
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    gameSpeed: INITIAL_SPEED,
    score: 0,
    cameraShake: 0,
    cameraZoom: 1,
    invertColor: false,
    frames: 0,
    lastSpeedIncrease: 0,
    lastInvertTime: 0
  });

  const generateDeathMessage = (percentage: number) => {
    if (percentage < 5) return "Did you forget to wipe?";
    if (percentage < 20) return "Dropped in the bowl.";
    if (percentage < 50) return "Clogged the pipes.";
    if (percentage < 80) return "Paper jam!";
    if (percentage < 95) return "Running on empty!";
    return "Total wipeout!";
  };

  const initGame = () => {
    stateRef.current = {
      player: {
        x: 100,
        y: 200,
        width: 42, // Slightly larger for visibility
        height: 42,
        vy: 0,
        gravityDirection: 1,
        color: '#ffffff', // White TP
        isGrounded: false
      },
      obstacles: [],
      particles: [],
      gameSpeed: INITIAL_SPEED,
      score: 0,
      cameraShake: 0,
      cameraZoom: 1,
      invertColor: false,
      frames: 0,
      lastSpeedIncrease: Date.now(),
      lastInvertTime: Date.now()
    };
    setScore(0);
    soundManager.setTempo(175); // Start slightly faster
  };

  const spawnObstacle = (canvasWidth: number, canvasHeight: number) => {
    const typeProb = Math.random();
    let type = ObstacleType.SPIKE;
    let width = 40;
    let height = 60;
    let y = 0;

    // Determine position (Floor or Ceiling)
    const onCeiling = Math.random() > 0.5;

    // Harder distribution
    if (typeProb > 0.80) { // 20% Pillar
      type = ObstacleType.PILLAR;
      width = 50;
      height = 140 + Math.random() * 100; // Taller pillars
    } else if (typeProb > 0.60) { // 20% Moving Pillar (Increased chance)
      type = ObstacleType.MOVING_PILLAR;
      width = 45;
      height = 120;
    } else if (typeProb > 0.50) { // 10% Ghost
        type = ObstacleType.GHOST;
        width = 40;
        height = 60;
    }

    // Y position calculation
    if (onCeiling) {
      y = 0; // Top
    } else {
      y = canvasHeight - height; // Bottom
    }

    stateRef.current.obstacles.push({
      x: canvasWidth + 100,
      y: y,
      width,
      height,
      type,
      active: true,
      passed: false,
      oscillationOffset: Math.random() * Math.PI * 2
    });
  };

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 20; i++) {
      stateRef.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 20, // Faster particles
        vy: (Math.random() - 0.5) * 20,
        life: 1.0,
        color: color,
        size: Math.random() * 6 + 2
      });
    }
  };

  const handleInput = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    
    // Gravity Flip logic
    const { player } = stateRef.current;
    
    player.gravityDirection *= -1;
    // Don't fully reset VY, just damp it slightly to keep momentum chaotic
    player.vy = player.vy * 0.5; 
    soundManager.playFlip();

  }, [gameState]);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const state = stateRef.current;
      const { width, height } = canvas;

      // 1. Audio Analysis & Frustration Factors
      let bassEnergy = 0;
      if (gameState === GameState.PLAYING) {
         bassEnergy = soundManager.getBassEnergy();
         
         // Camera Shake on Bass - Increased intensity
         if (bassEnergy > 230) { 
            state.cameraShake = (Math.random() - 0.5) * 15; // Harder shake
            state.cameraZoom = 1.05; // More zoom punch
         } else {
            state.cameraShake *= 0.85; // Slower recovery
            state.cameraZoom = 1 + (state.cameraZoom - 1) * 0.9;
         }

         // Random Color Invert - More frequent (every 8s minimum)
         if (Date.now() - state.lastInvertTime > 8000 && Math.random() > 0.98) {
            state.invertColor = !state.invertColor;
            state.lastInvertTime = Date.now();
            // Stays inverted slightly longer or shorter randomly
            setTimeout(() => { stateRef.current.invertColor = false; }, Math.random() * 1500 + 500); 
         }
      }

      // Clear Canvas
      ctx.fillStyle = state.invertColor ? '#0ff' : '#000';
      ctx.fillRect(0, 0, width, height);
      
      ctx.save();
      
      // Apply Camera Effects
      ctx.translate(width/2, height/2);
      ctx.scale(state.cameraZoom, state.cameraZoom);
      ctx.rotate((state.cameraShake * Math.PI) / 180);
      ctx.translate(-width/2, -height/2);

      // Draw Tunnel Grid (Background)
      ctx.strokeStyle = state.invertColor ? '#000' : '#333';
      ctx.lineWidth = 1;
      const gridSize = 50;
      const offset = (state.frames * state.gameSpeed) % gridSize;
      
      // Horizontal lines (Depth)
      ctx.beginPath();
      ctx.moveTo(0, height/2); ctx.lineTo(width, height/2); 
      for(let i=0; i<width; i+=gridSize) {
         const x = i - offset;
         if (x > 0) {
             ctx.moveTo(x, 0); ctx.lineTo(x, height);
         }
      }
      ctx.moveTo(0, 50); ctx.lineTo(width, 50);
      ctx.moveTo(0, height-50); ctx.lineTo(width, height-50);
      ctx.stroke();


      if (gameState === GameState.PLAYING) {
        state.frames++;

        // Increase Speed - Aggressive ramp up
        if (Date.now() - state.lastSpeedIncrease > 5000) { // Every 5 seconds
          state.gameSpeed = Math.min(state.gameSpeed + SPEED_INCREMENT, MAX_SPEED);
          state.lastSpeedIncrease = Date.now();
          soundManager.setTempo(175 + (state.gameSpeed - INITIAL_SPEED) * 8); // Music goes crazy
        }

        // Physics: Player
        state.player.vy += GRAVITY_FORCE * state.player.gravityDirection;
        // Terminal velocity cap
        if (Math.abs(state.player.vy) > 25) state.player.vy = 25 * Math.sign(state.player.vy);
        
        state.player.y += state.player.vy;

        // Floor/Ceiling Collision
        if (state.player.y < 0) {
            state.player.y = 0;
            state.player.vy = 0;
            state.player.isGrounded = true;
        } else if (state.player.y + state.player.height > height) {
            state.player.y = height - state.player.height;
            state.player.vy = 0;
            state.player.isGrounded = true;
        } else {
            state.player.isGrounded = false;
        }

        // Spawn Obstacles - High Density
        // 2.2 multiplier makes them spawn extremely close at high speeds
        if (state.frames % Math.floor(1000 / (state.gameSpeed * 2.2)) === 0) {
            spawnObstacle(width, height);
        }

        // Update Obstacles
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
            const obs = state.obstacles[i];
            obs.x -= state.gameSpeed;

            // Moving Pillar Logic - Faster oscillation
            if (obs.type === ObstacleType.MOVING_PILLAR) {
                obs.oscillationOffset = (obs.oscillationOffset || 0) + 0.15;
                obs.y += Math.sin(obs.oscillationOffset) * 3;
            }

            // Draw Obstacle
            ctx.shadowBlur = 10;
            if (obs.type === ObstacleType.GHOST) {
                 ctx.fillStyle = state.invertColor ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'; // Harder to see
                 ctx.shadowColor = 'transparent';
            } else {
                ctx.fillStyle = state.invertColor ? '#000' : '#ff003c'; // Neon Red
                ctx.shadowColor = '#ff003c';
            }
            
            if (obs.type === ObstacleType.SPIKE) {
                ctx.beginPath();
                if (obs.y < height / 2) { 
                    ctx.moveTo(obs.x, obs.y);
                    ctx.lineTo(obs.x + obs.width, obs.y);
                    ctx.lineTo(obs.x + obs.width/2, obs.y + obs.height);
                } else { 
                    ctx.moveTo(obs.x, obs.y + obs.height);
                    ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                    ctx.lineTo(obs.x + obs.width/2, obs.y);
                }
                ctx.fill();
            } else {
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            }
            ctx.shadowBlur = 0;

            // Collision Detection (AABB)
            // Tighter hitbox (reduced padding to 2) makes it less forgiving
            const hitboxPadding = 2;
            if (
                state.player.x < obs.x + obs.width - hitboxPadding &&
                state.player.x + state.player.width > obs.x + hitboxPadding &&
                state.player.y < obs.y + obs.height - hitboxPadding &&
                state.player.y + state.player.height > obs.y + hitboxPadding
            ) {
                if (obs.type !== ObstacleType.GHOST) {
                    // DIE
                    createExplosion(state.player.x, state.player.y, state.player.color);
                    soundManager.playDeath();
                    soundManager.stopMusic();
                    setGameState(GameState.GAME_OVER);
                    
                    // Score is roughly 10 pts per obstacle. Max speed reaches quickly.
                    const percentage = Math.min(Math.floor(state.score / 100), 100);
                    setDeathMsg(generateDeathMessage(percentage));
                    
                    if (state.score > highScore) {
                        setHighScore(state.score);
                        localStorage.setItem('toilet_run_highscore', state.score.toString());
                    }
                }
            }

            // Scoring
            if (!obs.passed && obs.x + obs.width < state.player.x) {
                obs.passed = true;
                state.score += 10;
                setScore(state.score);
            }

            // Cleanup
            if (obs.x + obs.width < 0) {
                state.obstacles.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = state.particles.length - 1; i >= 0; i--) {
            const p = state.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.globalAlpha = 1;

            if (p.life <= 0) state.particles.splice(i, 1);
        }
      }

      // Draw Player (Realistic TP Roll)
      if (gameState !== GameState.GAME_OVER) {
          const { x, y, width, height } = state.player;
          const centerX = x + width / 2;
          const centerY = y + height / 2;

          // --- Draw The Roll (Rotating) ---
          ctx.save();
          ctx.translate(centerX, centerY);
          
          // Rotation based on game frames (rolling forward)
          const rotation = (state.frames * state.gameSpeed * 0.05);
          ctx.rotate(rotation);

          // 1. Roll Body (Gradient White)
          // Create a subtle radial gradient to simulate rounded paper
          const grad = ctx.createRadialGradient(0, 0, width*0.1, 0, 0, width/2);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.8, '#f5f5f5');
          grad.addColorStop(1, '#e0e0e0');
          
          ctx.fillStyle = grad; 
          ctx.beginPath();
          ctx.arc(0, 0, width / 2, 0, Math.PI * 2);
          ctx.fill();
          
          // 2. Texture lines (Layers)
          ctx.strokeStyle = '#d4d4d4';
          ctx.lineWidth = 1;
          // Draw a few concentric circles/spirals to show paper layers
          for (let r = 0.3; r < 0.5; r += 0.08) {
              ctx.beginPath();
              ctx.arc(0, 0, width * r, 0, Math.PI * 2);
              ctx.stroke();
          }

          // 3. Inner Cardboard Tube (Brown)
          ctx.fillStyle = '#bcaaa4'; 
          ctx.beginPath();
          ctx.arc(0, 0, width * 0.22, 0, Math.PI * 2);
          ctx.fill();

          // 4. Inner Tube Shadow/Depth
          ctx.strokeStyle = '#8d6e63';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, width * 0.22, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState]);

  // Load High Score
  useEffect(() => {
      const stored = localStorage.getItem('toilet_run_highscore');
      if (stored) setHighScore(parseInt(stored));
      
      const handleResize = () => {
          if (canvasRef.current && containerRef.current) {
              canvasRef.current.width = containerRef.current.clientWidth;
              canvasRef.current.height = containerRef.current.clientHeight;
          }
      };
      
      window.addEventListener('resize', handleResize);
      handleResize();
      
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Space/Arrow keys for jumping
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
            if (gameState === GameState.PLAYING) handleInput();
            else {
                // Prevent space from scrolling or doing weird things if not playing
            }
        }
        // M key for mute (doesn't conflict with Escape)
        if (e.code === 'KeyM' || e.key.toLowerCase() === 'm') {
            e.preventDefault();
            setMuted(prev => {
                const newMuted = !prev;
                if (newMuted) soundManager.stopMusic();
                else if (gameState === GameState.PLAYING) soundManager.startMusic();
                return newMuted;
            });
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleInput]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      soundManager.stopMusic(); // Stop all sounds when game is closed/unmounted
    };
  }, []);

  const startGame = () => {
      soundManager.init();
      if (!muted) soundManager.startMusic();
      initGame();
      setGameState(GameState.PLAYING);
  };

  const toggleMute = () => {
      setMuted(!muted);
      if (!muted) soundManager.stopMusic();
      else if (gameState === GameState.PLAYING) soundManager.startMusic();
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden font-mono select-none">
      <div className="scanlines"></div>
      
      <canvas 
        ref={canvasRef}
        className="block w-full h-full"
        onMouseDown={(e) => { e.preventDefault(); handleInput(); }}
        onTouchStart={(e) => { e.preventDefault(); handleInput(); }}
      />

      {/* HUD */}
      <div className="absolute top-4 left-4 text-cyan-400 z-10 pointer-events-none">
         <div className="text-2xl font-bold neon-text">SCORE: {score.toString().padStart(6, '0')}</div>
         <div className="text-sm text-cyan-700">HI: {highScore.toString().padStart(6, '0')}</div>
      </div>
      
      <div className="absolute top-4 right-4 z-10 cursor-pointer text-cyan-400" onClick={toggleMute}>
          {muted ? <VolumeX size={32} /> : <Volume2 size={32} />}
      </div>

      {/* Start Screen */}
      {gameState === GameState.START && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
              <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 mb-8 neon-text tracking-tighter text-center">
                  TOILET<br/>RUN
              </h1>
              <p className="text-cyan-200 mb-8 text-lg animate-pulse">Save the last roll!</p>
              
              <button 
                onClick={startGame}
                className="group relative px-8 py-4 bg-transparent border-2 border-cyan-400 text-cyan-400 font-bold text-xl uppercase tracking-widest hover:bg-cyan-400 hover:text-black transition-all duration-300 neon-border"
              >
                  <span className="flex items-center gap-2">
                      <Play size={24} /> UNROLL
                  </span>
              </button>
          </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40 z-20 backdrop-blur-sm">
              <h2 className="text-6xl font-black text-red-500 mb-2 neon-text glitch-effect">CLOGGED!</h2>
              <p className="text-white text-2xl mb-8 font-bold italic">"{deathMsg}"</p>
              
              <div className="flex gap-8 mb-8">
                  <div className="text-center">
                      <p className="text-red-300 text-xs">SCORE</p>
                      <p className="text-4xl font-bold text-white">{score}</p>
                  </div>
                  <div className="text-center">
                      <p className="text-yellow-300 text-xs flex items-center justify-center gap-1"><Trophy size={12}/> BEST</p>
                      <p className="text-4xl font-bold text-yellow-400">{highScore}</p>
                  </div>
              </div>

              <button 
                onClick={startGame}
                className="px-8 py-4 bg-transparent border-2 border-red-500 text-red-500 font-bold text-xl uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all duration-300 neon-border mb-4"
              >
                  <span className="flex items-center gap-2">
                      <RotateCcw size={24} /> FLUSH AGAIN
                  </span>
              </button>
          </div>
      )}
    </div>
  );
};