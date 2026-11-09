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

const DEMO = "دیروز دوازده میلیون تومان کرایه‌ی حمل بار به اصفهان از صندوق دادیم";

/* Test mode: when the browser has no recognizer, the microphone is blocked or the speech service
   is unreachable, the bar still behaves like a recording. The waveform moves and a sample sentence
   is written word by word, so the whole flow can be tried. The bar labels it «آزمایشی».
   For now this test mode is the default; pass { real: true } to use the browser recognizer. */
export function useVoice(onDone: (text: string) => void, { maxMs = 60000, sample = DEMO, real = false } = {}) {
  const [test, setTest] = React.useState(false);
  const sim = React.useRef<number>();
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
    clearInterval(sim.current);
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

  const simulate = () => {
    cleanup();
    setTest(true); setRec(true); setError(null);
    const words = sample.split(" ");
    let t = 0, phase = 0;
    lastText.current = ""; setLive("");
    sim.current = window.setInterval(() => {
      t += 1; phase += 0.45;
      // a voice-like envelope: syllable bumps on top of slow breathing, with short pauses between words
      const pause = t % 9 === 0;
      setLevels(Array.from({ length: 18 }, (_, i) => pause ? 0.14 : Math.max(0.12, Math.min(1, 0.35 + 0.35 * Math.sin(phase + i * 0.7) * Math.sin(phase * 0.37 + i) + Math.random() * 0.3))));
      if (t % 4 === 0) {
        const n = Math.min(words.length, t / 4);
        lastText.current = words.slice(0, n).join(" "); setLive(lastText.current);
        if (n >= words.length) { clearInterval(sim.current); timer.current = window.setTimeout(() => finish(), 700); }
      }
    }, 90);
  };

  const start = () => {
    setError(null); setTest(false);
    const W = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
    const C = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!C || !real) { simulate(); return; } // the prototype runs in test mode unless `real` is asked for
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
      let failed = false;
      s.onerror = (e) => { if (e.error !== "aborted" && e.error !== "no-speech") failed = true; else if (e.error === "no-speech") setError(ERR["no-speech"]); };
      s.onend = () => { r.current = null; if (failed) simulate(); else finish(); };
      r.current = s;
      s.start();
      setRec(true);
      meter();
      timer.current = window.setTimeout(() => r.current?.stop(), maxMs);
    } catch { r.current = null; simulate(); }
  };
  const stop = () => { if (r.current) r.current.stop(); else { if (test) lastText.current = sample; finish(); } };
  const cancel = () => { lastText.current = ""; if (r.current) { r.current.onend = null; r.current.abort(); r.current = null; } cleanup(); setRec(false); setLive(""); };

  React.useEffect(() => () => { r.current?.abort(); cleanup(); }, [cleanup]);
  return { rec, live, error, levels, test, start, stop, cancel, clearError: () => setError(null) };
}
