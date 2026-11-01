import { useMemo, useState } from 'react';
import { IA_TOKENS, IA_CATEGORIES, IA_CATEGORY_LABELS } from '../data/iaTokens';

/**
 * IA-Suite — sección de escaparate de los 10 tokens de inteligencia artificial.
 *
 * Es la hermana de la A-Suite: mismos patrones visuales, pero la familia IA
 * (AITH, AIPR, AIDT, AISC, AIBT, AIWR, AICR, AITX, AIEX, AIFA) más el hub.
 * Los contratos viven en `contracts/iasuite/`; hoy no hay direcciones
 * desplegadas, así que la página lo dice en lugar de fingir datos de cadena.
 */

const CATEGORY_BADGES = {
  governance: 'bg-indigo-500/20 text-indigo-300',
  compute: 'bg-amber-500/20 text-amber-300',
  data: 'bg-emerald-500/20 text-emerald-300',
  security: 'bg-red-500/20 text-red-300',
  agents: 'bg-violet-500/20 text-violet-300',
  rewards: 'bg-pink-500/20 text-pink-300',
  dev: 'bg-sky-500/20 text-sky-300',
  gas: 'bg-orange-500/20 text-orange-300',
  exchange: 'bg-cyan-500/20 text-cyan-300',
  farming: 'bg-lime-500/20 text-lime-300',
};

const CONTRACTS = [
  ...IA_TOKENS.map((t) => ({ file: `${t.symbol}.sol`, role: `${t.name} (${t.symbol})` })),
  { file: 'IAHub.sol', role: 'Hub: autoriza mint/burn y coordina la suite' },
  { file: 'security/IATimelock.sol', role: 'Retardos de ejecución para cambios críticos' },
  { file: 'security/IATreasury.sol', role: 'Tesorería con reglas de salida' },
];

function Stat({ label, value, hint }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function TokenDetail({ token, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-dark-100 rounded-2xl max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 p-6 border-b border-gray-700">
          <img
            src={token.image}
            alt={token.symbol}
            className="w-20 h-20 rounded-xl object-cover border border-gray-700"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold">{token.symbol}</h2>
              <span className={`text-xs px-2 py-0.5 rounded ${CATEGORY_BADGES[token.category] || 'bg-gray-700 text-gray-300'}`}>
                {IA_CATEGORY_LABELS[token.category] || token.category}
              </span>
            </div>
            <p className="text-gray-400">{token.name}</p>
            <p className="text-sm text-primary-400 mt-1">{token.utility}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-300 leading-relaxed">{token.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Supply</p>
              <p className="font-medium">{token.supply}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Decimales</p>
              <p className="font-medium">{token.decimals}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Contrato</p>
              <p className="font-mono text-xs">{token.contract}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Estado</p>
              <p className="font-medium text-amber-300">Sin desplegar</p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Funciones clave</p>
            <div className="space-y-1">
              {token.keyFunctions.map((fn) => (
                <div key={fn.name} className="flex flex-col sm:flex-row sm:items-center gap-1 text-sm">
                  <code className="font-mono text-xs text-primary-400">{fn.name}</code>
                  <span className="text-gray-400">{fn.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Capacidades</p>
            <div className="flex flex-wrap gap-2">
              {token.features.map((f) => (
                <span key={f} className="text-xs px-2 py-1 rounded bg-dark-200 border border-gray-700 text-gray-300">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IaSuite() {
  const [category, setCategory] = useState('ALL');
  const [selected, setSelected] = useState(null);

  const tokens = useMemo(
    () => (category === 'ALL' ? IA_TOKENS : IA_TOKENS.filter((t) => t.category === category)),
    [category],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">IA-Suite</h1>
          <p className="text-gray-400 mt-1">
            Diez tokens de inteligencia artificial y su hub de coordinación
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
          Escaparate · contratos sin desplegar
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Tokens" value={IA_TOKENS.length} hint="Diez utilidades distintas" />
        <Stat label="Contratos" value={CONTRACTS.length} hint="Incluye hub, timelock y tesorería" />
        <Stat label="Desplegados" value="0" hint="Sin direcciones todavía" />
        <Stat label="Red" value="—" hint="Se elegirá al desplegar" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {['ALL', ...IA_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              category === c
                ? 'bg-primary-600 text-white'
                : 'bg-dark-100 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {c === 'ALL' ? 'Todos' : IA_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {tokens.map((t) => (
          <button key={t.id} onClick={() => setSelected(t)} className="group text-left">
            <div className="card p-0 overflow-hidden hover:border-primary-500/40 transition-all duration-300 hover:-translate-y-1">
              <div className="aspect-square overflow-hidden">
                <img
                  src={t.image}
                  alt={t.symbol}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-bold">{t.symbol}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${CATEGORY_BADGES[t.category] || 'bg-gray-700 text-gray-300'}`}>
                    {IA_CATEGORY_LABELS[t.category]}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{t.name}</p>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{t.utility}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold">IAHub</h2>
            <p className="text-sm text-gray-400 mt-1">
              El hub autoriza las emisiones y quemas de la suite y guarda la relación entre tokens.
              Los contratos están en <code className="font-mono text-primary-400">contracts/iasuite/</code>,
              listos para compilar; no se ha desplegado ninguna dirección.
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-dark-200 border border-gray-700 text-gray-400">
            {CONTRACTS.length} contratos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-700">
                <th className="py-2 pr-4 font-medium">Contrato</th>
                <th className="py-2 pr-4 font-medium">Papel</th>
                <th className="py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {CONTRACTS.map((c) => (
                <tr key={c.file} className="border-b border-gray-800/60 last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs text-primary-400">{c.file}</td>
                  <td className="py-2 pr-4 text-gray-300">{c.role}</td>
                  <td className="py-2 text-amber-300 text-xs">Sin desplegar</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <TokenDetail token={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
