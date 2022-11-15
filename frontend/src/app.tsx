import { useEffect, useState } from "preact/hooks";
import { BarStackChart } from "./components/bar-stack-chart";
import { LineChart } from "./components/line-chart";
import { SearchForm } from "./components/search-form";
import { readableDate } from "./utils/date";

enum DvfType {
  "Maison" = "Maison",
  "Dépendance" = "Dépendance",
  "Appartement" = "Appartement",
  "Unknown" = "",
}
interface YearStat {
  count: Record<DvfType, number>;
  pricePerM2Median: Record<DvfType, number>;
  towns: string[];
  firstMutationDate: string;
  lastMutationDate: string;
}

export function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [zipCode, setZipCode] = useState("69740");

  const years = ["2017", "2018", "2019", "2020", "2021", "2022"];

  const dataByYear = years.reduce<Record<string, [YearStat | undefined, (d: YearStat) => void]>>((acc, year) => {
    acc[year] = useState<YearStat>();
    return acc;
  }, {});

  const fetchYear = (year: string) =>
    fetch(`/api/v1/stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ zipCode, year }),
    })
      .then((res) => res.json())
      .then((res) => dataByYear[year][1](res));

  useEffect(() => {
    setIsLoading(true);
    Promise.all(years.map(fetchYear)).finally(() => setIsLoading(false));
  }, [zipCode]);

  const sellByYearsSeries = Object.values(DvfType).map((type) => {
    const rows = years.map((year) => dataByYear[year][0]?.count[type] ?? 0);
    return { name: type, data: rows };
  });

  const pricePerM2ByYearsSeries = Object.values(DvfType)
    .filter((type) => type !== DvfType.Unknown)
    .map((type) => {
      const rows = years.map((year) => dataByYear[year][0]?.pricePerM2Median[type] ?? 0);
      return { name: type, data: rows };
    });

  const firstMutationDate = dataByYear[years[0]][0]?.firstMutationDate;
  const lastMutationDate = dataByYear[years[years.length - 1]][0]?.lastMutationDate;

  const towns = Array.from(new Set(years.flatMap((year) => dataByYear[year][0]?.towns).filter(Boolean)));

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
      <p>
        Les données pour ce truc vont de {readableDate(firstMutationDate)} à {readableDate(lastMutationDate)} pour les
        villes suivantes
      </p>
      <ul>
        {towns.map((town) => (
          <li>{town}</li>
        ))}
      </ul>
      <LineChart title="Prix au mètre carré médian par an" labels={years} series={pricePerM2ByYearsSeries} />
      <BarStackChart title="Nombre de mutation par an" labels={years} series={sellByYearsSeries} />
    </main>
  );
}
