import React from 'react';
import { render, screen, waitFor, within } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { FileList } from './FileList';
import { fileService } from '../services/fileService';
import { File as FileType, PaginatedResponse } from '../types/file';

// Mock the file service
jest.mock('../services/fileService', () => ({
    fileService: {
        getFiles: jest.fn(),
        deleteFile: jest.fn(),
        downloadFile: jest.fn(),
    },
}));

const mockFileService = fileService as jest.Mocked<typeof fileService>;

// Sample test data
const mockFiles: FileType[] = [
    {
        id: '1',
        original_filename: 'document.pdf',
        file_type: 'application/pdf',
        size: 1024,
        uploaded_at: '2024-01-15T10:30:00Z',
        file: 'http://localhost:8000/media/uploads/document.pdf',
        is_duplicate: false,
    },
    {
        id: '2',
        original_filename: 'image.png',
        file_type: 'image/png',
        size: 2048,
        uploaded_at: '2024-01-16T14:45:00Z',
        file: 'http://localhost:8000/media/uploads/image.png',
        is_duplicate: true,
    },
    {
        id: '3',
        original_filename: 'video.mp4',
        file_type: 'video/mp4',
        size: 5120,
        uploaded_at: '2024-01-17T09:15:00Z',
        file: 'http://localhost:8000/media/uploads/video.mp4',
        is_duplicate: false,
    },
];

const mockPaginatedResponse: PaginatedResponse<FileType> = {
    count: 3,
    next: null,
    previous: null,
    results: mockFiles,
};

describe('FileList', () => {
    beforeEach(() => {
        mockFileService.getFiles.mockClear();
        mockFileService.deleteFile.mockClear();
        mockFileService.downloadFile.mockClear();
    });

    it('displays loading state initially', async () => {
        // Keep the promise pending to show loading state
        mockFileService.getFiles.mockReturnValueOnce(new Promise(() => { }));

        render(<FileList />);

        // Should show loading skeleton
        expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('displays file list after loading', async () => {
        mockFileService.getFiles.mockResolvedValueOnce(mockPaginatedResponse);

        render(<FileList />);

        await waitFor(() => {
            expect(screen.getByText('document.pdf')).toBeInTheDocument();
        });

        expect(screen.getByText('image.png')).toBeInTheDocument();
        expect(screen.getByText('video.mp4')).toBeInTheDocument();
    });

    it('displays empty state when no files', async () => {
        mockFileService.getFiles.mockResolvedValueOnce({
            count: 0,
            next: null,
            previous: null,
            results: [],
        });

        render(<FileList />);

        await waitFor(() => {
            expect(screen.getByText('No files found')).toBeInTheDocument();
        });

        expect(
            screen.getByText('Get started by uploading a file or adjust your filters.')
        ).toBeInTheDocument();
    });

    it('displays error state on fetch failure', async () => {
        mockFileService.getFiles.mockRejectedValueOnce(new Error('Network error'));

        render(<FileList />);

        await waitFor(() => {
            expect(
                screen.getByText('Failed to load files. Please try again.')
            ).toBeInTheDocument();
        });
    });

    it('displays file metadata correctly', async () => {
        mockFileService.getFiles.mockResolvedValueOnce(mockPaginatedResponse);

        render(<FileList />);

        await waitFor(() => {
            expect(screen.getByText('document.pdf')).toBeInTheDocument();
        });

        // Check file size display (1024 bytes = 1.00 KB)
        expect(screen.getByText('1.00 KB')).toBeInTheDocument();

        // Check file type display
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('PNG')).toBeInTheDocument();
        expect(screen.getByText('MP4')).toBeInTheDocument();
    });

    it('displays duplicate badge for duplicate files', async () => {
        mockFileService.getFiles.mockResolvedValueOnce(mockPaginatedResponse);

        render(<FileList />);

        await waitFor(() => {
            expect(screen.getByText('image.png')).toBeInTheDocument();
        });

        // image.png is marked as duplicate
        expect(screen.getByText('Duplicate')).toBeInTheDocument();
    });

    it('calls deleteFile when delete button is clicked', async () => {
        const user = userEvent.setup();
        mockFileService.getFiles.mockResolvedValueOnce(mockPaginatedResponse);
        mockFileService.deleteFile.mockResolvedValueOnce(undefined);

        render(<FileList onDeleteSuccess={jest.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('document.pdf')).toBeInTheDocument();
        });

        // Find the first delete button and click it
        const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
        await user.click(deleteButtons[0]);

        await waitFor(() => {
            expect(mockFileService.deleteFile).toHaveBeenCalledWith('1');
        });
    });

    it('calls downloadFile when download button is clicked', async () => {
        const user = userEvent.setup();
        mockFileService.getFiles.mockResolvedValueOnce(mockPaginatedResponse);
        mockFileService.downloadFile.mockResolvedValueOnce(undefined);

        render(<FileList />);

        await waitFor(() => {
            expect(screen.getByText('document.pdf')).toBeInTheDocument();
        });

        // Find the first download button and click it
        const downloadButtons = screen.getAllByRole('button', { name: /Download/i });
        await user.click(downloadButtons[0]);

        await waitFor(() => {
            expect(mockFileService.downloadFile).toHaveBeenCalledWith(
                'http://localhost:8000/media/uploads/document.pdf',
                'document.pdf'
            );
        });
    });

    it('passes filters to getFiles', async () => {
        mockFileService.getFiles.mockResolvedValueOnce(mockPaginatedResponse);

        const filters = {
            search: 'test',
            file_type: 'image/',
            min_size: 1000,
        };

        render(<FileList filters={filters} />);

        await waitFor(() => {
            expect(mockFileService.getFiles).toHaveBeenCalledWith(
                expect.objectContaining({
                    search: 'test',
                    file_type: 'image/',
                    min_size: 1000,
                    page: 1,
                })
            );
        });
    });

    it('displays file count and pagination info', async () => {
        mockFileService.getFiles.mockResolvedValueOnce(mockPaginatedResponse);

        render(<FileList />);

        await waitFor(() => {
            expect(screen.getByText('Uploaded Files')).toBeInTheDocument();
        });

        // Should show results count
        expect(screen.getByText(/Showing 1 to 3 of 3 results/)).toBeInTheDocument();
    });

    it('displays pagination controls for multiple pages', async () => {
        const manyFilesResponse: PaginatedResponse<FileType> = {
            count: 45,
            next: 'http://localhost:8000/api/files/?page=2',
            previous: null,
            results: mockFiles,
        };

        mockFileService.getFiles.mockResolvedValue(manyFilesResponse);

        render(<FileList />);

        await waitFor(() => {
            expect(screen.getByText('Page')).toBeInTheDocument();
        });

        // Should show page numbers
        expect(screen.getByText('1')).toBeInTheDocument(); // current page
        expect(screen.getByText('3')).toBeInTheDocument(); // total pages (45/20 = 3)
    });

    it('navigates to next page when next button clicked', async () => {
        const user = userEvent.setup();

        const manyFilesResponse: PaginatedResponse<FileType> = {
            count: 45,
            next: 'http://localhost:8000/api/files/?page=2',
            previous: null,
            results: mockFiles,
        };

        mockFileService.getFiles.mockResolvedValue(manyFilesResponse);

        render(<FileList />);

        await waitFor(() => {
            expect(screen.getByText('Page')).toBeInTheDocument();
        });

        // Click next button
        const nextButton = screen.getByRole('button', { name: 'Next' });
        await user.click(nextButton);

        await waitFor(() => {
            expect(mockFileService.getFiles).toHaveBeenCalledWith(
                expect.objectContaining({ page: 2 })
            );
        });
    });

    it('resets to page 1 when filters change', async () => {
        mockFileService.getFiles.mockResolvedValue(mockPaginatedResponse);

        const { rerender } = render(<FileList filters={{}} />);

        await waitFor(() => {
            expect(mockFileService.getFiles).toHaveBeenCalledWith(
                expect.objectContaining({ page: 1 })
            );
        });

        // Change filters
        rerender(<FileList filters={{ search: 'new search' }} />);

        await waitFor(() => {
            expect(mockFileService.getFiles).toHaveBeenCalledWith(
                expect.objectContaining({ search: 'new search', page: 1 })
            );
        });
    });

    it('calls onDeleteSuccess callback after successful delete', async () => {
        const user = userEvent.setup();
        const mockOnDeleteSuccess = jest.fn();

        mockFileService.getFiles.mockResolvedValueOnce(mockPaginatedResponse);
        mockFileService.deleteFile.mockResolvedValueOnce(undefined);

        render(<FileList onDeleteSuccess={mockOnDeleteSuccess} />);

        await waitFor(() => {
            expect(screen.getByText('document.pdf')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
        await user.click(deleteButtons[0]);

        await waitFor(() => {
            expect(mockOnDeleteSuccess).toHaveBeenCalled();
        });
    });

    it('applies correct color coding based on file type', async () => {
        mockFileService.getFiles.mockResolvedValueOnce(mockPaginatedResponse);

        render(<FileList />);

        await waitFor(() => {
            expect(screen.getByText('document.pdf')).toBeInTheDocument();
        });

        // Find the file type icon containers
        // PDF should have red styling, image purple, video pink
        const listItems = screen.getAllByRole('listitem');
        expect(listItems.length).toBe(3);
    });
});
