import React from 'react';
import { CameraPreset, OfficeTelemetry } from '../types/office';
import { 
  Building2, 
  Camera, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Sparkles, 
  Layers, 
  Activity, 
  CloudLightning 
} from 'lucide-react';

interface NavigationHeaderProps {
  is3DMode: boolean;
  onToggle3DMode: () => void;
  cameraPresets: CameraPreset[];
  activeCameraPresetId: string;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  onOpenVRMModal: () => void;
  onOpenDiagnosticsModal: () => void;
  telemetry: OfficeTelemetry;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  is3DMode,
  onToggle3DMode,
  cameraPresets,
  activeCameraPresetId,
  onSelectCameraPreset,
  isAudioMuted,
  onToggleAudio,
  onOpenVRMModal,
  onOpenDiagnosticsModal,
  telemetry
}) => {
  return (
    <header className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
      {/* Brand & Cloudflare Status Pill */}
      <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800/80 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-none pointer-events-auto">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-white text-sm tracking-tight">OfficeMe</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              3D AI Team
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <CloudLightning className="w-3 h-3 text-cyan-400" />
            <span className="font-mono text-[11px]">Cloudflare Edge Synced</span>
          </div>
        </div>
      </div>

      {/* Center Camera Presets (in 3D Mode) */}
      {is3DMode && (
        <div className="hidden lg:flex items-center gap-1 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-1.5 shadow-2xl pointer-events-auto">
          <div className="px-2 text-xs text-slate-400 flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" />
            <span>View:</span>
          </div>
          {cameraPresets.map((preset) => {
            const isActive = activeCameraPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectCameraPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Right Controls: 2D/3D Mode, Audio, VRM Manager, Diagnostics */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* FPS & Health Tag */}
        <button
          type="button"
          onClick={onOpenDiagnosticsModal}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-2xl px-3 py-2 text-xs font-mono text-slate-300 transition-colors shadow-2xl"
          title="Open RAM & Render Diagnostics"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>{telemetry.fps} FPS</span>
          <span className="text-slate-500 hidden sm:inline">| {telemetry.isSoftwareGl ? 'SoftGL' : 'GPU'}</span>
        </button>

        {/* VRM Humanoid Manager */}
        <button
          type="button"
          onClick={onOpenVRMModal}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-2xl px-3 py-2 text-xs font-semibold text-white transition-colors shadow-2xl"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">VRM Avatar</span>
        </button>

        {/* 2D / 3D Toggle */}
        <button
          type="button"
          onClick={onToggle3DMode}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-2xl px-3 py-2 text-xs font-semibold text-white transition-colors shadow-2xl"
          title="Switch between 3D Virtual Scene and 2D Eco Floor Plan"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>{is3DMode ? '3D Active' : '2D Eco'}</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          type="button"
          onClick={onToggleAudio}
          className="w-9 h-9 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors shadow-2xl"
          title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>
      </div>
    </header>
  );
};
