"""
Tests for file utility functions.
"""
import hashlib
import tempfile
import os
from io import BytesIO
from django.test import TestCase
from files.utils import compute_file_hash


class ComputeFileHashTests(TestCase):
    """Tests for the compute_file_hash utility function."""

    def test_hash_simple_content(self):
        """Test hashing simple byte content."""
        content = b'Hello, World!'
        file_obj = BytesIO(content)
        
        computed_hash = compute_file_hash(file_obj)
        expected_hash = hashlib.sha256(content).hexdigest()
        
        self.assertEqual(computed_hash, expected_hash)
        self.assertEqual(len(computed_hash), 64)  # SHA-256 produces 64 hex chars

    def test_hash_empty_file(self):
        """Test hashing empty content."""
        content = b''
        file_obj = BytesIO(content)
        
        computed_hash = compute_file_hash(file_obj)
        expected_hash = hashlib.sha256(content).hexdigest()
        
        self.assertEqual(computed_hash, expected_hash)

    def test_hash_large_content(self):
        """Test hashing content larger than chunk size (8KB)."""
        # Create content larger than the default 8KB chunk size
        content = b'x' * (8192 * 3 + 100)  # ~24KB + 100 bytes
        file_obj = BytesIO(content)
        
        computed_hash = compute_file_hash(file_obj)
        expected_hash = hashlib.sha256(content).hexdigest()
        
        self.assertEqual(computed_hash, expected_hash)

    def test_file_position_reset(self):
        """Test that file position is reset to 0 after hashing."""
        content = b'Test content for position check'
        file_obj = BytesIO(content)
        
        # Move to middle of file
        file_obj.seek(10)
        
        compute_file_hash(file_obj)
        
        # Position should be reset to 0
        self.assertEqual(file_obj.tell(), 0)

    def test_hash_binary_content(self):
        """Test hashing binary content with various byte values."""
        content = bytes(range(256))  # All possible byte values
        file_obj = BytesIO(content)
        
        computed_hash = compute_file_hash(file_obj)
        expected_hash = hashlib.sha256(content).hexdigest()
        
        self.assertEqual(computed_hash, expected_hash)

    def test_same_content_same_hash(self):
        """Test that identical content produces identical hashes."""
        content = b'Duplicate content test'
        
        file1 = BytesIO(content)
        file2 = BytesIO(content)
        
        hash1 = compute_file_hash(file1)
        hash2 = compute_file_hash(file2)
        
        self.assertEqual(hash1, hash2)

    def test_different_content_different_hash(self):
        """Test that different content produces different hashes."""
        file1 = BytesIO(b'Content A')
        file2 = BytesIO(b'Content B')
        
        hash1 = compute_file_hash(file1)
        hash2 = compute_file_hash(file2)
        
        self.assertNotEqual(hash1, hash2)

    def test_hash_with_real_file(self):
        """Test hashing with an actual file on disk."""
        content = b'Real file content for testing'
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        try:
            with open(tmp_path, 'rb') as f:
                computed_hash = compute_file_hash(f)
            
            expected_hash = hashlib.sha256(content).hexdigest()
            self.assertEqual(computed_hash, expected_hash)
        finally:
            os.unlink(tmp_path)

    def test_custom_chunk_size(self):
        """Test hashing with a custom chunk size."""
        content = b'Custom chunk size test content'
        file_obj = BytesIO(content)
        
        # Use a smaller chunk size
        computed_hash = compute_file_hash(file_obj, chunk_size=4)
        expected_hash = hashlib.sha256(content).hexdigest()
        
        self.assertEqual(computed_hash, expected_hash)
