// components/livekit/Loader.tsx
export function Loader({ text = "Loading..." }: { text?: string }) {
  return (
    <div
      style={{
        height: "100vh",
        background: "#0b0b0b",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontSize: 14,
      }}
    >
      {text}
    </div>
  );
}
