#!/usr/bin/env python3
"""
VA Guideline Scraper
Downloads and parses VA Lenders Handbook (Pamphlet 26-7) and M26-1 Manual
"""

import requests
import json
import hashlib
import os
from datetime import datetime
from pathlib import Path
import PyPDF2
import re

class VAScraper:
    def __init__(self, data_dir="../guidelines"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        self.sources = {
            "lenders_handbook": "https://www.benefits.va.gov/warms/docs/admin26/m26-07/lender_handbook_va_pamphlet_complete.pdf",
            "m26_1_manual": "https://www.benefits.va.gov/WARMS/docs/admin26/m26_01/Manual_M26_1.pdf",
            "credit_underwriting": "https://benefits.va.gov/WARMS/docs/admin26/m26-07/chapter_4_credit_underwriting.pdf"
        }
        
        self.metadata_file = self.data_dir / "va_metadata.json"
        self.json_file = self.data_dir / "va_guidelines.json"
    
    def download_pdf(self, url, filename):
        """Download PDF from URL"""
        filepath = self.data_dir / filename
        print(f"Downloading VA document from {url}...")
        try:
            response = requests.get(url, timeout=60, stream=True)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"Downloaded successfully to {filepath}")
            return filepath
        except Exception as e:
            print(f"Error downloading from {url}: {e}")
            return None
    
    def calculate_hash(self, filepath):
        """Calculate SHA256 hash of file"""
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def extract_text_from_pdf(self, filepath):
        """Extract text content from PDF"""
        print(f"Extracting text from {filepath.name}...")
        try:
            text_content = []
            
            with open(filepath, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                total_pages = len(pdf_reader.pages)
                
                print(f"Total pages: {total_pages}")
                
                for page_num in range(total_pages):
                    page = pdf_reader.pages[page_num]
                    text = page.extract_text()
                    text_content.append(f"\n--- PAGE {page_num + 1} ---\n{text}")
                    
                    if (page_num + 1) % 50 == 0:
                        print(f"Processed {page_num + 1}/{total_pages} pages...")
            
            full_text = "\n".join(text_content)
            
            # Save extracted text
            text_file = filepath.with_suffix('.txt')
            with open(text_file, 'w', encoding='utf-8') as f:
                f.write(full_text)
            
            print(f"Text extracted and saved to {text_file}")
            return full_text
        
        except Exception as e:
            print(f"Error extracting text: {e}")
            return None
    
    def parse_guidelines(self, texts):
        """Parse guidelines into structured format"""
        print("Parsing VA guidelines into structured format...")
        
        # Combine all texts
        combined_text = "\n\n=== DOCUMENT SEPARATOR ===\n\n".join(texts.values())
        
        guidelines = {
            "source": "VA - Lenders Handbook (Pamphlet 26-7) and M26-1 Manual",
            "last_updated": datetime.now().isoformat(),
            "documents": list(texts.keys()),
            "income_requirements": [],
            "credit_requirements": [],
            "property_requirements": [],
            "debt_to_income_ratios": [],
            "eligibility_requirements": [],
            "full_text": combined_text
        }
        
        # Extract key sections using regex patterns
        income_patterns = [
            r"(?i)(income\s+calculation|qualifying\s+income|employment\s+income)",
            r"(?i)(self-employed\s+income|business\s+income)",
            r"(?i)(rental\s+income|residual\s+income)",
            r"(?i)(overtime|bonus|commission)",
        ]
        
        credit_patterns = [
            r"(?i)(credit\s+score|credit\s+requirements|credit\s+standards)",
            r"(?i)(credit\s+history|credit\s+report|credit\s+analysis)",
            r"(?i)(bankruptcy|foreclosure)",
        ]
        
        dti_patterns = [
            r"(?i)(debt.to.income|dti\s+ratio|residual\s+income)",
            r"(?i)(income\s+ratio|housing\s+ratio)",
        ]
        
        eligibility_patterns = [
            r"(?i)(veteran\s+eligibility|entitlement|certificate\s+of\s+eligibility)",
            r"(?i)(service\s+requirements|discharge\s+requirements)",
        ]
        
        # Extract income requirements
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
        
        # Extract credit requirements
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
        
        # Extract DTI requirements
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
        
        # Extract eligibility requirements
        for pattern in eligibility_patterns:
            matches = re.finditer(pattern, combined_text)
            for match in matches:
                start = max(0, match.start() - 500)
                end = min(len(combined_text), match.end() + 500)
                context = combined_text[start:end].strip()
                guidelines["eligibility_requirements"].append({
                    "keyword": match.group(),
                    "context": context
                })
        
        print(f"Found {len(guidelines['income_requirements'])} income requirement sections")
        print(f"Found {len(guidelines['credit_requirements'])} credit requirement sections")
        print(f"Found {len(guidelines['debt_to_income_ratios'])} DTI requirement sections")
        print(f"Found {len(guidelines['eligibility_requirements'])} eligibility requirement sections")
        
        return guidelines
    
    def save_metadata(self, file_hashes):
        """Save metadata about the downloaded files"""
        metadata = {
            "last_checked": datetime.now().isoformat(),
            "file_hashes": file_hashes,
            "sources": self.sources
        }
        
        with open(self.metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Metadata saved to {self.metadata_file}")
    
    def scrape(self, force_update=False):
        """Main scraping function"""
        print("=" * 60)
        print("VA Guideline Scraper")
        print("=" * 60)
        
        # Check if we should use cached data
        if not force_update and self.json_file.exists():
            print("Using existing VA guidelines data.")
            with open(self.json_file, 'r') as f:
                return json.load(f)
        
        # Download all PDFs
        downloaded_files = {}
        file_hashes = {}
        
        for doc_name, url in self.sources.items():
            filename = f"va_{doc_name}.pdf"
            filepath = self.download_pdf(url, filename)
            
            if filepath:
                downloaded_files[doc_name] = filepath
                file_hashes[doc_name] = self.calculate_hash(filepath)
            else:
                print(f"Warning: Failed to download {doc_name}")
        
        if not downloaded_files:
            print("Failed to download any VA documents.")
            return None
        
        # Save metadata
        self.save_metadata(file_hashes)
        
        # Extract text from all PDFs
        texts = {}
        for doc_name, filepath in downloaded_files.items():
            text = self.extract_text_from_pdf(filepath)
            if text:
                texts[doc_name] = text
        
        if not texts:
            print("Failed to extract text from any VA documents.")
            return None
        
        # Parse guidelines
        guidelines = self.parse_guidelines(texts)
        
        # Save structured data
        with open(self.json_file, 'w', encoding='utf-8') as f:
            json.dump(guidelines, f, indent=2, ensure_ascii=False)
        
        print(f"Structured guidelines saved to {self.json_file}")
        print("=" * 60)
        print("VA scraping completed successfully!")
        print("=" * 60)
        
        return guidelines


if __name__ == "__main__":
    scraper = VAScraper()
    guidelines = scraper.scrape()
    
    if guidelines:
        print(f"\nSummary:")
        print(f"- Source: {guidelines['source']}")
        print(f"- Last Updated: {guidelines['last_updated']}")
        print(f"- Documents Processed: {len(guidelines['documents'])}")
        print(f"- Income Requirements Found: {len(guidelines['income_requirements'])}")
        print(f"- Credit Requirements Found: {len(guidelines['credit_requirements'])}")
        print(f"- DTI Requirements Found: {len(guidelines['debt_to_income_ratios'])}")
        print(f"- Eligibility Requirements Found: {len(guidelines['eligibility_requirements'])}")
