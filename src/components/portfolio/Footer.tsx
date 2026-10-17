/**
 * Footer (spec §52).
 *
 * The notice is exactly as specified — no framework credit, no tagline, no
 * template attribution.
 */
export function Footer() {
  return (
    <footer className="relative border-t border-line">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p className="t-meta text-fg-muted">&copy; 2026 Ch V M Kiran</p>
        <a
          href="#home"
          className="t-meta transition-colors hover:text-accent focus-visible:text-accent"
        >
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
