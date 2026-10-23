import React from 'react';
import { AgentCharacter, AgentStatus } from '../types/office';
import { Monitor, CheckCircle, Clock, AlertTriangle, Play, Sparkles, Terminal } from 'lucide-react';

interface Office2DFallbackProps {
  agents: AgentCharacter[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onDispatchTask: (agentId: string, prompt: string) => void;
  onTriggerStatus: (agentId: string, status: AgentStatus) => void;
}

export const Office2DFallback: React.FC<Office2DFallbackProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onDispatchTask,
  onTriggerStatus
}) => {
  return (
    <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto text-slate-100 flex flex-col items-center">
      <div className="w-full max-w-6xl mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              2D High-Performance Eco Mode Active
            </span>
            <span className="text-xs text-slate-400">RAM Optimized for 4-8 GB Systems</span>
          </div>
          <h2 className="text-xl font-bold text-white">OfficeMe AI Team Virtual Floor Plan</h2>
          <p className="text-sm text-slate-400">
            Interactive lightweight 2D workspace with live Cloudflare agent synchronization.
          </p>
        </div>
      </div>

      {/* Modern Office 2D Grid Map */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((agent) => {
          const isSelected = selectedAgentId === agent.id;
          let statusBadgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
          let statusDot = 'bg-cyan-400';
          if (agent.status === 'thinking') {
            statusBadgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
            statusDot = 'bg-purple-400';
          } else if (agent.status === 'working') {
            statusBadgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            statusDot = 'bg-blue-400';
          } else if (agent.status === 'success') {
            statusBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            statusDot = 'bg-emerald-400';
          } else if (agent.status === 'failure') {
            statusBadgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
            statusDot = 'bg-rose-400';
          } else if (agent.status === 'waiting_approval') {
            statusBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            statusDot = 'bg-amber-400';
          }

          return (
            <div
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              className={`cursor-pointer transition-all duration-200 rounded-2xl p-5 border relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {/* Animated stylized character avatar portrait */}
                    <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700/80 relative overflow-hidden shrink-0">
                      {agent.visual.pngAsset ? (
                        <img
                          src={agent.visual.pngAsset}
                          alt={agent.name}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white"
                          style={{ backgroundColor: `#${agent.visual.suitColor.toString(16).padStart(6, '0')}` }}
                        >
                          {agent.name.charAt(0)}
                        </div>
                      )}
                      <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${statusDot}`} />
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base leading-snug">{agent.name}</h3>
                      <p className="text-xs text-slate-400 leading-tight">{agent.role}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${statusBadgeColor}`}>
                    {agent.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Current Task Description */}
                <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    <span>Active Workflow Task:</span>
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-2 font-mono">
                    {agent.currentTask}
                  </p>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Latency</span>
                    <span className="font-mono text-xs font-semibold text-slate-300">{agent.metrics.latencyMs}ms</span>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Completed</span>
                    <span className="font-mono text-xs font-semibold text-slate-300">{agent.metrics.tasksCompleted}</span>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Cloudflare</span>
                    <span className="font-mono text-xs font-semibold text-slate-300">D1 Synced</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerStatus(agent.id, 'working');
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                >
                  Work
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerStatus(agent.id, 'thinking');
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors"
                >
                  Think
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerStatus(agent.id, 'success');
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                >
                  Success
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerStatus(agent.id, 'waiting_approval');
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
