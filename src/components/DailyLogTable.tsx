import React, { useState, useMemo } from 'react';
import { PolicyResult, SimulationInputs } from '../types/inventory';
import { Download, Search, Filter, AlertCircle, ShoppingCart } from 'lucide-react';

interface DailyLogTableProps {
  results: PolicyResult[];
  inputs: SimulationInputs;
  dailyDemands?: number[];
}

export const DailyLogTable: React.FC<DailyLogTableProps> = ({ results, inputs, dailyDemands }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'stockouts' | 'orders'>('all');
  const [searchDay, setSearchDay] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const eoq = results.find((r) => r.id === 'eoq');
  const rop = results.find((r) => r.id === 'reorder_point');
  const periodic = results.find((r) => r.id === 'periodic_review');

  // Combined daily records
  const combinedDays = useMemo(() => {
    if (!eoq || !rop || !periodic) return [];
    const count = inputs.simulationDays;
    const list = [];
    for (let day = 1; day <= count; day++) {
      const eRec = eoq.dailyRecords.find((r) => r.day === day);
      const rRec = rop.dailyRecords.find((r) => r.day === day);
      const pRec = periodic.dailyRecords.find((r) => r.day === day);

      const hasStockout =
        (eRec?.stockoutUnits ?? 0) > 0 ||
        (rRec?.stockoutUnits ?? 0) > 0 ||
        (pRec?.stockoutUnits ?? 0) > 0;

      const hasOrder =
        (eRec?.orderPlaced ?? false) ||
        (rRec?.orderPlaced ?? false) ||
        (pRec?.orderPlaced ?? false);

      const realizedDemand =
        dailyDemands && dailyDemands[day - 1] !== undefined
          ? dailyDemands[day - 1]
          : eRec?.demand ?? 0;

      list.push({
        day,
        demand: realizedDemand,
        eoq: eRec,
        rop: rRec,
        periodic: pRec,
        hasStockout,
        hasOrder,
      });
    }
    return list;
  }, [eoq, rop, periodic, inputs.simulationDays, dailyDemands]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return combinedDays.filter((row) => {
      if (searchDay && !row.day.toString().includes(searchDay)) {
        return false;
      }
      if (filterMode === 'stockouts' && !row.hasStockout) {
        return false;
      }
      if (filterMode === 'orders' && !row.hasOrder) {
        return false;
      }
      return true;
    });
  }, [combinedDays, searchDay, filterMode]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Day',
      'Daily Demand',
      'EOQ Stock',
      'EOQ Stockout',
      'EOQ Order Qty',
      'ROP Stock',
      'ROP Stockout',
      'ROP Order Qty',
      'Periodic Stock',
      'Periodic Stockout',
      'Periodic Order Qty',
    ];

    const rows = combinedDays.map((r) => [
      r.day,
      r.demand,
      r.eoq?.endingInventory ?? 0,
      r.eoq?.stockoutUnits ?? 0,
      r.eoq?.orderPlaced ? r.eoq.orderQuantity : 0,
      r.rop?.endingInventory ?? 0,
      r.rop?.stockoutUnits ?? 0,
      r.rop?.orderPlaced ? r.rop.orderQuantity : 0,
      r.periodic?.endingInventory ?? 0,
      r.periodic?.stockoutUnits ?? 0,
      r.periodic?.orderPlaced ? r.periodic.orderQuantity : 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `inventory_simulation_${inputs.productName.replace(/\s+/g, '_')}_${inputs.simulationDays}d.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Daily Simulation Inspection Log
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Day-by-day comparative records of realized demand, available stock, and replenish triggers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => {
                setFilterMode('all');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Days ({combinedDays.length})
            </button>
            <button
              onClick={() => {
                setFilterMode('stockouts');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterMode === 'stockouts'
                  ? 'bg-rose-500 text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Stockouts
            </button>
            <button
              onClick={() => {
                setFilterMode('orders');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterMode === 'orders'
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Order Days
            </button>
          </div>

          {/* Search by Day */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Day..."
              value={searchDay}
              onChange={(e) => {
                setSearchDay(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 w-28 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Day</th>
              <th className="py-2.5 px-3">Realized Demand</th>
              <th className="py-2.5 px-3 text-amber-600 dark:text-amber-400">
                EOQ (Fixed Q)
              </th>
              <th className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">
                ROP (s, Q)
              </th>
              <th className="py-2.5 px-3 text-blue-600 dark:text-blue-400">
                Periodic Review (T, S)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                  No records matched the current filter.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.day}
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                    row.hasStockout ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    Day {row.day}
                  </td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                    {row.demand} units
                  </td>

                  {/* EOQ column */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {row.eoq?.endingInventory ?? 0}
                      </span>
                      {(row.eoq?.stockoutUnits ?? 0) > 0 && (
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold px-1 rounded">
                          Lost: {row.eoq?.stockoutUnits}
                        </span>
                      )}
                      {row.eoq?.orderPlaced && (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold px-1 rounded">
                          +Ord {row.eoq.orderQuantity}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* ROP column */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {row.rop?.endingInventory ?? 0}
                      </span>
                      {(row.rop?.stockoutUnits ?? 0) > 0 && (
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold px-1 rounded">
                          Lost: {row.rop?.stockoutUnits}
                        </span>
                      )}
                      {row.rop?.orderPlaced && (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold px-1 rounded">
                          +Ord {row.rop.orderQuantity}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Periodic Review column */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {row.periodic?.endingInventory ?? 0}
                      </span>
                      {(row.periodic?.stockoutUnits ?? 0) > 0 && (
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold px-1 rounded">
                          Lost: {row.periodic?.stockoutUnits}
                        </span>
                      )}
                      {row.periodic?.orderPlaced && (
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold px-1 rounded">
                          +Ord {row.periodic.orderQuantity}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} days
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Prev
            </button>
            <span className="px-2 font-mono">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
