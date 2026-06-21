import { BaseConnector } from './base.js';
import type { OrbSignalInput, ConnectorStatus } from '../types/orb.js';
import { listTasks } from '../services/taskStore.js';

/** Turns the owner's open tasks (especially due-soon / overdue) into attention signals. */
export class TasksConnector extends BaseConnector {
  constructor() {
    super('tasks', 'personal');
  }

  async status(): Promise<ConnectorStatus> {
    return 'connected'; // local store, always available
  }

  async signals(userId: string): Promise<OrbSignalInput[]> {
    const open = await listTasks(userId, 'open');
    const now = Date.now();
    return open.slice(0, 25).map((t) => {
      const due = t.dueAt ? new Date(t.dueAt).getTime() : null;
      const overdue = due !== null && due < now;
      const dueSoon = due !== null && due - now < 36 * 3600 * 1000; // < 36h
      const urgency = overdue ? 0.95 : dueSoon ? 0.8 : Math.min(0.7, 0.25 + t.priority * 0.05);
      return {
        id: `task-${t.id}`,
        name: (overdue ? 'Overdue: ' : dueSoon ? 'Due soon: ' : '') + t.title,
        description: t.description ?? `Task in ${t.domain}.`,
        domain: 'personal',
        category: 'task',
        riskLevel: 'low',
        urgency,
        impact: Math.min(0.85, 0.2 + t.priority * 0.07),
        effort: 0.3,
        confidence: 0.85,
        toolName: 'tasks.complete'
      };
    });
  }
}
