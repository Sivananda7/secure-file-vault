import requests
import json

BASE_URL = "http://localhost:8000/api"

def upload_file(filename, content, content_type="text/plain"):
    files = {'file': (filename, content, content_type)}
    response = requests.post(f"{BASE_URL}/files/", files=files)
    return response.json()

def search_files(params):
    response = requests.get(f"{BASE_URL}/files/", params=params)
    print(f"\nSearch params: {params}")
    results = response.json()
    print(f"Count: {len(results)}")
    for f in results:
        print(f" - {f['original_filename']} ({f['size']} bytes, {f['file_type']})")

print("--- Uploading Test Files ---")
upload_file("vacation.jpg", b"fake_image_content", "image/jpeg")
upload_file("report.pdf", b"fake_pdf_content" * 100, "application/pdf")
upload_file("notes.txt", b"simple notes", "text/plain")

print("\n--- Testing Search & Filters ---")

# Test 1: Search by name
search_files({'search': 'vacation'})

# Test 2: Filter by type
search_files({'file_type': 'image/'})

# Test 3: Filter by size
search_files({'min_size': 100})

# Test 4: Combined filters
search_files({'search': 'report', 'min_size': 100})
