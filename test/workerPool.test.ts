import { describe, it, expect } from 'vitest';
import { WorkerPool, type WorkerLike, type PoolJob } from '../src/lib/workerPool';
import type { OptimiseResult } from '../src/core/types';

// Tracks how many fake workers are processing a message at once (across the whole pool).
class Tracker {
  cur = 0;
  peak = 0;
  start() { this.cur++; this.peak = Math.max(this.peak, this.cur); }
  end() { this.cur--; }
}

// A fake worker that replies on a timer instead of running real WASM. The reply echoes the
// job name so a submit() promise can be matched to the job it was given.
class FakeWorker implements WorkerLike {
  private listeners: Record<string, ((e: any) => void)[]> = { message: [], error: [] };
  private terminated = false;
  constructor(private delay: (name: string) => number, private track: Tracker) {}
  postMessage(msg: any) {
    this.track.start();
    setTimeout(() => {
      this.track.end();
      if (this.terminated) return;
      const result = mkResult(msg.name);
      for (const l of this.listeners.message) l({ data: { id: msg.id, result } });
    }, this.delay(msg.name));
  }
  addEventListener(type: string, l: (e: any) => void) { (this.listeners[type] ||= []).push(l); }
  removeEventListener(type: string, l: (e: any) => void) {
    this.listeners[type] = (this.listeners[type] || []).filter((x) => x !== l);
  }
  terminate() { this.terminated = true; }
}

function job(name: string): PoolJob {
  return { name, bytes: new Uint8Array(4), opts: {} };
}

function mkResult(name: string): OptimiseResult {
  return {
    name, outName: 'scaled_' + name, status: 'ok', action: '', resized: false,
    compressed: false, converted: false, origDims: [0, 0], newDims: [0, 0],
    origBytes: 4, newBytes: 2, outType: 'image/jpeg', message: '',
  };
}

describe('WorkerPool', () => {
  it('resolves each job with its own result even when replies arrive out of order', async () => {
    const track = new Tracker();
    // Reverse timing: '0' is slowest, '4' fastest — replies come back in the wrong order.
    const delay = (name: string) => (5 - Number(name)) * 5;
    const pool = new WorkerPool(5, () => new FakeWorker(delay, track));
    const out = await Promise.all([0, 1, 2, 3, 4].map((i) => pool.submit(job(String(i)))));
    expect(out.map((r) => r?.name)).toEqual(['0', '1', '2', '3', '4']);
    pool.terminate();
  });

  it('never runs more than `size` jobs at once', async () => {
    const track = new Tracker();
    const pool = new WorkerPool(2, () => new FakeWorker(() => 10, track));
    await Promise.all(Array.from({ length: 6 }, (_, i) => pool.submit(job('img' + i))));
    expect(track.peak).toBe(2);
    pool.terminate();
  });

  it('processes a batch larger than the pool to completion', async () => {
    const track = new Tracker();
    const pool = new WorkerPool(3, () => new FakeWorker(() => 2, track));
    const out = await Promise.all(Array.from({ length: 10 }, (_, i) => pool.submit(job('b' + i))));
    expect(out.filter((r) => r && r.status === 'ok')).toHaveLength(10);
    pool.terminate();
  });

  it('terminate() settles every in-flight and queued job with null', async () => {
    const track = new Tracker();
    const pool = new WorkerPool(2, () => new FakeWorker(() => 50, track));
    const proms = Array.from({ length: 5 }, (_, i) => pool.submit(job('c' + i)));
    await new Promise((r) => setTimeout(r, 5)); // let the first 2 dispatch
    pool.terminate();
    const out = await Promise.all(proms);
    expect(out.every((r) => r === null)).toBe(true);
  });

  it('submit() after terminate resolves null', async () => {
    const pool = new WorkerPool(2, () => new FakeWorker(() => 1, new Tracker()));
    pool.terminate();
    expect(await pool.submit(job('x'))).toBe(null);
  });
});
