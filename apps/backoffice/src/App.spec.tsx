import { renderToStaticMarkup } from 'react-dom/server';
import { BackofficeApp } from './App';

describe('BackofficeApp', () => {
  it('renders the administration overview', () => {
    const html = renderToStaticMarkup(<BackofficeApp />);

    expect(html).toContain('Operations overview');
    expect(html).toContain('Recent events');
    expect(html).toContain('Mara &amp; Luis');
  });
});
