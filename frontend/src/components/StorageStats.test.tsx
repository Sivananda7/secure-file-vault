import React from 'react';
import { render, screen, waitFor } from '../test-utils';
import { StorageStats } from './StorageStats';
import { fileService } from '../services/fileService';

// Mock the file service
jest.mock('../services/fileService', () => ({
    fileService: {
        getStorageStats: jest.fn(),
    },
}));

const mockFileService = fileService as jest.Mocked<typeof fileService>;

describe('StorageStats', () => {
    beforeEach(() => {
        mockFileService.getStorageStats.mockClear();
    });

    it('renders nothing when stats are not loaded', () => {
        mockFileService.getStorageStats.mockReturnValueOnce(new Promise(() => { }));

        const { container } = render(<StorageStats refreshTrigger={0} />);

        // Component should return null when stats are not loaded
        expect(container.firstChild).toBeNull();
    });

    it('displays storage statistics correctly', async () => {
        mockFileService.getStorageStats.mockResolvedValueOnce({
            total_files: 100,
            unique_files: 75,
            duplicate_files: 25,
            total_logical_size: 102400,
            actual_storage_used: 76800,
            storage_saved: 25600,
            savings_percentage: 25.0,
        });

        render(<StorageStats refreshTrigger={0} />);

        await waitFor(() => {
            expect(screen.getByText('100')).toBeInTheDocument(); // Total files
        });

        expect(screen.getByText('75')).toBeInTheDocument(); // Unique files
        expect(screen.getByText('25')).toBeInTheDocument(); // Duplicate files
    });

    it('displays storage saved in KB', async () => {
        mockFileService.getStorageStats.mockResolvedValueOnce({
            total_files: 10,
            unique_files: 8,
            duplicate_files: 2,
            total_logical_size: 10240,
            actual_storage_used: 8192,
            storage_saved: 2048,
            savings_percentage: 20.0,
        });

        render(<StorageStats refreshTrigger={0} />);

        await waitFor(() => {
            // 2048 bytes = 2.0 KB
            expect(screen.getByText('2.0')).toBeInTheDocument();
            expect(screen.getByText('KB')).toBeInTheDocument();
        });
    });

    it('displays efficiency percentage with correct styling for high savings', async () => {
        mockFileService.getStorageStats.mockResolvedValueOnce({
            total_files: 100,
            unique_files: 50,
            duplicate_files: 50,
            total_logical_size: 100000,
            actual_storage_used: 50000,
            storage_saved: 50000,
            savings_percentage: 50.0,
        });

        render(<StorageStats refreshTrigger={0} />);

        await waitFor(() => {
            const efficiencyBadge = screen.getByText('50% Efficiency');
            expect(efficiencyBadge).toBeInTheDocument();
            // High savings (>20%) should have green styling
            expect(efficiencyBadge).toHaveClass('bg-green-100', 'text-green-800');
        });
    });

    it('displays efficiency percentage with correct styling for low savings', async () => {
        mockFileService.getStorageStats.mockResolvedValueOnce({
            total_files: 10,
            unique_files: 9,
            duplicate_files: 1,
            total_logical_size: 10000,
            actual_storage_used: 9000,
            storage_saved: 1000,
            savings_percentage: 10.0,
        });

        render(<StorageStats refreshTrigger={0} />);

        await waitFor(() => {
            const efficiencyBadge = screen.getByText('10% Efficiency');
            expect(efficiencyBadge).toBeInTheDocument();
            // Medium savings (0-20%) should have blue styling
            expect(efficiencyBadge).toHaveClass('bg-blue-100', 'text-blue-800');
        });
    });

    it('displays efficiency percentage with correct styling for zero savings', async () => {
        mockFileService.getStorageStats.mockResolvedValueOnce({
            total_files: 5,
            unique_files: 5,
            duplicate_files: 0,
            total_logical_size: 5000,
            actual_storage_used: 5000,
            storage_saved: 0,
            savings_percentage: 0,
        });

        render(<StorageStats refreshTrigger={0} />);

        await waitFor(() => {
            const efficiencyBadge = screen.getByText('0% Efficiency');
            expect(efficiencyBadge).toBeInTheDocument();
            // Zero savings should have gray styling
            expect(efficiencyBadge).toHaveClass('bg-gray-100', 'text-gray-800');
        });
    });

    it('reloads stats when refreshTrigger changes', async () => {
        mockFileService.getStorageStats.mockResolvedValue({
            total_files: 10,
            unique_files: 10,
            duplicate_files: 0,
            total_logical_size: 1000,
            actual_storage_used: 1000,
            storage_saved: 0,
            savings_percentage: 0,
        });

        const { rerender } = render(<StorageStats refreshTrigger={0} />);

        await waitFor(() => {
            expect(mockFileService.getStorageStats).toHaveBeenCalledTimes(1);
        });

        // Trigger a refresh
        rerender(<StorageStats refreshTrigger={1} />);

        await waitFor(() => {
            expect(mockFileService.getStorageStats).toHaveBeenCalledTimes(2);
        });
    });

    it('displays section headers correctly', async () => {
        mockFileService.getStorageStats.mockResolvedValueOnce({
            total_files: 10,
            unique_files: 10,
            duplicate_files: 0,
            total_logical_size: 1000,
            actual_storage_used: 1000,
            storage_saved: 0,
            savings_percentage: 0,
        });

        render(<StorageStats refreshTrigger={0} />);

        await waitFor(() => {
            expect(screen.getByText('Storage Optimization')).toBeInTheDocument();
        });

        expect(
            screen.getByText('Real-time deduplication efficiency metrics')
        ).toBeInTheDocument();
        expect(screen.getByText('Total Files')).toBeInTheDocument();
        expect(screen.getByText('Unique Files')).toBeInTheDocument();
        expect(screen.getByText('Duplicates Blocked')).toBeInTheDocument();
        expect(screen.getByText('Storage Saved')).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        mockFileService.getStorageStats.mockRejectedValueOnce(new Error('API Error'));

        const { container } = render(<StorageStats refreshTrigger={0} />);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to load stats', expect.any(Error));
        });

        // Component should not render anything on error
        expect(container.firstChild).toBeNull();

        consoleSpy.mockRestore();
    });

    it('displays unique files percentage correctly', async () => {
        mockFileService.getStorageStats.mockResolvedValueOnce({
            total_files: 100,
            unique_files: 75,
            duplicate_files: 25,
            total_logical_size: 100000,
            actual_storage_used: 75000,
            storage_saved: 25000,
            savings_percentage: 25.0,
        });

        render(<StorageStats refreshTrigger={0} />);

        await waitFor(() => {
            // 75/100 = 75% unique
            expect(screen.getByText('75% are unique')).toBeInTheDocument();
        });
    });
});
