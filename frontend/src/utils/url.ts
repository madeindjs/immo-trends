export function changeUrlQueryParam(params: Record<string, string>) {
  const newUrl = `${window.location.origin}?${new URLSearchParams(params).toString()}`;

  window.history.pushState({ path: newUrl }, "", newUrl);
}

export function getUrlQueryParam(key: string): string {
  return new URLSearchParams(location.search).get(key) ?? "";
}
