#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Yallakora Web Scraper V2
محسن لاستخراج البيانات الفعلية من موقع يلا كورة
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

# إعداد نظام السجلات
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class YallakoraScraper:
    def __init__(self):
        self.base_url = "https://www.yallakora.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def get_page(self, url: str) -> Optional[BeautifulSoup]:
        """جلب صفحة ويب وتحويلها إلى BeautifulSoup object"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            logger.error(f"خطأ في جلب الصفحة {url}: {e}")
            return None
    
    def get_matches_by_date(self, date: str = None) -> List[Dict]:
        """
        جلب المباريات حسب التاريخ
        date: التاريخ بصيغة YYYY-MM-DD (اختياري، افتراضي اليوم)
        """
        if not date:
            date = datetime.now().strftime("%m/%d/%Y")
        else:
            # تحويل التاريخ من YYYY-MM-DD إلى MM/DD/YYYY
            date_obj = datetime.strptime(date, "%Y-%m-%d")
            date = date_obj.strftime("%m/%d/%Y")
        
        url = f"{self.base_url}/match-center?date={date}"
        logger.info(f"جلب المباريات لتاريخ: {date}")
        
        soup = self.get_page(url)
        if not soup:
            return []
        
        matches = []
        
        # البحث عن المباريات باستخدام الهيكل الفعلي للموقع
        # البحث عن جميع البطولات في الصفحة
        tournament_sections = soup.find_all('div', class_='matchesContainer')
        
        for section in tournament_sections:
            try:
                # جلب اسم البطولة
                tournament_name = ""
                tournament_header = section.find_previous('h2') or section.find_previous('h3')
                if tournament_header:
                    tournament_name = tournament_header.get_text(strip=True)
                
                # البحث عن المباريات في هذه البطولة
                match_items = section.find_all('div', class_='item')
                
                for item in match_items:
                    match_data = self.extract_match_from_item(item, tournament_name)
                    if match_data:
                        matches.append(match_data)
                        
            except Exception as e:
                logger.error(f"خطأ في معالجة قسم البطولة: {e}")
                continue
        
        # البحث البديل إذا لم نجد مباريات
        if not matches:
            matches = self.fallback_match_extraction(soup)
        
        logger.info(f"تم جلب {len(matches)} مباراة")
        return matches
    
    def extract_match_from_item(self, item, tournament_name: str = "") -> Optional[Dict]:
        """استخراج بيانات المباراة من عنصر item"""
        try:
            match_data = {
                'tournament': tournament_name,
                'scraped_at': datetime.now().isoformat()
            }
            
            # البحث عن أسماء الفرق
            team_elements = item.find_all('div', class_='teamName') or item.find_all('span', class_='team')
            if not team_elements:
                # بحث بديل عن أسماء الفرق
                team_elements = item.find_all(text=True)
                team_names = [t.strip() for t in team_elements if t.strip() and len(t.strip()) > 2]
                if len(team_names) >= 2:
                    match_data['home_team'] = team_names[0]
                    match_data['away_team'] = team_names[1]
            else:
                if len(team_elements) >= 2:
                    match_data['home_team'] = team_elements[0].get_text(strip=True)
                    match_data['away_team'] = team_elements[1].get_text(strip=True)
            
            # البحث عن النتيجة
            score_elements = item.find_all('span', class_='score') or item.find_all('div', class_='score')
            if score_elements and len(score_elements) >= 2:
                match_data['home_score'] = score_elements[0].get_text(strip=True)
                match_data['away_score'] = score_elements[1].get_text(strip=True)
            else:
                # بحث بديل عن النتيجة
                score_pattern = re.search(r'(\d+)\s*-\s*(\d+)', item.get_text())
                if score_pattern:
                    match_data['home_score'] = score_pattern.group(1)
                    match_data['away_score'] = score_pattern.group(2)
            
            # البحث عن وقت المباراة
            time_element = item.find('span', class_='time') or item.find('div', class_='time')
            if time_element:
                match_data['match_time'] = time_element.get_text(strip=True)
            else:
                # بحث بديل عن الوقت
                time_pattern = re.search(r'(\d{1,2}:\d{2})', item.get_text())
                if time_pattern:
                    match_data['match_time'] = time_pattern.group(1)
            
            # البحث عن حالة المباراة
            status_indicators = ['انتهت', 'مباشر', 'لم تبدأ', 'مؤجلة', 'ملغية']
            item_text = item.get_text()
            for status in status_indicators:
                if status in item_text:
                    match_data['status'] = status
                    break
            
            # البحث عن رابط المباراة
            link_element = item.find('a')
            if link_element and link_element.get('href'):
                href = link_element.get('href')
                if href.startswith('http'):
                    match_data['match_url'] = href
                else:
                    match_data['match_url'] = self.base_url + href
            
            # التأكد من وجود بيانات أساسية
            if 'home_team' in match_data and 'away_team' in match_data:
                return match_data
            
            return None
            
        except Exception as e:
            logger.error(f"خطأ في استخراج بيانات المباراة: {e}")
            return None
    
    def fallback_match_extraction(self, soup) -> List[Dict]:
        """استخراج المباريات بطريقة بديلة"""
        matches = []
        
        try:
            # البحث عن جميع الروابط التي تحتوي على كلمة "مباراة" أو أرقام النتائج
            all_links = soup.find_all('a')
            
            for link in all_links:
                link_text = link.get_text(strip=True)
                
                # البحث عن نمط يشبه أسماء الفرق والنتائج
                if any(keyword in link_text for keyword in ['vs', 'ضد', '-']) and len(link_text) > 10:
                    match_data = {
                        'raw_text': link_text,
                        'match_url': self.base_url + link.get('href', ''),
                        'scraped_at': datetime.now().isoformat()
                    }
                    
                    # محاولة استخراج أسماء الفرق
                    parts = re.split(r'\s+(?:vs|ضد|-)\s+', link_text, flags=re.IGNORECASE)
                    if len(parts) >= 2:
                        match_data['home_team'] = parts[0].strip()
                        match_data['away_team'] = parts[1].strip()
                        matches.append(match_data)
            
        except Exception as e:
            logger.error(f"خطأ في الاستخراج البديل: {e}")
        
        return matches
    
    def get_live_matches(self) -> List[Dict]:
        """جلب المباريات المباشرة"""
        url = f"{self.base_url}/match-center"
        logger.info("جلب المباريات المباشرة")
        
        soup = self.get_page(url)
        if not soup:
            return []
        
        live_matches = []
        
        # البحث عن المباريات المباشرة
        live_indicators = soup.find_all(text=re.compile(r'مباشر|LIVE|live', re.IGNORECASE))
        
        for indicator in live_indicators:
            try:
                # البحث عن العنصر الأب الذي يحتوي على بيانات المباراة
                parent = indicator.parent
                while parent and parent.name != 'body':
                    match_data = self.extract_match_from_item(parent)
                    if match_data:
                        match_data['is_live'] = True
                        match_data['status'] = 'مباشر'
                        live_matches.append(match_data)
                        break
                    parent = parent.parent
                    
            except Exception as e:
                logger.error(f"خطأ في استخراج المباراة المباشرة: {e}")
                continue
        
        logger.info(f"تم جلب {len(live_matches)} مباراة مباشرة")
        return live_matches
    
    def get_today_matches(self) -> List[Dict]:
        """جلب مباريات اليوم"""
        return self.get_matches_by_date(datetime.now().strftime("%Y-%m-%d"))
    
    def get_yesterday_matches(self) -> List[Dict]:
        """جلب مباريات الأمس"""
        yesterday = datetime.now() - timedelta(days=1)
        return self.get_matches_by_date(yesterday.strftime("%Y-%m-%d"))
    
    def get_tomorrow_matches(self) -> List[Dict]:
        """جلب مباريات الغد"""
        tomorrow = datetime.now() + timedelta(days=1)
        return self.get_matches_by_date(tomorrow.strftime("%Y-%m-%d"))
    
    def get_news(self) -> List[Dict]:
        """جلب الأخبار الرياضية"""
        url = f"{self.base_url}/news"
        logger.info("جلب الأخبار الرياضية")
        
        soup = self.get_page(url)
        if not soup:
            return []
        
        news_items = []
        
        # البحث عن الأخبار
        news_containers = soup.find_all('div', class_='newsItem') or soup.find_all('article')
        
        for container in news_containers:
            try:
                news_item = {}
                
                # عنوان الخبر
                title_element = container.find('h2') or container.find('h3') or container.find('a')
                if title_element:
                    news_item['title'] = title_element.get_text(strip=True)
                
                # رابط الخبر
                link_element = container.find('a')
                if link_element and link_element.get('href'):
                    href = link_element.get('href')
                    news_item['url'] = href if href.startswith('http') else self.base_url + href
                
                # صورة الخبر
                img_element = container.find('img')
                if img_element and img_element.get('src'):
                    news_item['image'] = img_element.get('src')
                
                # ملخص الخبر
                summary_element = container.find('p')
                if summary_element:
                    news_item['summary'] = summary_element.get_text(strip=True)
                
                # تاريخ النشر
                date_element = container.find('time') or container.find('span', class_='date')
                if date_element:
                    news_item['published_date'] = date_element.get_text(strip=True)
                
                if news_item and 'title' in news_item:
                    news_items.append(news_item)
                    
            except Exception as e:
                logger.error(f"خطأ في استخراج الخبر: {e}")
                continue
        
        logger.info(f"تم جلب {len(news_items)} خبر")
        return news_items
    
    def search_team(self, team_name: str) -> Dict:
        """البحث عن معلومات فريق"""
        logger.info(f"البحث عن الفريق: {team_name}")
        
        # البحث في مباريات عدة أيام
        team_matches = []
        for i in range(-7, 8):
            date = (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d")
            daily_matches = self.get_matches_by_date(date)
            
            for match in daily_matches:
                if (team_name.lower() in match.get('home_team', '').lower() or 
                    team_name.lower() in match.get('away_team', '').lower()):
                    match['date'] = date
                    team_matches.append(match)
        
        return {
            'team_name': team_name,
            'matches': team_matches,
            'total_matches': len(team_matches)
        }

def test_scraper_v2():
    """اختبار المكشطة المحسنة"""
    scraper = YallakoraScraper()
    
    print("=== اختبار جلب مباريات اليوم ===")
    today_matches = scraper.get_today_matches()
    print(f"تم جلب {len(today_matches)} مباراة لليوم")
    if today_matches:
        print("مثال على مباراة اليوم:")
        print(json.dumps(today_matches[0], ensure_ascii=False, indent=2))
    
    print("\n=== اختبار جلب مباريات الأمس ===")
    yesterday_matches = scraper.get_yesterday_matches()
    print(f"تم جلب {len(yesterday_matches)} مباراة للأمس")
    if yesterday_matches:
        print("مثال على مباراة الأمس:")
        print(json.dumps(yesterday_matches[0], ensure_ascii=False, indent=2))
    
    print("\n=== اختبار جلب الأخبار ===")
    news = scraper.get_news()
    print(f"تم جلب {len(news)} خبر")
    if news:
        print("مثال على خبر:")
        print(json.dumps(news[0], ensure_ascii=False, indent=2))
    
    print("\n=== اختبار البحث عن فريق ===")
    team_info = scraper.search_team("الأهلي")
    print(f"تم العثور على {team_info['total_matches']} مباراة للأهلي")

if __name__ == "__main__":
    test_scraper_v2()

