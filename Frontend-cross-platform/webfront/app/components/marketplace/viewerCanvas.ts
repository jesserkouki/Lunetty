"use client";

import { useSyncExternalStore } from "react";

let activeViewer: string | null = null;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function getSnapshot() {
  return activeViewer;
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function claimViewerCanvas(owner: string) {
  if (activeViewer === owner) return;
  activeViewer = owner;
  notify();
}

export function releaseViewerCanvas(owner: string) {
  if (activeViewer !== owner) return;
  activeViewer = null;
  notify();
}

export function useViewerCanvas(owner: string) {
  return useSyncExternalStore(subscribe, getSnapshot, () => null) === owner;
}
