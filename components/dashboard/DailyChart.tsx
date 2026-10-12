import type { DaySeries } from "@/lib/metrics";

/** Tallest bar, in pixels. Pixel heights render reliably inside flex rows. */
const BAR_MAX_PX = 120;

/**
 * Activity created and generation outcomes per day.
 *
 * The bars are plain elements rather than a chart library, so they inherit
 * the theme colours and stay readable in dark mode. A screen-reader table
 * carries the same numbers, because a picture of the data is no use to
 * someone using a screen reader.
 */
export function DailyChart({ series }: { series: DaySeries[] }) {
  const max = Math.max(1, ...series.map((d) => Math.max(d.created, d.success + d.failure)));
  // Any non-zero value gets at least 2px so a quiet day is still visible.
  const px = (value: number) => (value > 0 ? Math.max(2, Math.round((value / max) * BAR_MAX_PX)) : 0);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {series.map((day) => (
          <div key={day.date} className="flex min-w-[1.75rem] flex-1 flex-col items-center gap-1">
            <div
              className="flex w-full items-end justify-center gap-[3px]"
              style={{ height: BAR_MAX_PX }}
              aria-hidden="true"
            >
              <div
                title={`${day.created} activities created on ${day.label}`}
                className="w-2 rounded-t bg-accent"
                style={{ height: px(day.created) }}
              />
              <div className="flex w-2 flex-col justify-end">
                <div
                  title={`${day.failure} failed generations on ${day.label}`}
                  className="w-full rounded-t bg-red-600"
                  style={{ height: px(day.failure) }}
                />
                <div
                  title={`${day.success} successful generations on ${day.label}`}
                  className="w-full bg-tile-correct"
                  style={{ height: px(day.success) }}
                />
              </div>
            </div>
            <span className="text-[0.6rem] leading-none text-muted">{day.label.split(" ")[0]}</span>
          </div>
        ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" aria-hidden="true" />
          Activities created
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-tile-correct" aria-hidden="true" />
          Generated successfully
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-600" aria-hidden="true" />
          Failed
        </li>
      </ul>

      <table className="sr-only">
        <caption>Activities created and generation outcomes for each of the last {series.length} days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Activities created</th>
            <th scope="col">Generated successfully</th>
            <th scope="col">Failed</th>
          </tr>
        </thead>
        <tbody>
          {series.map((day) => (
            <tr key={day.date}>
              <th scope="row">{day.label}</th>
              <td>{day.created}</td>
              <td>{day.success}</td>
              <td>{day.failure}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
