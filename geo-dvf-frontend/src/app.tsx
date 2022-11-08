import { useEffect, useState } from "preact/hooks";
import "./app.css";
import { SearchForm } from "./components/search-form";

export function App() {
  const [zipCode, setZipCode] = useState("69330");

  const dep = zipCode.substring(0, 2);

  useEffect(() => {
    fetch(`https://files.data.gouv.fr/geo-dvf/latest/csv/2017/communes/${dep}/${zipCode}.csv`).then((res) =>
      console.log(res)
    );
  }, [zipCode]);

  return (
    <>
      <SearchForm zipCode={zipCode} onZipCodeChange={setZipCode} />
    </>
  );
}
