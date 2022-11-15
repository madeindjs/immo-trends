import { FunctionComponent } from "preact";
import { TargetedEvent, useState } from "preact/compat";

interface Props {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
}

export const SearchForm: FunctionComponent<Props> = (props) => {
  const [zipCode, setZipCode] = useState(props.zipCode);

  const onSubmit = (event: TargetedEvent<HTMLFormElement, Event>) => {
    event.preventDefault();
    console.log(event);

    if (zipCode !== props.zipCode) {
      props.onZipCodeChange(zipCode);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <label for="zipCode">
        Code postal
        <input type="text" value={zipCode} onInput={(event) => setZipCode((event.target as any).value)} />
      </label>
      <input type="submit" value="" />
    </form>
  );
};
