import { useEffect, useState } from 'react';
import type { PortfolioHolding } from '../../types';
import { CloseIcon } from '../icons';

export interface PositionFormValues {
  ticker: string;
  shares: string;
  buyPrice: string;
  buyDate: string;
}

function emptyForm(): PositionFormValues {
  return { ticker: '', shares: '', buyPrice: '', buyDate: new Date().toISOString().slice(0, 10) };
}

interface PositionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PositionFormValues) => void;
  editing: PortfolioHolding | null;
  tickerSuggestions: string[];
}

export function PositionDialog({ open, onClose, onSubmit, editing, tickerSuggestions }: PositionDialogProps) {
  const [form, setForm] = useState<PositionFormValues>(emptyForm());

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? { ticker: editing.ticker, shares: String(editing.shares), buyPrice: String(editing.buyPrice), buyDate: editing.buyDate }
        : emptyForm(),
    );
  }, [open, editing]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ticker.trim() || !parseFloat(form.shares) || !parseFloat(form.buyPrice)) return;
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="card relative w-full max-w-md p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {editing ? `Position bearbeiten – ${editing.ticker}` : 'Position hinzufügen'}
          </h3>
          <button className="btn-ghost !p-1.5" onClick={onClose} aria-label="Schließen">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Ticker</label>
            <input
              className="input"
              list="position-ticker-suggestions"
              placeholder="z.B. SAP"
              value={form.ticker}
              disabled={!!editing}
              onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
              autoFocus
            />
            <datalist id="position-ticker-suggestions">
              {tickerSuggestions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Menge</label>
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                placeholder="20"
                value={form.shares}
                onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Kaufpreis (EUR)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="178.40"
                value={form.buyPrice}
                onChange={(e) => setForm((f) => ({ ...f, buyPrice: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">Kaufdatum</label>
            <input
              className="input"
              type="date"
              value={form.buyDate}
              onChange={(e) => setForm((f) => ({ ...f, buyDate: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn-primary">
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
