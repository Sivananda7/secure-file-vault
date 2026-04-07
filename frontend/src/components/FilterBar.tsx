import React from 'react';
import { FileFilters } from '../services/fileService';

interface FilterBarProps {
    filters: FileFilters;
    onFilterChange: (filters: FileFilters) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onFilterChange({
            ...filters,
            [name]: value
        });
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Search</label>
                    <input
                        type="text"
                        name="search"
                        value={filters.search || ''}
                        onChange={handleChange}
                        placeholder="Filename..."
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                </div>

                {/* File Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">File Type</label>
                    <select
                        name="file_type"
                        value={filters.file_type || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    >
                        <option value="">All Types</option>
                        <option value="image/">Images</option>
                        <option value="video/">Videos</option>
                        <option value="application/pdf">PDFs</option>
                        <option value="text/">Text</option>
                    </select>
                </div>

                {/* Size Range */}
                <div className="flex space-x-2">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Min Size (B)</label>
                        <input
                            type="number"
                            name="min_size"
                            value={filters.min_size || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Max Size (B)</label>
                        <input
                            type="number"
                            name="max_size"
                            value={filters.max_size || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
