"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment } from "react";
import { Button } from "@/components/ui/primitives";

export type Crumb = { label: string; href?: string };

/**
 * The bar that sits under the module tabs on Board and Flow: a wide breadcrumb
 * field on the left, the Create action pinned right.
 */
export function BoardBar({
  crumbs,
  createHref,
  onCreate,
  createLabel = "Create",
  trailing,
}: {
  crumbs: Crumb[];
  createHref?: string;
  onCreate?: () => void;
  createLabel?: string;
  trailing?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="flex shrink-0 items-center gap-2 px-2.5 pt-2.5 sm:gap-2.5 sm:px-4 sm:pt-3">
      <div className="flex h-9 min-w-0 flex-1 items-center gap-1.5 overflow-hidden rounded-lg border border-line2 bg-void px-3 text-[16.2px] sm:h-8">
        {crumbs.map((c, i) => (
          <Fragment key={`${c.label}-${i}`}>
            {i > 0 && <span className="text-faint">/</span>}
            {c.href && i < crumbs.length - 1 ? (
              <Link
                href={c.href}
                className="truncate text-dim transition-colors hover:text-ink"
              >
                {c.label}
              </Link>
            ) : (
              <span
                className={
                  i === crumbs.length - 1 && crumbs.length > 1
                    ? "truncate text-dim"
                    : "truncate text-ink"
                }
              >
                {c.label}
              </span>
            )}
          </Fragment>
        ))}
        <span className="ml-auto flex items-center">{trailing}</span>
      </div>
      <Button
        size="sm"
        className="h-9 w-[74px] shrink-0 rounded-lg sm:h-8 sm:w-[86px]"
        onClick={() => (onCreate ? onCreate() : createHref && router.push(createHref))}
      >
        {createLabel}
      </Button>
    </div>
  );
}
