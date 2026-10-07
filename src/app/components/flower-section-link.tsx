"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Hash } from "lucide-react";
import { buttonVariants } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

export default function FlowerSectionLink({
  sectionId,
  label,
  copiedLabel,
  fallbackLabel,
}: {
  sectionId: string;
  label: string;
  copiedLabel: string;
  fallbackLabel: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "fallback">("idle");
  const statusLabel = status === "copied" ? copiedLabel : status === "fallback" ? fallbackLabel : label;

  async function copyLink() {
    const url = new URL(window.location.href);
    url.hash = sectionId;

    try {
      await navigator.clipboard.writeText(url.href);
      setStatus("copied");
    } catch {
      setStatus("fallback");
    }
  }

  return (
    <>
      <Link
        href={`#${sectionId}`}
        aria-label={label}
        title={statusLabel}
        onClick={copyLink}
        onBlur={() => setStatus("idle")}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "absolute right-full top-1/2 mr-1 -translate-y-1/2 text-muted-foreground hover:text-foreground",
        )}
      >
        {status === "copied" ? <Check aria-hidden="true" /> : <Hash aria-hidden="true" />}
      </Link>
      <span role="status" className="sr-only">{status === "idle" ? "" : statusLabel}</span>
    </>
  );
}
