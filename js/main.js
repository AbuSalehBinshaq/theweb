// متغيرات عامة
let articles = [];
let currentLanguage = localStorage.getItem('language') || 'ar';
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let advertisements = [];

// تحميل المقالات من قاعدة البيانات
async function loadArticles() {
    try {
        const response = await fetch(`/api/articles?lang=${currentLanguage}`);
        if (!response.ok) {
            throw new Error('فشل في جلب المقالات');
        }
        articles = await response.json();
        displayArticles(articles);
    } catch (error) {
        console.error('خطأ في تحميل المقالات:', error);
        displayError(getText('errorLoadingArticles'));
    }
}

// تحميل الإعلانات
async function loadAdvertisements() {
    try {
        const response = await fetch('/api/ads');
        if (response.ok) {
            advertisements = await response.json();
            displayAdvertisements();
        }
    } catch (error) {
        console.error('خطأ في تحميل الإعلانات:', error);
    }
}

// عرض الإعلانات
function displayAdvertisements() {
    // عرض إعلان الهيدر
    const headerAd = advertisements.find(ad => ad.position === 'header' && ad.is_active);
    if (headerAd) {
        const headerContainer = document.querySelector('.header');
        if (headerContainer) {
            const adDiv = document.createElement('div');
            adDiv.className = 'header-ad';
            adDiv.innerHTML = headerAd.ad_code;
            headerContainer.appendChild(adDiv);
        }
    }
    
    // عرض إعلان بين المحتوى
    const contentAd = advertisements.find(ad => ad.position === 'content' && ad.is_active);
    if (contentAd && articles.length > 0) {
        const articlesContainer = document.getElementById('articlesContainer');
        if (articlesContainer) {
            const adDiv = document.createElement('div');
            adDiv.className = 'content-ad';
            adDiv.innerHTML = contentAd.ad_code;
            
            // إدراج الإعلان بعد المقال الثالث
            const articles = articlesContainer.querySelectorAll('.article-card');
            if (articles.length >= 3) {
                articlesContainer.insertBefore(adDiv, articles[2].nextSibling);
            } else {
                articlesContainer.appendChild(adDiv);
            }
        }
    }
}

// عرض المقالات
function displayArticles(articlesToShow) {
    const container = document.getElementById('articlesContainer');
    if (!container) return;

    if (articlesToShow.length === 0) {
        container.innerHTML = `<div class="no-articles">${getText('noArticles')}</div>`;
        return;
    }

    container.innerHTML = articlesToShow.map(article => `
        <div class="article-card" onclick="openArticle('${article.slug}')">
            <div class="article-image">
                <img src="${article.thumbnail_url || article.image_url || 'https://via.placeholder.com/400x250/1e3a8a/ffffff?text=كسرة'}" 
                     alt="${article.title}" loading="lazy">
            </div>
            <div class="article-content">
                <h3 class="article-title">${article.title}</h3>
                <p class="article-description">${article.description || ''}</p>
                <div class="article-meta">
                    <span class="article-author">${getText('by')}: ${article.author}</span>
                    <span class="article-date">${formatDate(article.published_at)}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // عرض الإعلانات بعد عرض المقالات
    displayAdvertisements();
}

// فتح مقال
function openArticle(slug) {
    window.location.href = `/articles/${slug}`;
}

// البحث في المقالات
function searchArticles() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayArticles(articles);
        return;
    }

    const filteredArticles = articles.filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        (article.description && article.description.toLowerCase().includes(searchTerm))
    );

    displayArticles(filteredArticles);
}

// تبديل اللغة
function toggleLanguage() {
    currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    localStorage.setItem('language', currentLanguage);
    
    // تحديث اتجاه الصفحة
    document.body.setAttribute('dir', currentLanguage === 'ar' ? 'rtl' : 'ltr');
    document.body.setAttribute('lang', currentLanguage);
    
    // تحديث النصوص
    updateLanguageTexts();
    
    // إعادة تحميل المقالات باللغة الجديدة
    loadArticles();
}

// تحديث النصوص حسب اللغة
function updateLanguageTexts() {
    // تحديث نص تبديل اللغة
    const langText = document.getElementById('lang-text');
    if (langText) {
        langText.textContent = currentLanguage === 'ar' ? 'EN' : 'AR';
    }
    
    // تحديث عنوان الموقع
    const siteTitle = document.getElementById('site-title');
    if (siteTitle) {
        siteTitle.textContent = currentLanguage === 'ar' ? 'كسرة - KASRAH' : 'KASRAH - كسرة';
    }
    
    // تحديث نص التحميل
    const loadingText = document.getElementById('loading-text');
    if (loadingText) {
        loadingText.textContent = getText('loadingArticles');
    }
    
    // تحديث النصوص في الشريط السفلي
    const navHome = document.getElementById('nav-home');
    const navNews = document.getElementById('nav-news');
    const navCompetitions = document.getElementById('nav-competitions');
    const navFavorites = document.getElementById('nav-favorites');
    const navMore = document.getElementById('nav-more');
    
    if (navHome) navHome.textContent = getText('home');
    if (navNews) navNews.textContent = getText('news');
    if (navCompetitions) navCompetitions.textContent = getText('competitions');
    if (navFavorites) navFavorites.textContent = getText('favorites');
    if (navMore) navMore.textContent = getText('more');
    
    // تحديث placeholder البحث
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.placeholder = getText('searchPlaceholder');
    }
    
    // تحديث جميع النصوص الثابتة في الصفحة
    updateStaticTexts();
}

// تحديث النصوص الثابتة
function updateStaticTexts() {
    // تحديث جميع العناصر التي تحتوي على نصوص ثابتة
    const staticElements = document.querySelectorAll('[data-translate]');
    staticElements.forEach(element => {
        const key = element.getAttribute('data-translate');
        element.textContent = getText(key);
    });
    
    // تحديث عناصر placeholder
    const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        element.placeholder = getText(key);
    });
    
    // تحديث عناصر title
    const titleElements = document.querySelectorAll('[data-translate-title]');
    titleElements.forEach(element => {
        const key = element.getAttribute('data-translate-title');
        element.title = getText(key);
    });
}

// الحصول على النص حسب اللغة
function getText(key) {
    const texts = {
        ar: {
            searchPlaceholder: 'البحث في المقالات...',
            noArticles: 'لا توجد مقالات متاحة',
            loadingArticles: 'جاري تحميل المقالات...',
            errorLoadingArticles: 'حدث خطأ في تحميل المقالات',
            favorites: 'المفضلة',
            news: 'أخبار',
            competitions: 'بطولات',
            more: 'المزيد',
            home: 'الرئيسية',
            by: 'من',
            siteTitle: 'كسرة - KASRAH',
            siteDescription: 'موقع رياضي شامل يقدم آخر الأخبار والتحليلات في عالم كرة القدم',
            keywords: 'كرة القدم, أخبار رياضية, دوري سعودي, دوري أبطال أوروبا, كأس العالم',
            searchButton: 'بحث',
            loading: 'جاري التحميل...',
            error: 'حدث خطأ',
            noResults: 'لا توجد نتائج',
            readMore: 'اقرأ المزيد',
            share: 'مشاركة',
            save: 'حفظ',
            cancel: 'إلغاء',
            confirm: 'تأكيد',
            delete: 'حذف',
            edit: 'تعديل',
            add: 'إضافة',
            close: 'إغلاق',
            back: 'رجوع',
            next: 'التالي',
            previous: 'السابق',
            first: 'الأول',
            last: 'الأخير',
            page: 'صفحة',
            of: 'من',
            results: 'نتائج',
            showing: 'عرض',
            to: 'إلى',
            items: 'عناصر',
            all: 'الكل',
            none: 'لا شيء',
            select: 'اختر',
            selected: 'محدد',
            clear: 'مسح',
            filter: 'تصفية',
            sort: 'ترتيب',
            refresh: 'تحديث',
            reload: 'إعادة تحميل',
            submit: 'إرسال',
            reset: 'إعادة تعيين',
            saveChanges: 'حفظ التغييرات',
            discardChanges: 'إلغاء التغييرات',
            unsavedChanges: 'تغييرات غير محفوظة',
            areYouSure: 'هل أنت متأكد؟',
            yes: 'نعم',
            no: 'لا',
            ok: 'موافق',
            success: 'نجح',
            warning: 'تحذير',
            info: 'معلومات',
            error: 'خطأ',
            notice: 'ملاحظة',
            help: 'مساعدة',
            about: 'حول',
            contact: 'اتصل بنا',
            privacy: 'الخصوصية',
            terms: 'الشروط',
            cookies: 'ملفات تعريف الارتباط',
            sitemap: 'خريطة الموقع',
            accessibility: 'إمكانية الوصول',
            feedback: 'تعليقات',
            report: 'إبلاغ',
            support: 'الدعم',
            faq: 'الأسئلة الشائعة',
            documentation: 'الوثائق',
            api: 'واجهة برمجة التطبيقات',
            developer: 'المطور',
            changelog: 'سجل التغييرات',
            version: 'الإصدار',
            license: 'الترخيص',
            credits: 'الاعتمادات',
            contributors: 'المساهمون',
            sponsors: 'الرعاة',
            donate: 'تبرع',
            subscribe: 'اشتراك',
            unsubscribe: 'إلغاء الاشتراك',
            newsletter: 'النشرة الإخبارية',
            notifications: 'الإشعارات',
            settings: 'الإعدادات',
            profile: 'الملف الشخصي',
            account: 'الحساب',
            login: 'تسجيل الدخول',
            logout: 'تسجيل الخروج',
            register: 'تسجيل',
            signup: 'إنشاء حساب',
            signin: 'تسجيل الدخول',
            forgotPassword: 'نسيت كلمة المرور؟',
            resetPassword: 'إعادة تعيين كلمة المرور',
            changePassword: 'تغيير كلمة المرور',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            confirmPassword: 'تأكيد كلمة المرور',
            username: 'اسم المستخدم',
            fullName: 'الاسم الكامل',
            firstName: 'الاسم الأول',
            lastName: 'اسم العائلة',
            phone: 'الهاتف',
            address: 'العنوان',
            city: 'المدينة',
            country: 'البلد',
            zipCode: 'الرمز البريدي',
            birthday: 'تاريخ الميلاد',
            gender: 'الجنس',
            male: 'ذكر',
            female: 'أنثى',
            other: 'آخر',
            avatar: 'الصورة الشخصية',
            bio: 'السيرة الذاتية',
            website: 'الموقع الإلكتروني',
            socialMedia: 'وسائل التواصل الاجتماعي',
            facebook: 'فيسبوك',
            twitter: 'تويتر',
            instagram: 'إنستغرام',
            linkedin: 'لينكد إن',
            youtube: 'يوتيوب',
            tiktok: 'تيك توك',
            snapchat: 'سناب شات',
            telegram: 'تليجرام',
            whatsapp: 'واتساب',
            discord: 'ديسكورد',
            reddit: 'ريديت',
            pinterest: 'بينتريست',
            tumblr: 'تمبلر',
            medium: 'ميديوم',
            github: 'جيت هب',
            stackoverflow: 'ستاك أوفرفلو',
            quora: 'كورا',
            behance: 'بيهانس',
            dribbble: 'دريببل',
            figma: 'فيجما',
            sketch: 'سكتش',
            adobe: 'أدوبي',
            microsoft: 'مايكروسوفت',
            google: 'جوجل',
            apple: 'أبل',
            amazon: 'أمازون',
            netflix: 'نتفليكس',
            spotify: 'سبوتيفاي',
            uber: 'أوبر',
            airbnb: 'إير بي إن بي',
            dropbox: 'دروب بوكس',
            slack: 'سلاك',
            zoom: 'زوم',
            skype: 'سكايب',
            viber: 'فايبر',
            line: 'لاين',
            wechat: 'وي تشات',
            qq: 'كيو كيو',
            weibo: 'ويبو',
            renren: 'رن رن',
            baidu: 'بايدو',
            alibaba: 'علي بابا',
            tencent: 'تينسنت',
            xiaomi: 'شاومي',
            huawei: 'هواوي',
            oppo: 'أوبو',
            vivo: 'فيفو',
            oneplus: 'ون بلس',
            samsung: 'سامسونج',
            sony: 'سوني',
            lg: 'إل جي',
            panasonic: 'باناسونيك',
            sharp: 'شارب',
            toshiba: 'توشيبا',
            hitachi: 'هيتاشي',
            mitsubishi: 'ميتسوبيشي',
            nissan: 'نيسان',
            toyota: 'تويوتا',
            honda: 'هوندا',
            mazda: 'مازدا',
            subaru: 'سوبارو',
            suzuki: 'سوزوكي',
            daihatsu: 'دايهاتسو',
            lexus: 'لكزس',
            infiniti: 'إنفينيتي',
            acura: 'أكورا',
            buick: 'بويك',
            cadillac: 'كاديلاك',
            chevrolet: 'شيفروليه',
            chrysler: 'كرايسلر',
            dodge: 'دودج',
            ford: 'فورد',
            gmc: 'جي إم سي',
            jeep: 'جيب',
            lincoln: 'لينكون',
            mercury: 'ميركوري',
            pontiac: 'بونتياك',
            saturn: 'ساترن',
            oldsmobile: 'أولدزموبيل',
            plymouth: 'بلايموث',
            amc: 'إيه إم سي',
            studebaker: 'ستوديبيكر',
            packard: 'باكارد',
            hudson: 'هدسون',
            nash: 'ناش',
            rambler: 'رامبلر',
            willys: 'ويليس',
            kaiser: 'كايزر',
            frazer: 'فرايزر',
            henry: 'هنري',
            essex: 'إسكس',
            terraplane: 'تيرابلين',
            graham: 'جراهام',
            reo: 'ريو',
            moon: 'مون',
            pierce: 'بيرس',
            auburn: 'أوبورن',
            cord: 'كورد',
            duesenberg: 'دوزنبرج',
            stutz: 'ستوتز',
            franklin: 'فرانكلين',
            air: 'إير',
            stephens: 'ستيفنز',
            davis: 'ديفيس',
            tucker: 'تكر',
            // نصوص صفحة المزيد
            dashboard: 'لوحة التحكم',
            dashboardDescription: 'إدارة المقالات والمحتوى',
            loginToDashboard: 'الدخول للوحة التحكم',
            aboutDescription: 'معلومات عن كسرة - KASRAH',
            viewInfo: 'عرض المعلومات',
            settingsDescription: 'تخصيص تجربة التصفح',
            openSettings: 'فتح الإعدادات',
            contactDescription: 'راسلنا عبر البريد الإلكتروني',
            sendMessage: 'إرسال رسالة',
            mobileApp: 'تطبيق الجوال',
            mobileAppDescription: 'حمل تطبيق كسرة للهاتف',
            appInfo: 'معلومات التطبيق',
            helpDescription: 'دليل الاستخدام والأسئلة الشائعة',
            viewHelp: 'عرض المساعدة',
            aboutKasrah: 'حول كسرة - KASRAH',
            kasrahDescription: 'كسرة - KASRAH',
            kasrahFullDescription: 'هو موقع رياضي عربي متخصص في تغطية الأخبار الرياضية المحلية والعالمية.',
            weOffer: 'نقدم لكم:',
            latestFootballNews: 'أحدث أخبار كرة القدم',
            saudiLeagueCoverage: 'تغطية شاملة للدوري السعودي',
            europeanChampionships: 'أخبار البطولات الأوروبية',
            worldTeamsNews: 'أخبار المنتخبات العالمية',
            specializedAnalysis: 'تحليلات رياضية متخصصة',
            releaseDate: 'تاريخ الإطلاق:',
            defaultLanguage: 'اللغة الافتراضية:',
            arabic: 'العربية',
            english: 'English',
            articlesPerPage: 'عدد المقالات في الصفحة:',
            fiveArticles: '5 مقالات',
            tenArticles: '10 مقالات',
            fifteenArticles: '15 مقالة',
            twentyArticles: '20 مقالة',
            enableNotifications: 'تفعيل الإشعارات',
            darkMode: 'الوضع المظلم',
            saveSettings: 'حفظ الإعدادات',
            mobileAppTitle: 'تطبيق كسرة للجوال',
            mobileAppAvailable: 'تطبيق كسرة للهاتف المحمول متوفر قريباً على:',
            googlePlay: 'Google Play',
            appStore: 'App Store',
            appFeatures: 'مميزات التطبيق:',
            instantNotifications: 'إشعارات فورية للأخبار المهمة',
            fastBrowsing: 'تصفح سريع وسهل',
            saveArticles: 'حفظ المقالات للقراءة لاحقاً',
            easySharing: 'مشاركة سهلة على وسائل التواصل',
            helpAndFAQ: 'المساعدة والأسئلة الشائعة',
            howToSearch: 'كيف أبحث عن مقال معين؟',
            searchAnswer: 'اضغط على أيقونة البحث في الأعلى واكتب الكلمات المفتاحية.',
            howToAddFavorite: 'كيف أضيف مقال للمفضلة؟',
            favoriteAnswer: 'اضغط على أيقونة القلب في صفحة المقال.',
            howToShare: 'كيف أشارك مقال؟',
            shareAnswer: 'استخدم أزرار المشاركة في نهاية كل مقال.',
            howToChangeLanguage: 'كيف أغير اللغة؟',
            languageAnswer: 'اضغط على زر تغيير اللغة في الأعلى.'
        },
        en: {
            searchPlaceholder: 'Search articles...',
            noArticles: 'No articles available',
            loadingArticles: 'Loading articles...',
            errorLoadingArticles: 'Error loading articles',
            favorites: 'Favorites',
            news: 'News',
            competitions: 'Competitions',
            more: 'More',
            home: 'Home',
            by: 'By',
            siteTitle: 'KASRAH - كسرة',
            siteDescription: 'Comprehensive sports website providing the latest news and analysis in the world of football',
            keywords: 'football, sports news, Saudi league, Champions League, World Cup',
            searchButton: 'Search',
            loading: 'Loading...',
            error: 'Error occurred',
            noResults: 'No results found',
            readMore: 'Read More',
            share: 'Share',
            save: 'Save',
            cancel: 'Cancel',
            confirm: 'Confirm',
            delete: 'Delete',
            edit: 'Edit',
            add: 'Add',
            close: 'Close',
            back: 'Back',
            next: 'Next',
            previous: 'Previous',
            first: 'First',
            last: 'Last',
            page: 'Page',
            of: 'of',
            results: 'results',
            showing: 'Showing',
            to: 'to',
            items: 'items',
            all: 'All',
            none: 'None',
            select: 'Select',
            selected: 'Selected',
            clear: 'Clear',
            filter: 'Filter',
            sort: 'Sort',
            refresh: 'Refresh',
            reload: 'Reload',
            submit: 'Submit',
            reset: 'Reset',
            saveChanges: 'Save Changes',
            discardChanges: 'Discard Changes',
            unsavedChanges: 'Unsaved Changes',
            areYouSure: 'Are you sure?',
            yes: 'Yes',
            no: 'No',
            ok: 'OK',
            success: 'Success',
            warning: 'Warning',
            info: 'Information',
            error: 'Error',
            notice: 'Notice',
            help: 'Help',
            about: 'About',
            contact: 'Contact Us',
            privacy: 'Privacy',
            terms: 'Terms',
            cookies: 'Cookies',
            sitemap: 'Sitemap',
            accessibility: 'Accessibility',
            feedback: 'Feedback',
            report: 'Report',
            support: 'Support',
            faq: 'FAQ',
            documentation: 'Documentation',
            api: 'API',
            developer: 'Developer',
            changelog: 'Changelog',
            version: 'Version',
            license: 'License',
            credits: 'Credits',
            contributors: 'Contributors',
            sponsors: 'Sponsors',
            donate: 'Donate',
            subscribe: 'Subscribe',
            unsubscribe: 'Unsubscribe',
            newsletter: 'Newsletter',
            notifications: 'Notifications',
            settings: 'Settings',
            profile: 'Profile',
            account: 'Account',
            login: 'Login',
            logout: 'Logout',
            register: 'Register',
            signup: 'Sign Up',
            signin: 'Sign In',
            forgotPassword: 'Forgot Password?',
            resetPassword: 'Reset Password',
            changePassword: 'Change Password',
            email: 'Email',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            username: 'Username',
            fullName: 'Full Name',
            firstName: 'First Name',
            lastName: 'Last Name',
            phone: 'Phone',
            address: 'Address',
            city: 'City',
            country: 'Country',
            zipCode: 'ZIP Code',
            birthday: 'Birthday',
            gender: 'Gender',
            male: 'Male',
            female: 'Female',
            other: 'Other',
            avatar: 'Avatar',
            bio: 'Bio',
            website: 'Website',
            socialMedia: 'Social Media',
            facebook: 'Facebook',
            twitter: 'Twitter',
            instagram: 'Instagram',
            linkedin: 'LinkedIn',
            youtube: 'YouTube',
            tiktok: 'TikTok',
            snapchat: 'Snapchat',
            telegram: 'Telegram',
            whatsapp: 'WhatsApp',
            discord: 'Discord',
            reddit: 'Reddit',
            pinterest: 'Pinterest',
            tumblr: 'Tumblr',
            medium: 'Medium',
            github: 'GitHub',
            stackoverflow: 'Stack Overflow',
            quora: 'Quora',
            behance: 'Behance',
            dribbble: 'Dribbble',
            figma: 'Figma',
            sketch: 'Sketch',
            adobe: 'Adobe',
            microsoft: 'Microsoft',
            google: 'Google',
            apple: 'Apple',
            amazon: 'Amazon',
            netflix: 'Netflix',
            spotify: 'Spotify',
            uber: 'Uber',
            airbnb: 'Airbnb',
            dropbox: 'Dropbox',
            slack: 'Slack',
            zoom: 'Zoom',
            skype: 'Skype',
            viber: 'Viber',
            line: 'Line',
            wechat: 'WeChat',
            qq: 'QQ',
            weibo: 'Weibo',
            renren: 'Renren',
            baidu: 'Baidu',
            alibaba: 'Alibaba',
            tencent: 'Tencent',
            xiaomi: 'Xiaomi',
            huawei: 'Huawei',
            oppo: 'OPPO',
            vivo: 'vivo',
            oneplus: 'OnePlus',
            samsung: 'Samsung',
            sony: 'Sony',
            lg: 'LG',
            panasonic: 'Panasonic',
            sharp: 'Sharp',
            toshiba: 'Toshiba',
            hitachi: 'Hitachi',
            mitsubishi: 'Mitsubishi',
            nissan: 'Nissan',
            toyota: 'Toyota',
            honda: 'Honda',
            mazda: 'Mazda',
            subaru: 'Subaru',
            suzuki: 'Suzuki',
            daihatsu: 'Daihatsu',
            lexus: 'Lexus',
            infiniti: 'Infiniti',
            acura: 'Acura',
            buick: 'Buick',
            cadillac: 'Cadillac',
            chevrolet: 'Chevrolet',
            chrysler: 'Chrysler',
            dodge: 'Dodge',
            ford: 'Ford',
            gmc: 'GMC',
            jeep: 'Jeep',
            lincoln: 'Lincoln',
            mercury: 'Mercury',
            pontiac: 'Pontiac',
            saturn: 'Saturn',
            oldsmobile: 'Oldsmobile',
            plymouth: 'Plymouth',
            amc: 'AMC',
            studebaker: 'Studebaker',
            packard: 'Packard',
            hudson: 'Hudson',
            nash: 'Nash',
            rambler: 'Rambler',
            willys: 'Willys',
            kaiser: 'Kaiser',
            frazer: 'Frazer',
            henry: 'Henry',
            essex: 'Essex',
            terraplane: 'Terraplane',
            graham: 'Graham',
            reo: 'REO',
            moon: 'Moon',
            pierce: 'Pierce',
            auburn: 'Auburn',
            cord: 'Cord',
            duesenberg: 'Duesenberg',
            stutz: 'Stutz',
            franklin: 'Franklin',
            air: 'Air',
            stephens: 'Stephens',
            davis: 'Davis',
            tucker: 'Tucker',
            // نصوص صفحة المزيد باللغة الإنجليزية
            dashboard: 'Dashboard',
            dashboardDescription: 'Manage articles and content',
            loginToDashboard: 'Login to Dashboard',
            aboutDescription: 'Information about KASRAH',
            viewInfo: 'View Information',
            settingsDescription: 'Customize browsing experience',
            openSettings: 'Open Settings',
            contactDescription: 'Contact us via email',
            sendMessage: 'Send Message',
            mobileApp: 'Mobile App',
            mobileAppDescription: 'Download KASRAH mobile app',
            appInfo: 'App Information',
            helpDescription: 'User guide and frequently asked questions',
            viewHelp: 'View Help',
            aboutKasrah: 'About KASRAH',
            kasrahDescription: 'KASRAH',
            kasrahFullDescription: 'is an Arabic sports website specialized in covering local and international sports news.',
            weOffer: 'We offer you:',
            latestFootballNews: 'Latest football news',
            saudiLeagueCoverage: 'Comprehensive coverage of Saudi League',
            europeanChampionships: 'European championships news',
            worldTeamsNews: 'World teams news',
            specializedAnalysis: 'Specialized sports analysis',
            releaseDate: 'Release Date:',
            defaultLanguage: 'Default Language:',
            arabic: 'Arabic',
            english: 'English',
            articlesPerPage: 'Articles per page:',
            fiveArticles: '5 articles',
            tenArticles: '10 articles',
            fifteenArticles: '15 articles',
            twentyArticles: '20 articles',
            enableNotifications: 'Enable notifications',
            darkMode: 'Dark mode',
            saveSettings: 'Save Settings',
            mobileAppTitle: 'KASRAH Mobile App',
            mobileAppAvailable: 'KASRAH mobile app will be available soon on:',
            googlePlay: 'Google Play',
            appStore: 'App Store',
            appFeatures: 'App features:',
            instantNotifications: 'Instant notifications for important news',
            fastBrowsing: 'Fast and easy browsing',
            saveArticles: 'Save articles for later reading',
            easySharing: 'Easy sharing on social media',
            helpAndFAQ: 'Help and FAQ',
            howToSearch: 'How do I search for a specific article?',
            searchAnswer: 'Click on the search icon at the top and type keywords.',
            howToAddFavorite: 'How do I add an article to favorites?',
            favoriteAnswer: 'Click on the heart icon in the article page.',
            howToShare: 'How do I share an article?',
            shareAnswer: 'Use the share buttons at the end of each article.',
            howToChangeLanguage: 'How do I change the language?',
            languageAnswer: 'Click on the language switch button at the top.'
        }
    };
    
    return texts[currentLanguage][key] || texts.ar[key] || key;
}

// تنسيق التاريخ
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return currentLanguage === 'ar' ? 'منذ يوم' : '1 day ago';
    } else if (diffDays < 7) {
        return currentLanguage === 'ar' ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString(currentLanguage === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// عرض رسالة خطأ
function displayError(message) {
    const container = document.getElementById('articlesContainer');
    if (container) {
        container.innerHTML = `<div class="error-message">${message}</div>`;
    }
}

// تبديل المفضلة
function toggleFavorite(articleId) {
    const index = favorites.indexOf(articleId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(articleId);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// التحقق من البحث من URL
function checkSearchFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    if (searchTerm) {
        document.getElementById('searchInput').value = searchTerm;
        searchArticles();
    }
}

// تبديل البحث
function toggleSearch() {
    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBar.classList.contains('active')) {
        searchBar.classList.remove('active');
        searchInput.value = '';
        displayArticles(articles);
    } else {
        searchBar.classList.add('active');
        searchInput.focus();
    }
}

// إعداد الأحداث
document.addEventListener('DOMContentLoaded', function() {
    // تطبيق اللغة المحفوظة
    document.body.setAttribute('dir', currentLanguage === 'ar' ? 'rtl' : 'ltr');
    document.body.setAttribute('lang', currentLanguage);
    
    // تحديث النصوص
    updateLanguageTexts();
    
    // تحميل المقالات
    loadArticles();
    
    // تحميل الإعلانات
    loadAdvertisements();
    
    // إعداد البحث
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchArticles);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchArticles();
            }
        });
    }
    
    // التحقق من البحث من URL
    checkSearchFromURL();
}); 
