/**
 * AddressSearch — filters buildings by address or name substring.
 * Pure frontend, no backend call needed.
 */

import { useState, useMemo } from "react";
import { useStore } from "../store/useStore";

export default function AddressSearch() {
  const { buildings, setSelectedBuilding, activeFilter } = useStore();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return buildings
      .filter(
        (b) =>
          b.address.toLowerCase().includes(q) ||
          (b.name && b.name.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [query, buildings]);

  const handleSelect = (building) => {
    setSelectedBuilding(building);
    setQuery(building.address);
    setFocused(false);
  };

  return (
    <div className="glass p-4 flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
        Address Search
      </span>

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search address or building name…"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm
                     text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
        />

        {/* Dropdown results */}
        {focused && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600
                          rounded-lg overflow-hidden z-50 shadow-xl">
            {results.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelect(b)}
                className="w-full text-left px-3 py-2 hover:bg-slate-700 transition border-b
                           border-slate-700 last:border-0"
              >
                <div className="text-xs text-white font-medium truncate">
                  {b.name || b.address}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {b.name ? b.address : ""} · {b.use_type} · {b.height_m}m
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {focused && query.length >= 2 && results.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600
                          rounded-lg px-3 py-2 text-xs text-slate-500 z-50">
            No buildings found
          </div>
        )}
      </div>

      {query.length >= 2 && results.length > 0 && (
        <p className="text-xs text-slate-500">{results.length} result{results.length !== 1 ? "s" : ""} — click to highlight</p>
      )}
    </div>
  );
}