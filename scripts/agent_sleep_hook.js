#!/usr/bin/env node

/**
 * agent_sleep_hook.js
 * Antigravity Workspace Hook for multi-agent sleep management.
 * Project: LifeGame2
 */

import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { getActiveAgents } from './check_active_agents.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const eventName = process.argv[2] || '';
const projectRoot = path.resolve(__dirname, '..');
const configFile = path.join(projectRoot, '.agents', 'sleep_config.json');
const nosleepScript = path.join(projectRoot, 'scripts', 'nosleep.sh');
const watcherScript = path.join(projectRoot, 'scripts', 'nosleep_watcher.js');
const watcherPidFile = '/tmp/nosleep_watcher_LifeGame2.pid';
const logFile = '/tmp/agent_sleep_hook_LifeGame2.log';

function log(msg) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] [${eventName}] ${msg}\n`);
  } catch (e) {}
}

function getConfig() {
  try {
    if (fs.existsSync(configFile)) {
      return JSON.parse(fs.readFileSync(configFile, 'utf8'));
    }
  } catch (e) {}
  return { enabled: true, countdownSeconds: 25, gracePeriodSeconds: 20, monitorScope: 'LifeGame2' };
}

function ensureWatcherRunning() {
  let isRunning = false;
  if (fs.existsSync(watcherPidFile)) {
    try {
      const pid = fs.readFileSync(watcherPidFile, 'utf8').trim();
      if (pid && execSync(`ps -p ${pid} -o comm= 2>/dev/null || true`, { encoding: 'utf8' }).trim()) {
        isRunning = true;
      }
    } catch (e) {}
  }

  if (!isRunning) {
    log('Watcher Daemon chưa chạy. Tiến hành khởi chạy ngầm (detached)...');
    try {
      const child = spawn('node', [watcherScript], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      log(`Đã khởi chạy Watcher Daemon (PID tạm: ${child.pid})`);
    } catch (err) {
      log(`Lỗi khởi chạy watcher: ${err.message}`);
    }
  }
}

// Đọc toàn bộ stdin
let inputData = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', chunk => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  let payload = {};
  try {
    if (inputData.trim()) {
      payload = JSON.parse(inputData);
    }
  } catch (e) {
    log(`Lỗi parse stdin JSON: ${e.message}`);
  }

  const config = getConfig();

  if (eventName === 'PreInvocation') {
    if (config.enabled) {
      try {
        log('PreInvocation: Kích hoạt caffeinate giữ thức...');
        execSync(`"${nosleepScript}" start`, { stdio: 'ignore' });
        ensureWatcherRunning();
      } catch (err) {
        log(`PreInvocation start error: ${err.message}`);
      }
    }
    process.stdout.write(JSON.stringify({ injectSteps: [] }));
    process.exit(0);
  } else if (eventName === 'Stop') {
    const convId = payload.conversationId || '';
    log(`Stop: conversationId=${convId}, terminationReason=${payload.terminationReason}, fullyIdle=${payload.fullyIdle}`);

    if (config.enabled) {
      ensureWatcherRunning();
      const scope = config.monitorScope === 'all' ? null : 'LifeGame2';
      const otherAgents = getActiveAgents(convId, scope);

      if (otherAgents.length > 0) {
        log(`Agent ${convId.slice(0, 8)} hoàn tất turn, nhưng vẫn còn ${otherAgents.length} Agent khác (${otherAgents.map(a => a.title).join(', ')}) đang chạy. GIỮ THỨC TIẾP TỤC.`);
      } else {
        log(`Agent ${convId.slice(0, 8)} hoàn tất turn. Không còn agent nào khác đang chạy. Bàn giao cho Watcher Daemon theo dõi.`);
      }
    }

    process.stdout.write(JSON.stringify({ decision: '' }));
    process.exit(0);
  } else {
    process.stdout.write(JSON.stringify({}));
    process.exit(0);
  }
});
