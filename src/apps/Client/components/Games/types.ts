export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export enum ObstacleType {
  SPIKE = 'SPIKE',
  PILLAR = 'PILLAR', // Standard pillar
  MOVING_PILLAR = 'MOVING_PILLAR', // Moves vertically
  GHOST = 'GHOST', // Visual only, passes through
  SPEED_PORTAL = 'SPEED_PORTAL' // Increases game speed
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Entity {
  vy: number;
  gravityDirection: 1 | -1;
  color: string;
  isGrounded: boolean;
}

export interface Obstacle extends Entity {
  type: ObstacleType;
  active: boolean;
  passed: boolean;
  oscillationOffset?: number; // For moving pillars
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}