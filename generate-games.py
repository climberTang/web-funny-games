#!/usr/bin/env python3
"""
Game Page Generator Script
Automatically generates game HTML pages from CSV data using templates.
"""

import csv
import os
import re
from datetime import datetime
from pathlib import Path
import random

def clean_filename(filename):
    """Clean filename to be URL-friendly"""
    # Remove special characters and replace spaces with hyphens
    filename = re.sub(r'[^\w\s-]', '', filename.lower())
    filename = re.sub(r'[-\s]+', '-', filename)
    return filename.strip('-')

def parse_embed_url(embed_html):
    """Extract iframe from embed HTML"""
    if not embed_html or embed_html.strip() == '':
        return '<div class="game-frame bg-gray-200 flex items-center justify-center"><p class="text-gray-500">Game not available</p></div>'
    
    # Clean up the embed HTML and add game-frame class
    embed_html = embed_html.replace('style="width: 100%; height: 100%;"', 'class="game-frame"')
    embed_html = embed_html.replace('<iframe', '<iframe class="game-frame"')
    
    return embed_html

def generate_categories_html(categories):
    """Generate category badges HTML"""
    if not categories:
        return '<span class="px-2 py-1 text-xs bg-apple-gray-light text-apple-gray rounded-md">casual</span>'
    
    category_list = categories.split('|')
    badges = []
    
    colors = [
        'bg-apple-blue text-white',
        'bg-apple-green text-white', 
        'bg-apple-orange text-white',
        'bg-apple-purple text-white',
        'bg-apple-pink text-white'
    ]
    
    for i, category in enumerate(category_list):
        color = colors[i % len(colors)]
        badges.append(f'<span class="px-2 py-1 text-xs {color} rounded-md">{category.strip()}</span>')
    
    return ' '.join(badges)

def generate_description_section(description):
    """Generate description section HTML"""
    if not description or description.strip() == '':
        return ''
    
    return f'''
        <div class="bg-white rounded-xl p-6 shadow-lg mb-6">
            <h2 class="text-xl font-semibold text-apple-gray-dark mb-4">About This Game</h2>
            <p class="text-apple-gray leading-relaxed">{description}</p>
        </div>
    '''

def generate_controls_section(controls):
    """Generate controls section HTML"""
    if not controls or controls.strip() == '':
        return ''
    
    return f'''
        <div class="bg-white rounded-xl p-6 shadow-lg mb-6">
            <h2 class="text-xl font-semibold text-apple-gray-dark mb-4">How to Play</h2>
            <div class="text-apple-gray leading-relaxed">
                {controls}
            </div>
        </div>
    '''

def generate_tips_section(tips):
    """Generate tips section HTML"""
    if not tips or tips.strip() == '':
        return ''
    
    return f'''
        <div class="bg-white rounded-xl p-6 shadow-lg mb-6">
            <h2 class="text-xl font-semibold text-apple-gray-dark mb-4">Tips & Strategies</h2>
            <div class="text-apple-gray leading-relaxed">
                {tips}
            </div>
        </div>
    '''

def generate_game_page(game_data, template_content, base_url="https://funnygames.com"):
    """Generate a complete game page from template and data"""
    
    # Extract data
    name = game_data.get('name', 'Untitled Game')
    slug = game_data.get('slug', clean_filename(name))
    image_url = game_data.get('image_url', '/images/placeholder-game.jpg')
    embed_url = game_data.get('embed_url', '')
    categories = game_data.get('categories', 'casual')
    
    # Get primary category for URL structure
    primary_category = categories.split('|')[0].strip() if categories else 'casual'
    
    # Generate URLs
    game_url = f"{base_url}/games/{primary_category}/{slug}.html"
    
    # Generate sections
    categories_html = generate_categories_html(categories)
    description_section = generate_description_section(game_data.get('description', f'Enjoy playing {name}, a fun {primary_category} game!'))
    controls_section = generate_controls_section(game_data.get('controls', ''))
    tips_section = generate_tips_section(game_data.get('tips', ''))
    
    # Parse embed
    embed_html = parse_embed_url(embed_url)
    
    # Generate random play count
    play_count = random.randint(1000, 50000)
    
    # Current date
    current_date = datetime.now().strftime("%B %d, %Y")
    
    # Replace template variables
    replacements = {
        '{{GAME_NAME}}': name,
        '{{GAME_SLUG}}': slug,
        '{{GAME_DESCRIPTION}}': game_data.get('description', f'Enjoy playing {name}, a fun {primary_category} game!'),
        '{{GAME_CATEGORY}}': primary_category,
        '{{GAME_CATEGORIES}}': categories_html,
        '{{GAME_URL}}': game_url,
        '{{GAME_IMAGE}}': image_url,
        '{{GAME_EMBED}}': embed_html,
        '{{GAME_DESCRIPTION_SECTION}}': description_section,
        '{{GAME_CONTROLS_SECTION}}': controls_section,
        '{{GAME_TIPS_SECTION}}': tips_section,
        '{{PLAY_COUNT}}': f"{play_count:,}",
        '{{GAME_DATE}}': current_date
    }
    
    # Apply replacements
    content = template_content
    for placeholder, value in replacements.items():
        content = content.replace(placeholder, value)
    
    return content, primary_category, slug

def read_csv_data(csv_file):
    """Read game data from CSV file"""
    games = []
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Clean up the data
                cleaned_row = {}
                for key, value in row.items():
                    # Remove quotes from values
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    cleaned_row[key.strip()] = value.strip()
                
                games.append(cleaned_row)
    
    except FileNotFoundError:
        print(f"Error: CSV file '{csv_file}' not found.")
        return []
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return []
    
    return games

def create_directories(games):
    """Create necessary directories for games"""
    categories = set()
    
    for game in games:
        if 'categories' in game:
            primary_category = game['categories'].split('|')[0].strip()
        else:
            primary_category = 'casual'
        categories.add(primary_category)
    
    # Create directories
    for category in categories:
        os.makedirs(f'games/{category}', exist_ok=True)
        print(f"Created directory: games/{category}")

def generate_all_games():
    """Main function to generate all game pages"""
    print("🎮 FunnyGames Page Generator")
    print("=" * 50)
    
    # Read template
    try:
        with open('game-template.html', 'r', encoding='utf-8') as f:
            template_content = f.read()
    except FileNotFoundError:
        print("❌ Error: game-template.html not found!")
        return
    
    # Read CSV data
    games = read_csv_data('game.csv')
    if not games:
        print("❌ No games data found!")
        return
    
    print(f"📊 Found {len(games)} games in CSV")
    
    # Create directories
    create_directories(games)
    
    # Generate pages
    generated_count = 0
    errors = []
    
    for game in games:
        try:
            content, category, slug = generate_game_page(game, template_content)
            
            # Create file path
            file_path = f'games/{category}/{slug}.html'
            
            # Write file
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            generated_count += 1
            print(f"✅ Generated: {file_path}")
            
        except Exception as e:
            error_msg = f"Error generating page for '{game.get('name', 'Unknown')}': {e}"
            errors.append(error_msg)
            print(f"❌ {error_msg}")
    
    # Summary
    print("\n" + "=" * 50)
    print(f"🎉 Generation Complete!")
    print(f"✅ Successfully generated: {generated_count} pages")
    
    if errors:
        print(f"❌ Errors: {len(errors)}")
        for error in errors:
            print(f"   - {error}")
    
    print("\n📁 Generated files are in the 'games/' directory")
    print("🚀 Your game site is ready to launch!")

if __name__ == "__main__":
    generate_all_games() 