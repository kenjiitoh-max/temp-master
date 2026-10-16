import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import type { MeterDevice } from '../lib/types';
import { MeterCard } from './MeterCard';

function renderCard(meter: MeterDevice) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MeterCard meter={meter} timeScale="day" />
    </QueryClientProvider>,
  );
}

const baseMeter: MeterDevice = {
  device_id: 'dev-1',
  device_name: 'Bedroom Meter',
  device_type: 'Meter',
  current_temperature: 23.4,
  current_humidity: 45,
  battery: 90,
  last_updated: null,
};

describe('MeterCard', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows the mapped display name and readings', async () => {
    vi.spyOn(api, 'getHistory').mockResolvedValue({
      device_id: 'dev-1',
      time_scale: 'day',
      history: [],
      device: null,
    });
    renderCard(baseMeter);

    expect(screen.getByText('第1蒸留塔 (T-101)')).toBeInTheDocument();
    expect(screen.getByText('23.4°C')).toBeInTheDocument();
    expect(await screen.findByText('No history for this range')).toBeInTheDocument();
    expect(api.getHistory).toHaveBeenCalledWith('dev-1', 'day');
  });

  it('renders HTML in device names as plain text', () => {
    vi.spyOn(api, 'getHistory').mockReturnValue(new Promise(() => {}));
    const { container } = renderCard({ ...baseMeter, device_name: '<img src=x onerror=alert(1)>' });

    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
