import { useEffect, useState } from "preact/hooks";
import { BarStackChart } from "./components/bar-stack-chart";
import { SearchForm } from "./components/search-form";

enum DvfType {
  "Maison" = "Maison",
  "Dépendance" = "Dépendance",
  "Appartement" = "Appartement",
  "Unknown" = "",
}
interface YearStat {
  count: Record<DvfType, number>;
}

export function App() {
  const [zipCode, setZipCode] = useState("69740");

  const [data, setData] = useState<Record<string, YearStat | undefined>>({});

  const years = [2017, 2018, 2019, 2020, 2021, 2022];

  const fetchYear = (year: number) =>
    fetch(`/api/v1/stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ zipCode, year }),
    })
      .then((res) => res.json())
      .then((res) => setData({ ...data, [String(year)]: res }));

  useEffect(() => {
    years.map(fetchYear);
  }, [zipCode]);

  console.log(data);

  const sellByYearsLabels = years.map(String);
  const sellByYearsSeries = Object.values(DvfType).map((type) => {
    const rows = years.map((year) => data[year]?.count[type] ?? 0);

    return { name: type, data: rows };
  });

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
      <BarStackChart title="Nombre de mutation par ans" labels={sellByYearsLabels} series={sellByYearsSeries} />
    </main>
  );
}
