import requests
import json

BASE_URL = "http://localhost:8000/api"

def print_stats():
    response = requests.get(f"{BASE_URL}/files/storage-stats/")
    print(json.dumps(response.json(), indent=2))

def upload_file(content, filename):
    files = {'file': (filename, content)}
    response = requests.post(f"{BASE_URL}/files/", files=files)
    return response.json()

print("--- Initial Stats ---")
print_stats()

print("\n--- Uploading File A ---")
upload_file(b"content_a_is_unique", "file_a.txt")

print("\n--- Uploading File A (Duplicate) ---")
upload_file(b"content_a_is_unique", "file_a_copy.txt")

print("\n--- Final Stats ---")
print_stats()
