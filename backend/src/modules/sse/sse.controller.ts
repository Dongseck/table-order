import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { sseManager } from './sse.manager';
import type { SseEventType } from '@shared/types/events';

export function connectSse(req: Request, res: Response): void {
  const auth = req.auth as { adminUserId: number; storeId: number };

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(': connected\n\n');

  const clientId = randomUUID();

  const tableIdsParam = req.query.tableIds as string | undefined;
  const eventTypesParam = req.query.eventTypes as string | undefined;

  const tableIds = tableIdsParam
    ? tableIdsParam.split(',').map(Number).filter((n) => !isNaN(n))
    : undefined;
  const eventTypes = eventTypesParam
    ? (eventTypesParam.split(',') as SseEventType[])
    : undefined;

  sseManager.addClient({
    clientId,
    storeId: auth.storeId,
    adminUserId: auth.adminUserId,
    response: res,
    filter: { tableIds, eventTypes },
    connectedAt: new Date(),
  });

  req.on('close', () => {
    sseManager.removeClient(clientId);
  });
}
