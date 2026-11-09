import type * as React from "react";
import { cn } from "@/lib/utils";

/** Algonet mark, redrawn as a line icon so it takes the current text colour in both themes. */
export function AlgonetMark({ className }: { className?: string }) {
  return (
    <svg viewBox="148 104 608 380" className={cn("size-full", className)} fill="none" stroke="currentColor" strokeWidth={22} strokeLinecap="round" aria-hidden>
      <path d="M171 369C171 428 214 470 266 470C292 470 314 460 333 445L600 189" />
      <path d="M262 369H706M600 116V462M600 189C640 160 700 160 734 189" />
      <g fill="currentColor" stroke="none">
        <circle cx="171" cy="369" r="28" /><circle cx="411" cy="369" r="28" /><circle cx="706" cy="369" r="28" />
        <circle cx="600" cy="189" r="19" /><circle cx="600" cy="369" r="19" /><circle cx="600" cy="462" r="19" /><circle cx="734" cy="189" r="19" />
      </g>
    </svg>
  );
}

/** Company avatar: the company's own mark when we have it, otherwise its first letter. */
export function CompanyAvatar({ name, className, letterClass, style }: { name: string; className?: string; letterClass?: string; style?: React.CSSProperties }) {
  const algonet = /الگونت/.test(name);
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden", className)} style={style}>
      {algonet ? <AlgonetMark className="p-[2px]" /> : <span className={letterClass}>{name[0]}</span>}
    </span>
  );
}
