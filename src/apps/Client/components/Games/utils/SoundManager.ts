/**
 * A self-contained procedural audio engine for Cyberpunk/Synthwave SFX and Music.
 * This avoids the need for loading external MP3s and allows direct sync with game logic.
 */

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  
  // Music Sequencer State
  private isPlaying: boolean = false;
  private nextNoteTime: number = 0;
  private current16thNote: number = 0;
  private tempo: number = 170; // Drum & Bass tempo
  private lookahead: number = 25.0;
  private scheduleAheadTime: number = 0.1;
  private timerID: number | null = null;

  // Analysis
  public analyser: AnalyserNode | null = null;
  public dataArray: Uint8Array | null = null;

  constructor() {
    // Lazy initialization in init() to handle browser autoplay policies
  }

  public init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    
    // Compressor to glue the mix
    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -10;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    // Analyser for visuals
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64; // Low resolution is fine for game sync
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.masterGain.connect(compressor);
    compressor.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public getBassEnergy(): number {
    if (!this.analyser || !this.dataArray) return 0;
    // Bypass TypeScript lib mismatch between ArrayBuffer and SharedArrayBuffer
    (this.analyser as any).getByteFrequencyData(this.dataArray);
    // Average the first few bins for bass
    return (this.dataArray[0] + this.dataArray[1] + this.dataArray[2]) / 3;
  }

  public startMusic() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.current16thNote = 0;
    this.nextNoteTime = this.ctx!.currentTime;
    this.scheduler();
  }

  public stopMusic() {
    this.isPlaying = false;
    if (this.timerID) {
      window.clearTimeout(this.timerID);
    }
  }

  public setTempo(bpm: number) {
    this.tempo = bpm;
  }

  private scheduler() {
    if (!this.ctx || !this.isPlaying) return;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.nextNote();
    }
    
    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.current16thNote = (this.current16thNote + 1) % 16;
  }

  private scheduleNote(beatNumber: number, time: number) {
    if (!this.ctx || !this.masterGain) return;

    // Drum Pattern (Simple DnB)
    // Kick: 0, 10
    // Snare: 4, 12
    // HiHats: 0, 2, 4, 6, 8, 10, 12, 14
    
    if (beatNumber === 0 || beatNumber === 10) {
      this.playKick(time);
    }
    if (beatNumber === 4 || beatNumber === 12) {
      this.playSnare(time);
    }
    if (beatNumber % 2 === 0) {
      this.playHiHat(time);
    }

    // Bassline (Reese bass style simplfied)
    if (beatNumber === 0 || beatNumber === 3 || beatNumber === 8 || beatNumber === 11) {
      // Vary frequency slightly
      const freq = beatNumber < 8 ? 55 : 41.2; // A1 or E1
      this.playBass(time, freq, 0.2);
    }
  }

  // --- SYNTHESIZERS ---

  private playKick(time: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(time);
    osc.stop(time + 0.5);
  }

  private playSnare(time: number) {
    const noiseBuffer = this.createNoiseBuffer();
    const noise = this.ctx!.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = this.ctx!.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain = this.ctx!.createGain();
    
    noiseGain.gain.setValueAtTime(0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);
    
    // Tone part of snare
    const osc = this.ctx!.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, time);
    const oscGain = this.ctx!.createGain();
    oscGain.gain.setValueAtTime(0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    osc.connect(oscGain);
    oscGain.connect(this.masterGain!);
    
    noise.start(time);
    osc.start(time);
    noise.stop(time + 0.2);
    osc.stop(time + 0.2);
  }

  private playHiHat(time: number) {
    // Metallic noise
    const osc = this.ctx!.createOscillator();
    osc.type = 'square';
    // Use high freq square as poor man's noise/hat
    osc.frequency.setValueAtTime(800 + Math.random() * 200, time);
    
    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(time);
    osc.stop(time + 0.05);
  }

  private playBass(time: number, freq: number, duration: number) {
    const osc = this.ctx!.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    
    // Lowpass filter envelope for "wub" feel
    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 5;
    filter.frequency.setValueAtTime(100, time);
    filter.frequency.linearRampToValueAtTime(800, time + (duration/2));
    filter.frequency.linearRampToValueAtTime(100, time + duration);

    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.linearRampToValueAtTime(0, time + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(time);
    osc.stop(time + duration);
  }

  private createNoiseBuffer(): AudioBuffer {
    const bufferSize = this.ctx!.sampleRate * 2; // 2 seconds
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // --- SFX ---

  public playFlip() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playDeath() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // Glitch noise
    const noiseBuffer = this.createNoiseBuffer();
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    
    noise.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(t);
    noise.stop(t + 0.5);

    // Downsweep
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + 0.5);
    
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.linearRampToValueAtTime(0, t + 0.5);
    
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  public playScore() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, t); // A5
    osc.frequency.setValueAtTime(1760, t + 0.05); // A6
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }
}

export const soundManager = new SoundManager();