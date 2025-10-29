#!/usr/bin/env python3
"""
Master Scraper Script
Runs all mortgage guideline scrapers and combines data
"""

import sys
import json
from datetime import datetime
from pathlib import Path

# Import all scrapers
from fha_scraper import FHAScraper
from va_scraper import VAScraper
from usda_scraper import USDAScraper
from fannie_mae_scraper import FannieMaeScraper
from freddie_mac_scraper import FreddieMacScraper


def run_all_scrapers(force_update=False):
    """Run all scrapers and combine results"""
    print("\n" + "=" * 80)
    print("MORTGAGE AI 360 - GUIDELINE SCRAPER SUITE")
    print("Powered by The Lawson Group")
    print("=" * 80 + "\n")
    
    results = {}
    errors = []
    
    # Run FHA Scraper
    print("\n[1/5] Running FHA Scraper...")
    try:
        fha_scraper = FHAScraper()
        fha_data = fha_scraper.scrape(force_update=force_update)
        if fha_data:
            results['fha'] = fha_data
            print("✓ FHA scraping completed successfully")
        else:
            errors.append("FHA scraping failed")
            print("✗ FHA scraping failed")
    except Exception as e:
        errors.append(f"FHA scraper error: {str(e)}")
        print(f"✗ FHA scraper error: {e}")
    
    # Run VA Scraper
    print("\n[2/5] Running VA Scraper...")
    try:
        va_scraper = VAScraper()
        va_data = va_scraper.scrape(force_update=force_update)
        if va_data:
            results['va'] = va_data
            print("✓ VA scraping completed successfully")
        else:
            errors.append("VA scraping failed")
            print("✗ VA scraping failed")
    except Exception as e:
        errors.append(f"VA scraper error: {str(e)}")
        print(f"✗ VA scraper error: {e}")
    
    # Run USDA Scraper
    print("\n[3/5] Running USDA Scraper...")
    try:
        usda_scraper = USDAScraper()
        usda_data = usda_scraper.scrape(force_update=force_update)
        if usda_data:
            results['usda'] = usda_data
            print("✓ USDA scraping completed successfully")
        else:
            errors.append("USDA scraping failed")
            print("✗ USDA scraping failed")
    except Exception as e:
        errors.append(f"USDA scraper error: {str(e)}")
        print(f"✗ USDA scraper error: {e}")
    
    # Run Fannie Mae Scraper
    print("\n[4/5] Running Fannie Mae Scraper...")
    try:
        fannie_scraper = FannieMaeScraper()
        fannie_data = fannie_scraper.scrape(force_update=force_update)
        if fannie_data:
            results['fannie_mae'] = fannie_data
            print("✓ Fannie Mae scraping completed successfully")
        else:
            errors.append("Fannie Mae scraping failed")
            print("✗ Fannie Mae scraping failed")
    except Exception as e:
        errors.append(f"Fannie Mae scraper error: {str(e)}")
        print(f"✗ Fannie Mae scraper error: {e}")
    
    # Run Freddie Mac Scraper
    print("\n[5/5] Running Freddie Mac Scraper...")
    try:
        freddie_scraper = FreddieMacScraper()
        freddie_data = freddie_scraper.scrape(force_update=force_update)
        if freddie_data:
            results['freddie_mac'] = freddie_data
            print("✓ Freddie Mac scraping completed successfully")
        else:
            errors.append("Freddie Mac scraping failed")
            print("✗ Freddie Mac scraping failed")
    except Exception as e:
        errors.append(f"Freddie Mac scraper error: {str(e)}")
        print(f"✗ Freddie Mac scraper error: {e}")
    
    # Create combined dataset
    print("\n" + "=" * 80)
    print("Creating Combined Guideline Dataset...")
    print("=" * 80)
    
    combined_data = {
        "metadata": {
            "created_at": datetime.now().isoformat(),
            "version": "1.0",
            "sources": list(results.keys()),
            "total_sources": len(results),
            "errors": errors
        },
        "guidelines": results
    }
    
    # Save combined data
    combined_file = Path("../guidelines/combined_guidelines.json")
    with open(combined_file, 'w', encoding='utf-8') as f:
        json.dump(combined_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Combined guidelines saved to {combined_file}")
    
    # Create summary
    print("\n" + "=" * 80)
    print("SCRAPING SUMMARY")
    print("=" * 80)
    print(f"Total Sources Scraped: {len(results)}/5")
    print(f"Successful: {len(results)}")
    print(f"Failed: {len(errors)}")
    
    if results:
        print("\nData Summary:")
        for source, data in results.items():
            print(f"\n{source.upper()}:")
            print(f"  - Source: {data.get('source', 'N/A')}")
            print(f"  - Last Updated: {data.get('last_updated', 'N/A')}")
            
            # Count requirements
            income_count = len(data.get('income_requirements', []))
            credit_count = len(data.get('credit_requirements', []))
            dti_count = len(data.get('debt_to_income_ratios', []))
            
            print(f"  - Income Requirements: {income_count}")
            print(f"  - Credit Requirements: {credit_count}")
            print(f"  - DTI Requirements: {dti_count}")
    
    if errors:
        print("\nErrors:")
        for error in errors:
            print(f"  - {error}")
    
    print("\n" + "=" * 80)
    print("Scraping process completed!")
    print("=" * 80 + "\n")
    
    return combined_data


if __name__ == "__main__":
    force_update = "--force" in sys.argv
    
    if force_update:
        print("Force update mode enabled - will re-download all guidelines")
    
    combined_data = run_all_scrapers(force_update=force_update)
    
    # Exit with appropriate code
    if combined_data['metadata']['errors']:
        sys.exit(1)
    else:
        sys.exit(0)
