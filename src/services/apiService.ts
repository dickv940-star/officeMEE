import { AgentCharacter, AgentStatus } from '../types/office';

export interface LogItem {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  level: 'info' | 'warn' | 'success' | 'action';
  message: string;
}

export interface CloudflareEnvironment {
  provider: string;
  edgeRegion: string;
  durableObjectsActive: boolean;
  vectorizeIndex: string;
  d1ReplicationStatus: string;
}

export async function fetchAgents(): Promise<{ agents: AgentCharacter[]; environment: CloudflareEnvironment }> {
  try {
    const res = await fetch('/api/cloudflare/agents');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return {
      agents: data.agents,
      environment: data.environment
    };
  } catch (err) {
    console.warn('[OfficeMe API] Failed to fetch agents from backend, using client state:', err);
    throw err;
  }
}

export async function updateAgentStatus(agentId: string, status: AgentStatus, currentTask?: string): Promise<void> {
  try {
    await fetch('/api/cloudflare/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, status, currentTask })
    });
  } catch (err) {
    console.warn('[OfficeMe API] updateAgentStatus offline error:', err);
  }
}

export async function dispatchTask(agentId: string, prompt: string, taskType?: string): Promise<{ workflowId: string }> {
  try {
    const res = await fetch('/api/cloudflare/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, prompt, taskType })
    });
    if (!res.ok) throw new Error(`Dispatch error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[OfficeMe API] dispatchTask offline fallback:', err);
    return { workflowId: `cf-wf-local-${Date.now().toString(36)}` };
  }
}

export async function executeAgentAction(agentId: string, action: 'approve' | 'reject' | 'reset'): Promise<void> {
  try {
    await fetch('/api/cloudflare/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, action })
    });
  } catch (err) {
    console.warn('[OfficeMe API] executeAgentAction offline fallback:', err);
  }
}

export async function fetchLogs(): Promise<LogItem[]> {
  try {
    const res = await fetch('/api/cloudflare/logs');
    if (!res.ok) throw new Error(`Logs error ${res.status}`);
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    return [];
  }
}
