#!/usr/bin/env node

/**
 * check_active_agents.js
 * Kiểm tra danh sách các Agent đang chạy trong Antigravity (dự án LifeGame2 hoặc toàn bộ).
 */

import { execSync } from 'child_process';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const dbPath = path.join(os.homedir(), '.gemini', 'antigravity', 'conversation_summaries.db');

export function getActiveAgents(excludeId = null, filterWorkspace = null) {
  try {
    let conditions = ["not_fully_idle = 1", "killed = 0"];
    if (excludeId) {
      conditions.push(`conversation_id != '${excludeId}'`);
    }
    if (filterWorkspace) {
      conditions.push(`workspace_uris LIKE '%${filterWorkspace}%'`);
    }

    const query = `SELECT conversation_id, title, workspace_uris, not_fully_idle, datetime(last_modified_time) FROM conversation_summaries WHERE ${conditions.join(" AND ")};`;
    const out = execSync(`sqlite3 "${dbPath}" "${query}"`, { encoding: 'utf8' }).trim();
    if (!out) return [];

    return out.split('\n').filter(Boolean).map(line => {
      const parts = line.split('|');
      let ws = [];
      try { ws = JSON.parse(parts[2]); } catch (e) { ws = [parts[2]]; }
      return {
        id: parts[0],
        title: parts[1],
        workspaceUris: ws,
        notFullyIdle: parts[3] === '1',
        lastModified: parts[4]
      };
    });
  } catch (err) {
    return [];
  }
}

// Kiểm tra xem script được chạy trực tiếp hay được import
const currentFilePath = fileURLToPath(import.meta.url);
const executedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (executedFilePath === currentFilePath || executedFilePath.endsWith('check_active_agents.js')) {
  const args = process.argv.slice(2);
  let excludeId = null;
  let filterWorkspace = null;
  let asJson = false;
  let countOnly = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--exclude' && args[i + 1]) {
      excludeId = args[++i];
    } else if (args[i] === '--workspace' && args[i + 1]) {
      filterWorkspace = args[++i];
    } else if (args[i] === '--json') {
      asJson = true;
    } else if (args[i] === '--count') {
      countOnly = true;
    }
  }

  const active = getActiveAgents(excludeId, filterWorkspace);

  if (countOnly) {
    console.log(active.length);
  } else if (asJson) {
    console.log(JSON.stringify(active, null, 2));
  } else {
    if (active.length === 0) {
      console.log("Không có Agent nào đang chạy.");
    } else {
      console.log(`Đang có ${active.length} Agent đang chạy:`);
      active.forEach((ag, idx) => {
        const wsName = ag.workspaceUris.map(u => u.split('/').pop()).join(', ');
        console.log(`  ${idx + 1}. [${ag.id.slice(0, 8)}] "${ag.title}" (Workspace: ${wsName}) - Cập nhật lúc: ${ag.lastModified}`);
      });
    }
  }
}
