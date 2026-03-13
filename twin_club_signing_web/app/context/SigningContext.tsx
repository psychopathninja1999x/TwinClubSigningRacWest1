"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface SignatureData {
  imageData: string; // base64
  label: string; // "Club 1" or "Club 2"
}

export interface DocumentData {
  blobUrl: string;
  arrayBuffer: ArrayBuffer;
  name: string;
}

/** Per-page overlay: page number -> base64 PNG of drawn signatures */
export type PageOverlays = Record<number, string>;

interface SigningContextType {
  document: DocumentData | null;
  setDocument: (data: DocumentData) => void;
  clearDocument: () => void;
  /** Full-screen drawn signatures per page - draw directly on document lines */
  pageOverlays: PageOverlays;
  setPageOverlay: (pageNum: number, dataUrl: string) => void;
  clearPageOverlay: (pageNum: number) => void;
  clearPageOverlays: () => void;
  signature1: SignatureData | null;
  signature2: SignatureData | null;
  setSignature1: (data: SignatureData | null) => void;
  setSignature2: (data: SignatureData | null) => void;
  clearSignatures: () => void;
}

const SigningContext = createContext<SigningContextType | null>(null);

export function SigningProvider({ children }: { children: React.ReactNode }) {
  const [document, setDocumentState] = useState<DocumentData | null>(null);
  const [pageOverlays, setPageOverlaysState] = useState<PageOverlays>({});
  const [signature1, setSignature1State] = useState<SignatureData | null>(null);
  const [signature2, setSignature2State] = useState<SignatureData | null>(null);

  const setDocument = useCallback((data: DocumentData) => {
    setDocumentState((prev) => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return data;
    });
  }, []);

  const clearDocument = useCallback(() => {
    setDocumentState((prev) => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
    setPageOverlaysState({});
    setSignature1State(null);
    setSignature2State(null);
  }, []);

  const setPageOverlay = useCallback((pageNum: number, dataUrl: string) => {
    setPageOverlaysState((prev) => ({ ...prev, [pageNum]: dataUrl }));
  }, []);

  const clearPageOverlay = useCallback((pageNum: number) => {
    setPageOverlaysState((prev) => {
      const next = { ...prev };
      delete next[pageNum];
      return next;
    });
  }, []);

  const clearPageOverlays = useCallback(() => setPageOverlaysState({}), []);

  const setSignature1 = useCallback((data: SignatureData | null) => {
    setSignature1State(data);
  }, []);

  const setSignature2 = useCallback((data: SignatureData | null) => {
    setSignature2State(data);
  }, []);

  const clearSignatures = useCallback(() => {
    setSignature1State(null);
    setSignature2State(null);
  }, []);

  return (
    <SigningContext.Provider
      value={{
        document,
        setDocument,
        clearDocument,
        pageOverlays,
        setPageOverlay,
        clearPageOverlay,
        clearPageOverlays,
        signature1,
        signature2,
        setSignature1,
        setSignature2,
        clearSignatures,
      }}
    >
      {children}
    </SigningContext.Provider>
  );
}

export function useSigning() {
  const ctx = useContext(SigningContext);
  if (!ctx) throw new Error("useSigning must be used within SigningProvider");
  return ctx;
}
