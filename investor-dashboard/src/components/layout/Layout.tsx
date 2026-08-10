import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useAppStore } from '../../store/AppStore';
import { MenuIcon } from '../icons';

const TITLES: Record<string, { title: string; subtitle: string }> = {
  briefing: { title: 'Morning Briefing', subtitle: 'Dein täglicher Marktüberblick' },
  researcher: { title: 'Market Researcher', subtitle: 'Aktien-Recherche in 2 Minuten statt 2 Stunden' },
  tips: { title: 'Investitions-Tipps', subtitle: 'Chancen entdecken & Positionen einschätzen' },
  model: { title: 'Model Builder', subtitle: 'Interaktives DCF-Bewertungsmodell' },
  earnings: { title: 'Earnings Reviewer', subtitle: 'Earnings-Calls & Meldungen analysieren' },
  portfolio: { title: 'Portfolio', subtitle: 'Depot-Überblick & Risikoanalyse' },
};

export function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { activeModule } = useAppStore();
  const meta = TITLES[activeModule];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3.5 backdrop-blur lg:px-8 dark:border-slate-800 dark:bg-slate-900/80">
          <button className="btn-ghost !p-1.5 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Menü öffnen">
            <MenuIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-slate-900 sm:text-lg dark:text-white">{meta.title}</h1>
            <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">{meta.subtitle}</p>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
