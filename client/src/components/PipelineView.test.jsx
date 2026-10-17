import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import PipelineView from './PipelineView';

describe('PipelineView', () => {
  test('renders all four pipeline stages', () => {
    render(<PipelineView activeStage={-1} />);
    expect(screen.getByText('Godown')).toBeInTheDocument();
    expect(screen.getByText('Packaging')).toBeInTheDocument();
    expect(screen.getByText('Routing')).toBeInTheDocument();
    expect(screen.getByText('Dispatch')).toBeInTheDocument();
  });

  test('marks stages up to activeStage as done', () => {
    render(<PipelineView activeStage={1} />);
    const godown = screen.getByTestId('stage-godown');
    const packaging = screen.getByTestId('stage-packaging');
    const routing = screen.getByTestId('stage-routing');
    expect(godown.className).toContain('border-hud-accent2');
    expect(packaging.className).toContain('border-hud-accent2');
    expect(routing.className).not.toContain('border-hud-accent2');
  });
});
