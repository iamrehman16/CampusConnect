export async function fetchBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `HTTP request failed: ${response.status} ${response.statusText} — ${url}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function fetchJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `HTTP request failed: ${response.status} ${response.statusText} — ${url}`,
    );
  }

  return response.json() as Promise<T>;
}
