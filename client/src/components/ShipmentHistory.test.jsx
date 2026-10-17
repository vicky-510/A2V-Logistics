import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import ShipmentHistory from './ShipmentHistory';

describe('ShipmentHistory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('shows an empty state with no shipments', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    render(<ShipmentHistory refreshKey={0} />);
    await waitFor(() => expect(screen.getByText('No shipments yet.')).toBeInTheDocument());
  });

  test('renders shipments with a status badge', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { shipmentId: 'SHIP-1', originGodownId: 'Godown A', destination: 'Port 1', units: 100, status: 'in_transit' },
      ],
    });
    render(<ShipmentHistory refreshKey={0} />);
    await waitFor(() => expect(screen.getByText('SHIP-1')).toBeInTheDocument());
    expect(screen.getByText('in transit')).toBeInTheDocument();
  });
});
