#!/usr/bin/env python3
"""
FHA Guideline Scraper
Downloads and parses HUD Handbook 4000.1 - FHA Single Family Housing Policy Handbook
"""

import requests
import json
import hashlib
import os
from datetime import datetime
from pathlib import Path
import PyPDF2
import re

class FHAScraper:
    def __init__(self, data_dir="../guidelines"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        self.sources = {
            "primary": "https://www.hud.gov/sites/dfiles/OCHCO/documents/4000.1hsghhdbk103123.pdf",
            "backup": "https://www.huduser.gov/portal/sites/default/files/pdf/Federal-Housing-Administration-Underwriting-Manual.pdf"
        }
        
        self.metadata_file = self.data_dir / "fha_metadata.json"
        self.pdf_file = self.data_dir / "fha_handbook_4000.1.pdf"
        self.text_file = self.data_dir / "fha_handbook_4000.1.txt"
        self.json_file = self.data_dir / "fha_guidelines.json"
    
    def download_pdf(self, url):
        """Download PDF from URL"""
        print(f"Downloading FHA Handbook from {url}...")
        try:
            response = requests.get(url, timeout=60, stream=True)
            response.raise_for_status()
            
            # Save PDF
            with open(self.pdf_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"Downloaded successfully to {self.pdf_file}")
            return True
        except Exception as e:
            print(f"Error downloading from {url}: {e}")
            return False
    
    def calculate_hash(self, filepath):
        """Calculate SHA256 hash of file"""
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def extract_text_from_pdf(self):
        """Extract text content from PDF"""
        print("Extracting text from PDF...")
        try:
            text_content = []
            
            with open(self.pdf_file, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                total_pages = len(pdf_reader.pages)
                
                print(f"Total pages: {total_pages}")
                
                for page_num in range(total_pages):
                    page = pdf_reader.pages[page_num]
                    text = page.extract_text()
                    text_content.append(f"\n--- PAGE {page_num + 1} ---\n{text}")
                    
                    if (page_num + 1) % 100 == 0:
                        print(f"Processed {page_num + 1}/{total_pages} pages...")
            
            full_text = "\n".join(text_content)
            
            # Save extracted text
            with open(self.text_file, 'w', encoding='utf-8') as f:
                f.write(full_text)
            
            print(f"Text extracted and saved to {self.text_file}")
            return full_text
        
        except Exception as e:
            print(f"Error extracting text: {e}")
            return None
    
    def parse_guidelines(self, text):
        """Parse guidelines into structured format"""
        print("Parsing guidelines into structured format...")
        
        guidelines = {
            "source": "FHA - HUD Handbook 4000.1",
            "last_updated": datetime.now().isoformat(),
            "sections": [],
            "income_requirements": [],
            "credit_requirements": [],
            "property_requirements": [],
            "debt_to_income_ratios": [],
            "full_text": text
        }
        
        # Extract key sections using regex patterns
        # Income-related sections
        income_patterns = [
            r"(?i)(income\s+calculation|qualifying\s+income|employment\s+income)",
            r"(?i)(self-employed\s+income|business\s+income)",
            r"(?i)(rental\s+income|investment\s+income)",
            r"(?i)(overtime|bonus|commission)",
        ]
        
        # Credit-related sections
        credit_patterns = [
            r"(?i)(credit\s+score|credit\s+requirements|minimum\s+credit)",
            r"(?i)(credit\s+history|credit\s+report)",
            r"(?i)(bankruptcy|foreclosure|short\s+sale)",
        ]
        
        # DTI patterns
        dti_patterns = [
            r"(?i)(debt.to.income|dti\s+ratio|housing\s+ratio)",
            r"(?i)(front.end\s+ratio|back.end\s+ratio)",
        ]
        
        # Extract income requirements
        for pattern in income_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                start = max(0, match.start() - 500)
                end = min(len(text), match.end() + 500)
                context = text[start:end].strip()
                guidelines["income_requirements"].append({
                    "keyword": match.group(),
                    "context": context
                })
        
        # Extract credit requirements
        for pattern in credit_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                start = max(0, match.start() - 500)
                end = min(len(text), match.end() + 500)
                context = text[start:end].strip()
                guidelines["credit_requirements"].append({
                    "keyword": match.group(),
                    "context": context
                })
        
        # Extract DTI requirements
        for pattern in dti_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                start = max(0, match.start() - 500)
                end = min(len(text), match.end() + 500)
                context = text[start:end].strip()
                guidelines["debt_to_income_ratios"].append({
                    "keyword": match.group(),
                    "context": context
                })
        
        print(f"Found {len(guidelines['income_requirements'])} income requirement sections")
        print(f"Found {len(guidelines['credit_requirements'])} credit requirement sections")
        print(f"Found {len(guidelines['debt_to_income_ratios'])} DTI requirement sections")
        
        return guidelines
    
    def save_metadata(self, file_hash):
        """Save metadata about the downloaded file"""
        metadata = {
            "last_checked": datetime.now().isoformat(),
            "file_hash": file_hash,
            "source_url": self.sources["primary"],
            "file_size": os.path.getsize(self.pdf_file),
            "version": "4000.1"
        }
        
        with open(self.metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Metadata saved to {self.metadata_file}")
    
    def check_for_updates(self):
        """Check if the guideline has been updated"""
        if not self.metadata_file.exists():
            return True  # No previous version, need to download
        
        with open(self.metadata_file, 'r') as f:
            old_metadata = json.load(f)
        
        # Try to download and compare hash
        temp_file = self.data_dir / "temp_fha.pdf"
        try:
            response = requests.get(self.sources["primary"], timeout=60, stream=True)
            response.raise_for_status()
            
            with open(temp_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            new_hash = self.calculate_hash(temp_file)
            old_hash = old_metadata.get("file_hash", "")
            
            if new_hash != old_hash:
                print("New version detected!")
                os.replace(temp_file, self.pdf_file)
                return True
            else:
                print("No updates found. Using cached version.")
                temp_file.unlink()
                return False
        
        except Exception as e:
            print(f"Error checking for updates: {e}")
            if temp_file.exists():
                temp_file.unlink()
            return False
    
    def scrape(self, force_update=False):
        """Main scraping function"""
        print("=" * 60)
        print("FHA Guideline Scraper")
        print("=" * 60)
        
        # Check if update is needed
        if not force_update and self.pdf_file.exists():
            needs_update = self.check_for_updates()
            if not needs_update:
                print("Using existing FHA guidelines data.")
                if self.json_file.exists():
                    with open(self.json_file, 'r') as f:
                        return json.load(f)
        
        # Download PDF
        success = self.download_pdf(self.sources["primary"])
        if not success:
            print("Trying backup URL...")
            success = self.download_pdf(self.sources["backup"])
            if not success:
                print("Failed to download FHA Handbook from all sources.")
                return None
        
        # Calculate hash
        file_hash = self.calculate_hash(self.pdf_file)
        self.save_metadata(file_hash)
        
        # Extract text
        text = self.extract_text_from_pdf()
        if not text:
            return None
        
        # Parse guidelines
        guidelines = self.parse_guidelines(text)
        
        # Save structured data
        with open(self.json_file, 'w', encoding='utf-8') as f:
            json.dump(guidelines, f, indent=2, ensure_ascii=False)
        
        print(f"Structured guidelines saved to {self.json_file}")
        print("=" * 60)
        print("FHA scraping completed successfully!")
        print("=" * 60)
        
        return guidelines


if __name__ == "__main__":
    scraper = FHAScraper()
    guidelines = scraper.scrape()
    
    if guidelines:
        print(f"\nSummary:")
        print(f"- Source: {guidelines['source']}")
        print(f"- Last Updated: {guidelines['last_updated']}")
        print(f"- Income Requirements Found: {len(guidelines['income_requirements'])}")
        print(f"- Credit Requirements Found: {len(guidelines['credit_requirements'])}")
        print(f"- DTI Requirements Found: {len(guidelines['debt_to_income_ratios'])}")
