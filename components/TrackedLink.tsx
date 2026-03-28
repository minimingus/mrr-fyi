"use client";

interface TrackedLinkProps {
  href: string;
  slug: string;
  children: React.ReactNode;
  className?: string;
}

export function TrackedLink({ href, slug, children, className }: TrackedLinkProps) {
  const handleClick = () => {
    // Fire-and-forget — never block navigation
    fetch("/api/analytics/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => {});
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
