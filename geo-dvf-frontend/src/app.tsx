import { LineChart } from "chartist";
import "chartist/dist/index.css";
import { parse } from "csv-parse/browser/esm/sync";
import { useEffect, useState } from "preact/hooks";
import "./app.css";
import { SearchForm } from "./components/search-form";

export function App() {
  const [zipCode, setZipCode] = useState("01002");

  const initializeChart = (element: HTMLElement | null) => {
    if (!element) return;

    new LineChart(
      element,
      {
        labels: ["2017", "2018"],
        series: [
          {
            name: "series-1",
            data: [8, 9, 10],
          },
        ],
      },
      {
        showArea: true,
        showPoint: false,
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

  const dep = zipCode.substring(0, 2);

  useEffect(() => {
    fetch(`/files.data.gouv.fr/geo-dvf/latest/csv/2017/communes/${dep}/${zipCode}.csv`)
      .then((res) => res.text())
      .then((content) => {
        const data = parse(content, { columns: true });
        console.log(data);
      });
  }, [zipCode]);

  return (
    <>
      <SearchForm zipCode={zipCode} onZipCodeChange={setZipCode} />
      <div ref={(el) => initializeChart(el)}></div>
    </>
  );
}
