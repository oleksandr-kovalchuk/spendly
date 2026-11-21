// Whether a query failed on the named constraint; Drizzle wraps the driver's error, so the
// violation can sit in `cause`
export function violatesConstraint(error: unknown, constraint: string): boolean {
  if (!(error instanceof Error)) return false;
  if ("constraint" in error && error.constraint === constraint) return true;
  return violatesConstraint(error.cause, constraint);
}
