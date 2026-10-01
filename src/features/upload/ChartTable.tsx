import { rpeToRir } from '../../lib/calc/effort';
import type { ChartData, EffortScale } from '../../lib/types';

/** The chart grid: reps down, effort across, %1RM in cells. Scrolls sideways if wide. */
export function ChartTable({ chart, scale }: { chart: ChartData; scale: EffortScale }) {
  const header = (rpe: number) => (scale === 'rir' ? rpeToRir(rpe) : rpe);
  return (
    <div className="chart-table-wrap" tabIndex={0} aria-label="RPE chart">
      <table className="chart-table px-num">
        <thead>
          <tr>
            <th scope="col">Reps</th>
            {chart.rpeValues.map((rpe) => (
              <th key={rpe} scope="col">
                {scale === 'rir' ? 'RIR' : 'RPE'} {header(rpe)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.rows.map((row) => (
            <tr key={row.reps}>
              <th scope="row">{row.reps}</th>
              {row.percents.map((p, i) => (
                <td key={i}>{p === null ? '' : `${Math.round(p * 1000) / 10}%`}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
