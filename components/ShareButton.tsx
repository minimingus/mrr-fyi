"use client";

interface ShareButtonProps {
  text: string;
  url: string;
  variant?: "default" | "success" | "amber";
  size?: "sm" | "md";
  className?: string;
}

function buildTwitterIntentUrl(text: string, url: string) {
  const params = new URLSearchParams({ text: `${text}\n${url}` });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function ShareButton({
  text,
  url,
  variant = "default",
  size = "sm",
  className = "",
}: ShareButtonProps) {
  const href = buildTwitterIntentUrl(text, url);

  const variantStyles = {
    default:
      "border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-dim)]",
    success: "bg-[rgba(16,185,129,0.15)] text-[var(--emerald)]",
    amber: "bg-[rgba(245,158,11,0.15)] text-[var(--amber)]",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 font-semibold rounded-md transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-3.5 h-3.5"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Share on X
    </a>
  );
}
