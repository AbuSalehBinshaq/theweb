require('dotenv').config({ path: './config.env' });
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد قاعدة البيانات مع إعادة الاتصال التلقائي
let pool;

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    // إعدادات إضافية لتحسين الاستقرار
    max: 20, // الحد الأقصى للاتصالات
    idleTimeoutMillis: 30000, // وقت الانتظار قبل إغلاق الاتصال غير المستخدم
    connectionTimeoutMillis: 2000, // وقت انتظار الاتصال
  });
}

// تهيئة الاتصال بقاعدة البيانات
function initializeDatabase() {
  pool = createPool();
  
  // معالجة أخطاء الاتصال
  pool.on('error', (err) => {
    console.error('خطأ في الاتصال بقاعدة البيانات:', err);
    // إعادة إنشاء الاتصال بعد 5 ثوان
    setTimeout(() => {
      console.log('إعادة الاتصال بقاعدة البيانات...');
      pool = createPool();
    }, 5000);
  });
}

// تهيئة قاعدة البيانات عند بدء التشغيل
initializeDatabase();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// إعداد الجلسات
app.use(session({
  secret: 'kasrah-secret-key-2025',
  resave: true,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000, // 24 ساعة
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Middleware للتحقق من تسجيل الدخول
function requireAuth(req, res, next) {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
  }
}

// دالة مساعدة للتعامل مع قاعدة البيانات
async function executeQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error('خطأ في قاعدة البيانات:', error);
    throw error;
  }
}

// دالة إنشاء ملف HTML للمقال
async function generateArticleHTML(article) {
  try {
    console.log(`🔄 بدء إنشاء ملف HTML للمقال: ${article.slug}`);
    
    // جلب إعدادات الموقع
    const siteSettings = await getSiteSettings();
    
    // قراءة قالب المقال
    const templatePath = path.join(__dirname, 'templates', 'article-template.html');
    console.log(`📖 قراءة القالب من: ${templatePath}`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`القالب غير موجود: ${templatePath}`);
    }
    
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // تنسيق التواريخ
    const publishDate = article.published_at ? new Date(article.published_at).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA');
    const publishDateISO = article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString();
    const modifiedDateISO = article.updated_at ? new Date(article.updated_at).toISOString() : publishDateISO;
    
    // استبدال المتغيرات في القالب
    const replacements = {
      '{{TITLE}}': article.title || article.title_en || 'مقال جديد',
      '{{DESCRIPTION}}': article.description || article.description_en || '',
      '{{IMAGE}}': article.image_url || article.thumbnail_url || '',
      '{{URL}}': `${process.env.SITE_URL || 'http://localhost:3000'}/articles/${article.slug}`,
      '{{SITE_URL}}': process.env.SITE_URL || 'http://localhost:3000',
      '{{AUTHOR}}': article.author || 'كسرة - Kasrah',
      '{{PUBLISH_DATE}}': publishDate,
      '{{PUBLISH_DATE_ISO}}': publishDateISO,
      '{{MODIFIED_DATE_ISO}}': modifiedDateISO,
      '{{CONTENT}}': article.content || article.content_en || '',
      '{{SLUG}}': article.slug,
      '{{ID}}': article.id || '',
      '{{CATEGORY}}': article.category || '',
      '{{META_TITLE}}': article.meta_title || article.title || article.title_en,
      '{{META_DESCRIPTION}}': article.meta_description || article.description || article.description_en,
      '{{META_KEYWORDS}}': article.meta_keywords || '',
      '{{SITE_NAME}}': siteSettings.site_name || 'كسرة - Kasrah',
      '{{SITE_DESCRIPTION}}': siteSettings.site_description || '',
      '{{PRIMARY_COLOR}}': siteSettings.primary_color || '#1e3a8a',
      '{{SECONDARY_COLOR}}': siteSettings.secondary_color || '#3b82f6'
    };
    
    console.log(`🔧 تطبيق الاستبدالات للمقال: ${article.title}`);
    
    // تطبيق الاستبدالات
    Object.keys(replacements).forEach(key => {
      const value = replacements[key] || '';
      template = template.replace(new RegExp(key, 'g'), value);
    });
    
    // إنشاء مجلد المقالات إذا لم يكن موجوداً
    const articlesDir = path.join(__dirname, 'articles');
    if (!fs.existsSync(articlesDir)) {
      console.log(`📁 إنشاء مجلد المقالات: ${articlesDir}`);
      fs.mkdirSync(articlesDir, { recursive: true });
    }
    
    // إنشاء ملف HTML
    const filePath = path.join(articlesDir, `${article.slug}.html`);
    fs.writeFileSync(filePath, template, 'utf8');
  
    
    return filePath;
  } catch (error) {
    console.error('❌ خطأ في إنشاء ملف HTML للمقال:', error);
    throw error;
  }
}

// دالة حذف ملف HTML للمقال
async function deleteArticleHTML(slug) {
  try {
    const filePath = path.join(__dirname, 'articles', `${slug}.html`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ تم حذف ملف HTML للمقال: ${slug}.html`);
    }
  } catch (error) {
    console.error('❌ خطأ في حذف ملف HTML للمقال:', error);
  }
}

// دالة تحديث ملف HTML للمقال
async function updateArticleHTML(article) {
  try {
    // حذف الملف القديم إذا تغير الـ slug
    if (article.old_slug && article.old_slug !== article.slug) {
      await deleteArticleHTML(article.old_slug);
    }
    
    // إنشاء الملف الجديد
    await generateArticleHTML(article);
  } catch (error) {
    console.error('❌ خطأ في تحديث ملف HTML للمقال:', error);
  }
}

// دالة جلب إعدادات الموقع
async function getSiteSettings() {
  try {
    const result = await executeQuery('SELECT * FROM site_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    return settings;
  } catch (error) {
    console.error('خطأ في جلب إعدادات الموقع:', error);
    return {};
  }
}

// دالة إنشاء الصفحة الرئيسية
async function generateIndexHTML() {
  try {
    console.log('🔄 بدء إنشاء الصفحة الرئيسية...');
    
    // جلب إعدادات الموقع
    const siteSettings = await getSiteSettings();
    
    // جلب المقالات المنشورة
    const result = await executeQuery('SELECT * FROM articles WHERE is_published = true ORDER BY published_at DESC LIMIT 10');
    const articles = result.rows;
    
    // قراءة قالب الصفحة الرئيسية
    const templatePath = path.join(__dirname, 'templates', 'index-template.html');
    console.log(`📖 قراءة قالب الصفحة الرئيسية من: ${templatePath}`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`قالب الصفحة الرئيسية غير موجود: ${templatePath}`);
    }
    
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // إنشاء HTML للمقالات
    const articlesHTML = articles.map(article => `
        <div class="article-card" onclick="window.location.href='/articles/${article.slug}.html'">
            <div class="article-image">
                <img src="${article.thumbnail_url || article.image_url || 'https://via.placeholder.com/400x250/1e3a8a/ffffff?text=كسرة'}" 
                     alt="${article.title}" loading="lazy">
            </div>
            <div class="article-content">
                <h3 class="article-title">${article.title}</h3>
                <p class="article-description">${article.description || ''}</p>
                <div class="article-meta">
                    <span class="article-author">من: ${article.author || 'كسرة - Kasrah'}</span>
                    <span class="article-date">${new Date(article.published_at).toLocaleDateString('ar-SA')}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // استبدال المتغيرات في القالب
    const replacements = {
      '{{ARTICLES_HTML}}': articlesHTML,
      '{{SITE_URL}}': process.env.SITE_URL || 'http://localhost:3000',
      '{{SITE_NAME}}': siteSettings.site_name || 'كسرة - Kasrah',
      '{{SITE_DESCRIPTION}}': siteSettings.site_description || '',
      '{{PRIMARY_COLOR}}': siteSettings.primary_color || '#1e3a8a',
      '{{SECONDARY_COLOR}}': siteSettings.secondary_color || '#3b82f6'
    };
    
    console.log(`🔧 تطبيق الاستبدالات للصفحة الرئيسية`);
    
    // تطبيق الاستبدالات
    Object.keys(replacements).forEach(key => {
      const value = replacements[key] || '';
      template = template.replace(new RegExp(key, 'g'), value);
    });
    
    // إنشاء ملف الصفحة الرئيسية
    const indexPath = path.join(__dirname, 'index.html');
    fs.writeFileSync(indexPath, template, 'utf8');
    
    console.log(`✅ تم إنشاء الصفحة الرئيسية: ${indexPath}`);
    return indexPath;
  } catch (error) {
    console.error('❌ خطأ في إنشاء الصفحة الرئيسية:', error);
    throw error;
  }
}

// API للمقالات (عام - بدون حماية)
app.get('/api/articles', async (req, res) => {
  try {
    const { lang = 'ar', category, exclude, limit } = req.query;
    let query = 'SELECT id, title, title_en, slug, description, description_en, image_url, thumbnail_url, author, published_at, category, language FROM articles WHERE is_published = true';
    let params = [];
    let paramIndex = 1;

    // إضافة فلتر التصنيف
    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // استبعاد مقال محدد
    if (exclude) {
      query += ` AND id != $${paramIndex}`;
      params.push(exclude);
      paramIndex++;
    }

    query += ' ORDER BY published_at DESC';

    // إضافة حد للمقالات
    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
    }

    const result = await executeQuery(query, params);
    
    // تنسيق البيانات حسب اللغة
    const articles = result.rows.map(article => ({
      ...article,
      title: lang === 'en' && article.title_en ? article.title_en : article.title,
      description: lang === 'en' && article.description_en ? article.description_en : article.description
    }));
    
    res.json(articles);
  } catch (error) {
    console.error('خطأ في جلب المقالات:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

app.get('/api/articles/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { lang = 'ar' } = req.query;
    
    const result = await executeQuery(
      'SELECT * FROM articles WHERE slug = $1 AND is_published = true',
      [slug]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المقال غير موجود' });
    }
    
    const article = result.rows[0];
    
    // تنسيق البيانات حسب اللغة
    if (lang === 'en') {
      article.title = article.title_en || article.title;
      article.content = article.content_en || article.content;
      article.description = article.description_en || article.description;
    }
    
    res.json(article);
  } catch (error) {
    console.error('خطأ في جلب المقال:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});


//sitemap
async function generateSitemap() {
  try {
    console.log('🔄 بدء إنشاء ملف sitemap.xml...');
    
    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    
    // جلب جميع المقالات المنشورة
    const result = await executeQuery('SELECT slug, updated_at, published_at, category FROM articles WHERE is_published = true ORDER BY published_at DESC');
    const articles = result.rows;
    
    console.log(`📊 تم العثور على ${articles.length} مقال منشور`);
    
    // إنشاء URLs للصفحات الثابتة
    const staticPages = [
      {
        loc: siteUrl,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        loc: `${siteUrl}/pages/news/index.html`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: `${siteUrl}/pages/competitions.html`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.8'
      },
      {
        loc: `${siteUrl}/pages/favorites.html`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.7'
      },
      {
        loc: `${siteUrl}/pages/more.html`,
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: '0.6'
      }
    ];
    
    // إنشاء URLs للمقالات
    const articleUrls = articles.map(article => {
      const lastmod = article.updated_at || article.published_at || new Date().toISOString();
      
      // تحديد الأولوية بناءً على التصنيف وتاريخ النشر
      let priority = '0.8';
      if (article.category === 'أخبار' || article.category === 'كرة القدم') {
        priority = '0.9';
      }
      
      // تقليل الأولوية للمقالات القديمة
      const publishDate = new Date(article.published_at);
      const daysSincePublish = Math.floor((new Date() - publishDate) / (1000 * 60 * 60 * 24));
      if (daysSincePublish > 30) {
        priority = '0.7';
      }
      if (daysSincePublish > 90) {
        priority = '0.6';
      }
      
      return {
        loc: `${siteUrl}/articles/${article.slug}.html`,
        lastmod: new Date(lastmod).toISOString(),
        changefreq: daysSincePublish < 7 ? 'daily' : daysSincePublish < 30 ? 'weekly' : 'monthly',
        priority: priority
      };
    });
    
    // دمج جميع URLs
    const allUrls = [...staticPages, ...articleUrls];
    
    // إنشاء XML
    const urlsXml = allUrls.map(url => `    <url>
      <loc>${url.loc}</loc>
      <lastmod>${url.lastmod}</lastmod>
      <changefreq>${url.changefreq}</changefreq>
      <priority>${url.priority}</priority>
    </url>`).join('\n');
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
    
    // حفظ الملف
    const sitemapPath = path.join(__dirname, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    
    console.log(`✅ تم إنشاء ملف sitemap.xml بنجاح`);
    console.log(`📄 المسار: ${sitemapPath}`);
    console.log(`🔗 إجمالي URLs: ${allUrls.length} (${staticPages.length} صفحات ثابتة + ${articleUrls.length} مقال)`);
    
    return sitemapPath;
  } catch (error) {
    console.error('❌ خطأ في إنشاء ملف sitemap.xml:', error);
    throw error;
  }
}

// API لإنشاء sitemap يدوياً
app.get('/api/admin/generate-sitemap', requireAuth, async (req, res) => {
  try {
    const sitemapPath = await generateSitemap();
    res.json({ 
      success: true, 
      message: 'تم إنشاء ملف sitemap.xml بنجاح',
      path: sitemapPath 
    });
  } catch (error) {
    console.error('خطأ في إنشاء sitemap:', error);
    res.status(500).json({ error: 'خطأ في إنشاء ملف sitemap.xml' });
  }
});

// API عام لعرض sitemap
app.get('/sitemap.xml', (req, res) => {
  try {
    const sitemapPath = path.join(__dirname, 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      res.set('Content-Type', 'application/xml');
      res.sendFile(sitemapPath);
    } else {
      res.status(404).send('ملف sitemap.xml غير موجود');
    }
  } catch (error) {
    console.error('خطأ في عرض sitemap:', error);
    res.status(500).send('خطأ في الخادم');
  }
});

// تشغيل إنشاء sitemap تلقائياً عند بدء الخادم
async function initializeSitemap() {
  try {
    console.log('🚀 تهيئة sitemap.xml عند بدء الخادم...');
    await generateSitemap();
  } catch (error) {
    console.error('❌ فشل في تهيئة sitemap.xml:', error);
  }
}

// جدولة إنشاء sitemap كل 24 ساعة
setInterval(async () => {
  try {
    console.log('⏰ تشغيل المهمة المجدولة لتحديث sitemap.xml...');
    await generateSitemap();
  } catch (error) {
    console.error('❌ خطأ في المهمة المجدولة لـ sitemap.xml:', error);
  }
}, 24 * 60 * 60 * 1000); // 24 ساعة

// التحقق من حالة تسجيل الدخول
app.get('/api/auth/status', (req, res) => {
  if (req.session.isAuthenticated) {
    res.json({ 
      authenticated: true, 
      username: req.session.username 
    });
  } else {
    res.json({ 
      authenticated: false, 
      username: null 
    });
  }
});

// تسجيل الدخول للوحة التحكم
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && 
        password === process.env.ADMIN_PASSWORD) {
      req.session.isAuthenticated = true;
      req.session.username = username;
      res.json({ success: true, message: 'تم تسجيل الدخول بنجاح' });
    } else {
      res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// تسجيل الخروج
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

// API محمي للمقالات (للوحة التحكم)
app.get('/api/admin/articles', requireAuth, async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM articles ORDER BY published_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('خطأ في جلب المقالات:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// تحديث API إضافة المقال
app.post('/api/admin/articles', requireAuth, async (req, res) => {
  try {
    const { 
      title, 
      title_en, 
      slug, 
      content, 
      content_en, 
      description, 
      description_en, 
      meta_title, 
      meta_description, 
      meta_keywords, 
      image_url, 
      thumbnail_url, 
      category,
      language = 'ar'
    } = req.body;
    
    const result = await executeQuery(
      `INSERT INTO articles (title, title_en, slug, content, content_en, description, description_en, meta_title, meta_description, meta_keywords, image_url, thumbnail_url, category, language) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [title, title_en, slug, content, content_en, description, description_en, meta_title, meta_description, meta_keywords, image_url, thumbnail_url, category, language]
    );
    
    const newArticle = result.rows[0];
    
    // إنشاء ملف HTML للمقال الجديد
    try {
      if (newArticle.is_published) {
        await generateArticleHTML(newArticle);
        // إنشاء الصفحة الرئيسية أيضاً
        await generateIndexHTML();
      }
    } catch (htmlError) {
      console.error('خطأ في إنشاء ملف HTML للمقال:', htmlError);
      // لا نريد أن نفشل في إضافة المقال إذا فشل إنشاء HTML
      // سنستمر ونرجع المقال المضاف
    }
    
    res.json(newArticle);
  } catch (error) {
    console.error('خطأ في إضافة المقال:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// تحديث API تحديث المقال
app.put('/api/admin/articles/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      title_en, 
      slug, 
      content, 
      content_en, 
      description, 
      description_en, 
      meta_title, 
      meta_description, 
      meta_keywords, 
      image_url, 
      thumbnail_url, 
      category, 
      is_published,
      language = 'ar'
    } = req.body;
    
    // جلب المقال الحالي لمعرفة الـ slug القديم
    const currentArticle = await executeQuery('SELECT slug FROM articles WHERE id = $1', [id]);
    const oldSlug = currentArticle.rows[0]?.slug;
    
    const result = await executeQuery(
      `UPDATE articles SET title = $1, title_en = $2, slug = $3, content = $4, content_en = $5, 
       description = $6, description_en = $7, meta_title = $8, meta_description = $9, meta_keywords = $10,
       image_url = $11, thumbnail_url = $12, category = $13, is_published = $14, language = $15, 
       updated_at = CURRENT_TIMESTAMP WHERE id = $16 RETURNING *`,
      [title, title_en, slug, content, content_en, description, description_en, meta_title, meta_description, meta_keywords, image_url, thumbnail_url, category, is_published, language, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المقال غير موجود' });
    }
    
    const updatedArticle = result.rows[0];
    updatedArticle.old_slug = oldSlug;
    
    // تحديث ملف HTML للمقال
    if (is_published) {
      await updateArticleHTML(updatedArticle);
    } else {
      // حذف الملف إذا تم إلغاء النشر
      await deleteArticleHTML(updatedArticle.slug);
    }
    
    // إنشاء الصفحة الرئيسية
    await generateIndexHTML();
    
    res.json(updatedArticle);
  } catch (error) {
    console.error('خطأ في تحديث المقال:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// تحديث API حذف المقال
app.delete('/api/admin/articles/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // جلب المقال قبل الحذف لمعرفة الـ slug
    const article = await executeQuery('SELECT slug FROM articles WHERE id = $1', [id]);
    const slug = article.rows[0]?.slug;
    
    const result = await executeQuery('DELETE FROM articles WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المقال غير موجود' });
    }
    
    // حذف ملف HTML للمقال
    if (slug) {
      await deleteArticleHTML(slug);
    }
    
    // إنشاء الصفحة الرئيسية
    await generateIndexHTML();
    
    res.json({ success: true, message: 'تم حذف المقال بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف المقال:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// API لإعدادات الموقع
app.get('/api/settings', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM site_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json(settings);
  } catch (error) {
    console.error('خطأ في جلب إعدادات الموقع:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

app.put('/api/admin/settings', requireAuth, async (req, res) => {
  try {
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      await executeQuery(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP',
        [key, value]
      );
    }
    
    // إعادة إنشاء جميع الملفات الثابتة لتطبيق الإعدادات الجديدة
    try {
      // إعادة إنشاء الصفحة الرئيسية
      await generateIndexHTML();
      
      // إعادة إنشاء جميع المقالات المنشورة
      const result = await executeQuery('SELECT * FROM articles WHERE is_published = true');
      const articles = result.rows;
      
      for (const article of articles) {
        await generateArticleHTML(article);
      }
      
      console.log(`✅ تم إعادة إنشاء ${articles.length} مقال وملف الصفحة الرئيسية`);
    } catch (htmlError) {
      console.error('خطأ في إعادة إنشاء الملفات الثابتة:', htmlError);
      // لا نريد أن نفشل في حفظ الإعدادات إذا فشل إنشاء HTML
    }
    
    res.json({ success: true, message: 'تم تحديث الإعدادات وإعادة إنشاء الملفات بنجاح' });
  } catch (error) {
    console.error('خطأ في تحديث إعدادات الموقع:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// API للإعلانات
app.get('/api/ads', async (req, res) => {
  try {
    const { position } = req.query;
    let query = 'SELECT * FROM advertisements WHERE is_active = true';
    let params = [];
    
    if (position) {
      query += ' AND position = $1';
      params.push(position);
    }
    
    const result = await executeQuery(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('خطأ في جلب الإعلانات:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

app.get('/api/admin/ads', requireAuth, async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM advertisements ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('خطأ في جلب الإعلانات:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

app.post('/api/admin/ads', requireAuth, async (req, res) => {
  try {
    const { name, ad_code, position, is_active = true } = req.body;
    
    const result = await executeQuery(
      'INSERT INTO advertisements (name, ad_code, position, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, ad_code, position, is_active]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('خطأ في إضافة الإعلان:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

app.put('/api/admin/ads/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ad_code, position, is_active } = req.body;
    
    const result = await executeQuery(
      'UPDATE advertisements SET name = $1, ad_code = $2, position = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, ad_code, position, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الإعلان غير موجود' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('خطأ في تحديث الإعلان:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

app.delete('/api/admin/ads/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await executeQuery('DELETE FROM advertisements WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الإعلان غير موجود' });
    }
    
    res.json({ success: true, message: 'تم حذف الإعلان بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف الإعلان:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// صفحة المقال
app.get('/article', (req, res) => {
  res.sendFile(path.join(__dirname, 'article.html'));
});

// لوحة التحكم
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/index.html'));
});

// الصفحات الأخرى
app.get('/pages/:page', (req, res) => {
  const page = req.params.page;
  res.sendFile(path.join(__dirname, `pages/${page}.html`));
});

app.get('/pages/news/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/news/index.html'));
});

// إضافة route لملفات المقالات
app.get('/articles/:slug.html', (req, res) => {
  const { slug } = req.params;
  const filePath = path.join(__dirname, 'articles', `${slug}.html`);
  
  console.log(`🔍 البحث عن ملف: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    console.log(`✅ تم العثور على الملف: ${filePath}`);
    res.sendFile(filePath);
  } else {
    console.log(`❌ الملف غير موجود: ${filePath}`);
    res.status(404).send(`
      <html dir="rtl">
        <head><title>المقال غير موجود</title></head>
        <body>
          <h1>المقال غير موجود</h1>
          <p>عذراً، المقال المطلوب غير موجود.</p>
          <a href="/">العودة للرئيسية</a>
        </body>
      </html>
    `);
  }
});

// إضافة route للمقالات بدون .html
app.get('/articles/:slug', (req, res) => {
  const { slug } = req.params;
  const filePath = path.join(__dirname, 'articles', `${slug}.html`);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.redirect(`/articles/${slug}.html`);
  }
});

// API لإنشاء ملفات HTML لجميع المقالات المنشورة
app.post('/api/admin/generate-all-articles', requireAuth, async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM articles WHERE is_published = true');
    const articles = result.rows;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const article of articles) {
      try {
        await generateArticleHTML(article);
        successCount++;
      } catch (error) {
        console.error(`خطأ في إنشاء ملف للمقال ${article.slug}:`, error);
        errorCount++;
      }
    }
    
    // إنشاء الصفحة الرئيسية أيضاً
    await generateIndexHTML();
    
    res.json({ 
      success: true, 
      message: `تم إنشاء ${successCount} ملف بنجاح، ${errorCount} أخطاء، وتم إنشاء الصفحة الرئيسية`,
      successCount,
      errorCount
    });
  } catch (error) {
    console.error('خطأ في إنشاء ملفات المقالات:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// API لإنشاء الصفحة الرئيسية
app.post('/api/admin/generate-index', requireAuth, async (req, res) => {
  try {
    await generateIndexHTML();
    res.json({ 
      success: true, 
      message: 'تم إنشاء الصفحة الرئيسية بنجاح'
    });
  } catch (error) {
    console.error('خطأ في إنشاء الصفحة الرئيسية:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// تشغيل الخادم
app.listen(PORT, async () => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
  console.log(`📱 الموقع متاح على: http://localhost:${PORT}`);
  console.log(`🔧 لوحة التحكم: http://localhost:${PORT}/admin`);
  
  // تهيئة sitemap عند بدء الخادم
  await initializeSitemap();
  
  // إعادة إنشاء جميع ملفات المقالات والصفحة الرئيسية عند بدء الخادم
  try {
    console.log("🔄 إعادة إنشاء جميع ملفات المقالات والصفحة الرئيسية عند بدء الخادم...");
    const articlesResult = await executeQuery("SELECT * FROM articles WHERE is_published = true");
    for (const article of articlesResult.rows) {
      await generateArticleHTML(article);
    }
    await generateIndexHTML();
    console.log("✅ تم إعادة إنشاء جميع ملفات المقالات والصفحة الرئيسية بنجاح.");
  } catch (error) {
    console.error("❌ خطأ في إعادة إنشاء ملفات المقالات والصفحة الرئيسية عند بدء الخادم:", error);
  }
});

// إغلاق الاتصال بقاعدة البيانات عند إغلاق التطبيق
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
}); 
