// Sports Page JavaScript
// يحتوي على جميع الوظائف الخاصة بصفحة الرياضة

class SportsPage {
    constructor() {
        this.apiBaseUrl = '/api/sports';
        this.loadingElement = document.getElementById('loading');
        this.init();
    }

    async init() {
        try {
            // تحميل البيانات الأساسية
            await this.loadSportsData();
            
            // إعداد البحث عن الفرق
            this.setupTeamSearch();
            
            // إعداد التحديث التلقائي للمباريات المباشرة
            this.setupAutoRefresh();
            
        } catch (error) {
            console.error('خطأ في تهيئة صفحة الرياضة:', error);
            this.showError('حدث خطأ في تحميل البيانات الرياضية');
        }
    }

    async loadSportsData() {
        try {
            this.showLoading(true);
            
            // تحميل الإحصائيات
            const stats = await this.fetchData('/stats');
            this.displayStats(stats);
            
            // تحميل البيانات المختلفة بشكل متوازي
            const [todayMatches, tomorrowMatches, liveMatches, sportsNews] = await Promise.all([
                this.fetchData('/matches/today'),
                this.fetchData('/matches/tomorrow'),
                this.fetchData('/matches/live'),
                this.fetchData('/news')
            ]);
            
            // عرض البيانات
            this.displayTodayMatches(todayMatches);
            this.displayTomorrowMatches(tomorrowMatches);
            this.displayLiveMatches(liveMatches);
            this.displaySportsNews(sportsNews);
            
            // إخفاء مؤشر التحميل
            this.showLoading(false);
            
        } catch (error) {
            console.error('خطأ في تحميل البيانات الرياضية:', error);
            this.showError('فشل في تحميل البيانات الرياضية');
            this.showLoading(false);
        }
    }

    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) {
            console.error(`خطأ في جلب البيانات من ${endpoint}:`, error);
            return [];
        }
    }

    displayStats(stats) {
        if (!stats) return;
        
        document.getElementById('today-matches-count').textContent = stats.today_matches_count || 0;
        document.getElementById('live-matches-count').textContent = stats.live_matches_count || 0;
        document.getElementById('tomorrow-matches-count').textContent = stats.tomorrow_matches_count || 0;
        document.getElementById('total-matches-count').textContent = stats.total_matches_count || 0;
        
        // إظهار قسم الإحصائيات
        document.getElementById('sports-stats').classList.remove('hidden');
    }

    displayTodayMatches(matches) {
        const container = document.getElementById('today-matches');
        const section = document.getElementById('today-matches-section');
        
        if (!matches || matches.length === 0) {
            container.innerHTML = '<div class="no-data-message">لا توجد مباريات اليوم</div>';
        } else {
            container.innerHTML = matches.map(match => this.createMatchCard(match)).join('');
        }
        
        // تحديث التاريخ
        document.getElementById('today-date').textContent = this.formatDate(new Date());
        
        section.classList.remove('hidden');
    }

    displayTomorrowMatches(matches) {
        const container = document.getElementById('tomorrow-matches');
        const section = document.getElementById('tomorrow-matches-section');
        
        if (!matches || matches.length === 0) {
            container.innerHTML = '<div class="no-data-message">لا توجد مباريات غداً</div>';
        } else {
            container.innerHTML = matches.map(match => this.createMatchCard(match)).join('');
        }
        
        // تحديث التاريخ
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('tomorrow-date').textContent = this.formatDate(tomorrow);
        
        section.classList.remove('hidden');
    }

    displayLiveMatches(matches) {
        const container = document.getElementById('live-matches');
        const section = document.getElementById('live-matches-section');
        
        if (!matches || matches.length === 0) {
            section.classList.add('hidden');
            return;
        }
        
        container.innerHTML = matches.map(match => this.createMatchCard(match, true)).join('');
        section.classList.remove('hidden');
    }

    displaySportsNews(news) {
        const container = document.getElementById('sports-news');
        const section = document.getElementById('sports-news-section');
        
        if (!news || news.length === 0) {
            container.innerHTML = '<div class="no-data-message">لا توجد أخبار رياضية متاحة</div>';
        } else {
            // عرض أول 6 أخبار فقط
            const limitedNews = news.slice(0, 6);
            container.innerHTML = limitedNews.map(newsItem => this.createNewsCard(newsItem)).join('');
        }
        
        section.classList.remove('hidden');
    }

    createMatchCard(match, isLive = false) {
        const liveClass = isLive ? 'live' : '';
        const statusClass = this.getStatusClass(match.status);
        
        return `
            <div class="match-card ${liveClass}">
                <div class="match-header">
                    <span class="tournament-name">${match.tournament || 'بطولة غير محددة'}</span>
                    <span class="match-status ${statusClass}">${match.status || 'غير محدد'}</span>
                </div>
                
                <div class="match-teams">
                    <div class="team">
                        <div class="team-logo">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="team-name">${match.home_team || 'فريق 1'}</div>
                    </div>
                    
                    <div class="match-score">
                        <span class="score">${match.home_score || '-'}</span>
                        <span class="vs">VS</span>
                        <span class="score">${match.away_score || '-'}</span>
                    </div>
                    
                    <div class="team">
                        <div class="team-logo">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="team-name">${match.away_team || 'فريق 2'}</div>
                    </div>
                </div>
                
                <div class="match-time">
                    ${match.match_time || 'وقت غير محدد'}
                </div>
            </div>
        `;
    }

    createNewsCard(newsItem) {
        return `
            <div class="news-card">
                <div class="news-image">
                    ${newsItem.image ? 
                        `<img src="${newsItem.image}" alt="${newsItem.title}" loading="lazy">` : 
                        '<i class="fas fa-newspaper"></i>'
                    }
                </div>
                <div class="news-content">
                    <h3 class="news-title">${newsItem.title || 'عنوان الخبر'}</h3>
                    <p class="news-summary">${newsItem.summary || 'ملخص الخبر غير متوفر'}</p>
                    <div class="news-meta">
                        <span class="news-date">${this.formatDate(newsItem.published_date)}</span>
                        ${newsItem.url ? `<a href="${newsItem.url}" target="_blank">قراءة المزيد</a>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    setupTeamSearch() {
        const searchInput = document.getElementById('team-search-input');
        const searchBtn = document.getElementById('team-search-btn');
        const resultsContainer = document.getElementById('team-search-results');

        const performSearch = async () => {
            const teamName = searchInput.value.trim();
            
            if (teamName.length < 2) {
                resultsContainer.classList.add('hidden');
                return;
            }

            try {
                searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                searchBtn.disabled = true;

                const teamData = await this.fetchData(`/team/${encodeURIComponent(teamName)}`);
                this.displayTeamResults(teamData, resultsContainer);

            } catch (error) {
                console.error('خطأ في البحث عن الفريق:', error);
                resultsContainer.innerHTML = '<div class="error-message">حدث خطأ في البحث</div>';
                resultsContainer.classList.remove('hidden');
            } finally {
                searchBtn.innerHTML = '<i class="fas fa-search"></i>';
                searchBtn.disabled = false;
            }
        };

        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    displayTeamResults(teamData, container) {
        if (!teamData || !teamData.matches) {
            container.innerHTML = '<div class="no-data-message">لم يتم العثور على مباريات لهذا الفريق</div>';
            container.classList.remove('hidden');
            return;
        }

        const matchesHtml = teamData.matches.length > 0 ? 
            teamData.matches.slice(0, 5).map(match => `
                <div class="team-match">
                    <div class="team-match-date">${match.date || 'تاريخ غير محدد'}</div>
                    <div class="team-match-info">
                        ${match.home_team} ${match.home_score || '-'} - ${match.away_score || '-'} ${match.away_team}
                    </div>
                </div>
            `).join('') : 
            '<div class="no-data-message">لا توجد مباريات متاحة</div>';

        container.innerHTML = `
            <div class="team-info">
                <h3>نتائج البحث عن: ${teamData.team_name}</h3>
                <p>إجمالي المباريات: ${teamData.total_matches || 0}</p>
            </div>
            <div class="team-matches">
                ${matchesHtml}
            </div>
        `;
        
        container.classList.remove('hidden');
    }

    setupAutoRefresh() {
        // تحديث المباريات المباشرة كل دقيقة
        setInterval(async () => {
            try {
                const liveMatches = await this.fetchData('/matches/live');
                if (liveMatches && liveMatches.length > 0) {
                    this.displayLiveMatches(liveMatches);
                }
            } catch (error) {
                console.error('خطأ في تحديث المباريات المباشرة:', error);
            }
        }, 60000); // كل دقيقة
    }

    getStatusClass(status) {
        if (!status) return '';
        
        const statusLower = status.toLowerCase();
        if (statusLower.includes('مباشر') || statusLower.includes('live')) {
            return 'live';
        } else if (statusLower.includes('انتهت') || statusLower.includes('finished')) {
            return 'finished';
        } else {
            return 'upcoming';
        }
    }

    formatDate(date) {
        if (!date) return 'تاريخ غير محدد';
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
        
        return dateObj.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showLoading(show) {
        if (this.loadingElement) {
            this.loadingElement.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // إدراج رسالة الخطأ بعد مؤشر التحميل
        if (this.loadingElement && this.loadingElement.parentNode) {
            this.loadingElement.parentNode.insertBefore(errorDiv, this.loadingElement.nextSibling);
        }
        
        // إزالة رسالة الخطأ بعد 5 ثوان
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// تهيئة صفحة الرياضة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new SportsPage();
});

// تصدير الكلاس للاستخدام في أماكن أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SportsPage;
}

