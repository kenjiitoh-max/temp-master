import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient, normalizeBaseUrl } from './api';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('normalizeBaseUrl', () => {
  it('defaults to same-origin relative paths', () => {
    expect(normalizeBaseUrl(undefined)).toBe('');
    expect(normalizeBaseUrl('')).toBe('');
  });

  it('strips trailing slashes', () => {
    expect(normalizeBaseUrl('https://example.com/')).toBe('https://example.com');
  });
});

describe('createApiClient', () => {
  it('fetches meters from a relative URL by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ meters: [], last_updated: null }));
    const api = createApiClient('', fetchMock);

    await expect(api.getMeters()).resolves.toEqual({ meters: [], last_updated: null });
    expect(fetchMock).toHaveBeenCalledWith('/api/meters', expect.any(Object));
  });

  it('prefixes the configured base URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ meters_count: 0 }));
    const api = createApiClient('https://temp-master.example/', fetchMock);

    await api.getStatus();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://temp-master.example/api/status',
      expect.any(Object),
    );
    expect(api.url('/api/backup')).toBe('https://temp-master.example/api/backup');
  });

  it('encodes device id and time scale in the history URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ history: [] }));
    const api = createApiClient('', fetchMock);

    await api.getHistory('A/B C', 'week');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/meters/A%2FB%20C/history?time_scale=week',
      expect.any(Object),
    );
  });

  it('sends POST for refresh', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: 'ok' }));
    const api = createApiClient('', fetchMock);

    await api.refreshMeters();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/meters/refresh',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws ApiError with the FastAPI detail message', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ detail: 'SwitchBot credentials not configured' }, { status: 500 }),
      );
    const api = createApiClient('', fetchMock);

    const err = await api.refreshMeters().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 500, message: 'SwitchBot credentials not configured' });
  });

  it('falls back to the HTTP status when the error body is not JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('oops', { status: 502 }));
    const api = createApiClient('', fetchMock);

    await expect(api.getMeters()).rejects.toMatchObject({ status: 502, message: 'HTTP 502' });
  });
});
