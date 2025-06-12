#!/usr/bin/env python3
"""
生成游戏数据的JavaScript文件
这样可以避免在file://协议下的CORS问题
"""

import csv
import json
import os

def generate_js_data():
    """从CSV生成JavaScript数据文件"""
    
    # 读取CSV文件
    games_data = []
    
    try:
        with open('game.csv', 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                # 处理分类
                categories = row.get('categories', 'casual').strip()
                categories_array = [cat.strip() for cat in categories.split('|')] if categories else ['casual']
                
                # 生成游戏URL
                game_url = f"games/{categories_array[0]}/{row['slug']}.html"
                
                game_data = {
                    'name': row['name'].strip(),
                    'slug': row['slug'].strip(),
                    'image_url': row['image_url'].strip(),
                    'embed_url': row['embed_url'].strip(),
                    'categories': categories,
                    'categoriesArray': categories_array,
                    'gameUrl': game_url
                }
                
                games_data.append(game_data)
    
    except FileNotFoundError:
        print("错误：找不到game.csv文件")
        return
    except Exception as e:
        print(f"读取CSV文件时出错：{e}")
        return
    
    # 生成JavaScript文件内容
    js_content = '''// 游戏数据 - 直接嵌入JavaScript，避免CORS问题
// 此文件由generate-js-data.py自动生成，请勿手动编辑

const GAMES_DATA = '''
    
    # 添加JSON数据
    js_content += json.dumps(games_data, ensure_ascii=False, indent=4)
    
    js_content += ''';

// 导出数据供main app使用
window.GAMES_DATA = GAMES_DATA;

// 统计信息
console.log(`已加载 ${GAMES_DATA.length} 个游戏`);

// 分类统计
const categoryCounts = {};
GAMES_DATA.forEach(game => {
    game.categoriesArray.forEach(category => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
});
console.log('分类统计:', categoryCounts);
'''
    
    # 确保js目录存在
    os.makedirs('js', exist_ok=True)
    
    # 写入JavaScript文件
    try:
        with open('js/games-data.js', 'w', encoding='utf-8') as jsfile:
            jsfile.write(js_content)
        
        print(f"✅ 成功生成 js/games-data.js")
        print(f"📊 包含 {len(games_data)} 个游戏")
        
        # 显示分类统计
        category_counts = {}
        for game in games_data:
            for category in game['categoriesArray']:
                category_counts[category] = category_counts.get(category, 0) + 1
        
        print("📈 分类统计:")
        for category, count in sorted(category_counts.items()):
            print(f"   {category}: {count} 个游戏")
            
    except Exception as e:
        print(f"写入JavaScript文件时出错：{e}")

if __name__ == "__main__":
    generate_js_data() 