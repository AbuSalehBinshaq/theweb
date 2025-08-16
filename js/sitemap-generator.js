// Sitemap Generator for Kasrah Website
// This script generates a dynamic sitemap based on articles and pages

class SitemapGenerator {
    constructor() {
        this.baseUrl = 'https://kasrah.onrender.com';
        this.lastMod = new Date().toISOString();
        this.sitemapData = [];
    }

    // إضافة صفحة للسايت ماب
    addPage(url, priority = 0.5, changefreq = 'monthly') {
        this.sitemapData.push({
            loc: `${this.baseUrl}${url}`,
            lastmod: this.lastMod,
            changefreq: changefreq,
            priority: priority
        });
    }

    // إضافة مقال للسايت ماب
    addArticle(slug, title, lastmod = null) {
        const articleDate = lastmod || this.lastMod;
        this.sitemapData.push({
            loc: `${this.baseUrl}/articles/${slug}.html`,
            lastmod: articleDate,
            changefreq: 'daily',
            priority: 0.8
        });
    }

    // توليد XML للسايت ماب
    generateXML() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        this.sitemapData.forEach(item => {
            xml += '    <url>\n';
            xml += `      <loc>${item.loc}</loc>\n`;
            xml += `      <lastmod>${item.lastmod}</lastmod>\n`;
            xml += `      <changefreq>${item.changefreq}</changefreq>\n`;
            xml += `      <priority>${item.priority}</priority>\n`;
            xml += '    </url>\n';
        });
        
        xml += '</urlset>';
        return xml;
    }

    // حفظ السايت ماب
    async saveSitemap() {
        try {
            const xml = this.generateXML();
            
            // إرسال للسيرفر لحفظه
            const response = await fetch('/api/sitemap/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sitemap: xml,
                    timestamp: this.lastMod
                })
            });
            
            if (response.ok) {
                console.log('✅ تم تحديث السايت ماب بنجاح');
                return true;
            } else {
                console.error('❌ فشل في تحديث السايت ماب');
                return false;
            }
        } catch (error) {
            console.error('❌ خطأ في تحديث السايت ماب:', error);
            return false;
        }
    }

    // توليد سايت ماب كامل للموقع
    generateFullSitemap() {
        // الصفحات الرئيسية
        this.addPage('/', 1.0, 'daily');
        this.addPage('/pages/news/', 0.9, 'daily');
        this.addPage('/pages/competitions.html', 0.8, 'weekly');
        this.addPage('/pages/matches.html', 0.8, 'daily');
        this.addPage('/pages/favorites.html', 0.7, 'weekly');
        this.addPage('/pages/search.html', 0.6, 'weekly');
        
        // صفحات إضافية
        this.addPage('/pages/about.html', 0.5, 'monthly');
        this.addPage('/pages/contact.html', 0.5, 'monthly');
        this.addPage('/pages/faq.html', 0.5, 'monthly');
        this.addPage('/pages/help.html', 0.5, 'monthly');
        this.addPage('/pages/more.html', 0.6, 'monthly');
        this.addPage('/pages/settings.html', 0.4, 'monthly');
        this.addPage('/pages/notifications.html', 0.6, 'weekly');
        this.addPage('/pages/feedback.html', 0.4, 'monthly');
        this.addPage('/pages/privacy-policy.html', 0.3, 'yearly');
        this.addPage('/pages/terms-of-service.html', 0.3, 'yearly');
        
        // المقالات (يمكن تحديثها من قاعدة البيانات)
        this.addArticle('darwin-nunez-to-alhilal-transfer-2025', 'داروين نونيز إلى الهلال');
        this.addArticle('joao-felix-to-al-nassr-transfer-analysis', 'جواو فيليكس إلى النصر');
        this.addArticle('alhilal-suber', 'الهلال يوقع مع سوبر');
        
        return this.generateXML();
    }

    // تحديث السايت ماب عند إضافة مقال جديد
    async addNewArticle(slug, title, content = '') {
        this.addArticle(slug, title);
        
        // تحديث RSS أيضاً
        await this.updateRSS(slug, title, content);
        
        // حفظ التحديثات
        return await this.saveSitemap();
    }

    // تحديث RSS
    async updateRSS(slug, title, content = '') {
        try {
            const rssItem = {
                title: title,
                link: `${this.baseUrl}/articles/${slug}.html`,
                description: content.substring(0, 200) + '...',
                pubDate: this.lastMod,
                guid: `${this.baseUrl}/articles/${slug}.html`
            };
            
            // إرسال تحديث RSS للسيرفر
            const response = await fetch('/api/rss/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rssItem)
            });
            
            if (response.ok) {
                console.log('✅ تم تحديث RSS بنجاح');
                return true;
            }
        } catch (error) {
            console.error('❌ خطأ في تحديث RSS:', error);
        }
        return false;
    }
}

// تصدير الكلاس للاستخدام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SitemapGenerator;
} else {
    // للاستخدام في المتصفح
    window.SitemapGenerator = SitemapGenerator;
}

// استخدام الكلاس
const sitemapGen = new SitemapGenerator();

// توليد سايت ماب كامل
document.addEventListener('DOMContentLoaded', function() {
    // يمكن استدعاء هذا عند الحاجة
    // sitemapGen.generateFullSitemap();
    
    console.log('🚀 Sitemap Generator جاهز للاستخدام');
});
