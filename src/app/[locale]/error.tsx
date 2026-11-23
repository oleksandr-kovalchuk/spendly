"use client";

import { ErrorPage } from "@/views/error/error-page";

// Only for a failing group layout: the groups' own error pages keep their navigation
export default function Error({ retry }: { retry: () => void }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 outline-none"
    >
      <ErrorPage retry={retry} />
    </main>
  );
}
