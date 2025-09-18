const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.WEBQX_DATA_DIR || path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadUsers() {
  try {
    ensureDir();
    if (!fs.existsSync(USERS_FILE)) return [];
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[persistence] Failed to load users:', e.message);
    return [];
  }
}

let saveTimer = null;
function scheduleSaveUsers(map) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveUsers(map), 400); // debounce
}

function saveUsers(map) {
  try {
    ensureDir();
    const unique = new Map();
    for (const [k, user] of map.entries()) {
      // only store one copy per user id (prefer id key) to prevent duplication
      const id = user.id || k;
      if (!unique.has(id)) unique.set(id, user);
    }
    const arr = Array.from(unique.values()).map(u => ({ ...u }));
    fs.writeFileSync(USERS_FILE, JSON.stringify(arr, null, 2));
    console.log(`[persistence] Saved ${arr.length} users`);
  } catch (e) {
    console.warn('[persistence] Failed to save users:', e.message);
  }
}

module.exports = { loadUsers, scheduleSaveUsers };
