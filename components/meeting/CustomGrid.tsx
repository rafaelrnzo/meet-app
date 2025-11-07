"use client";

import CustomTile from "./CustomTile";
import useTracksLite from "./useTracksLite";


export default function CustomGrid() {
  const { items } = useTracksLite();

  if (!items.length) {
    return (
      <div className="w-full h-full grid place-items-center text-neutral-300">
        Menunggu peserta…
      </div>
    );
  }

  return (
    <div
      className="w-full h-full p-3"
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        alignItems: "stretch",
      }}
    >
      {items.map((it) => (
        <CustomTile key={it.key} item={it} />
      ))}
    </div>
  );
}
