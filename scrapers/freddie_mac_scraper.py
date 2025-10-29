#!/usr/bin/env python3
"""
Freddie Mac Guideline Scraper
Scrapes content from Freddie Mac Single-Family Seller/Servicer Guide website
"""

import requests
import json
import hashlib
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup
import re
import time

class FreddieMacScraper:
    def __init__(self, data_dir="../guidelines"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        self.base_url = "https://guide.freddiemac.com"
        self.key_urls = [
            "https://guide.freddiemac.com/app/guide/browse",
            "https://guide.freddiemac.com/app/guide/section/5401.2",
            "https://cdn.lhfs.com/lhfscdn/wholesale/download/FreddieMac_TheGuide.pdf"
        ]
        
        self.metadata_file = self.data_dir / "freddie_mac_metadata.json"
        self.json_file = self.data_dir / "freddie_mac_guidelines.json"
        self.pdf_file = self.data_dir / "freddie_mac_guide.pdf"
        
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def download_pdf(self, url):
        """Download PDF version of guide"""
        print(f"Downloading Freddie Mac Guide PDF from {url}...")
        try:
            response = requests.get(url, headers=self.headers, timeout=60, stream=True)
            response.raise_for_status()
            
            with open(self.pdf_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"Downloaded successfully to {self.pdf_file}")
            return True
        except Exception as e:
            print(f"Error downloading PDF: {e}")
            return False
    
    def scrape_page(self, url):
        """Scrape content from a single page"""
        print(f"Scraping {url}...")
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract main content
            content = {
                'url': url,
                'title': soup.title.string if soup.title else '',
                'text': '',
                'sections': []
            }
            
            # Try to find main content area
            main_content = soup.find('main') or soup.find('article') or soup.find('div', class_='content')
            
            if main_content:
                # Extract all text
                content['text'] = main_content.get_text(separator='\n', strip=True)
                
                # Extract sections with headings
                for heading in main_content.find_all(['h1', 'h2', 'h3', 'h4']):
                    section = {
                        'heading': heading.get_text(strip=True),
                        'level': heading.name,
                        'content': ''
                    }
                    
                    # Get content until next heading
                    content_parts = []
                    for sibling in heading.find_next_siblings():
                        if sibling.name in ['h1', 'h2', 'h3', 'h4']:
                            break
                        content_parts.append(sibling.get_text(strip=True))
                    
                    section['content'] = '\n'.join(content_parts)
                    content['sections'].append(section)
            else:
                # Fallback: get all text from body
                content['text'] = soup.get_text(separator='\n', strip=True)
            
            time.sleep(1)  # Be respectful to the server
            return content
        
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            return None
    
    def parse_guidelines(self, scraped_data):
        """Parse scraped data into structured format"""
        print("Parsing Freddie Mac guidelines into structured format...")
        
        # Combine all text
        all_text = []
        for data in scraped_data:
            if data:
                all_text.append(f"\n=== {data['title']} ===\n{data['text']}")
        
        combined_text = "\n".join(all_text)
        
        guidelines = {
            "source": "Freddie Mac Single-Family Seller/Servicer Guide",
            "last_updated": datetime.now().isoformat(),
            "urls_scraped": [d['url'] for d in scraped_data if d],
            "income_requirements": [],
            "credit_requirements": [],
            "property_requirements": [],
            "debt_to_income_ratios": [],
            "lpmi_requirements": [],
            "documentation_requirements": [],
            "sections": [],
            "full_text": combined_text
        }
        
        # Store all sections
        for data in scraped_data:
            if data and data.get('sections'):
                guidelines['sections'].extend(data['sections'])
        
        # Extract key sections using regex patterns
        income_patterns = [
            r"(?i)(income\s+calculation|qualifying\s+income|employment\s+income)",
            r"(?i)(self-employed\s+income|business\s+income)",
            r"(?i)(rental\s+income|investment\s+income)",
            r"(?i)(overtime|bonus|commission)",
            r"(?i)(stable\s+monthly\s+income|gross\s+monthly\s+income)",
        ]
        
        credit_patterns = [
            r"(?i)(credit\s+score|credit\s+requirements|minimum\s+credit)",
            r"(?i)(credit\s+history|credit\s+report)",
            r"(?i)(bankruptcy|foreclosure|deed.in.lieu)",
            r"(?i)(credit\s+event|significant\s+derogatory)",
        ]
        
        dti_patterns = [
            r"(?i)(debt.to.income|dti\s+ratio|housing\s+ratio)",
            r"(?i)(total\s+expense\s+ratio|housing\s+expense\s+ratio)",
            r"(?i)(monthly\s+debt\s+obligations)",
        ]
        
        lpmi_patterns = [
            r"(?i)(loan\s+prospector|lp\s+findings|automated\s+underwriting)",
            r"(?i)(aus\s+recommendation|lp\s+recommendation)",
        ]
        
        doc_patterns = [
            r"(?i)(income\s+documentation|employment\s+documentation)",
            r"(?i)(paystub|w-2|tax\s+return|1040)",
            r"(?i)(verification\s+of\s+employment|voe|voi)",
        ]
        
        # Extract requirements
        for pattern in income_patterns:
            matches = re.finditer(pattern, combined_text)
            for match in matches:
                start = max(0, match.start() - 500)
                end = min(len(combined_text), match.end() + 500)
                context = combined_text[start:end].strip()
                guidelines["income_requirements"].append({
                    "keyword": match.group(),
                    "context": context
                })
        
        for pattern in credit_patterns:
            matches = re.finditer(pattern, combined_text)
            for match in matches:
                start = max(0, match.start() - 500)
                end = min(len(combined_text), match.end() + 500)
                context = combined_text[start:end].strip()
                guidelines["credit_requirements"].append({
                    "keyword": match.group(),
                    "context": context
                })
        
        for pattern in dti_patterns:
            matches = re.finditer(pattern, combined_text)
            for match in matches:
                start = max(0, match.start() - 500)
                end = min(len(combined_text), match.end() + 500)
                context = combined_text[start:end].strip()
                guidelines["debt_to_income_ratios"].append({
                    "keyword": match.group(),
                    "context": context
                })
        
        for pattern in lpmi_patterns:
            matches = re.finditer(pattern, combined_text)
            for match in matches:
                start = max(0, match.start() - 500)
                end = min(len(combined_text), match.end() + 500)
                context = combined_text[start:end].strip()
                guidelines["lpmi_requirements"].append({
                    "keyword": match.group(),
                    "context": context
                })
        
        for pattern in doc_patterns:
            matches = re.finditer(pattern, combined_text)
            for match in matches:
                start = max(0, match.start() - 500)
                end = min(len(combined_text), match.end() + 500)
                context = combined_text[start:end].strip()
                guidelines["documentation_requirements"].append({
                    "keyword": match.group(),
                    "context": context
                })
        
        print(f"Found {len(guidelines['income_requirements'])} income requirement sections")
        print(f"Found {len(guidelines['credit_requirements'])} credit requirement sections")
        print(f"Found {len(guidelines['debt_to_income_ratios'])} DTI requirement sections")
        print(f"Found {len(guidelines['lpmi_requirements'])} LP/MI requirement sections")
        print(f"Found {len(guidelines['documentation_requirements'])} documentation requirement sections")
        
        return guidelines
    
    def save_metadata(self):
        """Save metadata about the scraping session"""
        metadata = {
            "last_checked": datetime.now().isoformat(),
            "urls_scraped": self.key_urls,
            "scraper_version": "1.0"
        }
        
        with open(self.metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Metadata saved to {self.metadata_file}")
    
    def scrape(self, force_update=False):
        """Main scraping function"""
        print("=" * 60)
        print("Freddie Mac Guideline Scraper")
        print("=" * 60)
        
        # Check if we should use cached data
        if not force_update and self.json_file.exists():
            print("Using existing Freddie Mac guidelines data.")
            with open(self.json_file, 'r') as f:
                return json.load(f)
        
        # Download PDF version
        self.download_pdf(self.key_urls[2])
        
        # Scrape web pages
        scraped_data = []
        for url in self.key_urls[:2]:  # Skip PDF URL
            content = self.scrape_page(url)
            if content:
                scraped_data.append(content)
        
        if not scraped_data:
            print("Failed to scrape any Freddie Mac pages.")
            return None
        
        # Parse guidelines
        guidelines = self.parse_guidelines(scraped_data)
        
        # Save metadata
        self.save_metadata()
        
        # Save structured data
        with open(self.json_file, 'w', encoding='utf-8') as f:
            json.dump(guidelines, f, indent=2, ensure_ascii=False)
        
        print(f"Structured guidelines saved to {self.json_file}")
        print("=" * 60)
        print("Freddie Mac scraping completed successfully!")
        print("=" * 60)
        
        return guidelines


if __name__ == "__main__":
    scraper = FreddieMacScraper()
    guidelines = scraper.scrape()
    
    if guidelines:
        print(f"\nSummary:")
        print(f"- Source: {guidelines['source']}")
        print(f"- Last Updated: {guidelines['last_updated']}")
        print(f"- URLs Scraped: {len(guidelines['urls_scraped'])}")
        print(f"- Income Requirements Found: {len(guidelines['income_requirements'])}")
        print(f"- Credit Requirements Found: {len(guidelines['credit_requirements'])}")
        print(f"- DTI Requirements Found: {len(guidelines['debt_to_income_ratios'])}")
        print(f"- LP/MI Requirements Found: {len(guidelines['lpmi_requirements'])}")
        print(f"- Documentation Requirements Found: {len(guidelines['documentation_requirements'])}")
