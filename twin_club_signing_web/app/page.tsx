"use client";

import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-zinc-50 to-stone-100 dark:from-zinc-950 dark:via-slate-950 dark:to-zinc-950 px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/Logo.png"
            alt="Twin Club"
            width={120}
            height={120}
            className="h-28 w-auto object-contain"
          />
          <h1 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
            Twin Club Signing
          </h1>
        </div>
     
        <Link
          href="/new"
          className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-lg font-medium hover:opacity-90 transition-opacity"
        >
          Start the TWIN CLUB signing session
        </Link>
      </div>
    </div>
  );
}
