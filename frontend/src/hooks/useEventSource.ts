import { useCallback, useEffect, useRef, useState } from 'react';
import type { SseEvent, SseEventType } from '@shared/types/events';

type SseStatus = 'connected' | 'disconnected' | 'failed';

interface UseEventSourceOptions {
  url: string;
  token: string;
  tableIds?: number[];
  eventTypes?: SseEventType[];
  onEvent: (event: SseEvent) => void;
  enabled?: boolean;
}

interface UseEventSourceResult {
  status: SseStatus;
  reconnect: () => void;
}

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 3000;

export function useEventSource(options: UseEventSourceOptions): UseEventSourceResult {
  const { url, token, tableIds, eventTypes, onEvent, enabled = true } = options;
  const [status, setStatus] = useState<SseStatus>('disconnected');
  const retriesRef = useRef(0);
  const esRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('token', token);
    if (tableIds && tableIds.length > 0) params.set('tableIds', tableIds.join(','));
    if (eventTypes && eventTypes.length > 0) params.set('eventTypes', eventTypes.join(','));
    return `${url}?${params.toString()}`;
  }, [url, token, tableIds, eventTypes]);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource(buildUrl());
    esRef.current = es;

    es.onopen = () => {
      setStatus('connected');
      retriesRef.current = 0;
    };

    const eventHandler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        const type = e.type as SseEvent['type'];
        onEventRef.current({ type, data } as SseEvent);
      } catch {
        // ignore parse errors
      }
    };

    es.addEventListener('order:new', eventHandler);
    es.addEventListener('order:status', eventHandler);
    es.addEventListener('order:deleted', eventHandler);
    es.addEventListener('table:completed', eventHandler);

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setStatus('disconnected');

      retriesRef.current += 1;
      if (retriesRef.current > MAX_RETRIES) {
        setStatus('failed');
        return;
      }

      const delay = BASE_DELAY_MS * Math.pow(2, retriesRef.current - 1);
      setTimeout(() => {
        if (retriesRef.current <= MAX_RETRIES) {
          connect();
        }
      }, delay);
    };
  }, [buildUrl]);

  useEffect(() => {
    if (!enabled || !token) return;

    connect();

    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [enabled, token, connect]);

  const reconnect = useCallback(() => {
    retriesRef.current = 0;
    setStatus('disconnected');
    connect();
  }, [connect]);

  return { status, reconnect };
}
