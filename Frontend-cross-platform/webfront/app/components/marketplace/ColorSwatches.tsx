"use client";

import type { FrameColorOption } from "../../data/marketplace-demo";

type Props = {
  options: FrameColorOption[];
  selected: string;
  productName: string;
  onSelect: (option: FrameColorOption) => void;
};

export default function ColorSwatches({ options, selected, productName, onSelect }: Props) {
  if (options.length < 2) return null;

  return (
    <div
      role="group"
      aria-label={`Coloris disponibles pour ${productName}`}
      className="relative z-30 mt-3 flex items-center gap-2"
    >
      {options.map((option) => (
        <button
          key={option.name}
          type="button"
          title={option.name}
          aria-label={`${option.name} pour ${productName}`}
          aria-pressed={selected === option.name}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(option);
          }}
          className={`grid h-6 w-6 place-items-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
            selected === option.name ? "border-white" : "border-white/35"
          }`}
        >
          <span
            aria-hidden="true"
            className="h-4 w-4 rounded-full border border-black/10"
            style={{ backgroundColor: option.swatch }}
          />
        </button>
      ))}
    </div>
  );
}
