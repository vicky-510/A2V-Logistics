import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import StatsBar from './StatsBar';

describe('StatsBar', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/healing-logs')) {
        return Promise.resolve({ ok: true, json: async () => [{ shipmentId: 'a' }] });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [
          { shipmentId: 'SHIP-1', status: 'in_transit', etaMinutes: 20, costEstimate: 60 },
          { shipmentId: 'SHIP-2', status: 'delivered', etaMinutes: 40, costEstimate: 40 },
        ],
      });
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('computes and renders stats from shipments and healing logs', async () => {
    render(<StatsBar refreshKey={0} />);

    await waitFor(() => {
      expect(screen.getByText('Total shipments')).toBeInTheDocument();
    });

    const bar = screen.getByTestId('stats-bar');
    expect(within(bar).getByText('2')).toBeInTheDocument(); // total shipments
    expect(within(bar).getByText('30')).toBeInTheDocument(); // avg eta (20+40)/2
    expect(within(bar).getAllByText('1').length).toBe(2); // active shipments + healing events
    expect(within(bar).getByText('$100.00')).toBeInTheDocument(); // total cost
  });
});
