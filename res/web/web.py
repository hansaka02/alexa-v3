from googlesearch import search
from bs4 import BeautifulSoup
import requests
import sys
import json

# Function to perform a Google search
def google_search(query, num_results=3):
    results = []
    # Updated search call: remove the 'stop' and just limit the number of results manually
    for i, url in enumerate(search(query, lang="en")):
        if i >= num_results:
            break
        results.append(url)
    return results

# Function to scrape text from a website
def scrape_website(url):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        paragraphs = soup.find_all("p")
        
        text = " ".join([para.get_text(strip=True) for para in paragraphs[:5]])  # Strip whitespace
        text = text.encode("utf-8", "ignore").decode("utf-8")  # Remove encoding issues
        return text if text else "No content found."
    
    except requests.exceptions.RequestException as e:
        return f''
# Example usage
if __name__ == "__main__":
    query = sys.argv[1]  # Get the search query from command line arguments
    search_results = google_search(query)
    search_texts = [scrape_website(url) for url in search_results]
    
    # Print the result as JSON to send back to Node.js
    print(json.dumps(search_texts))
