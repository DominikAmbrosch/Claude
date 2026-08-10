import { useAppStore } from '../../store/AppStore';
import type { ModuleId } from '../../types';
import { SearchIcon, CalculatorIcon, MicIcon, BriefcaseIcon, SunIcon, MoonIcon, CloseIcon } from '../icons';

const NAV_ITEMS: { id: ModuleId; label: string; description: string; icon: typeof SearchIcon }[] = [
  { id: 'researcher', label: 'Market Researcher', description: 'Aktien-Recherche in 2 Minuten', icon: SearchIcon },
  { id: 'model', label: 'Model Builder', description: 'DCF-Bewertungsmodell', icon: CalculatorIcon },
  { id: 'earnings', label: 'Earnings Reviewer', description: 'Earnings-Call-Analyse', icon: MicIcon },
  { id: 'portfolio', label: 'Portfolio', description: 'Depot-Überblick', icon: BriefcaseIcon },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { activeModule, setActiveModule, theme, toggleTheme } = useAppStore();

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
            IQ
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">InvestorIQ</p>
            <p className="text-xs leading-tight text-slate-500 dark:text-slate-400">Research &amp; Portfolio Suite</p>
          </div>
        </div>
        <button className="btn-ghost !p-1.5 lg:hidden" onClick={onCloseMobile} aria-label="Menü schließen">
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveModule(item.id);
                onCloseMobile();
              }}
              className={`group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
              }`}
            >
              <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500 dark:text-slate-500'}`} />
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span className={`block text-xs ${active ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>{item.description}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <button onClick={toggleTheme} className="btn-secondary w-full justify-between !px-3">
          <span className="flex items-center gap-2">
            {theme === 'dark' ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
          <span
            className={`relative h-5 w-9 rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </span>
        </button>
        <p className="mt-3 px-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-600">
          Alle Daten sind Platzhalter/Simulation zu Demonstrationszwecken – keine Anlageberatung.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-72 flex-shrink-0 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
