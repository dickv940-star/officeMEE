import React, { useEffect, useRef, useState } from 'react';
import { 
  AgentCharacter, 
  AgentPose, 
  AgentStatus, 
  CameraPreset, 
  OfficeTelemetry 
} from './types/office';
import { OfficeScene } from './3d/officeScene';
import { NavigationHeader } from './components/NavigationHeader';
import { BottomControlDock } from './components/BottomControlDock';
import { AgentInspectorModal } from './components/AgentInspectorModal';
import { VRMManagerModal } from './components/VRMManagerModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { Office2DFallback } from './components/Office2DFallback';
import { 
  fetchAgents, 
  updateAgentStatus as apiUpdateStatus, 
  dispatchTask as apiDispatchTask, 
  executeAgentAction as apiExecuteAction 
} from './services/apiService';
import { audio } from './services/audioService';

const INITIAL_AGENTS: AgentCharacter[] = [
  {
    id: 'william-bigboss',
    name: 'William Bigboss',
    role: 'Director & Executive Lead',
    department: 'Executive Office',
    status: 'waiting_approval',
    currentTask: 'Reviewing cross-department budget and multi-region worker delegation policy',
    progress: 92,
    location: 'director_office',
    cfBinding: {
      workerName: 'officeme-director-orchestrator',
      d1Database: 'OFFICEME_EXECUTIVE_DB',
      kvNamespace: 'DIRECTOR_POLICIES_KV',
      model: '@cf/meta/llama-3.3-70b-instruct'
    },
    metrics: {
      tasksCompleted: 58,
      latencyMs: 110,
      tokensProcessed: 620000,
      cpuLoad: 28,
      memoryMb: 210
    },
    lastActive: new Date().toISOString(),
    visual: {
      suitColor: 0x17181b,
      accentColor: 0x17181b,
      skinColor: 0xdfae92,
      hairColor: 0x1e1b18,
      hairStyle: 'short_fade',
      hasGlasses: false,
      gender: 'male',
      height: 1.82,
      hasTie: true,
      tieColor: 0x111214,
      shirtColor: 0xffffff,
      shoeType: 'dress_shoes',
      pngAsset: 'assets/william-bigboss.png'
    }
  },
  {
    id: 'alexander-data-analyst',
    name: 'Alexander',
    role: 'Data Analyst',
    department: 'Data Analytics',
    status: 'working',
    currentTask: 'Analyzing traffic and affiliate conversion matrix across edge nodes',
    progress: 74,
    location: 'workstation_alexander',
    cfBinding: {
      workerName: 'officeme-analytics-worker',
      d1Database: 'OFFICEME_ANALYTICS_DB',
      kvNamespace: 'ANALYTICS_CACHE_KV',
      model: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b'
    },
    metrics: {
      tasksCompleted: 94,
      latencyMs: 82,
      tokensProcessed: 1120000,
      cpuLoad: 52,
      memoryMb: 340
    },
    lastActive: new Date().toISOString(),
    visual: {
      suitColor: 0x374151,
      accentColor: 0x374151,
      skinColor: 0xe3b29a,
      hairColor: 0x201d20,
      hairStyle: 'center_part',
      hasGlasses: false,
      gender: 'male',
      height: 1.78,
      hasTie: true,
      tieColor: 0x1d4ed8,
      shirtColor: 0xffffff,
      shoeType: 'sneakers',
      pngAsset: 'assets/alexander-data-analyst.png'
    }
  },
  {
    id: 'olivia-product-researcher',
    name: 'Olivia',
    role: 'Product Researcher',
    department: 'Product Strategy',
    status: 'thinking',
    currentTask: 'Evaluating competitive products and catalog demand on affiliate network',
    progress: 60,
    location: 'workstation_olivia',
    cfBinding: {
      workerName: 'officeme-research-worker',
      d1Database: 'OFFICEME_CATALOG_DB',
      kvNamespace: 'RESEARCH_CACHE_KV',
      model: '@cf/meta/llama-3.1-70b-instruct'
    },
    metrics: {
      tasksCompleted: 76,
      latencyMs: 145,
      tokensProcessed: 740000,
      cpuLoad: 34,
      memoryMb: 260
    },
    lastActive: new Date().toISOString(),
    visual: {
      suitColor: 0xffffff,
      accentColor: 0x1e293b,
      skinColor: 0xe8b69e,
      hairColor: 0x1a1a1a,
      hairStyle: 'long_straight',
      hasGlasses: false,
      gender: 'female',
      height: 1.70,
      holdingTablet: true,
      shirtColor: 0xffffff,
      shoeType: 'flats',
      pngAsset: 'assets/olivia-product-researcher.png'
    }
  },
  {
    id: 'ethan-marketing-strategist',
    name: 'Ethan',
    role: 'Marketing Strategist',
    department: 'Growth Marketing',
    status: 'working',
    currentTask: 'Generating viral promotional campaigns for Shopee & TikTok affiliate pipelines',
    progress: 81,
    location: 'workstation_ethan',
    cfBinding: {
      workerName: 'officeme-growth-worker',
      d1Database: 'OFFICEME_CAMPAIGNS_DB',
      kvNamespace: 'CAMPAIGNS_KV',
      model: '@cf/meta/llama-3.1-8b-instruct'
    },
    metrics: {
      tasksCompleted: 108,
      latencyMs: 68,
      tokensProcessed: 980000,
      cpuLoad: 44,
      memoryMb: 290
    },
    lastActive: new Date().toISOString(),
    visual: {
      suitColor: 0x93c5fd,
      accentColor: 0x1e293b,
      skinColor: 0xefc6ad,
      hairColor: 0x78716c,
      hairStyle: 'slick',
      hasGlasses: true,
      gender: 'male',
      height: 1.77,
      shirtColor: 0xbfdbfe,
      shoeType: 'dress_shoes',
      pngAsset: 'assets/ethan-marketing-strategist.png'
    }
  },
  {
    id: 'sophia-content-creator',
    name: 'Sophia',
    role: 'Content Creator',
    department: 'Creative & Social Studio',
    status: 'working',
    currentTask: 'Drafting multi-format video scripts and editorial hooks for social media',
    progress: 67,
    location: 'workstation_sophia',
    cfBinding: {
      workerName: 'officeme-content-worker',
      d1Database: 'OFFICEME_CONTENT_DB',
      kvNamespace: 'SCRIPTS_KV',
      model: '@cf/meta/llama-3.2-3b-instruct'
    },
    metrics: {
      tasksCompleted: 88,
      latencyMs: 55,
      tokensProcessed: 890000,
      cpuLoad: 39,
      memoryMb: 245
    },
    lastActive: new Date().toISOString(),
    visual: {
      suitColor: 0xd6c7b2,
      accentColor: 0x18181b,
      skinColor: 0xe7b59c,
      hairColor: 0x171717,
      hairStyle: 'shoulder_layered',
      hasGlasses: false,
      gender: 'female',
      height: 1.68,
      shirtColor: 0xffffff,
      shoeType: 'heels',
      pngAsset: 'assets/sophia-content-creator.png'
    }
  },
  {
    id: 'daniel-seo-specialist',
    name: 'Daniel',
    role: 'SEO Specialist',
    department: 'Search Engine Optimization',
    status: 'working',
    currentTask: 'Crawling keyword intent and backlink authority distribution',
    progress: 85,
    location: 'workstation_daniel',
    cfBinding: {
      workerName: 'officeme-seo-worker',
      d1Database: 'OFFICEME_SEO_DB',
      kvNamespace: 'SEO_CACHE_KV',
      model: '@cf/mistral/mistral-7b-instruct-v0.2'
    },
    metrics: {
      tasksCompleted: 119,
      latencyMs: 72,
      tokensProcessed: 1350000,
      cpuLoad: 48,
      memoryMb: 310
    },
    lastActive: new Date().toISOString(),
    visual: {
      suitColor: 0x1c1917,
      accentColor: 0x382f2d,
      skinColor: 0xd8a17f,
      hairColor: 0x1c1917,
      hairStyle: 'short_fade',
      hasGlasses: false,
      gender: 'male',
      height: 1.76,
      shortSleeves: true,
      shirtColor: 0x1c1917,
      shoeType: 'dress_shoes',
      pngAsset: 'assets/daniel-seo-specialist.png'
    }
  },
  {
    id: 'isabella-graphic-designer',
    name: 'Isabella',
    role: 'Graphic Designer',
    department: 'Visual & Brand Design',
    status: 'thinking',
    currentTask: 'Designing high-converting hero banners, color palettes, and typography tokens',
    progress: 52,
    location: 'workstation_isabella',
    cfBinding: {
      workerName: 'officeme-designer-worker',
      d1Database: 'OFFICEME_ASSETS_DB',
      kvNamespace: 'BRAND_TOKENS_KV',
      model: '@cf/black-forest-labs/flux-1-schnell'
    },
    metrics: {
      tasksCompleted: 64,
      latencyMs: 195,
      tokensProcessed: 480000,
      cpuLoad: 36,
      memoryMb: 280
    },
    lastActive: new Date().toISOString(),
    visual: {
      suitColor: 0x374151,
      accentColor: 0x374151,
      skinColor: 0xe8b69b,
      hairColor: 0x1f1d1d,
      hairStyle: 'wavy',
      hasGlasses: false,
      gender: 'female',
      height: 1.71,
      shirtColor: 0xffffff,
      shoeType: 'dress_shoes',
      pngAsset: 'assets/isabella-graphic-designer.png'
    }
  },
  {
    id: 'lucas-automation-engineer',
    name: 'Lucas',
    role: 'Automation Engineer',
    department: 'DevOps & Workflows',
    status: 'working',
    currentTask: 'Deploying edge scheduled crons and durable queue workers',
    progress: 89,
    location: 'workstation_lucas',
    cfBinding: {
      workerName: 'officeme-automation-worker',
      d1Database: 'OFFICEME_INFRA_DB',
      kvNamespace: 'PIPELINES_KV',
      model: '@cf/meta/llama-3.1-8b-instruct'
    },
    metrics: {
      tasksCompleted: 142,
      latencyMs: 38,
      tokensProcessed: 1820000,
      cpuLoad: 58,
      memoryMb: 380
    },
    lastActive: new Date().toISOString(),
    visual: {
      suitColor: 0xf8fafc,
      accentColor: 0x334155,
      skinColor: 0xdca681,
      hairColor: 0x171717,
      hairStyle: 'short_fade',
      hasGlasses: false,
      gender: 'male',
      height: 1.79,
      holdingTablet: true,
      shirtColor: 0xffffff,
      shoeType: 'dress_shoes',
      pngAsset: 'assets/lucas-automation-engineer.png'
    }
  },
  {
    id: 'charlotte-quality-controller',
    name: 'Charlotte',
    role: 'Quality Controller',
    department: 'Quality Assurance & Audit',
    status: 'success',
    currentTask: 'All automated validation checks passed: affiliate link integrity 100%',
    progress: 100,
    location: 'workstation_charlotte',
    cfBinding: {
      workerName: 'officeme-qa-worker',
      d1Database: 'OFFICEME_AUDIT_DB',
      kvNamespace: 'AUDIT_LOGS_KV',
      model: '@cf/mistral/mistral-7b-instruct-v0.2'
    },
    metrics: {
      tasksCompleted: 165,
      latencyMs: 44,
      tokensProcessed: 910000,
      cpuLoad: 22,
      memoryMb: 195
    },
    lastActive: new Date().toISOString(),
    visual: {
      suitColor: 0x17181b,
      accentColor: 0x17181b,
      skinColor: 0xe8b69b,
      hairColor: 0x18181b,
      hairStyle: 'wavy',
      hasGlasses: false,
      gender: 'female',
      height: 1.67,
      hasSkirt: true,
      lipstickColor: 0xb91c1c,
      shirtColor: 0x17181b,
      shoeType: 'heels',
      pngAsset: 'assets/charlotte-quality-controller.png'
    }
  }
];

const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'overview',
    name: 'Office Overview',
    position: [0, 8.2, 12.5],
    target: [0, 0.8, 0],
    description: 'Panoramic view of all 9 agent workstations and executive office'
  },
  {
    id: 'director',
    name: 'William (Director)',
    position: [0, 2.4, -0.6],
    target: [0, 1.2, -3.2],
    description: 'William Bigboss at executive office and presentation board'
  },
  {
    id: 'alexander',
    name: 'Alexander (Analytics)',
    position: [-5.2, 2.0, 3.4],
    target: [-5.2, 1.1, 0.8],
    description: 'Alexander analyzing traffic conversions and data models'
  },
  {
    id: 'olivia',
    name: 'Olivia (Research)',
    position: [-5.2, 2.0, 6.4],
    target: [-5.2, 1.1, 3.8],
    description: 'Olivia evaluating product catalog with digital tablet'
  },
  {
    id: 'ethan',
    name: 'Ethan (Marketing)',
    position: [-1.8, 2.0, 3.4],
    target: [-1.8, 1.1, 0.8],
    description: 'Ethan managing growth campaigns and affiliate funnels'
  },
  {
    id: 'sophia',
    name: 'Sophia (Creative)',
    position: [-1.8, 2.0, 6.4],
    target: [-1.8, 1.1, 3.8],
    description: 'Sophia crafting social content scripts and hooks'
  },
  {
    id: 'daniel',
    name: 'Daniel (SEO)',
    position: [1.8, 2.0, 3.4],
    target: [1.8, 1.1, 0.8],
    description: 'Daniel auditing keyword intent and search rankings'
  },
  {
    id: 'isabella',
    name: 'Isabella (Design)',
    position: [1.8, 2.0, 6.4],
    target: [1.8, 1.1, 3.8],
    description: 'Isabella building visual palettes and UI components'
  },
  {
    id: 'lucas',
    name: 'Lucas (Automation)',
    position: [5.2, 2.0, 3.4],
    target: [5.2, 1.1, 0.8],
    description: 'Lucas deploying edge workers and scheduled crons'
  },
  {
    id: 'charlotte',
    name: 'Charlotte (QA)',
    position: [5.2, 2.0, 6.4],
    target: [5.2, 1.1, 3.8],
    description: 'Charlotte verifying system tests and affiliate link integrity'
  }
];

export default function App() {
  const [agents, setAgents] = useState<AgentCharacter[]>(INITIAL_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('william-bigboss');
  const [activePresetId, setActivePresetId] = useState<string>('overview');
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Modals state
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isVRMModalOpen, setIsVRMModalOpen] = useState<boolean>(false);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState<boolean>(false);

  // Performance telemetry
  const [telemetry, setTelemetry] = useState<OfficeTelemetry>({
    fps: 60,
    frameTime: 16.6,
    drawCalls: 45,
    triangles: 14800,
    isSoftwareGl: false,
    gpuRenderer: 'Initializing...',
    memoryEstimateMb: 210,
    targetFramerate: 60
  });

  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneInstanceRef = useRef<OfficeScene | null>(null);

  // Sync with backend on mount
  useEffect(() => {
    fetchAgents()
      .then((data) => {
        if (data && data.agents && data.agents.length > 0) {
          setAgents((prev) => {
            // merge with visuals
            return data.agents.map((remote) => {
              const localMatch = prev.find((p) => p.id === remote.id);
              return {
                ...remote,
                visual: localMatch ? localMatch.visual : prev[0].visual
              };
            });
          });
        }
      })
      .catch((err) => {
        console.info('[OfficeMe] Backend active with client cache:', err);
      });
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!is3DMode || !canvasMountRef.current) return;

    // Check if WebGL is supported
    const hasWebGL = (() => {
      try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
      } catch {
        return false;
      }
    })();

    if (!hasWebGL) {
      console.warn('[OfficeMe] WebGL not supported, switching to 2D Eco-Mode');
      setIs3DMode(false);
      return;
    }

    try {
      const scene = new OfficeScene({
        container: canvasMountRef.current,
        agents: INITIAL_AGENTS,
        onSelectAgent: (agentId) => {
          setSelectedAgentId(agentId);
          setIsInspectorOpen(true);
        },
        onTelemetryUpdate: (t) => {
          setTelemetry(t);
        }
      });

      sceneInstanceRef.current = scene;

      return () => {
        scene.dispose();
        sceneInstanceRef.current = null;
      };
    } catch (err) {
      console.error('[OfficeMe] Failed to initialize 3D scene:', err);
      setIs3DMode(false);
    }
  }, [is3DMode]);

  // Handlers
  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    // Find matching camera preset
    let targetPresetId = 'overview';
    if (agentId === 'william-bigboss') targetPresetId = 'director';
    else if (agentId === 'alexander-data-analyst') targetPresetId = 'alexander';
    else if (agentId === 'olivia-product-researcher') targetPresetId = 'olivia';
    else if (agentId === 'ethan-marketing-strategist') targetPresetId = 'ethan';
    else if (agentId === 'sophia-content-creator') targetPresetId = 'sophia';
    else if (agentId === 'daniel-seo-specialist') targetPresetId = 'daniel';
    else if (agentId === 'isabella-graphic-designer') targetPresetId = 'isabella';
    else if (agentId === 'lucas-automation-engineer') targetPresetId = 'lucas';
    else if (agentId === 'charlotte-quality-controller') targetPresetId = 'charlotte';

    const preset = CAMERA_PRESETS.find((p) => p.id === targetPresetId);
    if (preset && sceneInstanceRef.current) {
      setActivePresetId(preset.id);
      sceneInstanceRef.current.focusCamera(preset);
    }
  };

  const handleSelectCameraPreset = (preset: CameraPreset) => {
    setActivePresetId(preset.id);
    if (sceneInstanceRef.current) {
      sceneInstanceRef.current.focusCamera(preset);
    }
  };

  const handleUpdateStatus = (agentId: string, status: AgentStatus) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, status, lastActive: new Date().toISOString() } : a))
    );

    if (sceneInstanceRef.current) {
      sceneInstanceRef.current.updateAgentStatus(agentId, status);
    }

    apiUpdateStatus(agentId, status).catch(() => {});
  };

  const handleOverridePose = (agentId: string, pose: AgentPose) => {
    if (sceneInstanceRef.current) {
      sceneInstanceRef.current.setAgentPose(agentId, pose);
    }
  };

  const handleDispatchPrompt = (agentId: string, prompt: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? {
              ...a,
              status: 'working',
              currentTask: prompt,
              progress: 20,
              metrics: { ...a.metrics, tasksCompleted: a.metrics.tasksCompleted + 1 }
            }
          : a
      )
    );

    if (sceneInstanceRef.current) {
      sceneInstanceRef.current.updateAgentStatus(agentId, 'working');
    }

    apiDispatchTask(agentId, prompt).catch(() => {});
  };

  const handleExecuteAction = (agentId: string, action: 'approve' | 'reject' | 'reset') => {
    const newStatus: AgentStatus = action === 'approve' ? 'success' : action === 'reject' ? 'failure' : 'idle';
    handleUpdateStatus(agentId, newStatus);
    apiExecuteAction(agentId, action).catch(() => {});
  };

  const handleToggleAudio = () => {
    const muted = audio.toggleMute();
    setIsAudioMuted(muted);
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top Header Navigation */}
      <NavigationHeader
        is3DMode={is3DMode}
        onToggle3DMode={() => setIs3DMode(!is3DMode)}
        cameraPresets={CAMERA_PRESETS}
        activeCameraPresetId={activePresetId}
        onSelectCameraPreset={handleSelectCameraPreset}
        isAudioMuted={isAudioMuted}
        onToggleAudio={handleToggleAudio}
        onOpenVRMModal={() => setIsVRMModalOpen(true)}
        onOpenDiagnosticsModal={() => setIsDiagnosticsModalOpen(true)}
        telemetry={telemetry}
      />

      {/* Main Viewport Container */}
      {is3DMode ? (
        <div
          ref={canvasMountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
        />
      ) : (
        <div className="w-full h-full pt-20">
          <Office2DFallback
            agents={agents}
            selectedAgentId={selectedAgentId}
            onSelectAgent={handleSelectAgent}
            onDispatchTask={handleDispatchPrompt}
            onTriggerStatus={handleUpdateStatus}
          />
        </div>
      )}

      {/* Unified Bottom Control Dock */}
      <BottomControlDock
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={handleSelectAgent}
        onUpdateStatus={handleUpdateStatus}
        onOverridePose={handleOverridePose}
        onDispatchPrompt={handleDispatchPrompt}
        onOpenInspector={() => setIsInspectorOpen(true)}
      />

      {/* Modals */}
      {isInspectorOpen && (
        <AgentInspectorModal
          agent={selectedAgent}
          onClose={() => setIsInspectorOpen(false)}
          onUpdateStatus={handleUpdateStatus}
          onOverridePose={handleOverridePose}
          onDispatchTask={handleDispatchPrompt}
          onExecuteAction={handleExecuteAction}
        />
      )}

      {isVRMModalOpen && (
        <VRMManagerModal onClose={() => setIsVRMModalOpen(false)} />
      )}

      {isDiagnosticsModalOpen && (
        <DiagnosticsModal
          telemetry={telemetry}
          onClose={() => setIsDiagnosticsModalOpen(false)}
        />
      )}
    </div>
  );
}
