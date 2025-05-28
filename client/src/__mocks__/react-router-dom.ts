// Mock for react-router-dom
import * as React from 'react';

// Mock components
export const BrowserRouter = ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children);
export const Routes = ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children);
export const Route = ({ element }: { element: React.ReactNode }) => element;
export const Link = ({ children, to }: { children: React.ReactNode; to: string }) => React.createElement('a', { href: to }, children);

// Mock hooks
export const useNavigate = () => jest.fn();
export const useParams = () => ({});
export const useLocation = () => ({});