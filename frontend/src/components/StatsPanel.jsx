/**
 * StatsPanel — live building counts by use type, updates when filter is active.
 */

import { useMemo } from "react";
import { useStore, applyFilter } from "../store/useStore";

const USE_COLORS = {
  Residential:   "#ff6b6b",
  Commercial:    "#ffd93d",
  Office:        "#6bcb77",
  Hotel:         "#c77dff",
  Industrial:    "#f4845f",
  Institutional: "#4cc9f0",
  Religious:     "#f72585",
  Parking:       "#6c757d",
  "Mixed Use":   "#4361ee",
  Retail:        "#ff9a3c",
};

export default function StatsPanel() {
  const { buildings, activeFilter } = useStore();

  const stats = useMemo(() => {
    const source = activeFilter ? applyFilter(buildings, activeFilter) : buildings;
    const counts = {};
    for (const b of source) {
      counts[b.use_type] = (counts[b.use_type] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6); // top 6 types
  }, [buildings, activeFilter]);

  const total = stats.reduce((s, [, n]) => s + n, 0);

  return (
    <div className="glass p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-orange-400">
          Stats
        </span>
        <span className="text-xs text-slate-400">
          {activeFilter ? "filtered" : "all buildings"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {stats.map(([type, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={type}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">{type}</span>
                <span className="text-slate-400">{count}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: USE_COLORS[type] || "#64748b",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-500 border-t border-slate-700 pt-2">
        Total shown: <span className="text-white font-bold">{total}</span> of{" "}
        <span className="text-white font-bold">{buildings.length}</span>
      </div>
    </div>
  );
}