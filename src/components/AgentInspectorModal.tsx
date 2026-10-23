import React, { useState } from 'react';
import { AgentCharacter, AgentPose, AgentStatus } from '../types/office';
import { 
  X, 
  Terminal, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Clock, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Server, 
  Send 
} from 'lucide-react';
import { audio } from '../services/audioService';

interface AgentInspectorModalProps {
  agent: AgentCharacter | null;
  onClose: () => void;
  onUpdateStatus: (agentId: string, status: AgentStatus) => void;
  onOverridePose: (agentId: string, pose: AgentPose) => void;
  onDispatchTask: (agentId: string, prompt: string) => void;
  onExecuteAction: (agentId: string, action: 'approve' | 'reject' | 'reset') => void;
}

export const AgentInspectorModal: React.FC<AgentInspectorModalProps> = ({
  agent,
  onClose,
  onUpdateStatus,
  onOverridePose,
  onDispatchTask,
  onExecuteAction
}) => {
  if (!agent) return null;

  const [promptText, setPromptText] = useState('');

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    audio.playClick();
    onDispatchTask(agent.id, promptText.trim());
    setPromptText('');
  };

  let statusBadgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  if (agent.status === 'thinking') statusBadgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
  else if (agent.status === 'working') statusBadgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  else if (agent.status === 'success') statusBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  else if (agent.status === 'failure') statusBadgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  else if (agent.status === 'waiting_approval') statusBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/40">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-md overflow-hidden border border-slate-700/80 shrink-0 bg-slate-800"
              style={{ backgroundColor: `#${agent.visual.suitColor.toString(16).padStart(6, '0')}` }}
            >
              {agent.visual.pngAsset ? (
                <img
                  src={agent.visual.pngAsset}
                  alt={agent.name}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    // Fallback to letter
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                agent.name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white tracking-tight">{agent.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${statusBadgeColor}`}>
                  {agent.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{agent.role} &bull; {agent.department}</p>
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Waiting for Approval Action Card */}
          {agent.status === 'waiting_approval' && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Pending Human Operator Approval</span>
              </div>
              <p className="text-xs text-slate-300 mb-3">
                {agent.name} has prepared changes and is holding execution awaiting your review.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    audio.playStatusSuccess();
                    onExecuteAction(agent.id, 'approve');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve & Deploy</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audio.playStatusAlert();
                    onExecuteAction(agent.id, 'reject');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          )}

          {/* Current Active Task */}
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-500">Current Task</span>
              <span className="font-mono text-slate-400">{agent.progress}% Complete</span>
            </div>
            <p className="text-sm font-mono text-slate-200 mb-3">{agent.currentTask}</p>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${agent.progress}%` }}
              />
            </div>
          </div>

          {/* Cloudflare Worker & Edge Architecture */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cloudflare Worker & Model Architecture</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Worker Service</span>
                <span className="text-slate-200 font-mono font-medium">{agent.cfBinding.workerName}</span>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Inference Model</span>
                <span className="text-blue-400 font-mono font-medium">{agent.cfBinding.model.split('/').pop()}</span>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">D1 Database</span>
                <span className="text-slate-200 font-mono font-medium">{agent.cfBinding.d1Database}</span>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">KV Namespace</span>
                <span className="text-slate-200 font-mono font-medium">{agent.cfBinding.kvNamespace}</span>
              </div>
            </div>
          </div>

          {/* Real-time Telemetry & Performance */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Agent Telemetry</span>
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Latency</span>
                <span className="font-mono text-sm font-bold text-slate-200">{agent.metrics.latencyMs} ms</span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Tokens</span>
                <span className="font-mono text-sm font-bold text-slate-200">{(agent.metrics.tokensProcessed / 1000).toFixed(0)}k</span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">CPU Load</span>
                <span className="font-mono text-sm font-bold text-slate-200">{agent.metrics.cpuLoad}%</span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Memory</span>
                <span className="font-mono text-sm font-bold text-slate-200">{agent.metrics.memoryMb} MB</span>
              </div>
            </div>
          </div>

          {/* Dispatch Task Form */}
          <form onSubmit={handleSendPrompt} className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Dispatch Directive / Prompt to Agent
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Type instructions for this agent..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="submit"
                disabled={!promptText.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Execute</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
