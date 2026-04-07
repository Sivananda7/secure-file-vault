import React from 'react';
import { render, screen, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { FileUpload } from './FileUpload';
import { fileService } from '../services/fileService';

// Mock the file service
jest.mock('../services/fileService', () => ({
    fileService: {
        uploadFile: jest.fn(),
    },
}));

const mockFileService = fileService as jest.Mocked<typeof fileService>;

describe('FileUpload', () => {
    const mockOnUploadSuccess = jest.fn();

    beforeEach(() => {
        mockOnUploadSuccess.mockClear();
        mockFileService.uploadFile.mockClear();
    });

    it('renders upload form correctly', () => {
        render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />);

        expect(screen.getByText('Upload File')).toBeInTheDocument();
        expect(screen.getByText('Upload a file')).toBeInTheDocument();
        expect(screen.getByText('Any file up to 10MB')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
    });

    it('disables upload button when no file is selected', () => {
        render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />);

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        expect(uploadButton).toBeDisabled();
    });

    it('shows selected file name after file selection', async () => {
        const user = userEvent.setup();

        render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />);

        const file = new File(['test content'], 'test-file.txt', {
            type: 'text/plain',
        });
        const input = screen.getByLabelText('Upload a file');

        await user.upload(input, file);

        expect(screen.getByText('Selected: test-file.txt')).toBeInTheDocument();
    });

    it('enables upload button after file selection', async () => {
        const user = userEvent.setup();

        render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />);

        const file = new File(['test content'], 'test-file.txt', {
            type: 'text/plain',
        });
        const input = screen.getByLabelText('Upload a file');

        await user.upload(input, file);

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        expect(uploadButton).not.toBeDisabled();
    });

    it('calls uploadFile and onUploadSuccess on successful upload', async () => {
        const user = userEvent.setup();
        mockFileService.uploadFile.mockResolvedValueOnce({
            id: '123',
            original_filename: 'test-file.txt',
            file_type: 'text/plain',
            size: 12,
            uploaded_at: '2024-01-01T00:00:00Z',
            file: 'http://localhost:8000/media/test.txt',
            is_duplicate: false,
        });

        render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />);

        const file = new File(['test content'], 'test-file.txt', {
            type: 'text/plain',
        });
        const input = screen.getByLabelText('Upload a file');

        await user.upload(input, file);

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        await user.click(uploadButton);

        await waitFor(() => {
            expect(mockFileService.uploadFile).toHaveBeenCalledWith(file);
        });

        await waitFor(() => {
            expect(mockOnUploadSuccess).toHaveBeenCalled();
        });
    });

    it('shows error message on upload failure', async () => {
        const user = userEvent.setup();
        mockFileService.uploadFile.mockRejectedValueOnce(new Error('Upload failed'));

        render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />);

        const file = new File(['test content'], 'test-file.txt', {
            type: 'text/plain',
        });
        const input = screen.getByLabelText('Upload a file');

        await user.upload(input, file);

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        await user.click(uploadButton);

        await waitFor(() => {
            expect(
                screen.getByText('Failed to upload file. Please try again.')
            ).toBeInTheDocument();
        });
    });

    it('shows uploading state during upload', async () => {
        const user = userEvent.setup();

        // Create a promise that we can control
        let resolveUpload: (value: any) => void;
        const uploadPromise = new Promise((resolve) => {
            resolveUpload = resolve;
        });
        mockFileService.uploadFile.mockReturnValueOnce(uploadPromise as any);

        render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />);

        const file = new File(['test content'], 'test-file.txt', {
            type: 'text/plain',
        });
        const input = screen.getByLabelText('Upload a file');

        await user.upload(input, file);

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        await user.click(uploadButton);

        // While uploading, button should show "Uploading..."
        await waitFor(() => {
            expect(screen.getByText('Uploading...')).toBeInTheDocument();
        });

        // Resolve the upload
        resolveUpload!({
            id: '123',
            original_filename: 'test-file.txt',
            file_type: 'text/plain',
            size: 12,
            uploaded_at: '2024-01-01T00:00:00Z',
            file: 'http://localhost:8000/media/test.txt',
            is_duplicate: false,
        });
    });

    it('clears selected file after successful upload', async () => {
        const user = userEvent.setup();
        mockFileService.uploadFile.mockResolvedValueOnce({
            id: '123',
            original_filename: 'test-file.txt',
            file_type: 'text/plain',
            size: 12,
            uploaded_at: '2024-01-01T00:00:00Z',
            file: 'http://localhost:8000/media/test.txt',
            is_duplicate: false,
        });

        render(<FileUpload onUploadSuccess={mockOnUploadSuccess} />);

        const file = new File(['test content'], 'test-file.txt', {
            type: 'text/plain',
        });
        const input = screen.getByLabelText('Upload a file');

        await user.upload(input, file);
        expect(screen.getByText('Selected: test-file.txt')).toBeInTheDocument();

        const uploadButton = screen.getByRole('button', { name: 'Upload' });
        await user.click(uploadButton);

        await waitFor(() => {
            expect(screen.queryByText('Selected: test-file.txt')).not.toBeInTheDocument();
        });
    });
});
