"use client";

import { catchError, type ErrorInfo } from "next/error";
import type { ReactNode } from "react";

import { TransactionListError } from "./transaction-list-error";

function Fallback(_props: unknown, { retry }: ErrorInfo) {
  return <TransactionListError retry={retry} />;
}

const Boundary = catchError(Fallback);

export function TransactionListBoundary({ children }: { children: ReactNode }) {
  return <Boundary>{children}</Boundary>;
}
