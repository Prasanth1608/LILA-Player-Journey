// Small legend icon that matches what's drawn on the map.
// kind "path" = a chevron (paths are drawn as lines with direction chevrons);
// otherwise the event's marker shape. Colour = who, shape = what happened.
export function Swatch({ kind, shape, color }) {
  return (
    <svg className="swatch" viewBox="0 0 24 24" aria-hidden="true">
      {kind === "path" ? (
        <polyline points="6,15 12,9 18,15" fill="none" stroke={color} strokeWidth="2.8"
                  strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <Marker shape={shape} color={color} />
      )}
    </svg>
  );
}

function Marker({ shape, color }) {
  switch (shape) {
    case "crosshair":
      return (
        <g fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="6.5" />
          <path d="M12 2.5v6M12 15.5v6M2.5 12h6M15.5 12h6" />
        </g>
      );
    case "cross":
      return <path d="M6 6 L18 18 M18 6 L6 18" stroke={color} strokeWidth="3.2" strokeLinecap="round" />;
    case "bolt":
      return <polygon points="13,2 5,14 11,14 10,22 19,9 13,9" fill={color} />;
    case "diamond":
      return <polygon points="12,4 20,12 12,20 4,12" fill={color} />;
    default:
      return <circle cx="12" cy="12" r="6" fill={color} />;
  }
}
