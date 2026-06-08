import type { DvfRowDetail } from "../../types.ts";

function isAbortError(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }

  const cause = error instanceof Error ? error.cause : undefined;
  return cause instanceof DOMException && cause.name === "AbortError";
}

export function useDvfDetail() {
  const row = ref<DvfRowDetail | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let abortController: AbortController | undefined;

  function cancelPending(): void {
    abortController?.abort();
    abortController = undefined;
    loading.value = false;
  }

  function clear(): void {
    cancelPending();
    row.value = null;
    error.value = null;
  }

  async function fetchDetail(rowid: number): Promise<void> {
    cancelPending();

    const controller = new AbortController();
    abortController = controller;
    loading.value = true;
    error.value = null;
    row.value = null;

    try {
      const response = await $fetch<DvfRowDetail>(`/api/dvf/${rowid}`, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      row.value = response;
    } catch (fetchError) {
      if (controller.signal.aborted || isAbortError(fetchError)) {
        return;
      }

      row.value = null;
      error.value =
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load DVF row";
    } finally {
      if (!controller.signal.aborted) {
        loading.value = false;
        abortController = undefined;
      }
    }
  }

  return {
    row,
    loading,
    error,
    fetchDetail,
    clear,
    cancelPending,
  };
}
