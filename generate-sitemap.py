#!/usr/bin/env python3
"""
Sitemap Generator for FunnyGames
Generates XML sitemap for better SEO
"""

import csv
import os
from datetime import datetime
from xml.sax.saxutils import escape

def read_games_data():
    """Read games data from CSV"""
    games = []
    try:
        with open('game.csv', 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                cleaned_row = {}
                for key, value in row.items():
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    cleaned_row[key.strip()] = value.strip()
                games.append(cleaned_row)
    except Exception as e:
        print(f"Error reading games data: {e}")
    return games

def generate_sitemap(base_url="https://funnygames.com"):
    """Generate XML sitemap"""
    
    # Read games data
    games = read_games_data()
    
    # Current timestamp
    current_time = datetime.now().strftime('%Y-%m-%d')
    
    # Start XML
    sitemap_content = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '',
        '  <!-- Homepage -->',
        '  <url>',
        f'    <loc>{base_url}/</loc>',
        f'    <lastmod>{current_time}</lastmod>',
        '    <changefreq>daily</changefreq>',
        '    <priority>1.0</priority>',
        '  </url>',
        ''
    ]
    
    # Add category pages
    categories = set()
    for game in games:
        if 'categories' in game and game['categories']:
            for cat in game['categories'].split('|'):
                categories.add(cat.strip())
    
    for category in sorted(categories):
        sitemap_content.extend([
            '  <!-- Category Page -->',
            '  <url>',
            f'    <loc>{base_url}/games/{category}/</loc>',
            f'    <lastmod>{current_time}</lastmod>',
            '    <changefreq>weekly</changefreq>',
            '    <priority>0.8</priority>',
            '  </url>',
            ''
        ])
    
    # Add game pages
    for game in games:
        if 'name' in game and 'slug' in game and 'categories' in game:
            primary_category = game['categories'].split('|')[0].strip() if game['categories'] else 'casual'
            game_url = f"{base_url}/games/{primary_category}/{game['slug']}.html"
            
            # Escape special characters
            game_url = escape(game_url)
            
            sitemap_content.extend([
                '  <!-- Game Page -->',
                '  <url>',
                f'    <loc>{game_url}</loc>',
                f'    <lastmod>{current_time}</lastmod>',
                '    <changefreq>monthly</changefreq>',
                '    <priority>0.6</priority>',
                '  </url>',
                ''
            ])
    
    # Close XML
    sitemap_content.extend([
        '</urlset>'
    ])
    
    # Write sitemap
    with open('sitemap.xml', 'w', encoding='utf-8') as f:
        f.write('\n'.join(sitemap_content))
    
    print(f"✅ Generated sitemap.xml with {len(games)} game pages")
    print(f"📊 Included {len(categories)} category pages")
    print(f"🌐 Base URL: {base_url}")

def generate_robots_txt(base_url="https://funnygames.com"):
    """Generate robots.txt file"""
    robots_content = f"""User-agent: *
Allow: /

# Sitemap
Sitemap: {base_url}/sitemap.xml

# Popular pages
Allow: /games/
Allow: /games/action/
Allow: /games/puzzle/
Allow: /games/adventure/
Allow: /games/casual/
Allow: /games/driving/
Allow: /games/sports/

# Block if needed (uncomment if you have admin areas)
# Disallow: /admin/
# Disallow: /private/

# Crawl delay (optional, for respectful crawling)
Crawl-delay: 1
"""
    
    with open('robots.txt', 'w', encoding='utf-8') as f:
        f.write(robots_content)
    
    print("✅ Generated robots.txt")

if __name__ == "__main__":
    print("🗺️  SEO Files Generator")
    print("=" * 40)
    
    # You can change the base URL here
    BASE_URL = "https://funnygames.com"
    
    generate_sitemap(BASE_URL)
    generate_robots_txt(BASE_URL)
    
    print("\n🚀 SEO files ready for deployment!")
    print("📁 Files created:")
    print("   - sitemap.xml")
    print("   - robots.txt")
    print("\n💡 Don't forget to:")
    print("   1. Update the base URL in this script")
    print("   2. Submit sitemap to Google Search Console")
    print("   3. Verify robots.txt is accessible") 