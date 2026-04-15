/**
 * IncomingVisitorContext
 *
 * Shared state that bridges the socket event (fired inside useNotifications)
 * to the IncomingVisitorAlert modal rendered at the root layout level.
 */
import React, { createContext, useContext, useState } from 'react';

export interface IncomingVisitor {
  entryId: string;
  visitorName: string;
  visitorType?: string;
  message?: string;
}

interface Ctx {
  incoming: IncomingVisitor | null;
  setIncoming: (v: IncomingVisitor | null) => void;
}

const IncomingVisitorCtx = createContext<Ctx>({
  incoming: null,
  setIncoming: () => {},
});

export function IncomingVisitorProvider({ children }: { children: React.ReactNode }) {
  const [incoming, setIncoming] = useState<IncomingVisitor | null>(null);
  return (
    <IncomingVisitorCtx.Provider value={{ incoming, setIncoming }}>
      {children}
    </IncomingVisitorCtx.Provider>
  );
}

export const useIncomingVisitor = () => useContext(IncomingVisitorCtx);
