export class InMemoryHistoryStore {
  constructor(maxMessages = 6, ttlMinutes = 30) {
    this._store = new Map();
    this.maxMessages = maxMessages;
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  _cleanupIfExpired(sessionId, now) {
    const session = this._store.get(sessionId);
    if (session) {
      if (now - session.lastAccessed > this.ttlMs) {
        this._store.delete(sessionId);
        return true;
      }
    }
    return false;
  }

  async getHistory(sessionId) {
    const now = Date.now();
    if (this._cleanupIfExpired(sessionId, now)) {
      return [];
    }

    const session = this._store.get(sessionId);
    if (!session) {
      return [];
    }

    session.lastAccessed = now;
    return [...session.messages];
  }

  async addTurn(sessionId, userMessage, assistantMessage) {
    const now = Date.now();
    this._cleanupIfExpired(sessionId, now);

    let session = this._store.get(sessionId);
    if (!session) {
      session = {
        messages: [],
        lastAccessed: now,
      };
      this._store.set(sessionId, session);
    }

    session.messages.push({ role: 'user', content: userMessage });
    session.messages.push({ role: 'assistant', content: assistantMessage });

    if (session.messages.length > this.maxMessages) {
      session.messages = session.messages.slice(-this.maxMessages);
    }

    session.lastAccessed = now;
  }

  async clear(sessionId) {
    this._store.delete(sessionId);
  }
}

export const defaultHistoryStore = new InMemoryHistoryStore();
export default defaultHistoryStore;
