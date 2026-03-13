"use client";

import React, { useRef, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import html2canvas from "html2canvas-pro";
import { SigningProvider, useSigning } from "@/app/context/SigningContext";
import { supabase } from "@/lib/supabase";
import FileUpload from "@/app/components/FileUpload";

const DocumentPanelDynamic = dynamic(
  () => import("@/app/components/DocumentPanel"),
  { ssr: false }
);

function SigningContent({ roomId }: { roomId: string }) {
  const {
    document: doc,
    setDocument,
    clearDocument,
    pageOverlays,
    setPageOverlay,
  } = useSigning();
  const captureRef = useRef<HTMLDivElement>(null);

  // Sync signatures to Supabase when user signs
  const syncOverlayToSupabase = async (pageNum: number, dataUrl: string) => {
    if (!supabase) return;
    await supabase.from("signing_page_overlays").upsert(
      { room_id: roomId, page_num: pageNum, data_url: dataUrl },
      { onConflict: "room_id,page_num" }
    );
  };

  // Wrap setPageOverlay to sync to Supabase
  const handlePageOverlay = (pageNum: number, dataUrl: string) => {
    setPageOverlay(pageNum, dataUrl);
    syncOverlayToSupabase(pageNum, dataUrl);
  };

  const handleDownload = async () => {
    const el = captureRef.current;
    if (!el) return;
    try {
      const fullHeight = el.scrollHeight;
      const origOverflow = el.style.overflow;
      const origHeight = el.style.height;
      const origMinHeight = el.style.minHeight;
      el.style.overflow = "visible";
      el.style.minHeight = "auto";
      el.style.height = `${fullHeight}px`;

      const parents: { el: HTMLElement; overflow: string }[] = [];
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        parents.push({ el: parent, overflow: parent.style.overflow });
        parent.style.overflow = "visible";
        parent = parent.parentElement;
      }

      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f4f4f5",
      });

      el.style.overflow = origOverflow;
      el.style.height = origHeight;
      el.style.minHeight = origMinHeight;
      parents.forEach(({ el: p, overflow }) => {
        p.style.overflow = overflow;
      });

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = (doc?.name.replace(/\.[^/.]+$/, "") || "signed-document") + "-signed.png";
      a.click();
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const hasDocument = doc != null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-zinc-50 to-stone-100 dark:from-zinc-950 dark:via-slate-950 dark:to-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="flex items-center gap-3 text-xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
            <img src="/Logo.png" alt="" width={56} height={56} className="object-contain" />
            Twin Club Signing
          </h1>
          {hasDocument && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Download as PNG
              </button>
              <button
                type="button"
                onClick={clearDocument}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Upload new document
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {!hasDocument ? (
          <FileUpload roomId={roomId} onDocumentLoaded={setDocument} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)] min-h-[400px]">
            <div className="h-full min-h-0">
              <DocumentPanelDynamic
                pdfBlobUrl={doc.blobUrl}
                pageOverlays={pageOverlays}
                setPageOverlay={handlePageOverlay}
                side="left"
                sideLabel="Club 1"
                captureRef={captureRef}
              />
            </div>
            <div className="h-full min-h-0">
              <DocumentPanelDynamic
                pdfBlobUrl={doc.blobUrl}
                pageOverlays={pageOverlays}
                setPageOverlay={handlePageOverlay}
                side="right"
                sideLabel="Club 2"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SignPage() {
  const params = useParams();
  const roomId = params?.roomId as string;
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && roomId) {
      setShareUrl(window.location.href);
    }
  }, [roomId]);

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Invalid session</p>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <p className="text-red-600 dark:text-red-400 mb-4">
          Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
        <a href="/" className="text-zinc-600 hover:underline">
          ← Back
        </a>
      </div>
    );
  }

  return (
    <SigningProvider>
      <RealtimeSync roomId={roomId} />
      {shareUrl && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-zinc-900/90 text-white text-sm flex items-center gap-3">
          <span>Share this link so others can sign:</span>
          <input
            readOnly
            value={shareUrl}
            className="flex-1 min-w-0 bg-zinc-800 rounded px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
            }}
            className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-xs"
          >
            Copy
          </button>
        </div>
      )}
      <SigningContent roomId={roomId} />
    </SigningProvider>
  );
}

/** Subscribes to Supabase Realtime and syncs document + overlays into context */
function RealtimeSync({ roomId }: { roomId: string }) {
  const { setDocument, setPageOverlay } = useSigning();

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    // Fetch initial room + overlays
    async function loadInitial() {
      const [roomRes, overlaysRes] = await Promise.all([
        client!.from("signing_rooms").select("*").eq("id", roomId).single(),
        client!.from("signing_page_overlays").select("*").eq("room_id", roomId),
      ]);

      if (roomRes.data?.document_url) {
        const res = await fetch(roomRes.data.document_url);
        const buf = await res.arrayBuffer();
        const blob = new Blob([buf], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        setDocument(
          { blobUrl, arrayBuffer: buf, name: roomRes.data.document_name || "document.pdf" }
        );
      }

      const overlays: Record<number, string> = {};
      (overlaysRes.data || []).forEach(
        (r: { page_num: number; data_url: string }) => {
          overlays[r.page_num] = r.data_url;
        }
      );
      Object.entries(overlays).forEach(([k, v]) =>
        setPageOverlay(parseInt(k, 10), v)
      );
    }
    loadInitial();

    const roomChannel = client
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "signing_rooms",
          filter: `id=eq.${roomId}`,
        },
        async (payload) => {
          const row = payload.new as { document_url?: string; document_name?: string };
          if (row?.document_url) {
            const res = await fetch(row.document_url);
            const buf = await res.arrayBuffer();
            const blob = new Blob([buf], { type: "application/pdf" });
            const blobUrl = URL.createObjectURL(blob);
            setDocument({
              blobUrl,
              arrayBuffer: buf,
              name: row.document_name || "document.pdf",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "signing_page_overlays",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as { page_num: number; data_url: string };
          if (row) setPageOverlay(row.page_num, row.data_url);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(roomChannel);
    };
  }, [roomId, setDocument, setPageOverlay]);

  return null;
}
