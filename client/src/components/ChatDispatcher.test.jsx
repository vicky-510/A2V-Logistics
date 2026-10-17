import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import ChatDispatcher from './ChatDispatcher';

describe('ChatDispatcher', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('sends a message and renders the agent confirmation', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        order: { units: 100, origin: 'Godown A', destination: 'Port 1' },
        result: {
          shipmentId: 'SHIP-1',
          dispatch: { carrier: 'Carrier-204' },
          route: { etaMinutes: 25 },
          costEstimate: 87.5,
        },
      }),
    });

    const onDispatched = vi.fn();
    render(<ChatDispatcher onDispatched={onDispatched} />);

    fireEvent.change(screen.getByLabelText('Dispatch order'), {
      target: { value: 'Ship 100 units from Godown A to Port 1' },
    });
    fireEvent.click(screen.getByLabelText('Send'));

    await waitFor(() => {
      expect(screen.getByText(/Dispatched 100 units/)).toBeInTheDocument();
    });
    expect(onDispatched).toHaveBeenCalled();
  });

  test('renders an error message when dispatch fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ ok: false, error: 'Could not parse order.' }),
    });

    render(<ChatDispatcher />);
    fireEvent.change(screen.getByLabelText('Dispatch order'), { target: { value: 'nonsense input' } });
    fireEvent.click(screen.getByLabelText('Send'));

    await waitFor(() => {
      expect(screen.getByText('Could not parse order.')).toBeInTheDocument();
    });
  });
});
