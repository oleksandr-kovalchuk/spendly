import { ArrowRightIcon } from "lucide-react";

import { buttonVariants } from "@/shared/ui/button";

export default function Home() {
  return (
    <main className="grid flex-1 place-content-center justify-items-center gap-3 p-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Get started</h1>
      <p className="text-muted-foreground">
        Edit <code className="font-mono">src/app/page.tsx</code> and save to see the change.
      </p>
      <a className={buttonVariants()} href="https://nextjs.org/docs">
        Next.js docs <ArrowRightIcon />
      </a>
    </main>
  );
}
