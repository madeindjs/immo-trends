import { parse } from "csv-parse/browser/esm/sync";
import { useEffect, useState } from "preact/hooks";
import "./app.css";
import { LineChart } from "./components/line-chart";
import { SearchForm } from "./components/search-form";

export function App() {
  const [zipCode, setZipCode] = useState("01002");

  const [data, setData] = useState<Record<string, unknown[]>>({});

  const dep = zipCode.substring(0, 2);

  useEffect(() => {
    fetch(`/files.data.gouv.fr/geo-dvf/latest/csv/2017/communes/${dep}/${zipCode}.csv`)
      .then((res) => res.text())
      .then((content) => {
        setData({
          ...data,
          "2017": parse(content, { columns: true }),
        });
      });
  }, [zipCode]);

  const sellByYearsLabels = [...Object.keys(data), "2018"];
  const sellByYearsData = [...Object.values(data).map((rows) => rows.length), 5];

  return (
    <>
      <SearchForm zipCode={zipCode} onZipCodeChange={setZipCode} />
      <LineChart title="Nombre de mutation par ans" labels={sellByYearsLabels} data={sellByYearsData} />
    </>
  );
}
