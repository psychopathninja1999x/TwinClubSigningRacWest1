"use client";

import React, { useRef, useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import SignatureCanvas from "react-signature-canvas";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

import type { PageOverlays } from "../context/SigningContext";

interface DocumentPanelProps {
  pdfBlobUrl: string;
  pageOverlays: PageOverlays;
  setPageOverlay: (pageNum: number, dataUrl: string) => void;
  side: "left" | "right";
  sideLabel: string;
  /** Ref for screenshot capture - passed from parent for the panel to download */
  captureRef?: React.RefObject<HTMLDivElement | null>;
}

export default function DocumentPanel({
  pdfBlobUrl,
  pageOverlays,
  setPageOverlay,
  side,
  sideLabel,
  captureRef,
}: DocumentPanelProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState(550);
  const containerRef = useRef<HTMLDivElement>(null);

  const setContentRef = (el: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (captureRef) (captureRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  // Resize page to fit container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const w = Math.min(el.clientWidth - 32, 550);
      setPageWidth(w > 200 ? w : 400);
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex h-full flex-col border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
      <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {sideLabel}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Sign on the lines provided
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-auto p-4 bg-zinc-100 dark:bg-zinc-950"
      >
        <div
          ref={(el) => {
            if (captureRef) (captureRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }}
          className="inline-block" // Wrapper grows to full document height for capture
        >
        <Document
          file={pdfBlobUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={
            <div className="flex items-center justify-center py-12 text-zinc-500">
              Loading document…
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <PageWithOverlay
              key={pageNum}
              pageNum={pageNum}
              pageWidth={pageWidth}
              overlayDataUrl={pageOverlays[pageNum]}
              setPageOverlay={setPageOverlay}
            />
          ))}
        </Document>
        </div>
      </div>
    </div>
  );
}

/** A4 aspect ratio */
const A4_HEIGHT_RATIO = 842 / 595;

interface PageWithOverlayProps {
  pageNum: number;
  pageWidth: number;
  overlayDataUrl: string | undefined;
  setPageOverlay: (pageNum: number, dataUrl: string) => void;
}

function PageWithOverlay({
  pageNum,
  pageWidth,
  overlayDataUrl,
  setPageOverlay,
}: PageWithOverlayProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [pageHeight, setPageHeight] = useState(pageWidth * A4_HEIGHT_RATIO);
  // Remount canvas after each save to avoid SignaturePad state corruption (push on undefined)
  const [canvasKey, setCanvasKey] = useState(0);

  useEffect(() => {
    setPageHeight(pageWidth * A4_HEIGHT_RATIO);
  }, [pageWidth]);

  // Merge existing overlay + new strokes, save, then remount canvas. Never use fromDataURL
  // or pad.clear() - clear() can race with throttled _strokeUpdate and corrupt _data.
  const handleEnd = () => {
    const pad = sigRef.current;
    if (!pad || pad.isEmpty()) return;

    const w = pageWidth;
    const h = pageHeight;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    const drawPadAndSave = () => {
      const sigCanvas = pad.getCanvas();
      if (sigCanvas) ctx.drawImage(sigCanvas, 0, 0, w, h);
      setPageOverlay(pageNum, tempCanvas.toDataURL("image/png"));
      // Remount instead of clear() - avoids "push on undefined" after 3rd+ signature
      setCanvasKey((k) => k + 1);
    };

    // Draw existing overlay first (if any), then new strokes
    if (overlayDataUrl) {
      const loadImg = new Image();
      loadImg.onload = () => {
        ctx.drawImage(loadImg, 0, 0, w, h);
        drawPadAndSave();
      };
      loadImg.onerror = drawPadAndSave;
      loadImg.src = overlayDataUrl;
    } else {
      drawPadAndSave();
    }
  };

  return (
    <div className="relative inline-block mb-4 last:mb-0">
      <Page
        pageNumber={pageNum}
        width={pageWidth}
        renderTextLayer={true}
        renderAnnotationLayer={true}
      />
      {/* Saved overlay - shown as img, no fromDataURL on canvas = no doubling */}
      {overlayDataUrl && (
        <img
          src={overlayDataUrl}
          alt=""
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: pageWidth, height: pageHeight }}
        />
      )}
      {/* Writable canvas - remount after each save to avoid SignaturePad corruption */}
      <div
        className="absolute top-0 left-0 touch-none"
        style={{
          width: pageWidth,
          height: pageHeight,
          zIndex: 10,
        }}
      >
        <SignatureCanvas
          key={canvasKey}
          ref={sigRef}
          canvasProps={{
            width: pageWidth,
            height: pageHeight,
            className: "touch-none",
            style: {
              width: pageWidth,
              height: pageHeight,
              touchAction: "none",
              pointerEvents: "auto",
            },
          }}
          penColor="#171717"
          backgroundColor="rgba(0,0,0,0)"
          onEnd={handleEnd}
          clearOnResize={false}
        />
      </div>
    </div>
  );
}
