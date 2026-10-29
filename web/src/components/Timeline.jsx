import { useEffect, useMemo } from "react";
import { LAYERS } from "../config/layers.js";
import { PLAYBACK } from "../theme/visual.js";
import { useClockValue } from "../hooks/usePlayback.js";
import { formatDuration } from "../lib/format.js";

const TRAIL_OPTIONS = [
  { value: "full", label: "Full path" },
  { value: "recent", label: `Last ${PLAYBACK.trailSeconds} s` },
];

// Play / pause, scrubber with event ticks, time, speed and trail mode.
export function Timeline({ clock, match, layers, trail, onTrailChange }) {
  // Whole seconds only: the label and slider update once a second, not every frame
  const second = useClockValue(clock, (c) => Math.floor(c.time));
  const playing = useClockValue(clock, (c) => c.playing);
  const speed = useClockValue(clock, (c) => c.speed);
  const duration = match?.duration ?? 0;
  const disabled = !match || duration <= 0;

  // Space bar plays/pauses, unless the user is typing or using another control
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== "Space" || disabled) return;
      if (e.target.closest("input, select, textarea, button")) return;
      e.preventDefault();
      clock.toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clock, disabled]);

  // Ticks on the scrubber for kills, deaths and storm deaths (layers that are on)
  const ticks = useMemo(() => {
    if (!match || duration <= 0) return [];
    return LAYERS.filter((l) => l.kind === "marker" && l.group !== "Loot" && layers.has(l.id))
      .flatMap((l) => match.events.filter(l.events).map((e) => ({ t: e.t, color: l.color })));
  }, [match, layers, duration]);

  return (
    <div className="timeline" aria-label="Playback">
      <button type="button" className="play" onClick={clock.toggle} disabled={disabled}
              aria-label={playing ? "Pause" : "Play"}>
        {playing ? "❚❚" : "▶"}
      </button>

      <div className="track">
        <div className="ticks" aria-hidden="true">
          {ticks.map((tick, i) => (
            <span key={i} className="tick" style={{ left: `${(tick.t / duration) * 100}%`, background: tick.color }} />
          ))}
        </div>
        <input
          type="range" min={0} max={duration || 1} step={1}
          value={disabled ? 0 : second}
          onChange={(e) => clock.seek(Number(e.target.value))}
          disabled={disabled}
          aria-label="Match time"
          aria-valuetext={`${formatDuration(second)} of ${formatDuration(duration)}`}
        />
      </div>

      <span className="clock" aria-live="off">
        {disabled ? "–:–– / –:––" : `${formatDuration(second)} / ${formatDuration(duration)}`}
      </span>

      <label className="mini-field">
        <span className="visually-hidden">Speed</span>
        <select value={speed} onChange={(e) => clock.setSpeed(Number(e.target.value))} disabled={disabled}>
          {PLAYBACK.speeds.map((s) => <option key={s} value={s}>{s}×</option>)}
        </select>
      </label>

      <label className="mini-field">
        <span className="visually-hidden">Trail</span>
        <select value={trail} onChange={(e) => onTrailChange(e.target.value)} disabled={disabled}>
          {TRAIL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    </div>
  );
}
