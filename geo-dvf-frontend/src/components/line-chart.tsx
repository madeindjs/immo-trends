import { LineChart as CTLineChart } from "chartist";
import "chartist/dist/index.css";
import { FunctionComponent } from "preact";

interface Props {
  title: string;
  labels: string[];
  data: number[];
}

export const LineChart: FunctionComponent<Props> = ({ title, labels, data }) => {
  console.log(labels, data);

  // if (labels)

  const initializeChart = (element: HTMLElement | null) => {
    if (!element) return;

    new CTLineChart(
      element,
      {
        labels: labels,
        series: [
          {
            name: "series-1",
            data,
          },
          {
            name: "series-2",
            data: data.map((i) => i * (0.5 + Math.random())),
          },
        ],
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
