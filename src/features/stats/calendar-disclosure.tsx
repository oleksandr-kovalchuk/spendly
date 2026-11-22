"use client";

import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

type CalendarDisclosureProps = { heading: string; month: string; children: ReactNode };

const panelVariants = cva(
  "grid transition-[grid-template-rows,visibility] duration-300 ease-out-soft",
  { variants: { isOpen: { true: "grid-rows-[1fr]", false: "invisible grid-rows-[0fr]" } } },
);

const chevronVariants = cva("size-5 shrink-0 transition-transform duration-300 ease-out-soft", {
  variants: { isOpen: { true: "rotate-180", false: "" } },
});

export function CalendarDisclosure({ heading, month, children }: CalendarDisclosureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const headingId = useId();
  const panelId = useId();

  return (
    <section aria-labelledby={headingId}>
      <Card className="gap-0">
        <CardHeader>
          <CardTitle>
            <h2 id={headingId}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setIsOpen(!isOpen)}
                className="flex min-h-6 w-full items-center gap-3 rounded-lg text-start outline-none focus-visible:ring-3 focus-visible:ring-ring"
              >
                <span className="flex-1">{heading}</span>
                <span className="text-sm font-normal text-muted-foreground">{month}</span>
                <ChevronDownIcon aria-hidden className={chevronVariants({ isOpen })} />
              </button>
            </h2>
          </CardTitle>
        </CardHeader>
        <div id={panelId} data-open={isOpen ? "" : undefined} className={panelVariants({ isOpen })}>
          <div className="min-h-0 overflow-hidden">
            <CardContent className="pt-(--card-spacing)">{children}</CardContent>
          </div>
        </div>
      </Card>
    </section>
  );
}
