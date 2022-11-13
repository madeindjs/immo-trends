import { FunctionComponent } from "preact";

interface Props {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
}

export const SearchForm: FunctionComponent<Props> = ({ zipCode, onZipCodeChange }) => {
  return (
    <form>
      <label for="zipCode">
        Code postal
        <input
          type="text"
          value={zipCode}
          onChange={(event) => {
            onZipCodeChange((event.target as any)?.value);
          }}
        />
      </label>
    </form>
  );
};
