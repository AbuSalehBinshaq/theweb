// Matches Display System - Redesigned
class MatchesDisplay {
    constructor() {
        this.matches = [];
        this.container = null;
        this.init();
    }

    init() {
        this.createMatchesSection();
        this.loadMatches();
        this.setupAutoRefresh();
    }

    createMatchesSection() {
        const matchesSection = document.getElementById('matchesSection');
        if (!matchesSection) return;

        const matchesHTML = `
            <div class="matches-header">
                <h2 class="matches-title">
                    <i class="fas fa-futbol"></i>
                    المباريات اليوم
                </h2>
                <button class="refresh-btn" onclick="matchesDisplay.loadMatches()">
                    <i class="fas fa-sync-alt"></i>
                    تحديث
                </button>
            </div>
            <div class="matches-list" id="matchesList">
                <div class="loading">جاري تحميل المباريات...</div>
            </div>
        `;

        matchesSection.innerHTML = matchesHTML;
        this.container = matchesSection;
    }

    async loadMatches() {
        try {
            const matchesList = document.getElementById('matchesList');
            if (matchesList) {
                matchesList.innerHTML = '<div class="loading">جاري تحميل المباريات...</div>';
            }

            // Try to load from API first, then fallback to sample data
            let matches = await this.fetchMatchesFromAPI();
            
            if (!matches || matches.length === 0) {
                matches = this.getSampleMatches();
            }

            this.matches = matches;
            this.displayMatches();
        } catch (error) {
            console.error('Error loading matches:', error);
            this.displayError();
        }
    }

    async fetchMatchesFromAPI() {
        try {
            const response = await fetch('/api/matches.json');
            if (response.ok) {
                const data = await response.json();
                return Object.values(data);
            }
        } catch (error) {
            console.log('API not available, using sample data');
        }
        return null;
    }

    getSampleMatches() {
        return [
            {
                "match_id": "sample_match_1",
                "league_name": "الدوري السعودي للمحترفين",
                "home_team": "الهلال",
                "away_team": "النصر",
                "home_team_logo": "https://via.placeholder.com/40x40/1e3a8a/ffffff?text=الهلال",
                "away_team_logo": "https://via.placeholder.com/40x40/f59e0b/ffffff?text=النصر",
                "match_date": "2025-09-11",
                "match_time": "20:00",
                "full_time_score": "2-1",
                "status": "انتهت",
                "match_url": "#",
                "last_updated": "2025-09-11T17:00:00.000000"
            },
            {
                "match_id": "sample_match_2",
                "league_name": "دوري أبطال آسيا",
                "home_team": "الاتحاد",
                "away_team": "الأهلي",
                "home_team_logo": "https://via.placeholder.com/40x40/10b981/ffffff?text=الاتحاد",
                "away_team_logo": "https://via.placeholder.com/40x40/ef4444/ffffff?text=الأهلي",
                "match_date": "2025-09-11",
                "match_time": "22:30",
                "full_time_score": "1-0",
                "status": "مباشر",
                "match_url": "#",
                "last_updated": "2025-09-11T19:30:00.000000"
            },
            {
                "match_id": "sample_match_3",
                "league_name": "الدوري السعودي للمحترفين",
                "home_team": "الشباب",
                "away_team": "الفتح",
                "home_team_logo": "https://via.placeholder.com/40x40/8b5cf6/ffffff?text=الشباب",
                "away_team_logo": "https://via.placeholder.com/40x40/06b6d4/ffffff?text=الفتح",
                "match_date": "2025-09-12",
                "match_time": "18:00",
                "full_time_score": "",
                "status": "قادمة",
                "match_url": "#",
                "last_updated": "2025-09-11T15:00:00.000000"
            }
        ];
    }

    displayMatches() {
        const matchesList = document.getElementById('matchesList');
        if (!matchesList || !this.matches.length) {
            this.displayError();
            return;
        }

        const matchesHTML = this.matches.map(match => this.createMatchCard(match)).join('');
        matchesList.innerHTML = matchesHTML;
    }

    createMatchCard(match) {
        const statusClass = this.getStatusClass(match.status);
        const statusText = this.getStatusText(match.status);
        const scoreDisplay = this.getScoreDisplay(match);
        const timeDisplay = this.getTimeDisplay(match);

        return `
            <div class="match-card" onclick="matchesDisplay.openMatchDetails('${match.match_id}')">
                <div class="match-header">
                    <span class="league-name">${match.league_name}</span>
                    <span class="match-status ${statusClass}">${statusText}</span>
                </div>
                <div class="match-teams">
                    <div class="team">
                        <img src="${match.home_team_logo}" alt="${match.home_team}" class="team-logo" 
                             onerror="this.src='https://via.placeholder.com/40x40/6c757d/ffffff?text=${encodeURIComponent(match.home_team.charAt(0))}'">
                        <span class="team-name">${match.home_team}</span>
                    </div>
                    <div class="match-score">
                        ${scoreDisplay}
                    </div>
                    <div class="team">
                        <img src="${match.away_team_logo}" alt="${match.away_team}" class="team-logo"
                             onerror="this.src='https://via.placeholder.com/40x40/6c757d/ffffff?text=${encodeURIComponent(match.away_team.charAt(0))}'">
                        <span class="team-name">${match.away_team}</span>
                    </div>
                </div>
                <div class="match-time">${timeDisplay}</div>
            </div>
        `;
    }

    getStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'مباشر':
            case 'live':
                return 'status-live';
            case 'انتهت':
            case 'finished':
                return 'status-finished';
            case 'قادمة':
            case 'upcoming':
            default:
                return 'status-upcoming';
        }
    }

    getStatusText(status) {
        const statusMap = {
            'مباشر': 'مباشر',
            'live': 'مباشر',
            'انتهت': 'انتهت',
            'finished': 'انتهت',
            'قادمة': 'قادمة',
            'upcoming': 'قادمة',
            'غير محدد': 'قادمة'
        };
        return statusMap[status.toLowerCase()] || 'قادمة';
    }

    getScoreDisplay(match) {
        if (match.full_time_score && match.full_time_score.trim()) {
            const scores = match.full_time_score.split('-');
            if (scores.length === 2) {
                return `<div class="score">${scores[0].trim()} - ${scores[1].trim()}</div>`;
            }
        }
        
        if (match.status.toLowerCase() === 'مباشر' || match.status.toLowerCase() === 'live') {
            return `<div class="score">0 - 0</div>`;
        }
        
        return '<div class="vs">VS</div>';
    }

    getTimeDisplay(match) {
        if (match.status.toLowerCase() === 'انتهت' || match.status.toLowerCase() === 'finished') {
            return `انتهت - ${match.match_time}`;
        }
        
        if (match.status.toLowerCase() === 'مباشر' || match.status.toLowerCase() === 'live') {
            return 'مباشر الآن';
        }
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (match.match_date === today.toISOString().split('T')[0]) {
            return `اليوم - ${match.match_time}`;
        } else if (match.match_date === tomorrow.toISOString().split('T')[0]) {
            return `غداً - ${match.match_time}`;
        } else {
            return `${match.match_date} - ${match.match_time}`;
        }
    }

    displayError() {
        const matchesList = document.getElementById('matchesList');
        if (matchesList) {
            matchesList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #6c757d;">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem; color: #ffc107;"></i>
                    <p>لا توجد مباريات متاحة حالياً</p>
                    <button onclick="matchesDisplay.loadMatches()" style="margin-top: 1rem; background: #00d4ff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer;">
                        <i class="fas fa-redo"></i> إعادة المحاولة
                    </button>
                </div>
            `;
        }
    }

    openMatchDetails(matchId) {
        const match = this.matches.find(m => m.match_id === matchId);
        if (match && match.match_url && match.match_url !== '#') {
            window.open(match.match_url, '_blank');
        } else {
            console.log('Match details for:', matchId);
        }
    }

    setupAutoRefresh() {
        // Refresh matches every 5 minutes
        setInterval(() => {
            this.loadMatches();
        }, 5 * 60 * 1000);
    }

    // Method to update matches from external JSON
    updateMatchesFromJSON(jsonData) {
        try {
            if (typeof jsonData === 'string') {
                jsonData = JSON.parse(jsonData);
            }
            
            if (typeof jsonData === 'object' && !Array.isArray(jsonData)) {
                this.matches = Object.values(jsonData);
            } else if (Array.isArray(jsonData)) {
                this.matches = jsonData;
            }
            
            this.displayMatches();
        } catch (error) {
            console.error('Error updating matches from JSON:', error);
        }
    }
}

// Initialize matches display when DOM is loaded
let matchesDisplay;
document.addEventListener('DOMContentLoaded', function() {
    matchesDisplay = new MatchesDisplay();
});

// Global function to update matches (can be called from external scripts)
function updateMatches(jsonData) {
    if (matchesDisplay) {
        matchesDisplay.updateMatchesFromJSON(jsonData);
    }
}

