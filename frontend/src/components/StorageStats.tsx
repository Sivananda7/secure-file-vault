import React, { useEffect, useState } from 'react';
import { fileService } from '../services/fileService';
import { StorageStats as StatsType } from '../types/file';
import {
    CircleStackIcon,
    DocumentDuplicateIcon,
    DocumentIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';

export const StorageStats: React.FC<{ refreshTrigger: number }> = ({ refreshTrigger }) => {
    const [stats, setStats] = useState<StatsType | null>(null);

    useEffect(() => {
        loadStats();
    }, [refreshTrigger]);

    const loadStats = async () => {
        try {
            const data = await fileService.getStorageStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats', error);
        }
    };

    if (!stats) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Storage Optimization</h3>
                    <p className="text-sm text-gray-500">Real-time deduplication efficiency metrics</p>
                </div>
                <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stats.savings_percentage > 20 ? 'bg-green-100 text-green-800' :
                            stats.savings_percentage > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {stats.savings_percentage}% Efficiency
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

                {/* Total Files Card */}
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg p-5 text-white shadow-lg shadow-indigo-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium">Total Files</p>
                            <p className="text-3xl font-bold mt-1">{stats.total_files}</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg">
                            <DocumentIcon className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-indigo-100">Across the system</p>
                </div>

                {/* Unique Files Card */}
                <div className="bg-white rounded-lg p-5 border border-indigo-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Unique Files</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.unique_files}</p>
                        </div>
                        <div className="bg-indigo-50 p-2 rounded-lg">
                            <CircleStackIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
                        <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${(stats.unique_files / stats.total_files * 100) || 0}%` }}
                        ></div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        {((stats.unique_files / stats.total_files * 100) || 0).toFixed(0)}% are unique
                    </p>
                </div>

                {/* Duplicates Card */}
                <div className="bg-white rounded-lg p-5 border border-orange-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Duplicates Blocked</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.duplicate_files}</p>
                        </div>
                        <div className="bg-orange-50 p-2 rounded-lg">
                            <DocumentDuplicateIcon className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-gray-500">
                        Prevented redundant storage
                    </p>
                </div>

                {/* Savings Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-5 text-white shadow-lg shadow-emerald-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">Storage Saved</p>
                            <p className="text-3xl font-bold mt-1">
                                {(stats.storage_saved / 1024).toFixed(1)} <span className="text-lg font-normal">KB</span>
                            </p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg">
                            <BanknotesIcon className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-2">
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white font-medium">
                            {stats.savings_percentage}%
                        </span>
                        <span className="text-xs text-emerald-100">reduction in costs</span>
                    </div>
                </div>

            </div>
        </div>
    );
};
