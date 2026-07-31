/* Durable storage for the Supabase auth SESSION.
   Default Supabase stores the session in localStorage, which iOS Safari (ITP) evicts after ~7 days
   of not opening the app → the session is lost → the app silently drops to anonymous → cloud
   progress stops syncing across devices.
   This is a COMPOSITE adapter: localStorage stays primary (fast, and existing sessions keep working
   with no re-auth), mirrored into IndexedDB. On read, if localStorage was evicted but the IndexedDB
   copy survived, the session is restored to localStorage — so it persists across ITP's cap. */
const DB_NAME = "sulog-auth", STORE = "kv", VER = 1;
let _dbP = null;
function db() {
  if (_dbP) return _dbP;
  _dbP = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
    const r = indexedDB.open(DB_NAME, VER);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return _dbP;
}
const idbGet = (k) => db().then((d) => new Promise((res) => { const r = d.transaction(STORE).objectStore(STORE).get(k); r.onsuccess = () => res(r.result ?? null); r.onerror = () => res(null); })).catch(() => null);
const idbSet = (k, v) => db().then((d) => { d.transaction(STORE, "readwrite").objectStore(STORE).put(v, k); }).catch(() => {});
const idbDel = (k) => db().then((d) => { d.transaction(STORE, "readwrite").objectStore(STORE).delete(k); }).catch(() => {});
const ls = () => (typeof localStorage !== "undefined" ? localStorage : null);

export const durableAuthStorage = {
  async getItem(k) {
    try { const v = ls()?.getItem(k); if (v != null) return v; } catch (e) {}
    const fromIdb = await idbGet(k);
    if (fromIdb != null) { try { ls()?.setItem(k, fromIdb); } catch (e) {} }  // restore after eviction
    return fromIdb;
  },
  setItem(k, v) { try { ls()?.setItem(k, v); } catch (e) {} idbSet(k, v); },
  removeItem(k) { try { ls()?.removeItem(k); } catch (e) {} idbDel(k); },
};
