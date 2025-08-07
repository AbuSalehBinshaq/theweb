// متغيرات عامة
let articles = [];
let currentUser = null;
let siteSettings = {};
let advertisements = [];

// التحقق من تسجيل الدخول
async function checkAuth() {
    try {
        const response = await fetch('/api/admin/articles');
        if (response.status === 401) {
            showLoginForm();
            return false;
        }
        return true;
    } catch (error) {
        showLoginForm();
        return false;
    }
}

// عرض نموذج تسجيل الدخول
function showLoginForm() {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="login-container">
                <div class="login-form">
                    <h2><i class="fas fa-lock"></i> تسجيل الدخول للوحة التحكم</h2>
                    <form id="loginForm" onsubmit="login(event)">
                        <div class="form-group">
                            <label for="username">اسم المستخدم:</label>
                            <input type="text" id="username" name="username" required>
                        </div>
                        <div class="form-group">
                            <label for="password">كلمة المرور:</label>
                            <input type="password" id="password" name="password" required>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
                        </button>
                    </form>
                </div>
            </div>
        `;
    }
}

// تسجيل الدخول
async function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = username;
            showNotification('تم تسجيل الدخول بنجاح', 'success');
            loadAdminPanel();
        } else {
            showNotification(data.error || 'فشل في تسجيل الدخول', 'error');
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showNotification('حدث خطأ في الاتصال', 'error');
    }
}

// تسجيل الخروج
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        showLoginForm();
        showNotification('تم تسجيل الخروج بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
    }
}

// تحميل لوحة التحكم
async function loadAdminPanel() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <div class="admin-header">
            <h2><i class="fas fa-cogs"></i> لوحة التحكم</h2>
            <div class="user-info">
                <span>مرحباً، ${currentUser}</span>
                <button onclick="logout()" class="btn btn-danger">
                    <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
                </button>
            </div>
        </div>
        
        <div class="admin-content">
            <div class="tabs">
                <button class="tab-btn active" onclick="showTab('articles', event)">
                    <i class="fas fa-newspaper"></i> المقالات
                </button>
                <button class="tab-btn" onclick="showTab('settings', event)">
                    <i class="fas fa-cog"></i> إعدادات الموقع
                </button>
                <button class="tab-btn" onclick="showTab('ads', event)">
                    <i class="fas fa-ad"></i> الإعلانات
                </button>
            </div>
            
            <div id="articles-tab" class="tab-content active">
                <div class="section">
                    <h3><i class="fas fa-newspaper"></i> إدارة المقالات</h3>
                    <button onclick="showAddArticleForm()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> إضافة مقال جديد
                    </button>
                    <div id="articles-list" class="articles-list">
                        <!-- سيتم تحميل المقالات هنا -->
                    </div>
                </div>
            </div>
            
            <div id="settings-tab" class="tab-content">
                <div class="section">
                    <h3><i class="fas fa-cog"></i> إعدادات الموقع</h3>
                    <div id="settings-form">
                        <!-- سيتم تحميل الإعدادات هنا -->
                    </div>
                </div>
            </div>
            
            <div id="ads-tab" class="tab-content">
                <div class="section">
                    <h3><i class="fas fa-ad"></i> إدارة الإعلانات</h3>
                    <button onclick="showAddAdForm()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> إضافة إعلان جديد
                    </button>
                    <div id="ads-list" class="ads-list">
                        <!-- سيتم تحميل الإعلانات هنا -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    await loadArticles();
    await loadSettings();
    await loadAds();
}

// عرض التبويبات
function showTab(tabName, event) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // إظهار التبويب المحدد
    document.getElementById(`${tabName}-tab`).classList.add('active');
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// تحميل المقالات
async function loadArticles() {
    try {
        const response = await fetch('/api/admin/articles');
        if (!response.ok) {
            throw new Error('فشل في جلب المقالات');
        }
        
        articles = await response.json();
        displayArticles();
    } catch (error) {
        console.error('خطأ في تحميل المقالات:', error);
        showNotification('حدث خطأ في تحميل المقالات', 'error');
    }
}

// عرض المقالات
function displayArticles() {
    const container = document.getElementById('articles-list');
    if (!container) return;
    
    if (articles.length === 0) {
        container.innerHTML = '<p class="no-articles">لا توجد مقالات</p>';
        return;
    }
    
    container.innerHTML = articles.map(article => `
        <div class="article-item" data-id="${article.id}">
            <div class="article-info">
                <h4>${article.title}</h4>
                <p>${article.description || 'لا يوجد وصف'}</p>
                <small>تاريخ النشر: ${formatDate(article.published_at)}</small>
                <small>الحالة: ${article.is_published ? 'منشور' : 'مسودة'}</small>
            </div>
            <div class="article-actions">
                <button onclick="editArticle(${article.id})" class="btn btn-primary">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button onclick="viewArticle('${article.slug}')" class="btn btn-info">
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button onclick="deleteArticle(${article.id})" class="btn btn-danger">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

// توليد الثامنيل تلقائيًا من أول صورة في المقال
function generateThumbnailFromContent(content) {
    if (!content) return '';
    
    // البحث عن أول صورة في المحتوى
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
    }
    
    // البحث عن روابط الصور
    const urlMatch = content.match(/https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp)/i);
    if (urlMatch) {
        return urlMatch[0];
    }
    
    return '';
}

// تحديث الثامنيل تلقائيًا عند تغيير المحتوى
function updateThumbnailFromContent() {
    const contentInput = document.getElementById('content');
    const thumbnailInput = document.getElementById('thumbnail_url');
    
    if (contentInput && thumbnailInput) {
        contentInput.addEventListener('input', function() {
            const thumbnail = generateThumbnailFromContent(this.value);
            if (thumbnail && !thumbnailInput.value) {
                thumbnailInput.value = thumbnail;
            }
        });
    }
}

// تحديث نموذج إضافة مقال ليشمل توليد الثامنيل التلقائي
function showAddArticleForm() {
    const container = document.getElementById('articles-list');
    if (!container) return;
    
    container.innerHTML = `
        <div class="article-form">
            <h4><i class="fas fa-plus"></i> إضافة مقال جديد</h4>
            <form id="addArticleForm" onsubmit="addArticle(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="title">عنوان المقال (عربي):</label>
                        <input type="text" id="title" name="title" required>
                    </div>
                    <div class="form-group">
                        <label for="title_en">عنوان المقال (إنجليزي):</label>
                        <input type="text" id="title_en" name="title_en">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="slug">رابط المقال:</label>
                    <input type="text" id="slug" name="slug" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="content">محتوى المقال (عربي):</label>
                        <textarea id="content" name="content" rows="10" required placeholder="اكتب محتوى المقال هنا..."></textarea>
                        <small class="help-text">سيتم توليد الثامنيل تلقائيًا من أول صورة في المحتوى</small>
                    </div>
                    <div class="form-group">
                        <label for="content_en">محتوى المقال (إنجليزي):</label>
                        <textarea id="content_en" name="content_en" rows="10" placeholder="اكتب محتوى المقال بالإنجليزية هنا..."></textarea>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="description">وصف المقال (عربي):</label>
                        <textarea id="description" name="description" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="description_en">وصف المقال (إنجليزي):</label>
                        <textarea id="description_en" name="description_en" rows="3"></textarea>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="meta_title">عنوان SEO:</label>
                    <input type="text" id="meta_title" name="meta_title">
                </div>
                
                <div class="form-group">
                    <label for="meta_description">وصف SEO:</label>
                    <textarea id="meta_description" name="meta_description" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="meta_keywords">الكلمات المفتاحية SEO:</label>
                    <input type="text" id="meta_keywords" name="meta_keywords" placeholder="كلمة1, كلمة2, كلمة3">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="image_url">رابط الصورة الرئيسية:</label>
                        <input type="url" id="image_url" name="image_url">
                    </div>
                    <div class="form-group">
                        <label for="thumbnail_url">رابط الصورة المصغرة:</label>
                        <input type="url" id="thumbnail_url" name="thumbnail_url" readonly>
                        <small class="help-text">سيتم توليدها تلقائيًا من المحتوى</small>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="category">التصنيف:</label>
                    <select id="category" name="category" required>
                        <option value="رياضة">رياضة</option>
                        <option value="كرة القدم">كرة القدم</option>
                        <option value="أخبار">أخبار</option>
                        <option value="تحليلات">تحليلات</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="language">اللغة الافتراضية:</label>
                    <select id="language" name="language">
                        <option value="ar">العربية</option>
                        <option value="en">الإنجليزية</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> إضافة المقال
                    </button>
                    <button type="button" onclick="loadArticles()" class="btn btn-secondary">
                        <i class="fas fa-times"></i> إلغاء
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // تفعيل توليد الثامنيل التلقائي
    updateThumbnailFromContent();
}

// إضافة مقال
async function addArticle(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const articleData = {
        title: formData.get('title'),
        title_en: formData.get('title_en'),
        slug: formData.get('slug'),
        content: formData.get('content'),
        content_en: formData.get('content_en'),
        description: formData.get('description'),
        description_en: formData.get('description_en'),
        meta_title: formData.get('meta_title'),
        meta_description: formData.get('meta_description'),
        meta_keywords: formData.get('meta_keywords'),
        image_url: formData.get('image_url'),
        thumbnail_url: formData.get('thumbnail_url'),
        category: formData.get('category'),
        language: formData.get('language')
    };
    
    try {
        const response = await fetch('/api/admin/articles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(articleData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('تم إضافة المقال بنجاح!', 'success');
            if (result.is_published) {
                showNotification('تم إنشاء ملف HTML للمقال تلقائياً', 'info');
            }
            loadArticles();
            resetForm();
        } else {
            showNotification(result.error || 'حدث خطأ في إضافة المقال', 'error');
        }
    } catch (error) {
        console.error('خطأ في إضافة المقال:', error);
        showNotification('حدث خطأ في الاتصال بالخادم', 'error');
    }
}

// تعديل مقال
async function editArticle(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    
    const container = document.getElementById('articles-list');
    if (!container) return;
    
    container.innerHTML = `
        <div class="article-form">
            <h4><i class="fas fa-edit"></i> تعديل المقال</h4>
            <form id="editArticleForm" onsubmit="updateArticle(event, ${articleId})">
                <div class="form-row">
                    <div class="form-group">
                        <label for="title">عنوان المقال (عربي):</label>
                        <input type="text" id="title" name="title" value="${article.title || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="title_en">عنوان المقال (إنجليزي):</label>
                        <input type="text" id="title_en" name="title_en" value="${article.title_en || ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="slug">رابط المقال:</label>
                    <input type="text" id="slug" name="slug" value="${article.slug || ''}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="content">محتوى المقال (عربي):</label>
                        <textarea id="content" name="content" rows="10" required>${article.content || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="content_en">محتوى المقال (إنجليزي):</label>
                        <textarea id="content_en" name="content_en" rows="10">${article.content_en || ''}</textarea>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="description">وصف المقال (عربي):</label>
                        <textarea id="description" name="description" rows="3">${article.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="description_en">وصف المقال (إنجليزي):</label>
                        <textarea id="description_en" name="description_en" rows="3">${article.description_en || ''}</textarea>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="meta_title">عنوان SEO:</label>
                    <input type="text" id="meta_title" name="meta_title" value="${article.meta_title || ''}">
                </div>
                
                <div class="form-group">
                    <label for="meta_description">وصف SEO:</label>
                    <textarea id="meta_description" name="meta_description" rows="3">${article.meta_description || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="meta_keywords">الكلمات المفتاحية SEO:</label>
                    <input type="text" id="meta_keywords" name="meta_keywords" value="${article.meta_keywords || ''}" placeholder="كلمة1, كلمة2, كلمة3">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="image_url">رابط الصورة الرئيسية:</label>
                        <input type="url" id="image_url" name="image_url" value="${article.image_url || ''}">
                    </div>
                    <div class="form-group">
                        <label for="thumbnail_url">رابط الصورة المصغرة:</label>
                        <input type="url" id="thumbnail_url" name="thumbnail_url" value="${article.thumbnail_url || ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="category">التصنيف:</label>
                    <select id="category" name="category" required>
                        <option value="رياضة" ${article.category === 'رياضة' ? 'selected' : ''}>رياضة</option>
                        <option value="كرة القدم" ${article.category === 'كرة القدم' ? 'selected' : ''}>كرة القدم</option>
                        <option value="أخبار" ${article.category === 'أخبار' ? 'selected' : ''}>أخبار</option>
                        <option value="تحليلات" ${article.category === 'تحليلات' ? 'selected' : ''}>تحليلات</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="language">اللغة الافتراضية:</label>
                    <select id="language" name="language">
                        <option value="ar" ${article.language === 'ar' ? 'selected' : ''}>العربية</option>
                        <option value="en" ${article.language === 'en' ? 'selected' : ''}>الإنجليزية</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="is_published" name="is_published" ${article.is_published ? 'checked' : ''}>
                        مقال منشور
                    </label>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> حفظ التغييرات
                    </button>
                    <button type="button" onclick="loadArticles()" class="btn btn-secondary">
                        <i class="fas fa-times"></i> إلغاء
                    </button>
                </div>
            </form>
        </div>
    `;
}

// تحديث مقال
async function updateArticle(event, articleId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const articleData = {
        title: formData.get('title'),
        title_en: formData.get('title_en'),
        slug: formData.get('slug'),
        content: formData.get('content'),
        content_en: formData.get('content_en'),
        description: formData.get('description'),
        description_en: formData.get('description_en'),
        meta_title: formData.get('meta_title'),
        meta_description: formData.get('meta_description'),
        meta_keywords: formData.get('meta_keywords'),
        image_url: formData.get('image_url'),
        thumbnail_url: formData.get('thumbnail_url'),
        category: formData.get('category'),
        language: formData.get('language'),
        is_published: formData.get('is_published') === 'on'
    };
    
    try {
        const response = await fetch(`/api/admin/articles/${articleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(articleData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('تم تحديث المقال بنجاح!', 'success');
            if (result.is_published) {
                showNotification('تم تحديث ملف HTML للمقال', 'info');
            } else {
                showNotification('تم حذف ملف HTML للمقال (غير منشور)', 'info');
            }
            loadArticles();
            resetForm();
        } else {
            showNotification(result.error || 'حدث خطأ في تحديث المقال', 'error');
        }
    } catch (error) {
        console.error('خطأ في تحديث المقال:', error);
        showNotification('حدث خطأ في تحديث المقال', 'error');
    }
}

// حذف مقال
async function deleteArticle(articleId) {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/articles/${articleId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('تم حذف المقال وملف HTML بنجاح!', 'success');
            loadArticles();
        } else {
            showNotification(result.error || 'حدث خطأ في حذف المقال', 'error');
        }
    } catch (error) {
        console.error('خطأ في حذف المقال:', error);
        showNotification('حدث خطأ في حذف المقال', 'error');
    }
}

// عرض مقال
function viewArticle(slug) {
    window.open(`/articles/${slug}.html`, '_blank');
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('ar-SA', options);
}

// عرض إشعار
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
}); 

// تحميل الإعدادات
async function loadSettings() {
    try {
        console.log('جاري تحميل الإعدادات...');
        const response = await fetch('/api/settings');
        if (response.ok) {
            siteSettings = await response.json();
            console.log('تم تحميل الإعدادات:', siteSettings);
            displaySettings();
        } else {
            console.error('فشل في تحميل الإعدادات:', response.status);
            showNotification('فشل في تحميل الإعدادات', 'error');
        }
    } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error);
        showNotification('حدث خطأ في تحميل الإعدادات', 'error');
    }
}

// عرض الإعدادات
function displaySettings() {
    const container = document.getElementById('settings-form');
    if (!container) return;
    
    // التأكد من أن siteSettings موجود
    if (!siteSettings || Object.keys(siteSettings).length === 0) {
        container.innerHTML = '<div class="loading">جاري تحميل الإعدادات...</div>';
        return;
    }
    
    container.innerHTML = `
        <form id="settingsForm" onsubmit="saveSettings(event)">
            <div class="form-group">
                <label for="site_name">اسم الموقع:</label>
                <input type="text" id="site_name" name="site_name" value="${siteSettings.site_name || ''}" required>
            </div>
            
            <div class="form-group">
                <label for="site_description">وصف الموقع:</label>
                <textarea id="site_description" name="site_description" rows="3">${siteSettings.site_description || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label for="site_keywords">الكلمات المفتاحية:</label>
                <input type="text" id="site_keywords" name="site_keywords" value="${siteSettings.site_keywords || ''}">
            </div>
            
            <div class="form-group">
                <label for="primary_color">اللون الأساسي:</label>
                <input type="color" id="primary_color" name="primary_color" value="${siteSettings.primary_color || '#1e3a8a'}">
            </div>
            
            <div class="form-group">
                <label for="secondary_color">اللون الثانوي:</label>
                <input type="color" id="secondary_color" name="secondary_color" value="${siteSettings.secondary_color || '#3b82f6'}">
            </div>
            
            <div class="form-group">
                <label for="accent_color">لون التمييز:</label>
                <input type="color" id="accent_color" name="accent_color" value="${siteSettings.accent_color || '#f59e0b'}">
            </div>
            
            <div class="form-group">
                <label for="site_logo">رابط الشعار:</label>
                <input type="url" id="site_logo" name="site_logo" value="${siteSettings.site_logo || ''}">
            </div>
            
            <div class="form-group">
                <label for="site_favicon">رابط الأيقونة:</label>
                <input type="url" id="site_favicon" name="site_favicon" value="${siteSettings.site_favicon || ''}">
            </div>
            
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> حفظ الإعدادات
            </button>
        </form>
    `;
}

// حفظ الإعدادات
async function saveSettings(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const settings = {};
    
    for (const [key, value] of formData.entries()) {
        settings[key] = value;
    }
    
    try {
        console.log('جاري حفظ الإعدادات:', settings);
        const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification(result.message || 'تم حفظ الإعدادات بنجاح', 'success');
            await loadSettings(); // إعادة تحميل الإعدادات
        } else {
            const data = await response.json();
            console.error('فشل في حفظ الإعدادات:', data);
            showNotification(data.error || 'فشل في حفظ الإعدادات', 'error');
        }
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
        showNotification('حدث خطأ في الاتصال', 'error');
    }
}

// تحميل الإعلانات
async function loadAds() {
    try {
        const response = await fetch('/api/admin/ads');
        if (response.ok) {
            advertisements = await response.json();
            displayAds();
        }
    } catch (error) {
        console.error('خطأ في تحميل الإعلانات:', error);
    }
}

// عرض الإعلانات
function displayAds() {
    const container = document.getElementById('ads-list');
    if (!container) return;
    
    if (advertisements.length === 0) {
        container.innerHTML = '<div class="no-ads">لا توجد إعلانات</div>';
        return;
    }
    
    container.innerHTML = advertisements.map(ad => `
        <div class="ad-item">
            <div class="ad-info">
                <h4>${ad.name}</h4>
                <p><strong>الموقع:</strong> ${ad.position}</p>
                <p><strong>الحالة:</strong> ${ad.is_active ? 'نشط' : 'غير نشط'}</p>
                <small>تم الإنشاء: ${formatDate(ad.created_at)}</small>
            </div>
            <div class="ad-actions">
                <button onclick="editAd(${ad.id})" class="btn btn-sm btn-primary">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button onclick="toggleAd(${ad.id}, ${!ad.is_active})" class="btn btn-sm ${ad.is_active ? 'btn-warning' : 'btn-success'}">
                    <i class="fas fa-${ad.is_active ? 'eye-slash' : 'eye'}"></i> ${ad.is_active ? 'إخفاء' : 'إظهار'}
                </button>
                <button onclick="deleteAd(${ad.id})" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

// عرض نموذج إضافة إعلان
function showAddAdForm() {
    const container = document.getElementById('ads-list');
    if (!container) return;
    
    container.innerHTML = `
        <div class="ad-form">
            <h4><i class="fas fa-plus"></i> إضافة إعلان جديد</h4>
            <form id="addAdForm" onsubmit="addAd(event)">
                <div class="form-group">
                    <label for="ad_name">اسم الإعلان:</label>
                    <input type="text" id="ad_name" name="name" required>
                </div>
                
                <div class="form-group">
                    <label for="ad_position">موقع الإعلان:</label>
                    <select id="ad_position" name="position" required>
                        <option value="header">الهيدر</option>
                        <option value="sidebar">الشريط الجانبي</option>
                        <option value="content">بين المحتوى</option>
                        <option value="footer">التذييل</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="ad_code">كود الإعلان (HTML/JavaScript):</label>
                    <textarea id="ad_code" name="ad_code" rows="6" required></textarea>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="ad_active" name="is_active" checked>
                        إعلان نشط
                    </label>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> إضافة الإعلان
                    </button>
                    <button type="button" onclick="loadAds()" class="btn btn-secondary">
                        <i class="fas fa-times"></i> إلغاء
                    </button>
                </div>
            </form>
        </div>
    `;
}

// إضافة إعلان
async function addAd(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const adData = {
        name: formData.get('name'),
        position: formData.get('position'),
        ad_code: formData.get('ad_code'),
        is_active: formData.get('is_active') === 'on'
    };
    
    try {
        const response = await fetch('/api/admin/ads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(adData)
        });
        
        if (response.ok) {
            showNotification('تم إضافة الإعلان بنجاح', 'success');
            await loadAds();
        } else {
            const data = await response.json();
            showNotification(data.error || 'فشل في إضافة الإعلان', 'error');
        }
    } catch (error) {
        console.error('خطأ في إضافة الإعلان:', error);
        showNotification('حدث خطأ في الاتصال', 'error');
    }
}

// تعديل إعلان
async function editAd(adId) {
    const ad = advertisements.find(a => a.id === adId);
    if (!ad) return;
    
    const container = document.getElementById('ads-list');
    if (!container) return;
    
    container.innerHTML = `
        <div class="ad-form">
            <h4><i class="fas fa-edit"></i> تعديل الإعلان</h4>
            <form id="editAdForm" onsubmit="updateAd(event, ${adId})">
                <div class="form-group">
                    <label for="ad_name">اسم الإعلان:</label>
                    <input type="text" id="ad_name" name="name" value="${ad.name}" required>
                </div>
                
                <div class="form-group">
                    <label for="ad_position">موقع الإعلان:</label>
                    <select id="ad_position" name="position" required>
                        <option value="header" ${ad.position === 'header' ? 'selected' : ''}>الهيدر</option>
                        <option value="sidebar" ${ad.position === 'sidebar' ? 'selected' : ''}>الشريط الجانبي</option>
                        <option value="content" ${ad.position === 'content' ? 'selected' : ''}>بين المحتوى</option>
                        <option value="footer" ${ad.position === 'footer' ? 'selected' : ''}>التذييل</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="ad_code">كود الإعلان (HTML/JavaScript):</label>
                    <textarea id="ad_code" name="ad_code" rows="6" required>${ad.ad_code}</textarea>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="ad_active" name="is_active" ${ad.is_active ? 'checked' : ''}>
                        إعلان نشط
                    </label>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> حفظ التغييرات
                    </button>
                    <button type="button" onclick="loadAds()" class="btn btn-secondary">
                        <i class="fas fa-times"></i> إلغاء
                    </button>
                </div>
            </form>
        </div>
    `;
}

// تحديث إعلان
async function updateAd(event, adId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const adData = {
        name: formData.get('name'),
        position: formData.get('position'),
        ad_code: formData.get('ad_code'),
        is_active: formData.get('is_active') === 'on'
    };
    
    try {
        const response = await fetch(`/api/admin/ads/${adId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(adData)
        });
        
        if (response.ok) {
            showNotification('تم تحديث الإعلان بنجاح', 'success');
            await loadAds();
        } else {
            const data = await response.json();
            showNotification(data.error || 'فشل في تحديث الإعلان', 'error');
        }
    } catch (error) {
        console.error('خطأ في تحديث الإعلان:', error);
        showNotification('حدث خطأ في الاتصال', 'error');
    }
}

// تبديل حالة الإعلان
async function toggleAd(adId, isActive) {
    const ad = advertisements.find(a => a.id === adId);
    if (!ad) return;
    
    try {
        const response = await fetch(`/api/admin/ads/${adId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: ad.name,
                position: ad.position,
                ad_code: ad.ad_code,
                is_active: isActive
            })
        });
        
        if (response.ok) {
            showNotification(`تم ${isActive ? 'إظهار' : 'إخفاء'} الإعلان بنجاح`, 'success');
            await loadAds();
        } else {
            const data = await response.json();
            showNotification(data.error || 'فشل في تحديث الإعلان', 'error');
        }
    } catch (error) {
        console.error('خطأ في تحديث الإعلان:', error);
        showNotification('حدث خطأ في الاتصال', 'error');
    }
}

// حذف إعلان
async function deleteAd(adId) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    
    try {
        const response = await fetch(`/api/admin/ads/${adId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('تم حذف الإعلان بنجاح', 'success');
            await loadAds();
        } else {
            const data = await response.json();
            showNotification(data.error || 'فشل في حذف الإعلان', 'error');
        }
    } catch (error) {
        console.error('خطأ في حذف الإعلان:', error);
        showNotification('حدث خطأ في الاتصال', 'error');
    }
} 

const fs = require('fs');
const path = require('path');

// دالة إنشاء ملف HTML للمقال
async function generateArticleHTML(article) {
  try {
    // قراءة قالب المقال
    const templatePath = path.join(__dirname, 'templates', 'article-template.html');
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // استبدال المتغيرات في القالب
    const replacements = {
      '{{TITLE}}': article.title || article.title_en || 'مقال جديد',
      '{{DESCRIPTION}}': article.description || article.description_en || '',
      '{{IMAGE}}': article.image_url || article.thumbnail_url || '',
      '{{URL}}': `${process.env.SITE_URL || 'http://localhost:3000'}/articles/${article.slug}.html`,
      '{{AUTHOR}}': article.author || 'كسرة - Kasrah',
      '{{PUBLISH_DATE}}': new Date(article.published_at).toLocaleDateString('ar-SA'),
      '{{CONTENT}}': article.content || article.content_en || '',
      '{{SLUG}}': article.slug,
      '{{CATEGORY}}': article.category || '',
      '{{META_TITLE}}': article.meta_title || article.title || article.title_en,
      '{{META_DESCRIPTION}}': article.meta_description || article.description || article.description_en,
      '{{META_KEYWORDS}}': article.meta_keywords || ''
    };
    
    // تطبيق الاستبدالات
    Object.keys(replacements).forEach(key => {
      template = template.replace(new RegExp(key, 'g'), replacements[key]);
    });
    
    // إنشاء مجلد المقالات إذا لم يكن موجوداً
    const articlesDir = path.join(__dirname, 'articles');
    if (!fs.existsSync(articlesDir)) {
      fs.mkdirSync(articlesDir, { recursive: true });
    }
    
    // إنشاء ملف HTML
    const filePath = path.join(articlesDir, `${article.slug}.html`);
    fs.writeFileSync(filePath, template, 'utf8');
    
    console.log(`✅ تم إنشاء ملف HTML للمقال: ${article.slug}.html`);
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

// إضافة أزرار إنشاء الملفات
function addGenerateHTMLButton() {
    const actionsContainer = document.querySelector('.actions-container') || document.createElement('div');
    actionsContainer.className = 'actions-container';
    
    const generateArticlesButton = document.createElement('button');
    generateArticlesButton.className = 'btn btn-secondary';
    generateArticlesButton.innerHTML = '<i class="fas fa-file-code"></i> إنشاء ملفات المقالات';
    generateArticlesButton.onclick = generateAllArticleHTML;
    
    const generateIndexButton = document.createElement('button');
    generateIndexButton.className = 'btn btn-primary';
    generateIndexButton.innerHTML = '<i class="fas fa-home"></i> إنشاء الصفحة الرئيسية';
    generateIndexButton.onclick = generateIndexHTML;
    
    actionsContainer.appendChild(generateArticlesButton);
    actionsContainer.appendChild(generateIndexButton);
    
    // إضافة الزر إلى الصفحة
    const existingContainer = document.querySelector('.actions-container');
    if (!existingContainer) {
        document.querySelector('.content').insertBefore(actionsContainer, document.querySelector('.content').firstChild);
    }
}

// دالة إنشاء جميع ملفات HTML
async function generateAllArticleHTML() {
    try {
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإنشاء...';
        button.disabled = true;
        
        const response = await fetch('/api/admin/generate-all-articles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`تم إنشاء ${result.successCount} ملف بنجاح!`, 'success');
        } else {
            showNotification('حدث خطأ في إنشاء الملفات', 'error');
        }
    } catch (error) {
        console.error('خطأ في إنشاء ملفات HTML:', error);
        showNotification('حدث خطأ في إنشاء الملفات', 'error');
    } finally {
        const button = event.target;
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// دالة إنشاء الصفحة الرئيسية
async function generateIndexHTML() {
    try {
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإنشاء...';
        button.disabled = true;
        
        const response = await fetch('/api/admin/generate-index', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('تم إنشاء الصفحة الرئيسية بنجاح!', 'success');
        } else {
            showNotification('حدث خطأ في إنشاء الصفحة الرئيسية', 'error');
        }
    } catch (error) {
        console.error('خطأ في إنشاء الصفحة الرئيسية:', error);
        showNotification('حدث خطأ في إنشاء الصفحة الرئيسية', 'error');
    } finally {
        const button = event.target;
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// إضافة الزر عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    addGenerateHTMLButton();
}); 