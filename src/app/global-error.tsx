"use client";

// It replaces the root layout, so it gets none of its styles or metadata
import "./globals.css";

import { Button } from "@/shared/ui/button";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <title>Something went wrong</title>
      <body className="grid min-h-svh place-content-center justify-items-center gap-3 p-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <Button onClick={() => retry()}>Try again</Button>
      </body>
    </html>
  );
}
