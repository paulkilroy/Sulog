/* IndexedDB store for the FULL Waray dictionary (~25k rows, ~3MB).
   localStorage can't hold it on Safari (~5MB cap, UTF-16 doubles it), but IndexedDB has plenty of
   room on every browser. Populated in the BACKGROUND after the app loads (see the bg-sync effect in
   sulog.jsx); powers offline "search any word" without bloating the cached course bundle. */
const DB_NAME = "sulog", DB_VER = 1, STORE = "dictionary", META = "meta";

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "waray" });
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
const get1 = (store, key) => new Promise((res) => { const r = store.get(key); r.onsuccess = () => res(r.result); r.onerror = () => res(undefined); });
const done = (t) => new Promise((res, rej) => { t.oncomplete = res; t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });

// what's currently stored: { version, count }. version = the course version it was synced at.
export async function dictMeta() {
  try {
    const db = await openDB();
    const version = await get1(db.transaction(META, "readonly").objectStore(META), "version");
    const count = await new Promise((res) => { const r = db.transaction(STORE, "readonly").objectStore(STORE).count(); r.onsuccess = () => res(r.result); r.onerror = () => res(0); });
    db.close();
    return { version: version || 0, count: count || 0 };
  } catch (e) { return { version: 0, count: 0, unavailable: true }; }
}

// replace the whole dictionary + stamp the version (one transaction)
export async function putDict(rows, version) {
  const db = await openDB();
  const t = db.transaction([STORE, META], "readwrite");
  const store = t.objectStore(STORE);
  store.clear();
  for (const r of rows) store.put(r);
  t.objectStore(META).put(version, "version");
  await done(t);
  db.close();
}

// the whole dictionary for local (offline) search
export async function allDict() {
  try {
    const db = await openDB();
    const rows = await new Promise((res) => { const r = db.transaction(STORE, "readonly").objectStore(STORE).getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); });
    db.close();
    return rows;
  } catch (e) { return []; }
}
