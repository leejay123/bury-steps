"use client";

/**
 * Height-over-distance line, drawn from a route's GPX-derived elevation
 * profile (one sample per point — see WalkRoute.elevationProfile). Shown
 * only when that profile exists at all; a route with no elevation data (no
 * GPX, or one with gaps) renders nothing here rather than a flat line that
 * would misleadingly suggest "no hills" instead of "no data".
 *
 * Plotted against real cumulative distance rather than point index, since
 * points are not evenly spaced (a straight stretch keeps far fewer of them
 * than a bendy one after simplification) — an index axis would squash or
 * stretch the shape of the climb in a way that doesn't match the ground.
 */

import { type PointerEvent, useMemo, useState } from "react";
import { cumulativeDistancesMetres, metresToMiles, type RoutePoint } from "@/lib/route-geometry";
import { cn } from "@/lib/utils";

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 160;
const PAD_LEFT = 32;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 20;
const PLOT_WIDTH = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_HEIGHT = VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM;
const PLOT_BOTTOM = PAD_TOP + PLOT_HEIGHT;

export function RouteElevationChart({
  points,
  elevations,
  className,
}: {
  points: RoutePoint[];
  /** Same length and order as `points` — a mismatch is treated as "no
   * profile" rather than plotted misaligned. */
  elevations: number[];
  className?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (points.length !== elevations.length || points.length < 2) return null;
    const distancesMetres = cumulativeDistancesMetres(points);
    const totalMetres = distancesMetres[distancesMetres.length - 1];
    if (totalMetres <= 0) return null;

    const minEle = Math.min(...elevations);
    const maxEle = Math.max(...elevations);
    // A little headroom so the line never touches the top/bottom edge —
    // and a floor under the range so a dead-flat file doesn't divide by
    // (near) zero and blow the line up to fill the whole height.
    const pad = Math.max(maxEle - minEle, 4) * 0.15;
    const yMin = minEle - pad;
    const yMax = maxEle + pad;

    const xAt = (metres: number) => PAD_LEFT + (metres / totalMetres) * PLOT_WIDTH;
    const yAt = (ele: number) => PLOT_BOTTOM - ((ele - yMin) / (yMax - yMin)) * PLOT_HEIGHT;

    const xs = distancesMetres.map(xAt);
    const ys = elevations.map(yAt);
    const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
    const areaPath =
      `M${xs[0].toFixed(1)},${PLOT_BOTTOM} ` +
      xs.map((x, i) => `L${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ") +
      ` L${xs[xs.length - 1].toFixed(1)},${PLOT_BOTTOM} Z`;

    return { distancesMetres, totalMetres, minEle, maxEle, xs, ys, yAt, linePath, areaPath };
  }, [points, elevations]);

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!chart) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH;
    // Points aren't evenly spaced, so nearest-by-x isn't a simple index
    // lookup — a linear scan over a route-sized array (at most a couple of
    // thousand points) is still cheap enough on every pointer move.
    let nearest = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < chart.xs.length; i += 1) {
      const d = Math.abs(chart.xs[i] - x);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }
    setHoverIndex(nearest);
  };

  if (!chart) return null;
  const { totalMetres, minEle, maxEle, xs, ys, yAt, linePath, areaPath } = chart;
  const totalMiles = metresToMiles(totalMetres);
  const midEle = (minEle + maxEle) / 2;

  const hovered =
    hoverIndex !== null
      ? {
          x: xs[hoverIndex],
          y: ys[hoverIndex],
          ele: elevations[hoverIndex],
          miles: metresToMiles(chart.distancesMetres[hoverIndex]),
        }
      : null;
  // Keep the tooltip text inside the viewBox rather than running off
  // whichever edge the cursor is nearest to.
  const labelAnchor = hovered ? (hovered.x < VIEW_WIDTH * 0.25 ? "start" : hovered.x > VIEW_WIDTH * 0.75 ? "end" : "middle") : "middle";
  const labelX = hovered ? (labelAnchor === "start" ? hovered.x + 4 : labelAnchor === "end" ? hovered.x - 4 : hovered.x) : 0;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <p className="text-xs font-medium text-muted-foreground">Elevation profile</p>
      <svg
        aria-label={`Elevation profile: ${Math.round(minEle)} to ${Math.round(maxEle)} metres over ${totalMiles.toFixed(1)} miles.`}
        className="w-full touch-none"
        onPointerLeave={() => setHoverIndex(null)}
        onPointerMove={onPointerMove}
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      >
        {[minEle, midEle, maxEle].map((ele) => (
          <line
            className="stroke-border"
            key={ele}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            x1={PAD_LEFT}
            x2={VIEW_WIDTH - PAD_RIGHT}
            y1={yAt(ele)}
            y2={yAt(ele)}
          />
        ))}
        {[minEle, midEle, maxEle].map((ele) => (
          <text className="fill-muted-foreground text-[9px]" dominantBaseline="middle" key={ele} x={0} y={yAt(ele)}>
            {Math.round(ele)}m
          </text>
        ))}

        <path className="fill-blue-600/15 dark:fill-blue-400/20" d={areaPath} />
        <path
          className="fill-none stroke-blue-600 dark:stroke-blue-400"
          d={linePath}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />

        <text className="fill-muted-foreground text-[9px]" x={PAD_LEFT} y={VIEW_HEIGHT - 4}>
          0 mi
        </text>
        <text className="fill-muted-foreground text-[9px]" textAnchor="end" x={VIEW_WIDTH - PAD_RIGHT} y={VIEW_HEIGHT - 4}>
          {totalMiles.toFixed(1)} mi
        </text>

        {hovered ? (
          <g>
            <line
              className="stroke-muted-foreground/50"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              x1={hovered.x}
              x2={hovered.x}
              y1={PAD_TOP}
              y2={PLOT_BOTTOM}
            />
            <circle className="fill-blue-600 dark:fill-blue-400" cx={hovered.x} cy={hovered.y} r={3.5} />
            <text
              className="fill-foreground text-[10px] font-medium"
              textAnchor={labelAnchor}
              x={labelX}
              y={PAD_TOP + 9}
            >
              {hovered.miles.toFixed(1)} mi · {Math.round(hovered.ele)} m
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

export default RouteElevationChart;
