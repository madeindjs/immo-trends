import { FunctionComponent } from "preact";
import { TargetedEvent, useState } from "preact/compat";

interface Props {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
  towns: string[];
  town: string;
  onTownChange: (towns: string) => void;
}

export const SearchForm: FunctionComponent<Props> = (props) => {
  const [zipCode, setZipCode] = useState(props.zipCode);
  const [town, setTown] = useState(props.town);

  const onSubmit = (event: TargetedEvent<HTMLFormElement, Event>) => {
    event.preventDefault();

    if (zipCode !== props.zipCode) {
      props.onZipCodeChange(zipCode);
    }

    if (town !== props.town) {
      props.onTownChange(town);
    }
  };

  return (
    <details>
      <summary>Filtres</summary>

      <form onSubmit={onSubmit}>
        <label for="zipCode">
          Code postal
          <input type="text" value={zipCode} onInput={(event) => setZipCode((event.target as any).value)} />
        </label>
        <label for="zipCode">
          Ville
          <select value={props.town} onChange={(event) => setTown((event.target as any).value)}>
            <option value=""></option>
            {props.towns.map((t) => (
              <option value={t}>{t}</option>
            ))}
          </select>
        </label>
        <input type="submit" value="" />
      </form>
    </details>
  );
};
