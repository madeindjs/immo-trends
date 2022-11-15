import { lazy, Suspense } from "preact/compat";
import { useEffect, useState } from "preact/hooks";
// import { LineChart } from "./components/line-chart";
import { SearchForm } from "./components/search-form";
import { YearLoader } from "./components/year-loader";
import { DvfType, YearStat } from "./models";
import { readableDate } from "./utils/date";
import { fetchYearStat } from "./utils/fetch-year-stats";
import { changeUrlQueryParam, getUrlQueryParam } from "./utils/url";

const LineChart = lazy(() => import("./components/line-chart").then((m) => m.LineChart));
const BarStackChart = lazy(() => import("./components/bar-stack-chart").then((m) => m.BarStackChart));

export function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [zipCode, setZipCode] = useState(getUrlQueryParam("zipCode"));

  const years = ["2017", "2018", "2019", "2020", "2021", "2022"];

  const dataByYear = years.reduce<Record<string, [YearStat | undefined, (d: YearStat | undefined) => void]>>(
    (acc, year) => {
      acc[year] = useState<YearStat>();
      return acc;
    },
    {}
  );

  const clearDataByYear = () => years.forEach((year) => dataByYear[year][1](undefined));

  const isYearReady = (year: string) => dataByYear[year][0] !== undefined;

  const fetchYear = (year: string) => fetchYearStat(year, zipCode).then((res) => dataByYear[year][1](res));

  useEffect(() => {
    if (!zipCode) return;

    changeUrlQueryParam({ zipCode });

    clearDataByYear();

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

  const currentProgress = () => years.map(isYearReady).filter(Boolean).length;

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

      {!zipCode && <p>Remplissez le formulaire</p>}

      {zipCode && isLoading && (
        <>
          <p aria-busy="true">Nous calculons les données...</p>
          <progress value={currentProgress()} max={years.length}></progress>
          <ul>
            {years.map((year) => (
              <li>
                <YearLoader year={year} ready={isYearReady(year)} />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* {zipCode && !isLoading && ( */}
      <>
        <p>
          Les données pour ce truc vont de {readableDate(firstMutationDate)} à {readableDate(lastMutationDate)} pour les
          villes suivantes
        </p>
        <ul>
          {towns.map((town) => (
            <li>{town}</li>
          ))}
        </ul>
        <Suspense fallback={<div aria-busy="true">loading...</div>}>
          <LineChart title="Prix au mètre carré médian par an" labels={years} series={pricePerM2ByYearsSeries} />
        </Suspense>
        <Suspense fallback={<div aria-busy="true">loading...</div>}>
          <BarStackChart title="Nombre de mutation par an" labels={years} series={sellByYearsSeries} />
        </Suspense>
      </>
      {/* )} */}
    </main>
  );
}
