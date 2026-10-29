// The playback clock: current match time, play/pause, seek and speed.
// It lives outside React so it can tick 60 times a second without re-rendering
// the page. The renderer redraws on every tick; React components subscribe only
// to the values they display (see hooks/usePlayback.js).
import { PLAYBACK } from "../theme/visual.js";

export class PlaybackClock {
  time = 0;          // seconds since match start
  duration = 0;      // match length in seconds
  playing = false;
  speed = PLAYBACK.defaultSpeed;

  #listeners = new Set();
  #frame = null;
  #lastNow = 0;

  // ---- Subscribing ----
  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
  #emit() {
    for (const listener of this.#listeners) listener(this);
  }

  // ---- Controls ----
  // A new match opens on its END state (everything visible); Play replays from 0:00.
  load(duration) {
    this.pause();
    this.duration = duration;
    this.time = duration;
    this.#emit();
  }

  seek(time) {
    this.time = Math.min(Math.max(time, 0), this.duration);
    this.#emit();
  }

  play() {
    if (this.playing || this.duration <= 0) return;
    if (this.time >= this.duration) this.time = 0; // at the end → start again
    this.playing = true;
    this.#lastNow = performance.now();
    this.#frame = requestAnimationFrame(this.#tick);
    this.#emit();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    cancelAnimationFrame(this.#frame);
    this.#emit();
  }

  toggle = () => (this.playing ? this.pause() : this.play());

  setSpeed(speed) {
    this.speed = speed;
    this.#emit();
  }

  // ---- One animation frame ----
  #tick = (now) => {
    const elapsed = (now - this.#lastNow) / 1000; // real seconds since last frame
    this.#lastNow = now;
    this.time = Math.min(this.duration, this.time + elapsed * this.speed);
    if (this.time >= this.duration) this.playing = false; // reached the end
    else this.#frame = requestAnimationFrame(this.#tick);
    this.#emit();
  };
}
