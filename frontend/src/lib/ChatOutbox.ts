import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'eduflow_chat';
const STORE_NAME = 'outbox';

export class ChatOutbox {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'uuid' });
        }
      },
    });
  }

  public async enqueue(message: any) {
    const db = await this.dbPromise;
    await db.put(STORE_NAME, {
      ...message,
      queued_at: Date.now()
    });
  }

  public async getQueuedMessages() {
    const db = await this.dbPromise;
    return await db.getAll(STORE_NAME);
  }

  public async removeFromQueue(uuid: string) {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, uuid);
  }

  public async clearQueue() {
    const db = await this.dbPromise;
    await db.clear(STORE_NAME);
  }
}

export const chatOutbox = new ChatOutbox();
