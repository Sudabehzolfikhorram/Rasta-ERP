import * as React from "react";
import { Add, ArrowLeft, Chart, DocumentText, MagicStar, Paperclip, Search, Send, TickCircle, Trash2, Wallet3, type IconType } from "@/components/icons";
import { useApp, type Chat } from "@/lib/store";
import { cn, toFa } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Orb } from "@/components/ai/Orb";
import { MicButton, VoiceBar, VoiceError } from "@/components/ai/VoiceBar";
import { useVoice } from "@/lib/voice";
import { answerFor } from "@/components/ai/CommandPalette";
import { ACCEPT } from "@/components/voucher/analyze";
import { Empty } from "./Dashboard";

const looksLikeEntry = (t: string) => /واریز|پرداخت|دادیم|خرید|دریافت|منتقل|میلیون|میلیارد|تومان|ریال/.test(t);
const scopeLabel: Record<Chat["scope"], string> = { home: "دستیار", reports: "گزارش‌ها", doc: "سند" };

const STARTERS: [IconType, string, string, string][] = [
  [Wallet3, "مانده‌ی بانک‌ها", "موجودی همه‌ی حساب‌ها تا امروز", "مانده‌ی بانک‌ها"],
  [Chart, "تراز آزمایشی آبان", "جمع گردش و مانده‌ی حساب‌های کل", "تراز آزمایشی آبان"],
  [TickCircle, "اسناد منتظر تأیید", "فهرست سندهایی که تأیید شما را لازم دارند", "اسناد منتظر تأیید"],
  [DocumentText, "ثبت سند با یک جمله", "مثلاً «۱۲ میلیون کرایه‌ی حمل از ملت دادیم»", "۱۲ میلیون تومان کرایه‌ی حمل از حساب ملت پرداخت کردیم"],
];

/** Splits an answer into its sentence and «• label: value» rows so rows can render as a small table. */
function Bubble({ text }: { text: string }) {
  const lines = text.split("\n");
  const rows = lines.filter((l) => l.startsWith("• ")).map((l) => l.slice(2).split(": "));
  const prose = lines.filter((l) => !l.startsWith("• ")).join("\n");
  return (
    <div className="num flex flex-col gap-2">
      <p className="whitespace-pre-line">{prose}</p>
      {rows.length > 0 && (
        <dl className="overflow-hidden rounded-field border border-border bg-surface/80 text-[13px]">
          {rows.map(([k, v], i) => (
            <div key={i} className="flex items-center justify-between gap-4 border-t border-border/70 px-3 py-2 first:border-t-0">
              <dt className="text-muted-foreground">{k}</dt><dd className="font-bold">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/** Answer text that appears word by word, once, when it first arrives. */
function Stream({ text }: { text: string }) {
  const lines = text.split("\n");
  const prose = lines.filter((l) => !l.startsWith("• ")).join(" ");
  const rows = lines.filter((l) => l.startsWith("• ")).map((l) => l.slice(2).split(": "));
  const words = prose.split(" ");
  const step = 0.045;
  return (
    <div className="num flex flex-col gap-2">
      <p>{words.map((w, i) => <span key={i} className="stream-word" style={{ animationDelay: `${i * step}s` }}>{w} </span>)}</p>
      {rows.length > 0 && (
        <dl className="overflow-hidden rounded-field border border-border bg-surface/80 text-[13px]">
          {rows.map(([k, v], i) => (
            <div key={i} className="stream-word flex items-center justify-between gap-4 border-t border-border/70 px-3 py-2 first:border-t-0" style={{ animationDelay: `${words.length * step + i * 0.12}s` }}>
              <dt className="text-muted-foreground">{k}</dt><dd className="font-bold">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

const STEPS = ["خواندن اسناد و حساب‌ها", "محاسبه‌ی مانده‌ها", "آماده کردن پاسخ"];
function Thinking() {
  const [i, setI] = React.useState(0);
  React.useEffect(() => { const t = window.setInterval(() => setI((x) => Math.min(x + 1, STEPS.length - 1)), 420); return () => clearInterval(t); }, []);
  return (
    <li className="flex items-start gap-3 animate-rise">
      <div className="rounded-[calc(var(--r-field)+6px)] border border-border bg-surface px-4 py-3">
        <ol className="flex flex-col gap-1.5 text-[12.5px]">
          {STEPS.map((s, k) => (
            <li key={s} className={cn("flex items-center gap-2", k > i && "opacity-40")}>
              {k < i ? <TickCircle className="size-4 text-ai" variant="Bold" /> : <span className={cn("size-4 rounded-full border-2", k === i ? "animate-spin border-ai border-t-transparent" : "border-border")} />}
              <span className={cn(k === i && "shimmer-text font-semibold")}>{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </li>
  );
}

export function Assistant() {
  const { chats, startChat, addMsg, removeChat, unit, startVoucher, chatSeed, openReport } = useApp();
  const fresh = React.useRef<string | null>(null);
  const chatsRef = React.useRef(chats);
  chatsRef.current = chats;
  const voice = useVoice(React.useCallback((t: string) => setText(t), []));
  const [active, setActive] = React.useState<string | null>(chatSeed?.id ?? null);
  const [text, setText] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const [q, setQ] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);
  const endRef = React.useRef<HTMLDivElement>(null);
  const chat = chats.find((c) => c.id === active) ?? null;
  const list = chats.filter((c) => !q.trim() || c.title.includes(q.trim()) || c.msgs.some((m) => m.text.includes(q.trim())));

  const send = React.useCallback((t: string, into: string | null) => {
    const ask = t.trim();
    if (!ask) return;
    if (looksLikeEntry(ask)) { startVoucher({ text: ask }); return; }
    const id = into ? (addMsg(into, { who: "me", text: ask }), into) : startChat("home", ask);
    setActive(id);
    setText("");
    setThinking(true);
    setTimeout(() => {
      const a = answerFor(ask, unit);
      fresh.current = `${id}:${(chatsRef.current.find((c) => c.id === id)?.msgs.length ?? 1)}`;
      addMsg(id, { who: "ai", text: a ? `${a.line}${a.rows.length ? "\n" + a.rows.map(([k, v]) => `• ${k}: ${v}`).join("\n") : ""}` : "در این نسخه درباره‌ی مانده‌ی بانک‌ها، تراز آزمایشی، نقدینگی، چک‌ها، مشتری‌ها و اسناد منتظر تأیید پاسخ می‌دهم. برای ثبت سند، رویداد را در یک جمله بنویسید." });
      setThinking(false);
    }, 1100);
  }, [addMsg, startChat, startVoucher, unit]);

  // a question asked elsewhere (dashboard, command bar) opens here and is answered right away
  const seeded = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!chatSeed || seeded.current === chatSeed.n) return;
    seeded.current = chatSeed.n;
    if (chatSeed.id) setActive(chatSeed.id);
    if (chatSeed.ask) send(chatSeed.ask, null);
  }, [chatSeed, send]);
  React.useEffect(() => { endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [chat?.msgs.length, thinking]);

  const history = (
    <aside className="panel flex min-h-0 flex-col p-3" aria-label="گفت‌وگوهای قبلی">
      <Button variant="soft" className="mb-3 w-full justify-start" onClick={() => setActive(null)}><Add /> گفت‌وگوی جدید</Button>
      <label className="relative mb-2 block">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجو در گفت‌وگوها" aria-label="جست‌وجو در گفت‌وگوها"
          className="h-9 w-full rounded-field border border-input bg-surface/80 ps-9 pe-3 text-[13px] outline-none focus:border-ring" />
      </label>
      <div className="px-2 pb-1 pt-2 text-[11.5px] font-bold text-muted-foreground">گفت‌وگوهای قبلی</div>
      {list.length ? (
        <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
          {list.map((c) => (
            <li key={c.id} className="group relative">
              <button onClick={() => setActive(c.id)} aria-current={active === c.id ? "true" : undefined}
                className={cn("w-full rounded-field px-3 py-2.5 pe-9 text-start transition-colors hover:bg-muted/80", active === c.id && "bg-primary-soft")}>
                <span className={cn("block truncate text-[13px] font-semibold", active === c.id && "text-primary")}>{c.title}</span>
                <span className="num block text-[11.5px] text-muted-foreground">{c.when} · {scopeLabel[c.scope]}</span>
              </button>
              <button aria-label={`حذف گفت‌وگوی ${c.title}`} onClick={() => { removeChat(c.id); if (active === c.id) setActive(null); }}
                className="absolute end-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      ) : <Empty icon={MagicStar} title={q ? "گفت‌وگویی پیدا نشد" : "هنوز گفت‌وگویی ندارید"} text={q ? undefined : "پرسش‌های شما از دستیار اینجا ذخیره می‌شود."} />}
    </aside>
  );

  return (
    <div className="grid gap-5 lg:h-[calc(100vh-112px)] lg:min-h-[560px] lg:grid-cols-[290px_minmax(0,1fr)]">
      {history}
      <section className="panel edge-run flex min-h-[520px] min-w-0 flex-col overflow-hidden">
        {chat ? (
          <header className="flex items-center gap-3 border-b border-border/70 px-5 py-3">
            <button onClick={() => setActive(null)} className="grid size-8 place-items-center rounded-field text-muted-foreground hover:bg-muted lg:hidden" aria-label="بازگشت"><ArrowLeft className="size-4 rotate-180" /></button>
            <Orb size={28} busy={thinking} />
            <b className="min-w-0 flex-1 truncate text-[14px]">{chat.title}</b>
            {chat.scope === "reports" && <Button size="sm" variant="outline" onClick={() => openReport("statements")}>باز کردن گزارش</Button>}
          </header>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 lg:px-8">
          {chat ? (
            <ol className="mx-auto flex w-full max-w-3xl flex-col gap-4" aria-live="polite">
              {chat.msgs.map((m, i) => (
                <li key={i} className={cn("flex items-start gap-3 animate-rise", m.who === "me" && "flex-row-reverse")}>
                  {m.who === "me" && <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-muted text-[12px] font-bold">س</span>}
                  <div className={cn("max-w-[82%] rounded-[calc(var(--r-field)+6px)] px-4 py-3 text-[14px] leading-7", m.who === "me" ? "bg-primary text-primary-foreground" : "border border-border bg-surface")}>
                    {m.who === "ai" ? (fresh.current === `${chat.id}:${i}` ? <Stream text={m.text} /> : <Bubble text={m.text} />) : <span className="num whitespace-pre-line">{m.text}</span>}
                  </div>
                </li>
              ))}
              {thinking && <Thinking />}
              <div ref={endRef} />
            </ol>
          ) : (
            <div className="m-auto flex w-full max-w-2xl flex-col items-center py-6 text-center">
              <Orb size={84} busy={thinking} />
              <h2 className="mt-5 text-[22px] font-extrabold">از دستیار راستا بپرسید</h2>
              <p className="mt-1.5 max-w-md text-[13.5px] text-muted-foreground">درباره‌ی حساب‌ها، اسناد و گزارش‌ها سؤال کنید، یا رویداد مالی را بنویسید تا سندش ساخته شود.</p>
              <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
                {STARTERS.map(([I, t, d, ask]) => (
                  <button key={t} onClick={() => send(ask, null)} className="group flex items-start gap-3 rounded-[calc(var(--r-field)+4px)] border border-border bg-surface/70 p-4 text-start transition-colors hover:border-primary/40 hover:bg-surface">
                    <span className="grid size-10 shrink-0 place-items-center rounded-field bg-primary-soft text-primary"><I className="size-5" variant="Bulk" /></span>
                    <span className="min-w-0"><b className="block text-[13.5px]">{t}</b><span className="num block text-[12px] text-muted-foreground">{d}</span></span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(text, active && chat ? active : null); }} className="border-t border-border/70 p-4">
          {voice.rec ? <div className="mx-auto max-w-3xl"><VoiceBar voice={voice} /></div> : (
          <div className="mx-auto flex max-w-3xl items-center gap-1.5 rounded-[calc(var(--r-field)+6px)] border border-input bg-surface p-1.5 ps-4 shadow-soft focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15">
            <input value={text} onChange={(e) => setText(e.target.value)} aria-label="پیام به دستیار" placeholder={chat ? "ادامه‌ی گفت‌وگو…" : "بپرسید یا رویداد را بنویسید…"}
              className="h-10 min-w-0 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-muted-foreground" />
            <MicButton voice={voice} />
            <button type="button" aria-label="بارگذاری مدرک" onClick={() => fileRef.current?.click()} className="grid size-10 shrink-0 place-items-center rounded-field text-muted-foreground hover:bg-muted hover:text-foreground"><Paperclip className="size-5" /></button>
            <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) startVoucher({ file: f }); e.target.value = ""; }} />
            <Button type="submit" variant="ai" className="h-10 shrink-0 px-4" disabled={!text.trim() || thinking}><Send /> ارسال</Button>
          </div>
          )}
          <div className="mx-auto max-w-3xl"><VoiceError voice={voice} sample="مانده‌ی بانک‌ها چقدر است؟" onSample={setText} /></div>
          <p className="num mt-2 text-center text-[11.5px] text-muted-foreground">{toFa(chats.length)} گفت‌وگو ذخیره شده است</p>
        </form>
      </section>
    </div>
  );
}
