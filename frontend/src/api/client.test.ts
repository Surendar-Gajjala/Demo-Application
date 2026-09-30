import { ApiError, getPage, request, toQuery } from './client';

function mockFetch(status: number, body?: unknown) {
  const text = body === undefined ? '' : JSON.stringify(body);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(status === 204 ? null : text, { status })));
}

afterEach(() => vi.unstubAllGlobals());

describe('request', () => {
  it('returns parsed JSON on success', async () => {
    mockFetch(200, { id: 1 });
    await expect(request('/api/x')).resolves.toEqual({ id: 1 });
  });

  it('returns undefined on 204', async () => {
    mockFetch(204);
    await expect(request('/api/x', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('maps a ProblemDetail body to ApiError with field errors', async () => {
    mockFetch(400, {
      title: 'Validation failed',
      status: 400,
      detail: 'Request has invalid fields',
      errors: { itemNumber: 'must not be blank' },
    });
    const error = await request('/api/items').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.status).toBe(400);
    expect(apiError.title).toBe('Validation failed');
    expect(apiError.fieldErrors).toEqual({ itemNumber: 'must not be blank' });
  });

  it('maps a network failure to status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = (await request('/api/x').catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(0);
  });

  it('sends JSON content type only when there is a body', async () => {
    mockFetch(200, {});
    await request('/api/x', { method: 'POST', body: '{}' });
    const headers = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
  });
});

describe('toQuery', () => {
  it('skips empty values', () => {
    expect(toQuery({ search: '', page: 0, size: 25, type: undefined })).toBe('?page=0&size=25');
    expect(toQuery({})).toBe('');
  });
});

describe('getPage', () => {
  it('requests the page with query params', async () => {
    mockFetch(200, { content: [], page: 0, size: 25, totalElements: 0, totalPages: 0 });
    const page = await getPage('/api/items', { page: 0 });
    expect(page.totalElements).toBe(0);
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/api/items?page=0');
  });
});
