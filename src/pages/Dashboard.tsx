import * as React from "react";
import { ArrowLeft, Bell, Check, CheckCheck, FileText, Pin, PinOff, Plus, ShieldCheck, Sparkles, TimerReset, TrendingDown, TrendingUp } from "lucide-react";
import { useApp } from "@/lib/store";
import { cashActual, cashForecast, inbox, kpis, today, week, type InboxItem } from "@/data/demo";
import { short, toFa, unitLabel, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { WhyPopover } from "@/components/ai/WhyPopover";
import { CashChart, Spark } from "@/components/charts";

function AgentMark({ className }: { className?: string }) {
  return <span className={cn("ai-edge grid size-6 shrink-0 place-items-center rounded-full text-white", className)}><Sparkles className="size-3.5" /></span>;
}

function Brief() {
  const { startVoucher, openPalette, concept } = useApp();
  const glass = concept === "glass";
  const Link = ({ children, q }: { children: React.ReactNode; q: string }) => (
    <button
      onClick={() => openPalette(q)}
      className={cn(
        "rounded-md px-1 font-bold underline decoration-2 underline-offset-[7px] transition-colors",
        glass ? "bg-white/12 text-white decoration-white/55 hover:bg-white/20" : "bg-ai-soft/70 text-foreground decoration-ai/50 hover:bg-ai-soft",
      )}
    >
      {children}
    </button>
  );
  return (
    <section data-tour="brief" className={cn("relative overflow-hidden p-6 lg:p-7", glass ? "hero-glass" : "panel")}>
      {glass ? (
        <>
          <div className="pointer-events-none absolute -left-16 -top-24 size-80 rounded-full bg-white/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-28 right-10 size-72 rounded-full bg-emerald-300/25 blur-3xl" aria-hidden />
        </>
      ) : (
        <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-ai-soft blur-3xl" aria-hidden />
      )}
      <div className="relative">
        <div className={cn("flex items-center gap-2 text-[12.5px] font-bold", glass ? "text-white/85" : "text-ai-ink")}>
          <AgentMark className={glass ? "bg-none bg-white/20" : undefined} /> خلاصه‌ی امروز · از ایجنت تحلیل‌گر
        </div>
        <p className="num mt-3 max-w-[60ch] text-[19px] font-medium leading-[2.15]">
          از دیروز <Link q="اسناد دیروز">۲۳ سند</Link> ثبت شده و <Link q="اسناد منتظر تأیید">۳ سند</Link> منتظر تأیید شماست.
          نقدینگی با رسیدن پول پتروشیمی مارون <Link q="چرا نقدینگی بالا رفت؟">۶٪ بیشتر</Link> شد. <Link q="چک تکین‌کو">چک تکین‌کو</Link> امروز سررسید است.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            className={glass ? "bg-white text-[#16408F] hover:bg-white/90" : undefined}
            onClick={() => document.getElementById("inbox")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            از مهم‌ترین کار شروع کنید <ArrowLeft />
          </Button>
          <Button variant="outline" className={glass ? "border-white/35 bg-white/10 text-white hover:bg-white/20" : undefined} onClick={() => startVoucher()}>
            <Plus /> سند تازه
          </Button>
        </div>
      </div>
    </section>
  );
}

function Kpis() {
  const { unit } = useApp();
  return (
    <section data-tour="kpis" className="panel grid grid-cols-2 xl:grid-cols-4">
      {kpis.map((k, i) => {
        const s = short(k.rial, unit);
        return (
          <div key={k.id} className={cn("flex flex-col gap-1 p-5", i > 0 && "xl:border-s xl:border-border/70", i % 2 === 1 && "border-s border-border/70 xl:border-s", i > 1 && "border-t border-border/70 xl:border-t-0")}>
            <div className="flex items-center justify-between text-[12.5px] text-muted-foreground">
              {k.label}
              <WhyPopover title={k.label} line={k.why.line} parts={k.why.parts} />
            </div>
            <div className="num mt-1 text-[26px] font-extrabold tracking-tight">
              {s.n} <span className="text-[12px] font-medium text-muted-foreground">{s.s} {unitLabel(unit)}</span>
            </div>
            <div className="num text-[12px] text-muted-foreground">
              <span className={cn("me-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-px font-bold", k.good ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
                {k.delta.startsWith("+") ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}{k.delta.slice(1)}
              </span>{k.deltaNote}
            </div>
            <Spark data={k.series} className="mt-1 text-primary/70" />
          </div>
        );
      })}
    </section>
  );
}

function Today() {
  const { toast } = useApp();
  const [items, setItems] = React.useState(today);
  const [text, setText] = React.useState("");
  const [sel, setSel] = React.useState(1);
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setItems((x) => [...x, { time: "۱۰:۰۰", title: text.replace(/پنجشنبه|ساعت ۱۰/g, "").trim() || text, who: "human", source: "یادآوری شما · پنجشنبه ۲۱ آبان", state: "open" }]);
    setText("");
    toast("یادآوری پنجشنبه ۲۱ آبان، ساعت ۱۰ ثبت شد.", "ai");
  };
  const stateBadge = (s: string) =>
    s === "done" ? <Badge tone="success"><Check className="size-3" />انجام شد</Badge>
    : s === "today" ? <Badge tone="warning">امروز</Badge>
    : s === "soon" ? <Badge tone="warning">۳ روز مانده</Badge>
    : <Badge>باز</Badge>;
  return (
    <section data-tour="today" className="panel flex flex-col p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[16px] font-extrabold">امروز</h2>
        <span className="text-[12px] text-muted-foreground">کارهای شما و ایجنت‌ها، به ترتیب ساعت</span>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5" role="tablist" aria-label="روزهای هفته">
        {week.map((d, i) => (
          <button
            key={d.n}
            role="tab"
            aria-selected={sel === i}
            onClick={() => setSel(i)}
            className={cn("relative flex flex-col items-center rounded-2xl py-2 text-[11.5px] text-muted-foreground transition-colors hover:bg-muted", sel === i && "bg-primary text-primary-foreground hover:bg-primary")}
          >
            {d.d}
            <b className={cn("num text-[15px] text-foreground", sel === i && "text-primary-foreground")}>{d.n}</b>
            {d.dot && <span className="absolute bottom-1 size-1 rounded-full bg-ai" />}
          </button>
        ))}
      </div>
      <ol className="mt-3 flex flex-col">
        {items.map((t, i) => (
          <li key={i} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 border-t border-border/70 py-3">
            <span className="num text-[12px] font-semibold text-muted-foreground">{t.time}</span>
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-bold">{t.title}</div>
              <div className={cn("mt-0.5 flex items-center gap-1 text-[12px]", t.who === "agent" ? "text-ai-ink" : "text-muted-foreground")}>
                {t.who === "agent" ? <Sparkles className="size-3" /> : <Bell className="size-3" />}
                {t.source}
              </div>
            </div>
            {stateBadge(t.state)}
          </li>
        ))}
      </ol>
      <form onSubmit={add} className="mt-auto flex gap-2 pt-3">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="یک جمله بنویسید: «پنجشنبه ساعت ۱۰ پیگیری چک جم»" aria-label="یادآوری جدید" className="rounded-full" />
        <Button type="submit" variant="soft" size="icon" aria-label="افزودن یادآوری"><Plus /></Button>
      </form>
    </section>
  );
}

function Cash() {
  const { unit } = useApp();
  return (
    <section className="panel flex flex-col p-5">
      <div className="flex items-baseline justify-between">
        <div><h2 className="text-[16px] font-extrabold">نقدینگی</h2><p className="mt-0.5 text-[12.5px] text-muted-foreground">۱۲ روز گذشته و پیش‌بینی ۱۲ روز آینده · میلیارد {unitLabel(unit)}</p></div>
        <WhyPopover title="پیش‌بینی نقد" line="۲۲ آبان نقد به حدود ۴۴ میلیارد ریال می‌رسد، چون حقوق و بیمه هم‌زمان پرداخت می‌شوند." parts={[["حقوق آذر", "−۳٫۸ میلیارد"], ["لیست بیمه", "−۱٫۱ میلیارد"], ["دریافت فولاد مبارکه", "+۲٫۴ میلیارد"]]} />
      </div>
      <CashChart actual={cashActual} forecast={cashForecast} scale={unit === "rial" ? 1 : 0.1} unit={unitLabel(unit)} />
      <div className="mt-auto flex flex-wrap gap-4 pt-3 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 rounded bg-primary" />واقعی</span>
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 rounded bg-ai" />پیش‌بینی ایجنت نقدینگی</span>
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full border-2 border-warning" />کمترین موجودی: ۲۲ آبان</span>
      </div>
    </section>
  );
}

const kindIcon = { draft: FileText, check: ShieldCheck, approve: CheckCheck, close: TimerReset };

function InboxCard({ item, onDone }: { item: InboxItem; onDone: (id: string, msg: string) => void }) {
  const { startVoucher } = useApp();
  const Icon = kindIcon[item.kind];
  const primary = () => {
    if (item.kind === "draft") startVoucher("۵۰۰ میلیون تومان از پتروشیمی مارون به حساب پارسیان واریز شد");
    else if (item.kind === "approve") onDone(item.id, "۱۰ سند تأیید شد و شماره‌ی دائم آبان گرفت.");
    else onDone(item.id, "باز شد.");
  };
  return (
    <li className="rounded-2xl border border-border/80 bg-surface/80 p-4 transition-shadow hover:shadow-soft">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-ai-ink">
        <span className="grid size-6 place-items-center rounded-lg bg-ai-soft"><Icon className="size-3.5" /></span>
        {item.agent}
        {item.confidence && <span className="num ms-auto text-[11.5px] font-medium text-muted-foreground">اطمینان {item.confidence}</span>}
      </div>
      <div className="mt-2 text-[14px] font-bold">{item.title}</div>
      <p className="num mt-0.5 text-[13px] leading-6 text-muted-foreground">{item.detail}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={primary}>{item.primary}</Button>
        {item.secondary && <Button size="sm" variant="outline" onClick={() => onDone(item.id, "ثبت شد. ایجنت کنترل از این به بعد این مورد را می‌شناسد.")}>{item.secondary}</Button>}
      </div>
    </li>
  );
}

function Inbox() {
  const { toast } = useApp();
  const [items, setItems] = React.useState(inbox);
  const done = (id: string, msg: string) => { setItems((x) => x.filter((i) => i.id !== id)); toast(msg); };
  return (
    <section id="inbox" data-tour="inbox" className="panel flex flex-col p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[16px] font-extrabold"><AgentMark className="size-5" /> منتظر تصمیم شما</h2>
        <span className="num rounded-full bg-ai-soft px-2.5 text-[12px] font-bold text-ai-ink">{toFa(items.length)}</span>
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">ایجنت‌ها آماده می‌کنند، شما تصمیم می‌گیرید.</p>
      {items.length ? (
        <ul className="mt-4 flex flex-col gap-3">{items.map((i) => <InboxCard key={i.id} item={i} onDone={done} />)}</ul>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-2 py-8 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-success-soft text-success"><CheckCheck /></span>
          <b className="text-[14px]">کار امروز تمام شد</b>
          <span className="text-[12.5px] text-muted-foreground">هر کار تازه‌ای برسد، همین‌جا می‌بینید.</span>
        </div>
      )}
      <div className="mt-auto flex items-center gap-2 pt-4 text-[12px] text-muted-foreground">
        <span className="size-1.5 animate-pulse rounded-full bg-ai" /> ایجنت کنترل امروز ۲۳ سند را بررسی کرده است
      </div>
    </section>
  );
}

function Pinned() {
  const { pinned, unpin, openPalette } = useApp();
  return (
    <section data-tour="pinned" className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[14px] font-extrabold">سنجاق‌شده‌ها</h2>
        <span className="text-[12px] text-muted-foreground">جواب‌هایی که می‌خواهید هر روز ببینید</span>
      </div>
      {pinned.length === 0 ? (
        <button onClick={() => openPalette("مانده‌ی بانک‌ها")} className="flex items-center gap-3 rounded-[var(--radius)] border border-dashed border-ai/40 bg-surface/50 p-4 text-start text-[13px] text-muted-foreground transition-colors hover:bg-ai-soft/50">
          <Pin className="size-4 text-ai" /> بپرسید «مانده‌ی بانک‌ها» و جوابش را سنجاق کنید. این صفحه با سؤال‌های خودتان کامل می‌شود.
        </button>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {pinned.map((p) => (
            <div key={p.id} className="panel-data p-4 animate-in fade-in-0 zoom-in-95">
              <div className="flex items-center justify-between">
                <b className="text-[14px]">{p.title}</b>
                <button aria-label="برداشتن سنجاق" onClick={() => unpin(p.id)} className="text-muted-foreground hover:text-foreground"><PinOff className="size-4" /></button>
              </div>
              <ul className="mt-2 divide-y divide-border">
                {p.rows.map(([k, v]) => <li key={k} className="num flex justify-between py-1.5 text-[13px]"><span>{k}</span><b>{v}</b></li>)}
              </ul>
              <p className="mt-2 text-[11.5px] text-muted-foreground">{p.note}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function Dashboard() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-5">
        <Brief />
        <Kpis />
        <div className="grid gap-5 lg:grid-cols-2">
          <Today />
          <Cash />
        </div>
        <Pinned />
      </div>
      <Inbox />
    </div>
  );
}
