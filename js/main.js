// متغيرات عامة
let articles = [];
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let advertisements = [];
let currentHeroIndex = 0;
let heroSlides = [];
// تحميل المقالات من قاعدة البيانات
async function loadArticles() {
    try {
        const response = await fetch('/api/articles');
        if (!response.ok) {
            throw new Error('فشل في جلب المقالات');
        }
        articles = await response.json();
        displayArticles(articles);
    } catch (error) {
        console.error('خطأ في تحميل المقالات:', error);
        displayError('حدث خطأ في تحميل المقالات');
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
        container.innerHTML = `<div class="no-articles">لا توجد مقالات متاحة</div>`;
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
                    <span class="article-author">من: ${article.author}</span>
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





// تنسيق التاريخ
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'منذ يوم';
    } else if (diffDays < 7) {
        return `منذ ${diffDays} أيام`;
    } else {
        return date.toLocaleDateString('ar-SA', {
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



function displayHeroArticles(heroArticles) {
    const slider = document.getElementById('heroSlider');
    if (!slider) return;
    slider.innerHTML = "";
    heroSlides = heroArticles;
    heroArticles.forEach((article, i) => {
        const slide = document.createElement('div');
        slide.className = 'hero-slide';
        slide.innerHTML = `
          <div class="hero-article">
            <img src="${article.image_url || article.thumbnail_url || 'https://via.placeholder.com/800x450/1e3a8a/ffffff?text=خبر'}" alt="${article.title}">
            <div class="hero-overlay">
              <h2>${article.title}</h2>
              <p>${article.description || ''}</p>
              <a href="/article/${article.slug}" class="read-more">اقرأ المزيد</a>
            </div>
          </div>
        `;
        slider.appendChild(slide);
    });
    moveHeroSlide(0);
}


function moveHeroSlide(idx) {
    const slider = document.getElementById('heroSlider');
    if (!slider || heroSlides.length === 0) return;
    currentHeroIndex = ((idx % heroSlides.length) + heroSlides.length) % heroSlides.length;
    slider.style.transform = `translateX(${-currentHeroIndex * 100}%)`;
}

// أزرار التنقل ودعم السحب
document.addEventListener("DOMContentLoaded", function() {
    // أزرار السلايدر
    const prevBtn = document.getElementById('heroPrev');
    const nextBtn = document.getElementById('heroNext');
    if (prevBtn && nextBtn) {
        prevBtn.onclick = () => moveHeroSlide(currentHeroIndex - 1);
        nextBtn.onclick = () => moveHeroSlide(currentHeroIndex + 1);
    }

    // دعم السحب باللمس للموبايل
    let startX = 0;
    let deltaX = 0;
    let dragging = false;
    const slider = document.getElementById('heroSlider');
    if (slider) {
        slider.addEventListener('touchstart', (e) => {
            dragging = true;
            startX = e.touches[0].clientX;
        });
        slider.addEventListener('touchmove', (e) => {
            if (!dragging) return;
            deltaX = e.touches[0].clientX - startX;
        });
        slider.addEventListener('touchend', () => {
            if (!dragging) return;
            if (deltaX > 60) moveHeroSlide(currentHeroIndex - 1); // سحب يمين
            else if (deltaX < -60) moveHeroSlide(currentHeroIndex + 1); // سحب يسار
            dragging = false;
            deltaX = 0;
        });
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
