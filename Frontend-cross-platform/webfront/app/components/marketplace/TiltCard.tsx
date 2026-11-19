"use client";

import { useEffect, useRef } from "react";
import type { PointerEvent, ReactNode } from "react";
import { useTilt } from "./useTilt";

type Props = {
  children: ReactNode;
  className?: string;
  onLongHover?: () => void;
  onLongHoverEnd?: () => void;
  hoverDelay?: number;
  maxTiltDegrees?: number;
  touchEffect?: boolean;
};

export default function TiltCard({
  children,
  className = "",
  onLongHover,
  onLongHoverEnd,
  hoverDelay = 700,
  maxTiltDegrees = 8,
  touchEffect = true,
}: Props) {
  const {
    ref,
    onPointerMove,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onPointerLeave: resetTilt,
  } = useTilt({ maxTiltDegrees, touchEffect });
  const hoverTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
  }, []);

  const onPointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (!onLongHover || event.pointerType !== "mouse") return;
    hoverTimer.current = window.setTimeout(onLongHover, hoverDelay);
  };

  const onPointerLeave = () => {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    resetTilt();
    onLongHoverEnd?.();
  };

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
    >
      <div className="tilt-card__surface relative h-full">
        {children}
        <div aria-hidden="true" className="tilt-card__glare" />
      </div>
    </div>
  );
}
