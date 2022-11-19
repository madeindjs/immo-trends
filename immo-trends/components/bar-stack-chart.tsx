import bb, { bar } from "billboard.js";
import "billboard.js/dist/billboard.css";

interface Props {
  title: string;
  labels: string[];
  series: { name: string; data: number[] }[];
}

export function BarStackChart({ title, labels, series }: Props) {
  const initializeChart = (element: HTMLElement | null) => {
    if (!element) return;

    bb.generate({
      bindto: element,
      data: {
        x: "x",
        columns: [["x", ...labels], ...series.filter((s) => s.name).map((s) => [s.name, ...s.data])],
        type: bar(),
        groups: [series.filter((s) => s.name).map((s) => s.name)],
        labels: {
          format: (v) => Math.floor(v),
        },
        hide: ["Dépendance"],
      },
    });
  };

  return (
    <article>
      <header>{title}</header>
      <div ref={(el) => initializeChart(el)}></div>
    </article>
  );
}
