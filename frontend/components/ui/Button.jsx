import clsx from "clsx";

export function Button({ className, variant = "primary", ...props }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-neon-cyan/60 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-neon-cyan text-ink shadow-glow hover:brightness-110",
        variant === "ghost" && "border border-white/10 bg-white/5 text-white hover:bg-white/10",
        variant === "danger" && "bg-red-500 text-white hover:bg-red-400",
        className
      )}
      {...props}
    />
  );
}
