const formater = new Intl.DateTimeFormat();

function formatDate(date: string | Date | undefined): string {
  if (date === undefined) {
    return "";
  }

  return formater.format(new Date(date));
}

interface Props {
  date?: string;
}

export function ReadableDate({ date }: Props) {
  return <span>{formatDate(date)}</span>;
}
