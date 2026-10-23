import React from 'react';
import { X, Activity, Cpu, HardDrive, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { OfficeTelemetry } from '../types/office';

interface DiagnosticsModalProps {
  telemetry: OfficeTelemetry;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({ telemetry, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Performance & Memory Diagnostics</h2>
              <p className="text-xs text-slate-400">Tuned for Chrome 4–8 GB RAM & Multi-core CPU systems</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Status KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block font-mono">Framerate</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{telemetry.fps} FPS</span>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block font-mono">Frame Time</span>
              <span className="text-xl font-bold font-mono text-cyan-400">{telemetry.frameTime} ms</span>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block font-mono">Draw Calls</span>
              <span className="text-xl font-bold font-mono text-blue-400">{telemetry.drawCalls}</span>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block font-mono">Est. Memory</span>
              <span className="text-xl font-bold font-mono text-indigo-400">{telemetry.memoryEstimateMb} MB</span>
            </div>
          </div>

          {/* WebGL Architecture Info */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Graphics & WebGL Device Profile</span>
            </h3>
            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-500">GPU Driver:</span>
                <span className="text-slate-200 truncate max-w-[280px]" title={telemetry.gpuRenderer}>
                  {telemetry.gpuRenderer}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-500">Software WebGL Guard:</span>
                <span className={telemetry.isSoftwareGl ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                  {telemetry.isSoftwareGl ? 'Active (Throttled Pacing)' : 'Hardware Accelerated'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-500">Color Pipeline:</span>
                <span className="text-slate-200">SRGBColorSpace + ACESFilmic</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-500">Polygons Rendered:</span>
                <span className="text-slate-200">{telemetry.triangles.toLocaleString()} triangles</span>
              </div>
            </div>
          </div>

          {/* Optimizations Applied */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>4–8 GB RAM Optimization Checklist</span>
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero GC in render tick: Module-scoped reusable math vectors (_euler, _quat, _vec)</span>
              </div>
              <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Pixel Ratio capped at 1.5x max to conserve GPU fill rate and memory bandwidth</span>
              </div>
              <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Procedural canvas textures cached and pooled with mipmap optimization</span>
              </div>
              <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Instant 2D High-Performance Eco Mode fallback available for low-spec devices</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
