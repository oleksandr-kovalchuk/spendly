const DIGIT = /^\d$/;

// CSS draws the characters, so this has no text of its own: the caller puts the real value
// next to it
export function RollingText({ text }: { text: string }) {
  // A formatted number has no characters outside one code point
  const chars = Array.from(text);

  return (
    <span aria-hidden="true">
      {chars.map((char, index) => {
        // Counted from the end, so a digit keeps its place, and rolls, when the number grows
        const place = chars.length - index;

        return DIGIT.test(char) ? (
          <span key={`digit-${place}`} data-char={char} className="rolling-digit">
            <span className="rolling-strip" style={{ translate: `0 ${-Number(char)}lh` }} />
          </span>
        ) : (
          <span key={`char-${place}`} data-char={char} className="rolling-char" />
        );
      })}
    </span>
  );
}
