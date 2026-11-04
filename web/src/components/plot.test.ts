import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PlotDialog } from './PlotDialog';

describe('PlotDialog', () => {
  it('renders when empty', () => {
    const html = renderToString(React.createElement(PlotDialog, {
      isOpen: true,
      onClose: () => {},
      datasets: []
    }));
    expect(html).toContain('No dataset data available');
  });

  it('renders with dataset', () => {
    const html = renderToString(React.createElement(PlotDialog, {
      isOpen: true,
      onClose: () => {},
      datasets: [
        {
          name: 'd',
          count: 3,
          xRange: [0, 2],
          points: [
            { x: 0, yReal: 0, yImag: 0 },
            { x: 1, yReal: 1, yImag: 0 },
            { x: 2, yReal: 4, yImag: 0 },
          ]
        }
      ]
    }));
    expect(html).toBeDefined();
  });
});
