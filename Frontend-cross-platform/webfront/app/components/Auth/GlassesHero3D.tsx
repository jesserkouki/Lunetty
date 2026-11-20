"use client";

import Image from "next/image";
import { useState, type CSSProperties, type PointerEvent } from "react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import styles from "./GlassesHero3D.module.css";

type SceneStyle = CSSProperties & {
  "--tilt-x": string;
  "--tilt-y": string;
  "--halo-x": string;
  "--halo-y": string;
};

const STATIC_STYLE: SceneStyle = {
  "--tilt-x": "0deg",
  "--tilt-y": "0deg",
  "--halo-x": "0px",
  "--halo-y": "0px",
};

export default function GlassesHero3D() {
  const reducedMotion = useReducedMotion();
  const [style, setStyle] = useState<SceneStyle>(STATIC_STYLE);

  const followPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    setStyle({
      "--tilt-x": `${-y * 8}deg`,
      "--tilt-y": `${x * 10}deg`,
      "--halo-x": `${x * 16}px`,
      "--halo-y": `${y * 12}px`,
    });
  };

  return (
    <div
      aria-hidden="true"
      className={styles.scene}
      onPointerMove={followPointer}
      onPointerLeave={() => setStyle(STATIC_STYLE)}
    >
      <div className={styles.halo} style={style} />
      <div className={`${styles.depth} ${reducedMotion ? "" : styles.float}`} style={style}>
        <div className={styles.shadow} />
        <Image
          src="/images/frame-sillage.svg"
          alt=""
          fill
          sizes="(max-width: 768px) 0px, 430px"
          className={styles.glasses}
        />
      </div>
    </div>
  );
}
