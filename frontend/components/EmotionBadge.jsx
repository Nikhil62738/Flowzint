import clsx from "clsx";
import { emotionMeta } from "../lib/emotions";

export function EmotionBadge({ emotion = "Neutral", confidence }) {
  const meta = emotionMeta[emotion] || emotionMeta.Neutral;
  return (
    <span className={clsx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm", meta.color)}>
      <span className={clsx("h-2 w-2 rounded-full animate-pulseSoft", meta.dot)} />
      {emotion}
      {typeof confidence === "number" ? ` ${confidence}%` : ""}
    </span>
  );
}
