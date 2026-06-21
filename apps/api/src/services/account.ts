/**
 * account.ts — full account deletion (Apple Guideline 5.1.1(v): apps with accounts must let users
 * delete their account + data from inside the app). Wipes every store EBE keeps for the user.
 */
import { clearUserMemories } from './memoryStore.js';
import { clearUserTasks } from './taskStore.js';
import { clearUserActions } from './actionStore.js';
import { clearUserNotepad } from './notepadStore.js';
import { clearUserJournal } from './journalStore.js';
import { clearUserCouncilRuns } from './councilStore.js';
import { clearUserTokens } from './oauthStore.js';

export async function deleteAccount(userKey: string): Promise<{ deleted: string[] }> {
  const steps: [string, () => Promise<void>][] = [
    ['memories', () => clearUserMemories(userKey)],
    ['tasks', () => clearUserTasks(userKey)],
    ['actions', () => clearUserActions(userKey)],
    ['notepad', () => clearUserNotepad(userKey)],
    ['journal', () => clearUserJournal(userKey)],
    ['councilRuns', () => clearUserCouncilRuns(userKey)],
    ['connections', () => clearUserTokens(userKey)]
  ];
  const deleted: string[] = [];
  for (const [name, fn] of steps) {
    try { await fn(); deleted.push(name); } catch { /* best-effort; keep wiping the rest */ }
  }
  return { deleted };
}
