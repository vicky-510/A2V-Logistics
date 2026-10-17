import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import DisruptionButton from './DisruptionButton';

describe('DisruptionButton', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('is disabled when there is no active shipment', () => {
    render(<DisruptionButton shipmentId={null} />);
    expect(screen.getByRole('button', { name: /simulate roadblock/i })).toBeDisabled();
  });

  test('triggers the disrupt API call and reports back the healing result', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, healed: true, steps: [] }),
    });
    const onHealed = vi.fn();

    render(<DisruptionButton shipmentId="SHIP-1" onHealed={onHealed} />);
    fireEvent.click(screen.getByRole('button', { name: /simulate roadblock/i }));

    await waitFor(() => expect(onHealed).toHaveBeenCalledWith({ ok: true, healed: true, steps: [] }));
  });

  test('shows an error message if the disrupt call fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ ok: false, error: 'Healing loop failed' }),
    });

    render(<DisruptionButton shipmentId="SHIP-1" />);
    fireEvent.click(screen.getByRole('button', { name: /simulate roadblock/i }));

    await waitFor(() => expect(screen.getByText('Healing loop failed')).toBeInTheDocument());
  });

  test('switches disruption type and sends it with the request', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, healed: true, steps: [] }),
    });

    render(<DisruptionButton shipmentId="SHIP-1" />);
    fireEvent.click(screen.getByRole('button', { name: /breakdown/i }));
    fireEvent.click(screen.getByRole('button', { name: /simulate breakdown/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.eventType).toBe('breakdown');
  });
});
