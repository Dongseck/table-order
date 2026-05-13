import type { SseEvent } from '@shared/types/events';

export type { SseEvent };

export interface ISseManager {
  broadcast(storeId: number, event: SseEvent): void;
}

/**
 * Foundation stub: logs events to console instead of fanning out to clients.
 * Unit 3 (SSE) replaces this with a real client pool.
 */
class StubSseManager implements ISseManager {
  broadcast(storeId: number, event: SseEvent): void {
    // eslint-disable-next-line no-console
    console.log(`[SSE-stub] store=${storeId} type=${event.type}`, event.data);
  }
}

export const sseManager: ISseManager = new StubSseManager();
