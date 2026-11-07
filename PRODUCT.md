# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript + Vite, Tailwind CSS, shadcn/ui component pattern (Radix primitives), lucide icons. The user named shadcn; the rest was delegated: Vite because the concepts are a client-side prototype with no server.

## Users

Primary (MVP concept): the general manager / finance head (مدیر کل) of a mid-to-large Iranian organization, who opens the product each morning to see what needs a decision, approves accounting vouchers, and asks for numbers. Secondary: accountants who enter vouchers daily. Target organizations: government and non-government bodies, large industries, banks and energy companies. Roles beyond the general manager come later (the client sends permissions).

## Product Purpose

Rasta (راستا) is a Persian-first finance ERP. The MVP is the finance core: the home dashboard with daily tasks and reminders, navigation, calendars, fiscal year and currency, the chart of accounts tree (کل / معین / تفصیلی), accounting voucher entry, a report builder with a quick report panel, and one AI demo scenario. Success: a manager reaches any goal in a few clicks without needing training, and an accountant enters a balanced voucher in under a minute.

## Positioning

AI is a layer through the product, not a chatbot. Named agents do jobs (entry, control, period close, cash, analysis, calendar), always produce drafts, and leave a decision to the human with evidence. Existing Iranian and foreign ERPs have long, click-heavy flows that need guidance; Rasta's flows are short by design.

## Operating Context

- Jalali calendar, fiscal year and month. Voucher numbering is tied to year and month: a temporary number at save, a gap-free official number at finalization.
- Voucher states: پیش‌نویس → در انتظار تأیید → تأییدشده → قطعی‌شده, plus رد شده and برگشت‌خورده/ابطال‌شده.
- Rial is stored and printed. Amounts can be typed in toman with the rial value always visible. A rial/toman display toggle exists system-wide.
- Account code segments are configurable; client default کل 1 digit, معین up to 3, تفصیلی 6 to 9.
- Iranian legal deadlines (insurance list, VAT, withholding tax) appear in the calendar.

## Capabilities and Constraints

- Web only for now. RTL, Persian digits everywhere.
- Fonts: Persian fonts only, never Arabic-script fonts made for Arabic. Chosen: Yekan Bakh (Fontiran, commercial; a web licence must be bought before launch). Licensed font files must never be committed to the public repository.
- Status colors (green, amber, red) are for state only.
- Undecided: the client still sends permissions, sample vouchers and a trial balance sample.

## Brand Commitments

- Name: راستا. Persian-first, international later.
- The client does not want the product to resemble Iranian ERP systems.
- The UI must be attractive enough that customization can wait for a later phase.

## Evidence on Hand

- Client documents: «فرم‌های سیستم مالی.docx», «سند جامع قوانین کسب و کار.docx», «فرم های دیگر شرکتها.docx», treasury help PDFs (later phase). For information architecture only; their UI is not approved.
- IA/UX guide and agentic research reports (artifacts) built from them.
- No real customer data, testimonials or metrics. All dashboard numbers are synthetic demo data and must be labelled as such where a viewer could mistake them.

## Product Principles

1. Fewest steps to the goal: one entry point (Ctrl K), never leave the screen to fix a prerequisite.
2. The agent proposes, the human decides; every agent action has evidence and an undo.
3. A screen explains itself: a short, skippable tour and inline «چرا؟» replace manuals.
4. Numbers first: amounts are the most legible thing on any screen.

## Accessibility & Inclusion

WCAG 2.1 AA contrast, full keyboard use for voucher entry, visible focus, reduced-motion respected.
