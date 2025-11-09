// Simple credential store using Web Crypto + IndexedDB
// Stores passwords encrypted per-identifier (email/username) on this device.
// Notes:
// - This is meant only for convenience on trusted devices.
// - Do NOT use for highly sensitive environments without additional controls.

const DB_NAME = 'fsuu-cred-v1';
const DB_VERSION = 1;
const STORE_KEYS = 'keys';
const STORE_CREDS = 'creds';
const MASTER_KEY_ID = 'main';

function isEnvSupported() {
  try {
    return (
      typeof window !== 'undefined' &&
      !!window.indexedDB &&
      !!window.crypto &&
      !!window.crypto.subtle &&
      typeof TextEncoder !== 'undefined' &&
      typeof TextDecoder !== 'undefined'
    );
  } catch {
    return false;
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (!isEnvSupported()) return reject(new Error('Credential store not supported in this environment'));

    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_KEYS)) {
        db.createObjectStore(STORE_KEYS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CREDS)) {
        db.createObjectStore(STORE_CREDS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open credential DB'));
  });
}

function txWrap(db, store, mode) {
  const tx = db.transaction(store, mode);
  return { tx, os: tx.objectStore(store) };
}

function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuf(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

async function getOrCreateMasterKey() {
  const db = await openDB();
  // Try to read raw key bytes first
  const { tx, os } = txWrap(db, STORE_KEYS, 'readwrite');
  const raw = await new Promise((resolve, reject) => {
    const r = os.get(MASTER_KEY_ID);
    r.onsuccess = () => resolve(r.result?.raw || null);
    r.onerror = () => reject(r.error);
  });

  if (raw) {
    const key = await crypto.subtle.importKey(
      'raw',
      base64ToBuf(raw),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
    db.close();
    return key;
  }

  // Create new 256-bit raw key
  const rawBytes = new Uint8Array(32);
  crypto.getRandomValues(rawBytes);
  const rawB64 = bufToBase64(rawBytes.buffer);
  await new Promise((resolve, reject) => {
    const put = os.put({ id: MASTER_KEY_ID, raw: rawB64 });
    put.onsuccess = () => resolve();
    put.onerror = () => reject(put.error);
  });
  tx.commit?.();
  db.close();

  const key = await crypto.subtle.importKey(
    'raw',
    rawBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  return key;
}

export async function saveCredential(identifier, password) {
  if (!isEnvSupported()) return;
  if (!identifier || !password) return;
  const id = String(identifier).trim();
  const key = await getOrCreateMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

  const db = await openDB();
  const { tx, os } = txWrap(db, STORE_CREDS, 'readwrite');
  await new Promise((resolve, reject) => {
    const put = os.put({ id, iv: bufToBase64(iv.buffer), data: bufToBase64(cipher) });
    put.onsuccess = () => resolve();
    put.onerror = () => reject(put.error);
  });
  tx.commit?.();
  db.close();
}

export async function getCredential(identifier) {
  if (!isEnvSupported()) return null;
  if (!identifier) return null;
  const id = String(identifier).trim();
  const db = await openDB();
  const { os } = txWrap(db, STORE_CREDS, 'readonly');
  const record = await new Promise((resolve, reject) => {
    const r = os.get(id);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => reject(r.error);
  });
  db.close();
  if (!record) return null;

  try {
    const key = await getOrCreateMasterKey();
    const iv = new Uint8Array(base64ToBuf(record.iv));
    const cipher = base64ToBuf(record.data);
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    const dec = new TextDecoder();
    return dec.decode(plainBuf);
  } catch (e) {
    console.warn('Failed to decrypt saved credential:', e);
    return null;
  }
}

export async function deleteCredential(identifier) {
  if (!isEnvSupported()) return;
  if (!identifier) return;
  const id = String(identifier).trim();
  const db = await openDB();
  const { tx, os } = txWrap(db, STORE_CREDS, 'readwrite');
  await new Promise((resolve, reject) => {
    const del = os.delete(id);
    del.onsuccess = () => resolve();
    del.onerror = () => reject(del.error);
  });
  tx.commit?.();
  db.close();
}

export default { saveCredential, getCredential, deleteCredential };
