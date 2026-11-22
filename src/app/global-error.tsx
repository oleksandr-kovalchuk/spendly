"use client";

// It replaces the root layout, so it gets none of its styles, metadata or locale
import "./globals.css";

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
        {/* Not the shared Button: this page's code loads on every route and would bring Base UI twice */}
        <button
          type="button"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground outline-none hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => retry()}
        >
          <span lang="en">Try again</span>
          <span aria-hidden="true">/</span>
          <span lang="uk">Спробувати ще раз</span>
        </button>
      </body>
    </html>
  );
}
