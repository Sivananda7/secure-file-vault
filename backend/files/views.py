from django.shortcuts import render
from django.db import transaction
from django.db.models import Sum, Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import File
from .serializers import FileSerializer
from .utils import compute_file_hash

# Create your views here.


class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer

    def get_queryset(self):
        """
        Get queryset with optional search and filtering.
        """
        queryset = File.objects.all()
        
        # Search by filename
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(original_filename__icontains=search)
            
        # Filter by file_type
        file_type = self.request.query_params.get('file_type')
        if file_type:
            queryset = queryset.filter(file_type__startswith=file_type)
            
        # Filter by size range
        min_size = self.request.query_params.get('min_size')
        if min_size:
            queryset = queryset.filter(size__gte=min_size)
            
        max_size = self.request.query_params.get('max_size')
        if max_size:
            queryset = queryset.filter(size__lte=max_size)
            
        # Filter by upload date range
        uploaded_after = self.request.query_params.get('uploaded_after')
        if uploaded_after:
            queryset = queryset.filter(uploaded_at__gte=uploaded_after)
            
        uploaded_before = self.request.query_params.get('uploaded_before')
        if uploaded_before:
            queryset = queryset.filter(uploaded_at__lte=uploaded_before)
            
        return queryset

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Compute hash for deduplication
        content_hash = compute_file_hash(file_obj)
        
        with transaction.atomic():
            # Check if a file with same content already exists
            existing_file = File.objects.filter(content_hash=content_hash).first()
            
            if existing_file:
                # Duplicate detected - reuse existing file's storage path
                file_record = File.objects.create(
                    file=existing_file.file.name,  # Share the file path
                    original_filename=file_obj.name,
                    file_type=file_obj.content_type,
                    size=file_obj.size,
                    content_hash=content_hash,
                    is_duplicate=True
                )
            else:
                # New unique content - save the file
                file_record = File.objects.create(
                    file=file_obj,
                    original_filename=file_obj.name,
                    file_type=file_obj.content_type,
                    size=file_obj.size,
                    content_hash=content_hash,
                    is_duplicate=False
                )
        
        serializer = self.get_serializer(file_record)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        """
        Delete a file record.
        Only deletes the physical file if this is the last record with this content_hash.
        """
        instance = self.get_object()
        
        # Step 1: Capture file_path and content_hash BEFORE deletion
        file_path = instance.file.name
        content_hash = instance.content_hash
        
        with transaction.atomic():
            # Step 2: Delete the File row from database
            instance.delete()
            
            # Step 3: Check for remaining files with same hash
            remaining = File.objects.filter(content_hash=content_hash).exists()
            
            # Step 4: Delete physical file only if no remaining references
            if not remaining and file_path:
                from django.core.files.storage import default_storage
                if default_storage.exists(file_path):
                    default_storage.delete(file_path)
        
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='storage-stats')
    def storage_stats(self, request):
        """
        Get storage savings statistics.
        Calculates total vs actual storage used based on deduplication.
        """
        total_files = File.objects.count()
        total_logical_size = File.objects.aggregate(total=Sum('size'))['total'] or 0
        
        # Calculate unique files and actual storage using deduplication logic
        # For each unique content_hash, we only count the size once
        unique_hashes = File.objects.values('content_hash').distinct()
        unique_files_count = unique_hashes.count()
        
        # To get actual storage used, we sum the size of one representative file for each hash
        # We can simulate this by fetching one instance per hash OR better yet:
        # Since all files with same hash have same size, we can query distinct combinations
        actual_storage_used = 0
        
        # Efficient query: get distinct (content_hash, size) pairs and sum the sizes
        # Must clear ordering to ensure distinct works correctly across different upload times
        unique_sizes = File.objects.values('content_hash', 'size').order_by().distinct()
        for item in unique_sizes:
            actual_storage_used += item['size']
            
        duplicate_files = total_files - unique_files_count
        storage_saved = total_logical_size - actual_storage_used
        
        savings_percentage = 0.0
        if total_logical_size > 0:
            savings_percentage = (storage_saved / total_logical_size) * 100
            
        return Response({
            "total_files": total_files,
            "unique_files": unique_files_count,
            "duplicate_files": duplicate_files,
            "total_logical_size": total_logical_size,
            "actual_storage_used": actual_storage_used,
            "storage_saved": storage_saved,
            "savings_percentage": round(savings_percentage, 1)
        })
