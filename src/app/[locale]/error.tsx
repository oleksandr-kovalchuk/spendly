"use client";

import { ErrorPage } from "@/views/error/error-page";

export default function Error({ retry }: { retry: () => void }) {
  return <ErrorPage retry={retry} />;
}
