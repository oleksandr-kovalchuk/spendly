"use client";

import { ErrorPage } from "@/views/error/error-page";

// Inside the app layout, so the navigation stays
export default function Error({ retry }: { retry: () => void }) {
  return <ErrorPage retry={retry} />;
}
