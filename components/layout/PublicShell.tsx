import React from 'react';
import { SkipLink } from './SkipLink';
import { ThemeToggle } from './ThemeToggle';

export interface PublicShellProps {
  brand: React.ReactNode;
  navLinks?: React.ReactNode;
  ctaAction?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PublicShell: React.FC<PublicShellProps> = ({
  brand,
  navLinks,
  ctaAction,
  children,
  className = '',
}) => {
  return (
    <div
      className={`flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] ${className}`}
    >
      <SkipLink targetId="main-content" />

      {/* Public Header */}
      <header className="sticky top-0 z-[var(--aura-z-header)] flex h-[var(--aura-header-height)] w-full items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-glass)] px-4 backdrop-blur-md transition-colors sm:px-8">
        <div className="flex items-center gap-6">
          {brand}
          {navLinks && (
            <nav aria-label="Navigasi Laman" className="hidden md:flex items-center gap-4">
              {navLinks}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {ctaAction}
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col focus:outline-hidden">
        {children}
      </main>

      {/* Public Footer Boundary */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-8 px-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>&copy; {new Date().getFullYear()} TanAir Cloud. Hak cipta terpelihara.</span>
            <span>•</span>
            <span className="text-[var(--accent-premium)] font-medium">
              Platform AI BM-First Malaysia
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
            <a href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">
              Dasar Privasi
            </a>
            <a href="/terms" className="hover:text-[var(--text-primary)] transition-colors">
              Terma Perkhidmatan
            </a>
            <a href="/security" className="hover:text-[var(--text-primary)] transition-colors">
              Sekuriti
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
