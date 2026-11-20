"use client";

import { catchError, type ErrorInfo } from "next/error";
import type { ReactNode } from "react";

import { StatsError } from "./stats-error";

function Fallback(_props: unknown, { retry }: ErrorInfo) {
  return <StatsError retry={retry} />;
}

const Boundary = catchError(Fallback);

// A failed summary leaves the form and the list usable
export function StatsBoundary({ children }: { children: ReactNode }) {
  return <Boundary>{children}</Boundary>;
}
