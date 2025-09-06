// Sports Routes - مسارات البيانات الرياضية
// يحتوي على جميع المسارات الخاصة بالبيانات الرياضية من يلا كورة

const SportsAPI = require('./scrapers/sports_api');

// إنشاء instance من SportsAPI
const sportsAPI = new SportsAPI();

function addSportsRoutes(app) {
    // API للحصول على مباريات اليوم
    app.get('/api/sports/matches/today', async (req, res) => {
        try {
            const matches = await sportsAPI.getTodayMatches();
            res.json({
                success: true,
                data: matches,
                count: matches.length,
                date: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            console.error('خطأ في جلب مباريات اليوم:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في جلب مباريات اليوم',
                data: []
            });
        }
    });

    // API للحصول على مباريات الأمس
    app.get('/api/sports/matches/yesterday', async (req, res) => {
        try {
            const matches = await sportsAPI.getYesterdayMatches();
            res.json({
                success: true,
                data: matches,
                count: matches.length,
                date: new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0]
            });
        } catch (error) {
            console.error('خطأ في جلب مباريات الأمس:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في جلب مباريات الأمس',
                data: []
            });
        }
    });

    // API للحصول على مباريات الغد
    app.get('/api/sports/matches/tomorrow', async (req, res) => {
        try {
            const matches = await sportsAPI.getTomorrowMatches();
            res.json({
                success: true,
                data: matches,
                count: matches.length,
                date: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]
            });
        } catch (error) {
            console.error('خطأ في جلب مباريات الغد:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في جلب مباريات الغد',
                data: []
            });
        }
    });

    // API للحصول على مباريات بتاريخ محدد
    app.get('/api/sports/matches/date/:date', async (req, res) => {
        try {
            const { date } = req.params;
            
            // التحقق من صحة التاريخ
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return res.status(400).json({
                    success: false,
                    error: 'تنسيق التاريخ غير صحيح. يجب أن يكون YYYY-MM-DD'
                });
            }

            const matches = await sportsAPI.getMatchesByDate(date);
            res.json({
                success: true,
                data: matches,
                count: matches.length,
                date: date
            });
        } catch (error) {
            console.error('خطأ في جلب المباريات بالتاريخ:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في جلب المباريات بالتاريخ المحدد',
                data: []
            });
        }
    });

    // API للحصول على المباريات المباشرة
    app.get('/api/sports/matches/live', async (req, res) => {
        try {
            const matches = await sportsAPI.getLiveMatches();
            res.json({
                success: true,
                data: matches,
                count: matches.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('خطأ في جلب المباريات المباشرة:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في جلب المباريات المباشرة',
                data: []
            });
        }
    });

    // API للحصول على الأخبار الرياضية
    app.get('/api/sports/news', async (req, res) => {
        try {
            const news = await sportsAPI.getSportsNews();
            res.json({
                success: true,
                data: news,
                count: news.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('خطأ في جلب الأخبار الرياضية:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في جلب الأخبار الرياضية',
                data: []
            });
        }
    });

    // API للبحث عن فريق
    app.get('/api/sports/team/:teamName', async (req, res) => {
        try {
            const { teamName } = req.params;
            
            if (!teamName || teamName.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'اسم الفريق يجب أن يكون أكثر من حرفين'
                });
            }

            const teamData = await sportsAPI.searchTeam(teamName);
            res.json({
                success: true,
                data: teamData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('خطأ في البحث عن الفريق:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في البحث عن الفريق',
                data: { team_name: req.params.teamName, matches: [], total_matches: 0 }
            });
        }
    });

    // API شامل للحصول على جميع البيانات الرياضية
    app.get('/api/sports/dashboard', async (req, res) => {
        try {
            const [todayMatches, liveMatches, news] = await Promise.all([
                sportsAPI.getTodayMatches(),
                sportsAPI.getLiveMatches(),
                sportsAPI.getSportsNews()
            ]);

            res.json({
                success: true,
                data: {
                    today_matches: todayMatches.slice(0, 10), // أول 10 مباريات
                    live_matches: liveMatches,
                    latest_news: news.slice(0, 5) // آخر 5 أخبار
                },
                counts: {
                    today_matches: todayMatches.length,
                    live_matches: liveMatches.length,
                    news: news.length
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('خطأ في جلب بيانات الداشبورد:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في جلب بيانات الداشبورد',
                data: {
                    today_matches: [],
                    live_matches: [],
                    latest_news: []
                }
            });
        }
    });

    // API لإحصائيات سريعة
    app.get('/api/sports/stats', async (req, res) => {
        try {
            const [todayMatches, liveMatches, tomorrowMatches] = await Promise.all([
                sportsAPI.getTodayMatches(),
                sportsAPI.getLiveMatches(),
                sportsAPI.getTomorrowMatches()
            ]);

            res.json({
                success: true,
                data: {
                    today_matches_count: todayMatches.length,
                    live_matches_count: liveMatches.length,
                    tomorrow_matches_count: tomorrowMatches.length,
                    total_matches_count: todayMatches.length + tomorrowMatches.length
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('خطأ في جلب الإحصائيات:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ في جلب الإحصائيات',
                data: {
                    today_matches_count: 0,
                    live_matches_count: 0,
                    tomorrow_matches_count: 0,
                    total_matches_count: 0
                }
            });
        }
    });

    console.log('✅ تم تحميل مسارات البيانات الرياضية بنجاح');
}

module.exports = addSportsRoutes;

