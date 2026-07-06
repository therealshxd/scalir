// A small Web Worker pool that runs the optimise worker across multiple cores.
// The worker is stateless per message (keyed by `id`), so the pool is purely a dispatcher:
// it hands each queued job to the next idle worker and resolves that job's promise when
// the worker replies. The worker factory is injected so the scheduler can be unit-tested
// with a fake worker — no real Worker or WASM needed.
import type { WorkerRequest, WorkerResponse } from './optimise.worker';
import type { OptimiseResult } from '../core/types';

/** Minimal structural type satisfied by both the DOM `Worker` and the test fake. */
export interface WorkerLike {
  postMessage(message: WorkerRequest): void;
  addEventListener(type: string, listener: (e: any) => void): void;
  removeEventListener(type: string, listener: (e: any) => void): void;
  terminate(): void;
}

/**
 * Balanced default: one worker per core minus one (leave a core for the UI), capped at 6
 * because each worker lazy-loads its own copy of the WASM codecs (memory grows with size).
 */
export function defaultPoolSize(): number {
  const n = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
  return Math.max(1, Math.min(n - 1, 6));
}

/** Real factory — the `new URL(...)` literal must stay here so Vite bundles the worker. */
export function createOptimiseWorker(): WorkerLike {
  return new Worker(new URL('./optimise.worker.ts', import.meta.url), { type: 'module' });
}

export type PoolJob = Omit<WorkerRequest, 'id'>; // { name, bytes, opts, mode? }

type Task = { job: PoolJob; resolve: (r: OptimiseResult | null) => void };

type Active = {
  id: number;
  task: Task;
  onMessage: (e: { data: WorkerResponse }) => void;
  onError: (e: { message?: string }) => void;
};

export class WorkerPool {
  readonly size: number;
  private workers: WorkerLike[] = [];
  private idle: WorkerLike[] = [];
  private waiting: Task[] = [];
  private active = new Map<WorkerLike, Active>();
  private nextId = 0;
  private stopped = false;

  constructor(size: number, factory: () => WorkerLike = createOptimiseWorker) {
    this.size = Math.max(1, size);
    for (let i = 0; i < this.size; i++) {
      const w = factory();
      this.workers.push(w);
      this.idle.push(w);
    }
  }

  /** Resolves with the optimise result, or `null` if cancelled via terminate(). */
  submit(job: PoolJob): Promise<OptimiseResult | null> {
    return new Promise((resolve) => {
      if (this.stopped) { resolve(null); return; }
      this.waiting.push({ job, resolve });
      this.pump();
    });
  }

  /** Stop everything: kill workers and settle every outstanding job with `null`. */
  terminate(): void {
    if (this.stopped) return;
    this.stopped = true;
    for (const [w, a] of this.active) {
      w.removeEventListener('message', a.onMessage);
      w.removeEventListener('error', a.onError);
      a.task.resolve(null);
    }
    this.active.clear();
    for (const t of this.waiting) t.resolve(null);
    this.waiting = [];
    for (const w of this.workers) w.terminate();
    this.workers = [];
    this.idle = [];
  }

  private pump(): void {
    while (!this.stopped && this.idle.length && this.waiting.length) {
      const w = this.idle.shift()!;
      const task = this.waiting.shift()!;
      this.dispatch(w, task);
    }
  }

  private dispatch(w: WorkerLike, task: Task): void {
    const id = ++this.nextId;
    const onMessage = (e: { data: WorkerResponse }) => {
      if (e.data.id !== id) return; // ignore stale messages
      this.release(w);
      task.resolve(e.data.result);
    };
    const onError = (e: { message?: string }) => {
      this.release(w);
      task.resolve(errorRow(task.job, e?.message || 'worker error'));
    };
    this.active.set(w, { id, task, onMessage, onError });
    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    // Clone bytes (no transfer) so the caller's queue survives and can be re-run.
    w.postMessage({ id, ...task.job });
  }

  private release(w: WorkerLike): void {
    const a = this.active.get(w);
    if (a) {
      w.removeEventListener('message', a.onMessage);
      w.removeEventListener('error', a.onError);
      this.active.delete(w);
    }
    if (!this.stopped) {
      this.idle.push(w);
      this.pump();
    }
  }
}

function errorRow(job: PoolJob, message: string): OptimiseResult {
  return {
    name: job.name, outName: '', status: 'error', action: '', resized: false,
    compressed: false, converted: false, origDims: [0, 0], newDims: [0, 0],
    origBytes: job.bytes.length, newBytes: 0, outType: '', message,
  };
}
