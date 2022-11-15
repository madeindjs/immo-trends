import bb, { bar } from "billboard.js";
import "billboard.js/dist/billboard.css";
import { FunctionComponent } from "preact";

interface Props {
  title: string;
  labels: string[];
  series: { name: string; data: number[] }[];
}

export const BarStackChart: FunctionComponent<Props> = ({ title, labels, series }) => {
  const initializeChart = (element: HTMLElement | null) => {
    if (!element) return;

    console.log(series, labels);

    bb.generate({
      bindto: element,
      data: {
        x: "x",
        columns: [["x", ...labels], ...series.filter((s) => s.name).map((s) => [s.name, ...s.data])],
        type: bar(),
        groups: [series.filter((s) => s.name).map((s) => s.name)],
      },
    });
  };

  return (
    <article>
      <header>{title}</header>
      <div ref={(el) => initializeChart(el)}></div>
    </article>
  );
};
