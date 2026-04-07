import requests
import os
import hashlib

BASE_URL = "http://localhost:8000/api"
FILE_SIZE = 1024  # 1 KB dummy file

def create_dummy_file(filename, content=None):
    if content is None:
        content = os.urandom(FILE_SIZE)
    with open(filename, "wb") as f:
        f.write(content)
    return filename

def upload_file(filename):
    with open(filename, "rb") as f:
        files = {"file": f}
        response = requests.post(f"{BASE_URL}/files/", files=files)
        return response

def get_files(page=1):
    response = requests.get(f"{BASE_URL}/files/?page={page}")
    return response

def get_stats():
    response = requests.get(f"{BASE_URL}/files/storage-stats/")
    return response

def test_pagination_and_storage():
    print("=== Testing Pagination and Storage Stats ===")
    
    # 1. Clear DB? Ideally yes, but we'll just track what we add.
    # Current count
    initial_resp = get_files()
    if initial_resp.status_code == 200:
        initial_data = initial_resp.json()
        initial_count = initial_data['count'] if 'count' in initial_data else len(initial_data)
        print(f"Initial file count: {initial_count}")
    else:
        print("Could not fetch file list.")
        initial_count = 0

    # 2. Upload 25 files. 
    # To test storage stats, let's make 20 unique files and 5 exact duplicates.
    unique_content = os.urandom(FILE_SIZE)
    duplicate_filename = "duplicate_test_file.bin"
    create_dummy_file(duplicate_filename, unique_content)

    print("\n[Uploading Files]")
    created_files = []
    
    # Upload 20 unique files
    for i in range(20):
        fname = f"pagination_test_unique_{i}.bin"
        create_dummy_file(fname)
        resp = upload_file(fname)
        if resp.status_code == 201:
            print(f".", end="", flush=True)
            created_files.append(fname)
        else:
            print("x", end="", flush=True)
        os.remove(fname)

    # Upload 5 duplicate files
    for i in range(5):
        resp = upload_file(duplicate_filename)
        if resp.status_code == 201:
            print(f"D", end="", flush=True)
        else:
            print("x", end="", flush=True)
    
    print("\nUploads complete.")
    os.remove(duplicate_filename)

    # 3. Verify Pagination
    print("\n[Verifying Pagination]")
    # Page 1
    resp_p1 = get_files(1)
    data_p1 = resp_p1.json()
    
    # Check structure
    if 'results' not in data_p1:
        print("FAIL: Response does not look paginated (key 'results' missing).")
        return
    
    count = data_p1['count']
    results_length = len(data_p1['results'])
    
    print(f"Total Count: {count}")
    print(f"Page 1 Results: {results_length}")
    
    if results_length == 20:
        print("PASS: Page 1 has correct size (20).")
    else:
        print(f"FAIL: Page 1 has {results_length} items (expected 20).")

    if data_p1['next']:
        print(f"PASS: Next link present: {data_p1['next']}")
    else:
        print("FAIL: Next link missing.")

    # Page 2
    resp_p2 = get_files(2)
    data_p2 = resp_p2.json()
    results_p2 = len(data_p2['results'])
    print(f"Page 2 Results: {results_p2}")
    
    if results_p2 >= 5:
        print("PASS: Page 2 contains remaining items.")
    else:
        print("FAIL: Page 2 empty or missing items.")

    # 4. Verify Storage Stats
    print("\n[Verifying Storage Stats]")
    stats_resp = get_stats()
    stats = stats_resp.json()
    
    print(f"Total Files: {stats['total_files']}")
    print(f"Unique Files: {stats['unique_files']}")
    print(f"Duplicate Files: {stats['duplicate_files']}")
    print(f"Storage Saved: {stats['storage_saved']} bytes")
    
    # We added 20 unique items + (1 unique base for duplicate) + 4 extra duplicates
    # Wait, "duplicate_test_file.bin" was uploaded 5 times.
    # So 1 unique record, 4 duplicates.
    # Plus 20 unique random files.
    # Total added unique: 21. Total added duplicate: 4. Total added files: 25.
    
    # We can't strictly match exact numbers because other tests might have left data,
    # but we can check if duplicate count increased by at least 4.
    
    if stats['duplicate_files'] >= 4:
         print("PASS: Duplicate count reflects added duplicates.")
    else:
         print("FAIL: Duplicate count too low.")

    if stats['storage_saved'] > 0:
        print("PASS: Storage savings detected.")
    else:
        print("FAIL: No storage savings.")

if __name__ == "__main__":
    test_pagination_and_storage()
