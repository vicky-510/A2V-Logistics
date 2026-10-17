import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import LoginScreen from './LoginScreen';

describe('LoginScreen', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('logs in successfully and stores the token', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, token: 'abc.def' }),
    });
    const onLoggedIn = vi.fn();

    render(<LoginScreen onLoggedIn={onLoggedIn} />);
    fireEvent.change(screen.getByLabelText('Access code'), { target: { value: 'secretcode' } });
    fireEvent.click(screen.getByRole('button', { name: /enter/i }));

    await waitFor(() => expect(onLoggedIn).toHaveBeenCalled());
    expect(localStorage.getItem('autoroute_ai_token')).toBe('abc.def');
  });

  test('shows an error on an invalid code', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ ok: false, error: 'Invalid access code.' }),
    });

    render(<LoginScreen onLoggedIn={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Access code'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /enter/i }));

    await waitFor(() => expect(screen.getByText('Invalid access code.')).toBeInTheDocument());
  });
});
