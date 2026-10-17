import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import TerminalLog from './TerminalLog';

describe('TerminalLog', () => {
  test('shows a waiting message when there are no logs', () => {
    render(<TerminalLog logs={[]} />);
    expect(screen.getByText(/Waiting for events/i)).toBeInTheDocument();
  });

  test('renders log entries with actor and message', () => {
    const logs = [
      { timestamp: new Date().toISOString(), actor: 'pipeline', message: 'Inventory check at Godown A...' },
      { timestamp: new Date().toISOString(), actor: 'gemini-agent', message: 'Rerouting via bypass.' },
    ];
    render(<TerminalLog logs={logs} />);
    expect(screen.getByText(/Inventory check at Godown A/)).toBeInTheDocument();
    expect(screen.getByText(/Rerouting via bypass/)).toBeInTheDocument();
    expect(screen.getByText('[pipeline]')).toBeInTheDocument();
  });
});
