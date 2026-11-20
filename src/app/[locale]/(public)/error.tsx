"use client";

import { ErrorPage } from "@/views/error/error-page";

// Inside the signed-out layout, so the top bar stays
export default function Error({ retry }: { retry: () => void }) {
  return <ErrorPage retry={retry} />;
}
