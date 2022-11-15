const formater = new Intl.DateTimeFormat();

export function readableDate(date: string | Date | undefined): string {
  if (date === undefined) {
    return "";
  }

  return formater.format(new Date(date));
}
