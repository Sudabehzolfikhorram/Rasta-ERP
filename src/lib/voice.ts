import * as React from "react";

/* Speech to text with the browser's own recognizer (Chrome, Edge, Safari). The microphone level
   drives a real waveform. Nothing is faked: if the browser has no recognizer, or the user blocks
   the microphone, the hook says so and the caller can offer a sample sentence instead. */

type SRResult = ArrayLike<{ transcript: string }> & { isFinal: boolean };
type SR = {
  lang: string; interimResults: boolean; continuous: boolean;
  start: () => void; stop: () => void; abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<SRResult> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type Ctor = new () => SR;

export const voiceSupported = () => {
  const W = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return !!(W.SpeechRecognition ?? W.webkitSpeechRecognition);
};

const ERR: Record<string, string> = {
  "not-allowed": "دسترسی به میکروفون داده نشد. از تنظیمات مرورگر اجازه بدهید.",
  "service-not-allowed": "مرورگر اجازه‌ی تبدیل گفتار را نداد.",
  "no-speech": "صدایی شنیده نشد. دوباره امتحان کنید.",
  "audio-capture": "میکروفونی پیدا نشد.",
  network: "تبدیل گفتار به اینترنت نیاز دارد.",
};

export function useVoice(onDone: (text: string) => void, { maxMs = 60000 } = {}) {
  const [rec, setRec] = React.useState(false);
  const [live, setLive] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [levels, setLevels] = React.useState<number[]>(() => Array(18).fill(0.15));
  const r = React.useRef<SR | null>(null);
  const finalText = React.useRef("");
  const lastText = React.useRef("");
  const timer = React.useRef<number>();
  const raf = React.useRef<number>();
  const stream = React.useRef<MediaStream | null>(null);
  const ctx = React.useRef<AudioContext | null>(null);
  const done = React.useRef(onDone);
  done.current = onDone;

  const cleanup = React.useCallback(() => {
    clearTimeout(timer.current);
    if (raf.current) cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    ctx.current?.close().catch(() => {});
    ctx.current = null;
    setLevels(Array(18).fill(0.15));
  }, []);

  const finish = React.useCallback(() => {
    cleanup();
    setRec(false);
    const t = lastText.current.trim();
    finalText.current = ""; lastText.current = "";
    setLive("");
    if (t) done.current(t);
  }, [cleanup]);

  const meter = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const c = new AC();
      ctx.current = c;
      const an = c.createAnalyser();
      an.fftSize = 64;
      c.createMediaStreamSource(s).connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        an.getByteFrequencyData(buf);
        setLevels(Array.from({ length: 18 }, (_, i) => Math.max(0.12, Math.min(1, buf[i + 1] / 200))));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* the recognizer reports permission problems itself */ }
  };

  const start = () => {
    setError(null);
    const W = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
    const C = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!C) { setError("این مرورگر تبدیل گفتار به متن ندارد. Chrome، Edge یا Safari را امتحان کنید."); return; }
    finalText.current = ""; lastText.current = "";
    try {
      const s = new C();
      s.lang = "fa-IR"; s.interimResults = true; s.continuous = true;
      s.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) finalText.current += `${res[0].transcript} `;
          else interim += res[0].transcript;
        }
        lastText.current = `${finalText.current}${interim}`;
        setLive(lastText.current);
      };
      s.onerror = (e) => { if (e.error !== "aborted") setError(ERR[e.error] ?? "تبدیل گفتار انجام نشد."); };
      s.onend = () => { r.current = null; finish(); };
      r.current = s;
      s.start();
      setRec(true);
      meter();
      timer.current = window.setTimeout(() => r.current?.stop(), maxMs);
    } catch { r.current = null; setError("تبدیل گفتار شروع نشد."); }
  };
  const stop = () => { if (r.current) r.current.stop(); else finish(); };
  const cancel = () => { lastText.current = ""; if (r.current) { r.current.onend = null; r.current.abort(); r.current = null; } cleanup(); setRec(false); setLive(""); };

  React.useEffect(() => () => { r.current?.abort(); cleanup(); }, [cleanup]);
  return { rec, live, error, levels, start, stop, cancel, clearError: () => setError(null) };
}
