/**
 * WebQX Port Manager (Cross-Platform)
 * Restores missing module required by unified and legacy servers.
 * - Reserves and tracks ports to prevent conflicts
 * - Attempts graceful process termination on conflicts (Unix only)
 * - Persists lock state to repo root `.port-locks.json`
 */

const net = require('net');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Canonical port assignments (can be overridden by env)
const DEFAULT_PORTS = {
  main: 3000,
  django: 3001,
  openemr: 3002,
  telehealth: 3003
};

const LOCK_FILE = path.join(process.cwd(), '.port-locks.json');

class PortManager {
  constructor() {
    this.locks = this._loadLocks();
  }

  _loadLocks() {
    try {
      if (fs.existsSync(LOCK_FILE)) {
        return JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8')) || {};
      }
    } catch (e) {
      console.warn('PortManager: failed to read lock file:', e.message);
    }
    return {};
  }

  _saveLocks() {
    try {
      fs.writeFileSync(LOCK_FILE, JSON.stringify(this.locks, null, 2));
    } catch (e) {
      console.error('PortManager: failed to write lock file:', e.message);
    }
  }

  async isPortFree(port) {
    return new Promise(resolve => {
      const tester = net.createServer()
        .once('error', () => resolve(false))
        .once('listening', () => tester.close(() => resolve(true)))
        .listen(port, '0.0.0.0');
    });
  }

  async _pidsOnPort(port) {
    return new Promise(resolve => {
      // Unix-like: use lsof; Windows fallback: netstat parsing (best-effort)
      const cmd = process.platform === 'win32'
        ? `netstat -ano | findstr :${port}`
        : `lsof -i :${port} -sTCP:LISTEN -Pn 2>/dev/null | awk 'NR>1 {print $2}'`;
      exec(cmd, (err, stdout) => {
        if (err || !stdout) return resolve([]);
        const pids = new Set();
        stdout.split(/\r?\n/).forEach(line => {
          const trimmed = line.trim();
          if (!trimmed) return;
          if (process.platform === 'win32') {
            const parts = trimmed.split(/\s+/);
            const pid = parts[parts.length - 1];
            if (/^\d+$/.test(pid)) pids.add(pid);
          } else {
            if (/^\d+$/.test(trimmed)) pids.add(trimmed);
          }
        });
        resolve([...pids]);
      });
    });
  }

  async _killPids(pids, port) {
    if (!pids.length) return false;
    console.log(`⚠️ Port ${port} in use by PIDs: ${pids.join(', ')}. Attempting to free...`);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), 'SIGTERM');
      } catch (_) { /* ignore */ }
    }
    // Wait briefly and hard kill if needed
    await new Promise(r => setTimeout(r, 1200));
    let still = 0;
    for (const pid of pids) {
      try {
        process.kill(Number(pid), 0); // check
        process.kill(Number(pid), 'SIGKILL');
        still++;
      } catch (_) { /* already dead */ }
    }
    if (still) console.log(`🧹 Force killed ${still} lingering process(es) on ${port}`);
    return true;
  }

  async reservePort(serviceName, preferredPort) {
    const target = preferredPort || DEFAULT_PORTS[serviceName] || preferredPort;
    if (!target) throw new Error(`No port specified for service ${serviceName}`);

    let free = await this.isPortFree(target);
    if (!free) {
      const pids = await this._pidsOnPort(target);
      if (pids.length) {
        await this._killPids(pids, target);
        free = await this.isPortFree(target);
      }
    }

    if (!free) throw new Error(`Port ${target} still not free for ${serviceName}`);

    this.locks[serviceName] = { port: target, pid: process.pid, reservedAt: new Date().toISOString() };
    this._saveLocks();
    console.log(`🔒 Reserved port ${target} for ${serviceName}`);
    return target;
  }

  getPort(serviceName) {
    return (this.locks[serviceName] && this.locks[serviceName].port) || DEFAULT_PORTS[serviceName];
  }

  async releasePort(serviceName) {
    if (this.locks[serviceName]) {
      const p = this.locks[serviceName].port;
      delete this.locks[serviceName];
      this._saveLocks();
      console.log(`🔓 Released port ${p} for ${serviceName}`);
    }
  }

  async releaseAllPorts() {
    for (const key of Object.keys(this.locks)) {
      await this.releasePort(key);
    }
  }
}

module.exports = { PortManager };
