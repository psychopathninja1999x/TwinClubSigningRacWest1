"use client";

import React, { useCallback, useRef } from "react";
import type { DocumentData } from "../context/SigningContext";
import { supabase } from "@/lib/supabase";

interface FileUploadProps {
  onDocumentLoaded: (data: DocumentData) => void;
  /** When provided, uploads to Supabase Storage and updates the room for real-time sync */
  roomId?: string;
}

export default function FileUpload({ onDocumentLoaded, roomId }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        alert("Please upload a .pdf file");
        return;
      }
      try {
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: "application/pdf" });
        let blobUrl = URL.createObjectURL(blob);

        if (roomId && supabase) {
          const path = `${roomId}/${file.name}`;
          const { error: uploadErr } = await supabase.storage
            .from("documents")
            .upload(path, file, { upsert: true });
          if (uploadErr) throw uploadErr;
          const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
          const publicUrl = urlData.publicUrl;
          await supabase
            .from("signing_rooms")
            .update({ document_url: publicUrl, document_name: file.name, updated_at: new Date().toISOString() })
            .eq("id", roomId);
          blobUrl = publicUrl;
        }

        onDocumentLoaded({ blobUrl, arrayBuffer, name: file.name });
      } catch (err) {
        console.error(err);
        alert("Failed to load document. Please ensure it is a valid .pdf file.");
      }
    },
    [onDocumentLoaded, roomId]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl p-12 text-center
        hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors cursor-pointer
        bg-zinc-50 dark:bg-zinc-900/50"
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleChange}
        className="hidden"
      />
      <p className="text-zinc-600 dark:text-zinc-400 mb-1">
        Drag and drop a PDF here, or click to browse
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        PDF documents display exactly as in the original file
      </p>
    </div>
  );
}
