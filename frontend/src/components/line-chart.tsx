import * as chartist from "chartist";
import "chartist/dist/index.css";
import { FunctionComponent } from "preact";

interface Props {
  title: string;
  labels: string[];
  series: { name: string; data: number[] }[];
}

export const LineChart: FunctionComponent<Props> = ({ title, labels, series }) => {
  const initializeChart = (element: HTMLElement | null) => {
    if (!element) return;

    // @ts-ignore
    new chartist.LineChart(
      element,
      {
        labels: labels,
        series,
      },
      {
        showArea: true,
        showPoint: false,
        // series
        axisX: {
          showGrid: false,
          //   // type: Chartist.FixedScaleAxis,
          //   // divisor: 100,
          //   // labelInterpolationFnc: function(value) {
          //   //   return moment(value).format('MMM D');
          //   // }
        },
        axisY: {
          showGrid: false,
        },
      }
    );
  };

  return (
    <article>
      <header>{title}</header>
      <div ref={(el) => initializeChart(el)}></div>
    </article>
  );
};
