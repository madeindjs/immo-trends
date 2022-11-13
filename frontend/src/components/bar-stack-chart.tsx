import * as chartist from "chartist";
import "chartist/dist/index.css";
import { FunctionComponent } from "preact";

interface Props {
  title: string;
  labels: string[];
  series: { name: string; data: number[] }[];
}

export const BarStackChart: FunctionComponent<Props> = ({ title, labels, series }) => {
  // if (labels)

  const initializeChart = (element: HTMLElement | null) => {
    if (!element) return;

    console.log(series);

    // @ts-ignore
    new chartist.BarChart(
      element,
      {
        labels: labels,
        series: series,
      },
      {
        stackBars: true,
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
