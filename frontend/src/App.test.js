import { render, screen } from '@testing-library/react';
import App from './App';

test('renders wallet connection screen', () => {
  render(<App />);
  expect(screen.getByText(/freelance escrow dapp/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /connect metamask/i })).toBeInTheDocument();
});
