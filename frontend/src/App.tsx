import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';
import { FilterBar } from './components/FilterBar';
import { StorageStats } from './components/StorageStats';
import { FileFilters } from './services/fileService';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FileFilters>({});

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Abnormal Security - File Hub</h1>
          <p className="mt-1 text-sm text-gray-500">
            Secure, deduplicated file storage
          </p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <StorageStats refreshTrigger={refreshKey} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Sidebar: Upload */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white shadow sm:rounded-lg">
                <FileUpload onUploadSuccess={handleUploadSuccess} />
              </div>
            </div>

            {/* Main Content: Filters & List */}
            <div className="lg:col-span-2 space-y-6">
              <FilterBar filters={filters} onFilterChange={setFilters} />

              <div className="bg-white shadow sm:rounded-lg">
                <FileList filters={filters} onDeleteSuccess={handleDeleteSuccess} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-white shadow mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 File Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
