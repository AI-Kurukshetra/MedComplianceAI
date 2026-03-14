/**
 * IndexedDB helpers for MedCompliance offline features.
 *
 * Stores:
 *   quiz_progress      – partial quiz answers (restored on page reload)
 *   pending_submissions – completed quiz payloads waiting for network
 */

const DB_NAME = "medcompliance-offline";
const DB_VERSION = 1;

export type QuizProgress = {
  moduleId: string;
  answers: Record<string, string>;
  savedAt: string;
};

export type PendingSubmission = {
  id: string; // random uuid
  moduleId: string;
  payload: { questionId: string; optionId: string }[];
  savedAt: string;
};

/* ── Open database ────────────────────────────────────────── */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("quiz_progress")) {
        db.createObjectStore("quiz_progress", { keyPath: "moduleId" });
      }

      if (!db.objectStoreNames.contains("pending_submissions")) {
        db.createObjectStore("pending_submissions", { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/* ── Generic helpers ──────────────────────────────────────── */
async function putRecord<T>(store: string, record: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getRecord<T>(store: string, key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteRecord(store: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllRecords<T>(store: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

/* ── Quiz progress ────────────────────────────────────────── */

export async function saveQuizProgress(
  moduleId: string,
  answers: Record<string, string>,
): Promise<void> {
  await putRecord<QuizProgress>("quiz_progress", {
    moduleId,
    answers,
    savedAt: new Date().toISOString(),
  });
}

export async function loadQuizProgress(moduleId: string): Promise<Record<string, string> | null> {
  const record = await getRecord<QuizProgress>("quiz_progress", moduleId);
  return record?.answers ?? null;
}

export async function clearQuizProgress(moduleId: string): Promise<void> {
  await deleteRecord("quiz_progress", moduleId);
}

/* ── Pending submissions ──────────────────────────────────── */

function uuid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function addPendingSubmission(
  moduleId: string,
  payload: { questionId: string; optionId: string }[],
): Promise<string> {
  const id = uuid();
  await putRecord<PendingSubmission>("pending_submissions", {
    id,
    moduleId,
    payload,
    savedAt: new Date().toISOString(),
  });
  return id;
}

export async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  return getAllRecords<PendingSubmission>("pending_submissions");
}

export async function removePendingSubmission(id: string): Promise<void> {
  await deleteRecord("pending_submissions", id);
}
