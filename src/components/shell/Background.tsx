import * as React from "react";
import { useApp } from "@/lib/store";

/** The Algonet line language: thin rails, rounded turns and junction dots.
 *  Drawn as SVG so it follows the theme; soft colour glows sit underneath so glass has something to blur. */
const RAILS = [
  // top start cluster
  "M150 237 H595", "M271 80 V237", "M300 237 A 218 237 0 0 0 518 0", "M394 237 V360", "M594 120 V237",
  // the ribbon
  "M767 418 V468 A 58 58 0 0 0 825 526 Q 846 526 862 510 L 1052 320 Q 1066 307 1082 307 A 68 68 0 0 1 1150 375 V 481",
  "M790 526 A 84 84 0 0 0 872 567 Q 898 567 916 549 L 1098 366 Q 1118 341 1141 341 A 58 58 0 0 1 1199 399 V 535",
  "M880 481 H1150", "M956 228 V307 H1082", "M1192 200 V341 H1370", "M665 526 H790 V632", "M985 481 V662", "M1098 307 V576 H1242 V652",
  "M1060 690 V640 A 104 104 0 0 1 1164 535 H1330",
  // lower start cluster
  "M40 709 H157 Q 205 709 240 744 Q 266 775 296 775 H492", "M157 655 V862", "M295 629 V775", "M413 775 V872",
  // lower end
  "M1070 960 V915 A 108 108 0 0 1 1178 808 H1268", "M1110 856 H1291 V952",
];
const DOTS: [number, number][] = [[271, 174], [271, 237], [394, 237], [594, 237], [767, 418], [790, 526], [985, 481], [985, 567], [956, 307], [1141, 341], [1192, 341], [1150, 481], [1098, 366], [1199, 535], [1098, 576], [1242, 576], [157, 709], [295, 775], [295, 629], [413, 775], [1110, 856], [1291, 856]];
const RUN = [RAILS[5], RAILS[6], RAILS[14]];

export function Background() {
  const { concept } = useApp();
  const [still, setStill] = React.useState(false);
  React.useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setStill(mq.matches || document.documentElement.dataset.motion === "off");
    set();
    mq.addEventListener("change", set);
    const mo = new MutationObserver(set);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    return () => { mq.removeEventListener("change", set); mo.disconnect(); };
  }, []);
  // the bento concept mirrors the composition so the two concepts do not look like one page re-skinned
  const flip = concept === "bento" ? "translate(1440 0) scale(-1 1)" : undefined;
  return (
    <div className="bg-field" aria-hidden>
      <div className="glow g1" />
      <div className="glow g2" />
      <div className="glow g3" />
      <svg viewBox="0 0 1440 1024" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="fadeR" cx="50%" cy="50%" r="70%">
            <stop offset="55%" stopColor="#fff" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.15" />
          </radialGradient>
          <mask id="fade"><rect width="1440" height="1024" fill="url(#fadeR)" /></mask>
        </defs>
        <g transform={flip} mask="url(#fade)">
          <g className="lines" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round">
            {RAILS.map((d, i) => <path key={i} d={d} />)}
            {DOTS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" fill="currentColor" stroke="none" />)}
          </g>
          {!still && RUN.map((d, i) => (
            <circle key={i} r="2.6" className="runner" opacity="0.8">
              <animateMotion dur={`${16 + i * 7}s`} begin={`${i * 3}s`} repeatCount="indefinite" path={d} keyPoints={i % 2 ? "1;0" : "0;1"} keyTimes="0;1" calcMode="linear" />
            </circle>
          ))}
        </g>
      </svg>
      <div className="grain" />
    </div>
  );
}
