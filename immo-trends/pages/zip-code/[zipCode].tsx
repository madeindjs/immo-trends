import { Suspense, useEffect, useState } from "react";
import { BarStackChart } from "../../components/bar-stack-chart";
import { Layout } from "../../components/layout";
import { LineChart } from "../../components/line-chart";
import { ReadableDate } from "../../components/readable-date";
import { YearLoader } from "../../components/year-loader";
import { DvfType, YearStat } from "../../models";
import { getZipCode } from "../../services/zip-code";

interface Props {
  zipCode: string;
}

interface Params {
  zipCode: string;
}

const fetchYearStat = (year: string, zipCode: string): Promise<YearStat> =>
  fetch(`/api/v1/dvf-stats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ zipCode, year }),
  }).then((res) => res.json());

export default function ZipCode({ zipCode }: Props) {
  useEffect(() => {
    fetchYearStat("2017", zipCode);
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  // const [zipCode, setZipCode] = useState(getUrlQueryParam("zipCode"));

  const years = ["2017", "2018", "2019", "2020", "2021", "2022"];

  const dataByYear = years.reduce<Record<string, [YearStat | undefined, (d: YearStat | undefined) => void]>>(
    (acc, year) => {
      acc[year] = useState<YearStat>();
      return acc;
    },
    {}
  );

  const isYearReady = (year: string) => dataByYear[year][0] !== undefined;

  const fetchYear = (year: string) => fetchYearStat(year, zipCode).then((res) => dataByYear[year][1](res));

  useEffect(() => {
    if (!zipCode) return;

    setIsLoading(true);
    Promise.all(years.map(fetchYear)).finally(() => setIsLoading(false));
  }, []);

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
    <Layout
      content={
        <div>
          {isLoading && (
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

          {!isLoading && (
            <>
              <p>
                Les données pour ce truc vont de <ReadableDate date={firstMutationDate} /> à{" "}
                <ReadableDate date={lastMutationDate} /> pour les villes suivantes
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
          )}
        </div>
      }
    />
  );
}

export async function getStaticPaths() {
  const zipCodes = await getZipCode();

  // Get the paths we want to pre-render based on posts
  const paths = zipCodes.map((zipCode) => ({
    params: { zipCode },
  }));

  // We'll pre-render only these paths at build time.
  // { fallback: false } means other routes should 404.
  return { paths, fallback: false };
}

export function getStaticProps({ params }: { params: Params }): { props: Props } {
  // params contains the post `id`.
  // If the route is like /posts/1, then params.id is 1

  // Pass post data to the page via props
  return { props: { zipCode: params.zipCode } };
}
