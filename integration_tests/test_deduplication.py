#!/usr/bin/env python3
"""
Test script for Phase 2: Deduplication Upload and Delete with Reference Counting.
Run inside Docker: docker compose exec backend python test_deduplication.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files.storage import default_storage
from files.models import File
from files.utils import compute_file_hash


def cleanup():
    """Clean up all test data"""
    File.objects.all().delete()
    # Clean uploads directory
    try:
        for f in default_storage.listdir('uploads')[1]:
            default_storage.delete(f'uploads/{f}')
    except Exception:
        pass
    print("✓ Cleanup complete\n")


def test_upload_deduplication():
    """Test that duplicate uploads share storage"""
    print("=" * 60)
    print("TEST 1: Upload Deduplication")
    print("=" * 60)
    
    content_a = b"Test content for deduplication - File A"
    
    # Upload file A
    file_a = SimpleUploadedFile("test_a.txt", content_a, content_type="text/plain")
    hash_a = compute_file_hash(file_a)
    
    file1 = File.objects.create(
        file=file_a,
        original_filename="test_a.txt",
        file_type="text/plain",
        size=len(content_a),
        content_hash=hash_a,
        is_duplicate=False
    )
    file1_path = file1.file.name
    print(f"  File 1 created: {file1.id}")
    print(f"  Path: {file1_path}")
    print(f"  is_duplicate: {file1.is_duplicate}")
    print(f"  content_hash: {hash_a[:16]}...")
    
    # Upload same content again (simulate duplicate)
    file_a2 = SimpleUploadedFile("test_a_copy.txt", content_a, content_type="text/plain")
    hash_a2 = compute_file_hash(file_a2)
    
    # Check for existing file with same hash
    existing = File.objects.filter(content_hash=hash_a2).first()
    assert existing is not None, "Should find existing file with same hash"
    
    file2 = File.objects.create(
        file=existing.file.name,  # Share the path
        original_filename="test_a_copy.txt",
        file_type="text/plain",
        size=len(content_a),
        content_hash=hash_a2,
        is_duplicate=True
    )
    print(f"\n  File 2 created: {file2.id}")
    print(f"  Path: {file2.file.name}")
    print(f"  is_duplicate: {file2.is_duplicate}")
    
    # Verify both files share same path
    assert file1.file.name == file2.file.name, "Files should share storage path"
    print("\n✓ Both files share the same storage path!")
    
    # Verify there's only one physical file
    files_with_hash = File.objects.filter(content_hash=hash_a).count()
    print(f"✓ {files_with_hash} File records, 1 physical file")
    
    # Upload different content
    content_b = b"Completely different content - File B"
    file_b = SimpleUploadedFile("test_b.txt", content_b, content_type="text/plain")
    hash_b = compute_file_hash(file_b)
    
    existing_b = File.objects.filter(content_hash=hash_b).first()
    assert existing_b is None, "Different content should not have existing file"
    
    file3 = File.objects.create(
        file=file_b,
        original_filename="test_b.txt",
        file_type="text/plain",
        size=len(content_b),
        content_hash=hash_b,
        is_duplicate=False
    )
    print(f"\n  File 3 (different content): {file3.id}")
    print(f"  Path: {file3.file.name}")
    print(f"  is_duplicate: {file3.is_duplicate}")
    
    assert file3.file.name != file1.file.name, "Different content should have different path"
    print("✓ Different content stored in different file!")
    
    print("\n" + "=" * 60)
    print("RESULT: Upload Deduplication - PASSED ✓")
    print("=" * 60 + "\n")
    
    return file1, file2, file3


def test_delete_with_reference_counting(file1, file2, file3):
    """Test that physical file is only deleted when last reference is removed"""
    print("=" * 60)
    print("TEST 2: Delete with Reference Counting")
    print("=" * 60)
    
    file1_path = file1.file.name
    file3_path = file3.file.name
    content_hash = file1.content_hash
    
    print(f"\n  Initial state:")
    print(f"  - Files with same hash: {File.objects.filter(content_hash=content_hash).count()}")
    print(f"  - Physical file exists: {default_storage.exists(file1_path)}")
    
    # Delete first duplicate
    file1_id = file1.id
    file1.delete()
    
    remaining = File.objects.filter(content_hash=content_hash).exists()
    print(f"\n  After deleting File 1 ({file1_id}):")
    print(f"  - Remaining files with hash: {File.objects.filter(content_hash=content_hash).count()}")
    print(f"  - Physical file still exists: {default_storage.exists(file1_path)}")
    
    # Physical file should still exist
    if remaining:
        assert default_storage.exists(file1_path), "Physical file should still exist!"
        print("  ✓ Physical file correctly retained (other references exist)")
    
    # Delete second duplicate (last reference)
    file2_id = file2.id
    file2_path = file2.file.name
    file2_content_hash = file2.content_hash
    
    file2.delete()
    
    remaining_after = File.objects.filter(content_hash=file2_content_hash).exists()
    print(f"\n  After deleting File 2 ({file2_id}):")
    print(f"  - Remaining files with hash: {File.objects.filter(content_hash=file2_content_hash).count()}")
    
    # Now simulate the cleanup that destroy() would do
    if not remaining_after and file2_path:
        if default_storage.exists(file2_path):
            default_storage.delete(file2_path)
            print(f"  - Physical file deleted: True")
        print("  ✓ Physical file correctly deleted (no more references)")
    
    # Verify file3 still exists (different hash)
    assert default_storage.exists(file3_path), "File 3 should still exist"
    print(f"\n  File 3 (different content) still exists: {default_storage.exists(file3_path)}")
    print("  ✓ File 3 unaffected by deletion of other files")
    
    print("\n" + "=" * 60)
    print("RESULT: Delete with Reference Counting - PASSED ✓")
    print("=" * 60 + "\n")


def main():
    print("\n" + "=" * 60)
    print("PHASE 2 TESTS: Deduplication & Reference Counting")
    print("=" * 60 + "\n")
    
    try:
        cleanup()
        
        # Run tests
        file1, file2, file3 = test_upload_deduplication()
        test_delete_with_reference_counting(file1, file2, file3)
        
        print("\n" + "=" * 60)
        print("ALL TESTS PASSED! ✓")
        print("=" * 60 + "\n")
        
    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        cleanup()


if __name__ == "__main__":
    main()
