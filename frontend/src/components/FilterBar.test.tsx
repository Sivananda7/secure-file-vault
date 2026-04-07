import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { FilterBar } from './FilterBar';
import { FileFilters } from '../services/fileService';

describe('FilterBar', () => {
    const mockOnFilterChange = jest.fn();
    const defaultFilters: FileFilters = {};

    beforeEach(() => {
        mockOnFilterChange.mockClear();
    });

    it('renders all filter inputs', () => {
        render(
            <FilterBar filters={defaultFilters} onFilterChange={mockOnFilterChange} />
        );

        // Check for search input
        expect(screen.getByPlaceholderText('Filename...')).toBeInTheDocument();

        // Check for file type select
        expect(screen.getByLabelText('File Type')).toBeInTheDocument();

        // Check for size range inputs
        expect(screen.getByLabelText('Min Size (B)')).toBeInTheDocument();
        expect(screen.getByLabelText('Max Size (B)')).toBeInTheDocument();
    });

    it('displays current filter values', () => {
        const filters: FileFilters = {
            search: 'test-file',
            file_type: 'image/',
            min_size: 1000,
            max_size: 50000,
        };

        render(<FilterBar filters={filters} onFilterChange={mockOnFilterChange} />);

        expect(screen.getByPlaceholderText('Filename...')).toHaveValue('test-file');
        expect(screen.getByLabelText('File Type')).toHaveValue('image/');
        expect(screen.getByLabelText('Min Size (B)')).toHaveValue(1000);
        expect(screen.getByLabelText('Max Size (B)')).toHaveValue(50000);
    });

    it('calls onFilterChange when search input changes', async () => {
        const user = userEvent.setup();

        render(
            <FilterBar filters={defaultFilters} onFilterChange={mockOnFilterChange} />
        );

        const searchInput = screen.getByPlaceholderText('Filename...');
        await user.type(searchInput, 'document');

        // onFilterChange should be called for each character typed
        expect(mockOnFilterChange).toHaveBeenCalled();

        // Last call should have the search value
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1][0];
        expect(lastCall).toHaveProperty('search');
    });

    it('calls onFilterChange when file type is selected', async () => {
        const user = userEvent.setup();

        render(
            <FilterBar filters={defaultFilters} onFilterChange={mockOnFilterChange} />
        );

        const fileTypeSelect = screen.getByLabelText('File Type');
        await user.selectOptions(fileTypeSelect, 'image/');

        expect(mockOnFilterChange).toHaveBeenCalledWith(
            expect.objectContaining({ file_type: 'image/' })
        );
    });

    it('calls onFilterChange when min size is entered', async () => {
        const user = userEvent.setup();

        render(
            <FilterBar filters={defaultFilters} onFilterChange={mockOnFilterChange} />
        );

        const minSizeInput = screen.getByLabelText('Min Size (B)');
        await user.type(minSizeInput, '1024');

        expect(mockOnFilterChange).toHaveBeenCalled();
    });

    it('calls onFilterChange when max size is entered', async () => {
        const user = userEvent.setup();

        render(
            <FilterBar filters={defaultFilters} onFilterChange={mockOnFilterChange} />
        );

        const maxSizeInput = screen.getByLabelText('Max Size (B)');
        await user.type(maxSizeInput, '10240');

        expect(mockOnFilterChange).toHaveBeenCalled();
    });

    it('renders all file type options', () => {
        render(
            <FilterBar filters={defaultFilters} onFilterChange={mockOnFilterChange} />
        );

        expect(screen.getByRole('option', { name: 'All Types' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Images' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Videos' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'PDFs' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Text' })).toBeInTheDocument();
    });

    it('preserves existing filters when changing one filter', async () => {
        const user = userEvent.setup();
        const existingFilters: FileFilters = {
            search: 'existing',
            file_type: 'image/',
        };

        render(
            <FilterBar filters={existingFilters} onFilterChange={mockOnFilterChange} />
        );

        const minSizeInput = screen.getByLabelText('Min Size (B)');
        await user.type(minSizeInput, '500');

        // Should preserve existing filters and add new one
        expect(mockOnFilterChange).toHaveBeenCalledWith(
            expect.objectContaining({
                search: 'existing',
                file_type: 'image/',
            })
        );
    });
});
