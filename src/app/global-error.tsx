"use client";

// It replaces the root layout, so it gets none of its styles, metadata or locale
import "./globals.css";

import { Button } from "@/shared/ui/button";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <title>Something went wrong | Щось пішло не так</title>
      <body className="grid min-h-svh place-content-center justify-items-center gap-3 p-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          <span lang="en">Something went wrong</span>
          <br />
          <span lang="uk">Щось пішло не так</span>
        </h1>
        <Button onClick={() => retry()}>
          <span lang="en">Try again</span>
          <span aria-hidden="true">/</span>
          <span lang="uk">Спробувати ще раз</span>
        </Button>
      </body>
    </html>
  );
}
