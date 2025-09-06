// Sports API endpoints for Yallakora data
// يحتوي على endpoints لعرض البيانات الرياضية

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class SportsAPI {
    constructor() {
        this.scraperPath = path.join(__dirname, 'yallakora_scraper_v2.py');
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 دقيقة
    }

    // دالة مساعدة لتشغيل Python scraper
    async runScraper(method, params = []) {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn('python3', [
                '-c',
                `
import sys
sys.path.append('${__dirname}')
from yallakora_scraper_v2 import YallakoraScraper
import json

scraper = YallakoraScraper()
method = '${method}'
params = ${JSON.stringify(params)}

try:
    if method == 'get_today_matches':
        result = scraper.get_today_matches()
    elif method == 'get_yesterday_matches':
        result = scraper.get_yesterday_matches()
    elif method == 'get_tomorrow_matches':
        result = scraper.get_tomorrow_matches()
    elif method == 'get_matches_by_date':
        result = scraper.get_matches_by_date(params[0] if params else None)
    elif method == 'get_live_matches':
        result = scraper.get_live_matches()
    elif method == 'get_news':
        result = scraper.get_news()
    elif method == 'search_team':
        result = scraper.search_team(params[0] if params else '')
    else:
        result = []
    
    print(json.dumps(result, ensure_ascii=False))
except Exception as e:
    print(json.dumps({'error': str(e)}, ensure_ascii=False))
                `
            ]);

            let output = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
                } else {
                    try {
                        const result = JSON.parse(output);
                        resolve(result);
                    } catch (parseError) {
                        reject(new Error(`Failed to parse JSON: ${parseError.message}`));
                    }
                }
            });
        });
    }

    // دالة للتحقق من الكاش
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    // دالة لحفظ البيانات في الكاش
    setCachedData(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    // API endpoints
    async getTodayMatches() {
        const cacheKey = 'today_matches';
        let cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const matches = await this.runScraper('get_today_matches');
            this.setCachedData(cacheKey, matches);
            return matches;
        } catch (error) {
            console.error('خطأ في جلب مباريات اليوم:', error);
            return [];
        }
    }

    async getYesterdayMatches() {
        const cacheKey = 'yesterday_matches';
        let cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const matches = await this.runScraper('get_yesterday_matches');
            this.setCachedData(cacheKey, matches);
            return matches;
        } catch (error) {
            console.error('خطأ في جلب مباريات الأمس:', error);
            return [];
        }
    }

    async getTomorrowMatches() {
        const cacheKey = 'tomorrow_matches';
        let cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const matches = await this.runScraper('get_tomorrow_matches');
            this.setCachedData(cacheKey, matches);
            return matches;
        } catch (error) {
            console.error('خطأ في جلب مباريات الغد:', error);
            return [];
        }
    }

    async getMatchesByDate(date) {
        const cacheKey = `matches_${date}`;
        let cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const matches = await this.runScraper('get_matches_by_date', [date]);
            this.setCachedData(cacheKey, matches);
            return matches;
        } catch (error) {
            console.error(`خطأ في جلب مباريات ${date}:`, error);
            return [];
        }
    }

    async getLiveMatches() {
        const cacheKey = 'live_matches';
        let cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const matches = await this.runScraper('get_live_matches');
            this.setCachedData(cacheKey, matches);
            return matches;
        } catch (error) {
            console.error('خطأ في جلب المباريات المباشرة:', error);
            return [];
        }
    }

    async getSportsNews() {
        const cacheKey = 'sports_news';
        let cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const news = await this.runScraper('get_news');
            this.setCachedData(cacheKey, news);
            return news;
        } catch (error) {
            console.error('خطأ في جلب الأخبار الرياضية:', error);
            return [];
        }
    }

    async searchTeam(teamName) {
        const cacheKey = `team_${teamName}`;
        let cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const teamData = await this.runScraper('search_team', [teamName]);
            this.setCachedData(cacheKey, teamData);
            return teamData;
        } catch (error) {
            console.error(`خطأ في البحث عن الفريق ${teamName}:`, error);
            return { team_name: teamName, matches: [], total_matches: 0 };
        }
    }
}

// تصدير الكلاس
module.exports = SportsAPI;

