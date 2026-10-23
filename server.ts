import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// In-memory state for OfficeMe AI Agents & Cloudflare Workflows
export interface AgentState {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'idle' | 'thinking' | 'working' | 'success' | 'failure' | 'waiting_approval';
  currentTask: string;
  progress: number;
  location:
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
}

let agents: AgentState[] = [
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
    lastActive: new Date().toISOString()
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
    lastActive: new Date().toISOString()
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
    lastActive: new Date().toISOString()
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
    lastActive: new Date().toISOString()
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
    lastActive: new Date().toISOString()
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
    lastActive: new Date().toISOString()
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
    lastActive: new Date().toISOString()
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
    lastActive: new Date().toISOString()
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
    lastActive: new Date().toISOString()
  }
];

interface LogEntry {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  level: 'info' | 'warn' | 'success' | 'action';
  message: string;
}

let agentLogs: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString(),
    agentId: 'agent-pm',
    agentName: 'Sarah Jenkins',
    level: 'action',
    message: 'Submitted pull request #402 for Cloudflare Agent Mesh architecture. Awaiting approval.'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toLocaleTimeString(),
    agentId: 'agent-dev',
    agentName: 'Alex Rivera',
    level: 'info',
    message: 'Compiling bone matrix weights. FK solver running smoothly at 60 FPS.'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString(),
    agentId: 'agent-design',
    agentName: 'Elena Rostova',
    level: 'info',
    message: 'Iterating on natural breathing cycle harmonic wave (0.24 Hz).'
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 1).toLocaleTimeString(),
    agentId: 'agent-qa',
    agentName: 'Maya Patel',
    level: 'success',
    message: 'Workflow compliance verification completed successfully with 100% test coverage.'
  }
];

// Cloudflare Agent API routes
app.get('/api/cloudflare/agents', (_req, res) => {
  res.json({
    success: true,
    agents,
    environment: {
      provider: 'Cloudflare Workers & Pages AI',
      edgeRegion: 'sin01 (Singapore Edge POP)',
      durableObjectsActive: true,
      vectorizeIndex: 'officeme-team-embeddings',
      d1ReplicationStatus: 'HEALTHY_SYNCED'
    }
  });
});

app.post('/api/cloudflare/status', (req, res) => {
  const { agentId, status, currentTask } = req.body;
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) {
    res.status(404).json({ success: false, error: 'Agent not found' });
    return;
  }

  if (status) agent.status = status;
  if (currentTask) agent.currentTask = currentTask;
  agent.lastActive = new Date().toISOString();

  const logEntry: LogEntry = {
    id: 'log-' + Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    agentId: agent.id,
    agentName: agent.name,
    level: status === 'success' ? 'success' : status === 'failure' ? 'warn' : 'info',
    message: `Status updated to [${status}]: ${agent.currentTask}`
  };
  agentLogs.unshift(logEntry);
  if (agentLogs.length > 50) agentLogs.pop();

  res.json({ success: true, agent, log: logEntry });
});

app.post('/api/cloudflare/dispatch', (req, res) => {
  const { agentId, prompt, taskType } = req.body;
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) {
    res.status(404).json({ success: false, error: 'Agent not found' });
    return;
  }

  agent.status = 'working';
  agent.currentTask = prompt || `Processing dispatched task: ${taskType || 'Execution'}`;
  agent.progress = 10;
  agent.lastActive = new Date().toISOString();
  agent.metrics.tasksCompleted += 1;

  const logEntry: LogEntry = {
    id: 'log-' + Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    agentId: agent.id,
    agentName: agent.name,
    level: 'action',
    message: `Dispatched Cloudflare Worker task to ${agent.name}: "${agent.currentTask}"`
  };
  agentLogs.unshift(logEntry);

  res.json({
    success: true,
    workflowId: `cf-wf-${Date.now().toString(36)}`,
    agent,
    dispatchedAt: new Date().toISOString()
  });
});

app.post('/api/cloudflare/action', (req, res) => {
  const { agentId, action } = req.body;
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) {
    res.status(404).json({ success: false, error: 'Agent not found' });
    return;
  }

  if (action === 'approve') {
    agent.status = 'success';
    agent.currentTask = 'Approved by Operator: Deploying Cloudflare Worker changes to production';
    agent.progress = 100;
  } else if (action === 'reject') {
    agent.status = 'failure';
    agent.currentTask = 'Changes rejected by Operator. Revising deployment plan.';
  } else if (action === 'reset') {
    agent.status = 'idle';
    agent.currentTask = 'Standby for new commands';
  }

  agent.lastActive = new Date().toISOString();

  const logEntry: LogEntry = {
    id: 'log-' + Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    agentId: agent.id,
    agentName: agent.name,
    level: action === 'approve' ? 'success' : action === 'reject' ? 'warn' : 'info',
    message: `Operator triggered action [${action.toUpperCase()}] on ${agent.name}`
  };
  agentLogs.unshift(logEntry);

  res.json({ success: true, agent });
});

app.get('/api/cloudflare/logs', (_req, res) => {
  res.json({ success: true, logs: agentLogs });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'OfficeMe 3D Virtual AI Team Platform',
    timestamp: new Date().toISOString()
  });
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OfficeMe Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[OfficeMe Server] Failed to start:', err);
  process.exit(1);
});
