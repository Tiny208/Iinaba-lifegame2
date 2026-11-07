#!/usr/bin/env node

/**
 * nosleep_watcher.js
 * Daemon giám sát toàn bộ các Agent và task trong dự án LifeGame2.
 * Giữ màn hình thức khi BẤT KỲ Agent nào còn đang chạy.
 * Chỉ kích hoạt đếm ngược ngủ khi TẤT CẢ các Agent và task đã kết thúc hoàn toàn.
 */

import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { getActiveAgents } from './check_active_agents.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const configFile = path.join(projectRoot, '.agents', 'sleep_config.json');
const nosleepScript = path.join(projectRoot, 'scripts', 'nosleep.sh');
const watcherPidFile = '/tmp/nosleep_watcher_LifeGame2.pid';
const logFile = '/tmp/nosleep_watcher_LifeGame2.log';

function log(msg) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
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

// Kiểm tra xem watcher khác đã chạy chưa
if (fs.existsSync(watcherPidFile)) {
  try {
    const existingPid = parseInt(fs.readFileSync(watcherPidFile, 'utf8').trim(), 10);
    if (existingPid && existingPid !== process.pid) {
      const isRunning = execSync(`ps -p ${existingPid} -o comm= 2>/dev/null || true`, { encoding: 'utf8' }).trim();
      if (isRunning) {
        log(`Watcher đã đang chạy ở PID: ${existingPid}. Tiến trình này sẽ thoát.`);
        process.exit(0);
      }
    }
  } catch (e) {}
}

fs.writeFileSync(watcherPidFile, String(process.pid));
log(`Watcher Daemon đã khởi động (PID: ${process.pid})`);

// Đảm bảo caffeinate chạy
try {
  execSync(`"${nosleepScript}" start`, { stdio: 'ignore' });
} catch (e) {}

let idleStartTime = null;

const cleanup = () => {
  try { if (fs.existsSync(watcherPidFile)) fs.unlinkSync(watcherPidFile); } catch (e) {}
  log('Watcher Daemon đã dừng.');
};

process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('exit', cleanup);

const POLL_INTERVAL_MS = 5000;

setInterval(() => {
  const config = getConfig();

  if (!config.enabled) {
    log('Watcher: Đã tắt theo sleep_config.json. Thoát.');
    process.exit(0);
  }

  const scope = config.monitorScope === 'all' ? null : 'LifeGame2';
  const activeAgents = getActiveAgents(null, scope);

  if (activeAgents.length > 0) {
    if (idleStartTime !== null) {
      log(`Phát hiện lại Agent đang chạy (${activeAgents.map(a => a.title).join(', ')}). Đặt lại idle timer.`);
      idleStartTime = null;
    }
    // Đảm bảo caffeinate luôn bật
    try { execSync(`"${nosleepScript}" start`, { stdio: 'ignore' }); } catch (e) {}
  } else {
    // Không còn Agent nào đang chạy
    if (idleStartTime === null) {
      idleStartTime = Date.now();
      log('Tất cả các Agent đã ngừng hoạt động! Bắt đầu tính thời gian chờ an toàn (Grace period)...');
    } else {
      const gracePeriodMs = (config.gracePeriodSeconds || 20) * 1000;
      const elapsed = Date.now() - idleStartTime;
      log(`Không có Agent nào chạy: đã trôi qua ${Math.round(elapsed / 1000)}s / ${Math.round(gracePeriodMs / 1000)}s`);

      if (elapsed >= gracePeriodMs) {
        log('Thời gian chờ kết thúc và KHÔNG còn Agent nào chạy! Kích hoạt tiến trình tự động ngủ...');
        cleanup();
        
        // Gọi nosleep.sh finish để chuông reo + hộp thoại đếm ngược + sleep
        try {
          const child = spawn('/bin/bash', [nosleepScript, 'finish'], {
            detached: true,
            stdio: 'ignore'
          });
          child.unref();
        } catch (err) {
          log(`Lỗi khi gọi nosleep finish: ${err.message}`);
        }

        process.exit(0);
      }
    }
  }
}, POLL_INTERVAL_MS);
