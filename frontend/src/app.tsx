import { useEffect, useState } from "preact/hooks";
import { LineChart } from "./components/line-chart";
import { SearchForm } from "./components/search-form";

export function App() {
  const [zipCode, setZipCode] = useState("01002");

  const [data, setData] = useState<Record<string, unknown[]>>({});

  const years = [2017, 2018];

  useEffect(() => {
    fetch(`/api/v1/stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ zipCode }),
    }).then((res) => {
      console.log(res);
    });
  }, [zipCode]);

  const sellByYearsLabels = [...Object.keys(data), "2018"];
  const sellByYearsData = [...Object.values(data).map((rows) => rows.length), 5];

  return (
    <main class="container-fluid">
      <nav>
        <ul>
          <li>
            <strong>DVF visualizer</strong>
          </li>
        </ul>
        <ul>
          <li>
            <a href="#" role="button">
              Button
            </a>
          </li>
        </ul>
      </nav>
      <SearchForm zipCode={zipCode} onZipCodeChange={setZipCode} />
      <LineChart title="Nombre de mutation par ans" labels={sellByYearsLabels} data={sellByYearsData} />
    </main>
  );
}
