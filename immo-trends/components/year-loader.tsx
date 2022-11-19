interface Props {
  year: string;
  ready: boolean;
}

export function YearLoader({ ready, year }: Props) {
  return (
    <span>
      {ready ? "✅" : "⏳"}: {year}
    </span>
  );
}
