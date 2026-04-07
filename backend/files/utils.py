"""
Utility functions for file operations.
"""
import hashlib


def compute_file_hash(file_obj, chunk_size=8192):
    """
    Compute SHA-256 hash of a file object.
    
    Args:
        file_obj: A file-like object with read() method
        chunk_size: Size of chunks to read (default 8KB for memory efficiency)
    
    Returns:
        str: Hexadecimal SHA-256 hash of the file content
    """
    sha256_hash = hashlib.sha256()
    
    # Ensure we're at the start of the file
    file_obj.seek(0)
    
    # Read and update hash in chunks for memory efficiency
    for chunk in iter(lambda: file_obj.read(chunk_size), b''):
        sha256_hash.update(chunk)
    
    # Reset file position for subsequent reads
    file_obj.seek(0)
    
    return sha256_hash.hexdigest()
