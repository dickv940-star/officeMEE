export type AgentStatus = 'idle' | 'thinking' | 'working' | 'success' | 'failure' | 'waiting_approval';

export type AgentPose = 
  | 'idle_seated'
  | 'idle_standing'
  | 'sitting_typing'
  | 'sitting_thinking'
  | 'standing_presenting'
  | 'celebrating_success'
  | 'frustrated_failure'
  | 'waiting_approval'
  | 'walking';

export type OfficeLocation = 
  | 'director_office'
  | 'workstation_alexander' 
  | 'workstation_olivia' 
  | 'workstation_ethan' 
  | 'workstation_sophia'
  | 'workstation_daniel'
  | 'workstation_isabella'
  | 'workstation_lucas'
  | 'workstation_charlotte'
  | 'presentation_stage'
  | 'workstation_1'
  | 'workstation_2'
  | 'workstation_3'
  | 'workstation_4';

export interface AgentCharacter {
  id: string;
  name: string;
  role: string;
  department: string;
  status: AgentStatus;
  currentTask: string;
  progress: number;
  location: OfficeLocation;
  cfBinding: {
    workerName: string;
    d1Database: string;
    kvNamespace: string;
    model: string;
  };
  metrics: {
    tasksCompleted: number;
    latencyMs: number;
    tokensProcessed: number;
    cpuLoad: number;
    memoryMb: number;
  };
  lastActive: string;
  // Visual appearance configuration matching GitHub PNG artwork
  visual: {
    suitColor: number;
    accentColor: number;
    skinColor: number;
    hairColor: number;
    hairStyle: 'slick' | 'bob' | 'short_fade' | 'bun' | 'curly' | 'center_part' | 'long_straight' | 'shoulder_layered' | 'wavy';
    hasGlasses: boolean;
    gender: 'female' | 'male';
    height: number;
    hasSkirt?: boolean;
    hasTie?: boolean;
    tieColor?: number;
    shirtColor?: number;
    shoeType?: 'dress_shoes' | 'sneakers' | 'flats' | 'heels';
    shoeAccentColor?: number;
    lipstickColor?: number;
    shortSleeves?: boolean;
    holdingTablet?: boolean;
    pngAsset?: string;
  };
  customVrmUrl?: string;
  isCustomVrm?: boolean;
}

export interface CameraPreset {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  description: string;
}

export interface OfficeTelemetry {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  isSoftwareGl: boolean;
  gpuRenderer: string;
  memoryEstimateMb: number;
  targetFramerate: number;
}
