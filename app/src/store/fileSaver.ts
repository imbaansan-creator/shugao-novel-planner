/**
 * 本地单文件保存（File System Access API）
 * 只在 Chromium 内核浏览器 + localhost/https 下可用。
 * 不可用时降级为 localStorage + 手动导出。
 */

export type SaveHandle = any;

const DB_NAME = 'novel-planner-fs';
const STORE = 'handles';
const KEY = 'current';

export const canUseFileSystem = (): boolean =>
  typeof window !== 'undefined' && typeof (window as any).showSaveFilePicker === 'function';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putHandle(handle: SaveHandle): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(handle, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* 忽略：句柄存不下也不影响本次会话 */
  }
}

async function getHandle(): Promise<SaveHandle | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get(KEY);
      r.onsuccess = () => resolve(r.result ?? null);
      r.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function forgetHandle(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* ignore */
  }
}

/** 让用户选一个文件并绑定 */
export async function pickSaveFile(): Promise<SaveHandle | null> {
  const w = window as any;
  if (typeof w.showSaveFilePicker !== 'function') return null;
  try {
    const handle = await w.showSaveFilePicker({
      suggestedName: '书稿.json',
      types: [
        {
          description: '书稿数据（JSON）',
          accept: { 'application/json': ['.json'] }
        }
      ]
    });
    await putHandle(handle);
    return handle;
  } catch {
    return null; // 用户取消
  }
}

/** 权限检查；必要时申请 */
export async function ensurePermission(handle: SaveHandle): Promise<boolean> {
  try {
    const opts = { mode: 'readwrite' };
    if ((await handle.queryPermission(opts)) === 'granted') return true;
    return (await handle.requestPermission(opts)) === 'granted';
  } catch {
    return false;
  }
}

/** 写入整个数据对象 */
export async function writeToFile(
  handle: SaveHandle,
  payload: unknown
): Promise<boolean> {
  try {
    if (!(await ensurePermission(handle))) return false;
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

/** 启动时尝试恢复上次绑定的文件（权限还在才用） */
export async function restoreHandle(): Promise<SaveHandle | null> {
  const handle = await getHandle();
  if (!handle) return null;
  try {
    if ((await handle.queryPermission({ mode: 'readwrite' })) === 'granted') {
      return handle;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function dropHandle(): Promise<void> {
  await forgetHandle();
}
