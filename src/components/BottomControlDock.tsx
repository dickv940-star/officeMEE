import React, { useState } from 'react';
import { AgentCharacter, AgentPose, AgentStatus } from '../types/office';
import { 
  ChevronDown, 
  ChevronUp, 
  Send, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  BrainCircuit, 
  Smile, 
  User, 
  Footprints 
} from 'lucide-react';
import { audio } from '../services/audioService';

interface BottomControlDockProps {
  agents: AgentCharacter[];
  selectedAgentId: string;
  onSelectAgent: (id: string) => void;
  onUpdateStatus: (agentId: string, status: AgentStatus) => void;
  onOverridePose: (agentId: string, pose: AgentPose) => void;
  onDispatchPrompt: (agentId: string, prompt: string) => void;
  onOpenInspector: () => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onUpdateStatus,
  onOverridePose,
  onDispatchPrompt,
  onOpenInspector
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [taskPrompt, setTaskPrompt] = useState('');

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskPrompt.trim() || !selectedAgent) return;
    audio.playClick();
    onDispatchPrompt(selectedAgent.id, taskPrompt.trim());
    setTaskPrompt('');
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-full max-w-[940px] px-4 pointer-events-none">
      <div className="flex flex-col items-center">
        {/* Collapse / Expand Toggle Tab */}
        <button
          type="button"
          onClick={() => {
            audio.playClick();
            setIsCollapsed(!isCollapsed);
          }}
          className="pointer-events-auto mb-1.5 flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-full text-xs font-medium text-slate-300 hover:text-white transition-all shadow-xl"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
              <span>Show AI Team Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Cinema Mode (Hide HUD)</span>
            </>
          )}
        </button>

        {/* Main Dock Container */}
        <div
          className={`w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-4 shadow-2xl pointer-events-auto transition-all duration-300 ${
            isCollapsed ? 'translate-y-32 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          }`}
        >
          {/* Top Row: AI Team Quick Selector */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-3 border-b border-slate-800/80 scrollbar-none">
            <div className="flex items-center gap-2">
              {agents.map((agent) => {
                const isSelected = agent.id === selectedAgentId;
                let statusRing = 'border-cyan-400';
                if (agent.status === 'thinking') statusRing = 'border-purple-400';
                else if (agent.status === 'working') statusRing = 'border-blue-400';
                else if (agent.status === 'success') statusRing = 'border-emerald-400';
                else if (agent.status === 'failure') statusRing = 'border-rose-400';
                else if (agent.status === 'waiting_approval') statusRing = 'border-amber-400';

                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => {
                      audio.playClick();
                      onSelectAgent(agent.id);
                    }}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap text-left border ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-500/40 text-white'
                        : 'bg-slate-800/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white border-2 ${statusRing}`}
                      style={{ backgroundColor: `#${agent.visual.suitColor.toString(16).padStart(6, '0')}` }}
                    >
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold leading-tight">{agent.name}</div>
                      <div className="text-[10px] text-slate-400 leading-tight">{agent.role.split('&')[0]}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onOpenInspector}
              className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold whitespace-nowrap transition-colors shadow-md"
            >
              Inspect Agent
            </button>
          </div>

          {/* Middle Row: Status & Pose Controls for Selected Agent */}
          <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            {/* Status State Triggers */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Status:</span>

              <button
                type="button"
                onClick={() => {
                  audio.playClick();
                  onUpdateStatus(selectedAgent.id, 'idle');
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-colors border ${
                  selectedAgent.status === 'idle'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
                }`}
              >
                Idle
              </button>

              <button
                type="button"
                onClick={() => {
                  audio.playClick();
                  onUpdateStatus(selectedAgent.id, 'thinking');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors border ${
                  selectedAgent.status === 'thinking'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
                }`}
              >
                <BrainCircuit className="w-3 h-3 text-purple-400" />
                <span>Thinking</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audio.playClick();
                  onUpdateStatus(selectedAgent.id, 'working');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors border ${
                  selectedAgent.status === 'working'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
                }`}
              >
                <Play className="w-3 h-3 text-blue-400" />
                <span>Working</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audio.playStatusSuccess();
                  onUpdateStatus(selectedAgent.id, 'success');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors border ${
                  selectedAgent.status === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Success</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audio.playStatusAlert();
                  onUpdateStatus(selectedAgent.id, 'failure');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors border ${
                  selectedAgent.status === 'failure'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
                }`}
              >
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span>Failure</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audio.playStatusAlert();
                  onUpdateStatus(selectedAgent.id, 'waiting_approval');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors border ${
                  selectedAgent.status === 'waiting_approval'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
                }`}
              >
                <HelpCircle className="w-3 h-3 text-amber-400" />
                <span>Approval</span>
              </button>
            </div>

            {/* Pose Override Testers */}
            <div className="flex items-center gap-1.5 flex-wrap justify-start md:justify-end">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Pose:</span>
              <button
                type="button"
                onClick={() => onOverridePose(selectedAgent.id, 'sitting_typing')}
                className="px-2 py-0.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Typing
              </button>
              <button
                type="button"
                onClick={() => onOverridePose(selectedAgent.id, 'sitting_thinking')}
                className="px-2 py-0.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Think
              </button>
              <button
                type="button"
                onClick={() => onOverridePose(selectedAgent.id, 'standing_presenting')}
                className="px-2 py-0.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Present
              </button>
              <button
                type="button"
                onClick={() => onOverridePose(selectedAgent.id, 'waiting_approval')}
                className="px-2 py-0.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Wave
              </button>
              <button
                type="button"
                onClick={() => onOverridePose(selectedAgent.id, 'walking')}
                className="px-2 py-0.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Walk
              </button>
              <button
                type="button"
                onClick={() => onOverridePose(selectedAgent.id, 'celebrating_success')}
                className="px-2 py-0.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cheer
              </button>
            </div>
          </div>

          {/* Bottom Row: Quick Dispatch Prompt to Selected Agent */}
          <form onSubmit={handleDispatch} className="pt-3 mt-3 border-t border-slate-800/80 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={taskPrompt}
                onChange={(e) => setTaskPrompt(e.target.value)}
                placeholder={`Dispatch Cloudflare task to ${selectedAgent.name}... (e.g. 'Optimize edge cache rules')`}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!taskPrompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-semibold transition-all shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
