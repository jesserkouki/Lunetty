"use client";

import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "../../../lib/motion/useReducedMotion";

export function useTilt({
  maxTiltDegrees = 8,
  touchEffect = true,
}: {
  maxTiltDegrees?: number;
  touchEffect?: boolean;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  const apply = (x: number, y: number, scale: number, glareX: number, glareY: number, opacity: number) => {
    const element = ref.current;
    if (!element) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      element.style.setProperty("--tilt-x", `${x}deg`);
      element.style.setProperty("--tilt-y", `${y}deg`);
      element.style.setProperty("--tilt-scale", String(scale));
      element.style.setProperty("--glare-x", `${glareX}%`);
      element.style.setProperty("--glare-y", `${glareY}%`);
      element.style.setProperty("--glare-opacity", String(opacity));
      element.dataset.tiltActive = opacity > 0 ? "true" : "false";
    });
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    apply(
      -(y - 0.5) * maxTiltDegrees * 2,
      (x - 0.5) * maxTiltDegrees * 2,
      1.03,
      x * 100,
      y * 100,
      1,
    );
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion || !touchEffect || event.pointerType !== "touch") return;
    apply(1.2, -1.2, 0.99, 50, 45, 0.45);
  };

  const reset = () => apply(0, 0, 1, 50, 50, 0);

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  return {
    ref,
    onPointerMove,
    onPointerDown,
    onPointerUp: reset,
    onPointerCancel: reset,
    onPointerLeave: reset,
  };
}
