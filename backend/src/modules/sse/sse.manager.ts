import type { Response } from 'express';
import type { SseEvent, SseEventType } from '@shared/types/events';
import { SSE_HEARTBEAT_MS } from '../../common/constants';

export type { SseEvent };

export interface SseSubscriptionFilter {
  tableIds?: number[];
  eventTypes?: SseEventType[];
}

interface SseClient {
  clientId: string;
  storeId: number;
  adminUserId: number;
  response: Response;
  filter: SseSubscriptionFilter;
  connectedAt: Date;
}

export interface ISseManager {
  broadcast(storeId: number, event: SseEvent): void;
  addClient(client: SseClient): void;
  removeClient(clientId: string): void;
  getClientCount(storeId: number): number;
}

class RealSseManager implements ISseManager {
  private clients: Map<string, SseClient> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startHeartbeat();
  }

  addClient(client: SseClient): void {
    this.clients.set(client.clientId, client);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  getClientCount(storeId: number): number {
    let count = 0;
    for (const client of this.clients.values()) {
      if (client.storeId === storeId) count++;
    }
    return count;
  }

  broadcast(storeId: number, event: SseEvent): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.storeId !== storeId) continue;

      if (!this.matchesFilter(client.filter, event)) continue;

      try {
        client.response.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
      } catch {
        this.clients.delete(clientId);
      }
    }
  }

  private matchesFilter(filter: SseSubscriptionFilter, event: SseEvent): boolean {
    if (filter.eventTypes && filter.eventTypes.length > 0) {
      if (!filter.eventTypes.includes(event.type)) return false;
    }

    if (filter.tableIds && filter.tableIds.length > 0) {
      const tableId = this.extractTableId(event);
      if (tableId !== null && !filter.tableIds.includes(tableId)) return false;
    }

    return true;
  }

  private extractTableId(event: SseEvent): number | null {
    if ('tableId' in event.data) return event.data.tableId;
    return null;
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [clientId, client] of this.clients.entries()) {
        try {
          client.response.write(': heartbeat\n\n');
        } catch {
          this.clients.delete(clientId);
        }
      }
    }, SSE_HEARTBEAT_MS);
  }

  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.clients.clear();
  }
}

export const sseManager: ISseManager = new RealSseManager();
