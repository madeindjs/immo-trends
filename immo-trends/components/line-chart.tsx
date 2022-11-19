import bb, { line } from "billboard.js";
import "billboard.js/dist/billboard.css";

interface Props {
  title: string;
  labels: string[];
  series: { name: string; data: number[] }[];
}

export function LineChart({ title, labels, series }: Props) {
  const initializeChart = (element: HTMLElement | null) => {
    if (!element) return;

    console.log(series);

    bb.generate({
      bindto: element,
      data: {
        x: "x",
        columns: [["x", ...labels], ...series.map((s) => [s.name, ...s.data])],
        type: line(),
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
