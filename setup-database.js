require('dotenv').config({ path: './config.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    console.log('🔗 جاري الاتصال بقاعدة البيانات...');
    
    // إنشاء جدول المقالات مع حقول SEO
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        title_en VARCHAR(255),
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        content_en TEXT,
        description TEXT,
        description_en TEXT,
        meta_title VARCHAR(255),
        meta_description TEXT,
        meta_keywords TEXT,
        image_url VARCHAR(500),
        thumbnail_url VARCHAR(500),
        author VARCHAR(100) DEFAULT 'كسرة - Kasrah',
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_published BOOLEAN DEFAULT true,
        category VARCHAR(100) DEFAULT 'رياضة',
        language VARCHAR(10) DEFAULT 'ar'
      );
    `;

    await pool.query(createTableQuery);
    console.log('✅ تم إنشاء جدول المقالات بنجاح');

    // إضافة الأعمدة المفقودة إذا لم تكن موجودة
    const addMissingColumns = `
      DO $$ 
      BEGIN 
        -- إضافة عمود title_en إذا لم يكن موجوداً
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'title_en') THEN
          ALTER TABLE articles ADD COLUMN title_en VARCHAR(255);
        END IF;
        
        -- إضافة عمود content_en إذا لم يكن موجوداً
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'content_en') THEN
          ALTER TABLE articles ADD COLUMN content_en TEXT;
        END IF;
        
        -- إضافة عمود description_en إذا لم يكن موجوداً
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'description_en') THEN
          ALTER TABLE articles ADD COLUMN description_en TEXT;
        END IF;
        
        -- إضافة عمود meta_title إذا لم يكن موجوداً
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'meta_title') THEN
          ALTER TABLE articles ADD COLUMN meta_title VARCHAR(255);
        END IF;
        
        -- إضافة عمود meta_description إذا لم يكن موجوداً
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'meta_description') THEN
          ALTER TABLE articles ADD COLUMN meta_description TEXT;
        END IF;
        
        -- إضافة عمود meta_keywords إذا لم يكن موجوداً
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'meta_keywords') THEN
          ALTER TABLE articles ADD COLUMN meta_keywords TEXT;
        END IF;
        
        -- إضافة عمود thumbnail_url إذا لم يكن موجوداً
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'thumbnail_url') THEN
          ALTER TABLE articles ADD COLUMN thumbnail_url VARCHAR(500);
        END IF;
        
        -- إضافة عمود language إذا لم يكن موجوداً
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'language') THEN
          ALTER TABLE articles ADD COLUMN language VARCHAR(10) DEFAULT 'ar';
        END IF;
      END $$;
    `;

    await pool.query(addMissingColumns);
    console.log('✅ تم إضافة الأعمدة المفقودة بنجاح');

    // إنشاء جدول المستخدمين (للوحة التحكم)
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createUsersTableQuery);
    console.log('✅ تم إنشاء جدول المستخدمين بنجاح');

    // إنشاء جدول إعدادات الموقع
    const createSettingsTableQuery = `
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createSettingsTableQuery);
    console.log('✅ تم إنشاء جدول إعدادات الموقع بنجاح');

    // إنشاء جدول الإعلانات
    const createAdsTableQuery = `
      CREATE TABLE IF NOT EXISTS advertisements (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ad_code TEXT NOT NULL,
        position VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createAdsTableQuery);
    console.log('✅ تم إنشاء جدول الإعلانات بنجاح');

    // إضافة بيانات أولية للمقالات
    const insertSampleArticles = `
      INSERT INTO articles (title, title_en, slug, content, content_en, description, description_en, meta_title, meta_description, meta_keywords, image_url, thumbnail_url, author, category) VALUES
      ('الدوري السعودي 2025: منافسة شرسة بين الأندية', 'Saudi League 2025: Fierce Competition Between Clubs', 'saudi-league-2025', 
       '<h1>الدوري السعودي 2025</h1><p>يشهد الدوري السعودي منافسة شرسة هذا الموسم بين الأندية الكبرى...</p>', 
       '<h1>Saudi League 2025</h1><p>The Saudi League is witnessing fierce competition this season between major clubs...</p>',
       'منافسة شرسة في الدوري السعودي هذا الموسم', 
       'Fierce competition in the Saudi League this season',
       'الدوري السعودي 2025 - منافسة شرسة بين الأندية',
       'يشهد الدوري السعودي منافسة شرسة هذا الموسم بين الأندية الكبرى. تعرف على آخر التطورات والنتائج.',
       'الدوري السعودي, كرة القدم, الأندية السعودية, 2025',
       'https://via.placeholder.com/800x400/1e3a8a/ffffff?text=الدوري+السعودي', 
       'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=الدوري+السعودي',
       'كسرة - Kasrah', 'رياضة')
      ON CONFLICT (slug) DO NOTHING;
    `;

    await pool.query(insertSampleArticles);
    console.log('✅ تم إضافة المقالات التجريبية بنجاح');

    // إضافة إعدادات الموقع الافتراضية
    const insertDefaultSettings = `
      INSERT INTO site_settings (setting_key, setting_value, setting_type) VALUES
      ('site_name', 'كسرة - Kasrah', 'text'),
      ('site_description', 'موقع رياضي متخصص في الأخبار والتحليلات', 'text'),
      ('site_keywords', 'رياضة, كرة القدم, أخبار رياضية, تحليلات', 'text'),
      ('site_logo', '', 'text'),
      ('site_favicon', '', 'text'),
      ('primary_color', '#1e3a8a', 'color'),
      ('secondary_color', '#3b82f6', 'color'),
      ('accent_color', '#f59e0b', 'color'),
      ('default_language', 'ar', 'text')
      ON CONFLICT (setting_key) DO NOTHING;
    `;

    await pool.query(insertDefaultSettings);
    console.log('✅ تم إضافة إعدادات الموقع الافتراضية بنجاح');

    console.log('🎉 تم إعداد قاعدة البيانات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إعداد قاعدة البيانات:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase(); 