import { useState } from 'react';
import TOKENS, { TOKEN_SERIES } from '../data/tokens';

const SERIES_COLORS = {
  A: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  A1: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
  AX: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
};

const TYPE_ICONS = {
  Governance: '\uD83C\uDFDB\uFE0F',
  Utility: '\u2699\uFE0F',
  Payment: '\uD83D\uDCB3',
  Reserve: '\uD83C\uDFE6',
};

function Badge({ label, variant }) {
  const c = SERIES_COLORS[variant] || SERIES_COLORS.A;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${c.bg} ${c.text}`}>{label}</span>
  );
}

function TokenCard({ token, expanded, onToggle }) {
  const sc = SERIES_COLORS[token.series];
  return (
    <div
      className={`card border ${expanded ? sc.border : 'border-gray-800'} transition-all duration-300`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 text-left"
      >
        <img
          src={token.img}
          alt={token.ticker}
          className="w-14 h-14 rounded-xl border border-gray-700 object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-lg">{token.name}</p>
            <Badge label={token.series} variant={token.series} />
            <Badge label={token.type} variant={token.series} />
          </div>
          <p className="text-sm text-gray-400 font-mono">{token.ticker}</p>
        </div>
        <span className="text-2xl flex-shrink-0">{TYPE_ICONS[token.type] || '\uD83D\uDD35'}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-5 space-y-4 border-t border-gray-800 pt-5">
          <Section title="Arquitectura" content={token.architecture} />
          <Section title="Casos de uso" content={token.usage} />
          <Section title="Riesgos" content={token.risks} variant="red" />
          <Section title="Mitigaciones" content={token.mitigations} variant="green" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Supply</p>
              <p className="font-mono">{token.supply.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Precio base</p>
              <p className="font-mono">${token.basePrice}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, content, variant }) {
  const color =
    variant === 'red'
      ? 'text-red-400'
      : variant === 'green'
        ? 'text-green-400'
        : 'text-gray-300';
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">{title}</p>
      <p className={`text-sm leading-relaxed ${color}`}>{content}</p>
    </div>
  );
}

export default function TokenSpecs() {
  const [expandedSlug, setExpandedSlug] = useState(null);
  const [seriesFilter, setSeriesFilter] = useState('ALL');

  const filtered =
    seriesFilter === 'ALL' ? TOKENS : TOKENS.filter((t) => t.series === seriesFilter);

  function handleCSV() {
    const header = 'Ticker,Nombre,Serie,Tipo,Supply,Arquitectura,Uso,Riesgos,Mitigaciones';
    const rows = TOKENS.map(
      (t) =>
        `${t.ticker},"${t.name}",${t.series},${t.type},${t.supply},"${t.architecture}","${t.usage}","${t.risks}","${t.mitigations}"`,
    );
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'a-suite-token-specs.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Especificaciones de Tokens</h1>
          <p className="text-gray-400 mt-1">
            Arquitectura, riesgos y mitigaciones de los {TOKENS.length} tokens
          </p>
        </div>
        <button onClick={handleCSV} className="btn-secondary text-sm">
          Descargar CSV
        </button>
      </div>

      {/* Series filter */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', ...TOKEN_SERIES].map((s) => (
          <button
            key={s}
            onClick={() => setSeriesFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              seriesFilter === s
                ? 'bg-primary-600 text-white'
                : 'bg-dark-100 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {s === 'ALL' ? `Todos (${TOKENS.length})` : `Serie ${s}`}
          </button>
        ))}
      </div>

      {/* Token list */}
      <div className="space-y-4">
        {filtered.map((t) => (
          <TokenCard
            key={t.slug}
            token={t}
            expanded={expandedSlug === t.slug}
            onToggle={() => setExpandedSlug(expandedSlug === t.slug ? null : t.slug)}
          />
        ))}
      </div>
    </div>
  );
}
