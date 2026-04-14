/**
 * useEntryRequests — listens for real-time walk-in entry requests for the current resident.
 * Returns the latest pending entry request, plus a function to approve/deny it.
 */
import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import api from '../lib/api';

export interface EntryRequest {
  id: string;
  visitorName: string;
  visitorPhone?: string;
  visitorType: string;
  flat?: { number: string };
  entryTime: string;
  status: string;
}

export function useEntryRequests() {
  const socket = useSocket();
  const [pendingRequest, setPendingRequest] = useState<EntryRequest | null>(null);
  const [responding, setResponding] = useState(false);

  // Listen for real-time walk-in events
  useEffect(() => {
    if (!socket) return;

    const handler = ({ entry }: { entry: EntryRequest }) => {
      setPendingRequest(entry);
    };

    socket.on('entry:new', handler);
    return () => { socket.off('entry:new', handler); };
  }, [socket]);

  const respond = useCallback(async (action: 'approve' | 'deny') => {
    if (!pendingRequest) return;
    setResponding(true);
    try {
      await api.patch(`/entry/${pendingRequest.id}/${action}`);
      setPendingRequest(null);
    } catch (err) {
      console.error('[useEntryRequests] respond failed:', err);
    } finally {
      setResponding(false);
    }
  }, [pendingRequest]);

  return { pendingRequest, responding, respond, dismiss: () => setPendingRequest(null) };
}
