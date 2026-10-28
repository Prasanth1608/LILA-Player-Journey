// Small legend symbol that matches what's drawn on the map.
// kind "path" = a line; otherwise a marker shape.
const OUTLINE = "#080c10";

export function Swatch({ kind, shape, color, outlineColor = OUTLINE }) {
  return (
    <svg className="swatch" viewBox="0 0 20 20" aria-hidden="true">
      {kind === "path" ? (
        <>
          <path d="M2 15 L10 7 L18 12" fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
          <circle cx="2.5" cy="15" r="2" fill={color} />
        </>
      ) : (
        <Marker shape={shape} color={color} outline={outlineColor} />
      )}
    </svg>
  );
}

function Marker({ shape, color, outline }) {
  switch (shape) {
    case "triangle":
      return <polygon points="10,3 17,15 3,15" fill={color} stroke={outline} strokeWidth="1.4" />;
    case "cross":
      return (
        <g strokeLinecap="round">
          <path d="M5 5 L15 15 M15 5 L5 15" stroke={outline} strokeWidth="5.5" />
          <path d="M5 5 L15 15 M15 5 L5 15" stroke={color} strokeWidth="3" />
        </g>
      );
    case "star":
      return (
        <polygon
          points="10,2 12.2,7.5 18,7.6 13.4,11.2 15.1,17 10,13.6 4.9,17 6.6,11.2 2,7.6 7.8,7.5"
          fill={color} stroke={outline} strokeWidth="1.4"
        />
      );
    case "diamond":
      return <polygon points="10,3 17,10 10,17 3,10" fill={color} stroke={outline} strokeWidth="1.4" />;
    default:
      return <circle cx="10" cy="10" r="6" fill={color} stroke={outline} strokeWidth="1.4" />;
  }
}
