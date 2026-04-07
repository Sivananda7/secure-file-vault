export interface File {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;
  is_duplicate: boolean;
}

export interface StorageStats {
  total_files: number;
  unique_files: number;
  duplicate_files: number;
  total_logical_size: number;
  actual_storage_used: number;
  storage_saved: number;
  savings_percentage: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}