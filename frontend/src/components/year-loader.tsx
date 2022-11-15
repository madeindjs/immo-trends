import { FunctionComponent } from "preact";

interface Props {
  year: string;
  ready: boolean;
}

export const YearLoader: FunctionComponent<Props> = ({ ready, year }) => {
  return (
    <span>
      {ready ? "✅" : "⏳"}: {year}
    </span>
  );
};
