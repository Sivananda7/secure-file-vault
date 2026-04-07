import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                // Turn off retries for tests
                retry: false,
                // Don't cache during tests
                gcTime: 0,
                staleTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });

interface WrapperProps {
    children: React.ReactNode;
}

// Custom render function that includes QueryClientProvider
function customRender(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    const testQueryClient = createTestQueryClient();

    const Wrapper: React.FC<WrapperProps> = ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
            {children}
        </QueryClientProvider>
    );

    return {
        ...render(ui, { wrapper: Wrapper, ...options }),
        queryClient: testQueryClient,
    };
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override the render method
export { customRender as render };
