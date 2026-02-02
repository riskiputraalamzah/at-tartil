/**
 * E-Kitab At-Tartil - Flipbook Reader
 * TPQ AMANAH Sawotratap
 * 
 * Fixed: Simple responsive sizing that actually works
 */

// ===== State =====
let currentJilid = 1;
let pageFlip = null;
const MAX_PAGES = 36;
let showingCover = true;

// ===== DOM Elements Cache =====
let elements = null;

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', init);

function init() {
  elements = {
    bookSelection: document.getElementById('bookSelection'),
    flipbookReader: document.getElementById('flipbookReader'),
    coverView: document.getElementById('coverView'),
    coverImage: document.getElementById('coverImage'),
    flipbookContainer: document.getElementById('flipbookContainer'),
    toolbarTitle: document.getElementById('toolbarTitle'),
    toolbarPage: document.getElementById('toolbarPage'),
    pageSelect: document.getElementById('pageSelect'),
    navPrev: document.getElementById('navPrev'),
    navNext: document.getElementById('navNext'),
    mobilePrev: document.getElementById('mobilePrev'),
    mobileNext: document.getElementById('mobileNext'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    iconExpand: document.getElementById('iconExpand'),
    iconCompress: document.getElementById('iconCompress'),
    year: document.getElementById('year')
  };

  if (elements.year) {
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    elements.year.textContent = startYear === currentYear ? startYear : `${startYear} - ${currentYear}`;
  }

  populatePageSelector();
  setupImageLoaders(); // Add skeleton loading handlers
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
}

// ===== Page Selector =====
function populatePageSelector() {
  const select = elements.pageSelect;
  if (!select) return;

  select.innerHTML = '<option value="0">Cover</option>';
  for (let i = 1; i <= MAX_PAGES; i++) {
    const option = document.createElement('option');
    option.value = i.toString();
    option.textContent = `Hal ${i}`;
    select.appendChild(option);
  }
}

// ===== Setup Image Loaders =====
function setupImageLoaders() {
  // Setup skeleton loaders for all book cover images
  const bookCovers = document.querySelectorAll('.book-cover-wrap');
  bookCovers.forEach(cover => {
    const img = cover.querySelector('img');
    if (img) {
      if (img.complete) {
        cover.classList.add('loaded');
      } else {
        img.addEventListener('load', () => {
          cover.classList.add('loaded');
        });
        img.addEventListener('error', () => {
          cover.classList.add('loaded'); // Still remove skeleton on error
        });
      }
    }
  });
}

// ===== Get Page URLs =====
function getPageUrls(jilid) {
  const urls = [];
  for (let i = 1; i <= MAX_PAGES; i++) {
    urls.push(`img/tartil${jilid}/${i}.png`);
  }
  return urls;
}

// ===== Calculate Size - SIMPLE VIEWPORT BASED =====
function getFlipbookSize() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw < 768;

  // Reserve space for UI elements
  const toolbarHeight = 70;
  const footerHeight = 80;
  const padding = 30;
  const availHeight = vh - toolbarHeight - footerHeight - padding;

  let pageWidth, pageHeight;

  if (isMobile) {
    // Mobile: single page, fill width
    pageWidth = Math.min(vw * 0.85, 400);
    pageHeight = pageWidth * 1.4; // taller than wide

    // But don't exceed height
    if (pageHeight > availHeight * 0.9) {
      pageHeight = availHeight * 0.9;
      pageWidth = pageHeight * 0.7;
    }
  } else {
    // Desktop: double spread
    pageHeight = Math.min(availHeight * 0.88, 550);
    pageWidth = pageHeight * 0.7;

    // Check double width fits
    const totalWidth = (pageWidth * 2) + 20;
    if (totalWidth > vw * 0.75) {
      pageWidth = ((vw * 0.75) - 20) / 2;
      pageHeight = pageWidth / 0.7;
    }
  }

  console.log('Flipbook size:', { vw, vh, pageWidth: Math.floor(pageWidth), pageHeight: Math.floor(pageHeight), isMobile });

  return {
    width: Math.floor(pageWidth),
    height: Math.floor(pageHeight)
  };
}

// ===== Open Book =====
function openBook(jilid) {
  currentJilid = jilid;
  showingCover = true;

  if (elements.toolbarTitle) {
    elements.toolbarTitle.textContent = `At-Tartil Jilid ${jilid}`;
  }

  elements.bookSelection.classList.add('hidden');
  elements.flipbookReader.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  showCover(jilid);
}

// ===== Show Cover =====
function showCover(jilid) {
  showingCover = true;

  const coverWrapper = document.querySelector('.cover-wrapper');
  if (coverWrapper) {
    coverWrapper.classList.remove('loaded');
  }

  if (elements.coverImage) {
    elements.coverImage.classList.remove('loaded');
    elements.coverImage.src = `img/tartil${jilid}/cover.webp`;
    elements.coverImage.alt = `Cover At-Tartil Jilid ${jilid}`;

    // Add load handlers
    if (elements.coverImage.complete) {
      elements.coverImage.classList.add('loaded');
      if (coverWrapper) coverWrapper.classList.add('loaded');
    } else {
      elements.coverImage.addEventListener('load', function handleLoad() {
        elements.coverImage.classList.add('loaded');
        if (coverWrapper) coverWrapper.classList.add('loaded');
        elements.coverImage.removeEventListener('load', handleLoad);
      });
      elements.coverImage.addEventListener('error', function handleError() {
        elements.coverImage.classList.add('loaded');
        if (coverWrapper) coverWrapper.classList.add('loaded');
        elements.coverImage.removeEventListener('error', handleError);
      });
    }
  }

  elements.coverView.classList.remove('hidden');
  elements.flipbookContainer.classList.add('hidden');

  updatePageInfo(0);
  updateNavButtonsForCover();
}

// ===== Start Reading =====
function startReading() {
  showingCover = false;

  elements.coverView.classList.add('hidden');
  elements.flipbookContainer.classList.remove('hidden');

  destroyFlipbook();

  setTimeout(() => {
    createFlipbook(currentJilid);
  }, 50);
}

// ===== Destroy Flipbook =====
function destroyFlipbook() {
  if (pageFlip) {
    try { pageFlip.destroy(); } catch (e) { }
    pageFlip = null;
  }

  const container = elements.flipbookContainer;
  if (container) {
    container.innerHTML = '<div id="flipbook" class="flipbook"></div>';
  }
}

// ===== Create Flipbook =====
function createFlipbook(jilid) {
  const flipbookEl = document.getElementById('flipbook');
  if (!flipbookEl) return;

  const size = getFlipbookSize();
  const pageUrls = getPageUrls(jilid);

  // Create pages
  pageUrls.forEach((url, index) => {
    const page = document.createElement('div');
    page.className = 'page-content';
    page.dataset.density = 'soft';

    const img = document.createElement('img');
    img.src = url;
    img.alt = `Halaman ${index + 1}`;
    img.loading = index < 4 ? 'eager' : 'lazy';
    img.draggable = false;

    // Add loading handlers
    img.addEventListener('load', () => {
      page.classList.add('loaded');
    });
    img.addEventListener('error', () => {
      page.classList.add('loaded');
    });

    page.appendChild(img);
    flipbookEl.appendChild(page);
  });

  try {
    pageFlip = new St.PageFlip(flipbookEl, {
      width: size.width,
      height: size.height,
      size: 'fixed',
      minWidth: size.width,
      maxWidth: size.width,
      minHeight: size.height,
      maxHeight: size.height,
      showCover: false,
      mobileScrollSupport: false,
      maxShadowOpacity: 0.4,
      drawShadow: true,
      flippingTime: 500,
      usePortrait: window.innerWidth < 768,
      startZIndex: 0,
      autoSize: false,
      clickEventForward: true,
      useMouseEvents: true,
      swipeDistance: 30,
      showPageCorners: true,
      disableFlipByClick: false
    });

    const pages = flipbookEl.querySelectorAll('.page-content');
    pageFlip.loadFromHTML(pages);

    pageFlip.on('flip', (e) => {
      updatePageInfo(e.data + 1);
    });
    pageFlip.on('changeState', () => updateNavButtons());

    updatePageInfo(1);
    updateNavButtons();

  } catch (error) {
    console.error('Flipbook error:', error);
  }
}

// ===== Update Page Info =====
function updatePageInfo(pageIndex) {
  const display = pageIndex === 0 ? 'Cover' : pageIndex;

  if (elements.toolbarPage) {
    elements.toolbarPage.textContent = `${display} / ${MAX_PAGES}`;
  }

  if (elements.pageSelect) {
    elements.pageSelect.value = Math.min(pageIndex, MAX_PAGES).toString();
  }
}

// ===== Update Nav Buttons - Cover =====
function updateNavButtonsForCover() {
  if (elements.navPrev) elements.navPrev.disabled = true;
  if (elements.navNext) elements.navNext.disabled = false;
  if (elements.mobilePrev) elements.mobilePrev.disabled = true;
  if (elements.mobileNext) elements.mobileNext.disabled = false;
}

// ===== Update Nav Buttons - Flipbook =====
function updateNavButtons() {
  if (!pageFlip) return;

  try {
    const current = pageFlip.getCurrentPageIndex();
    const total = pageFlip.getPageCount();

    const isLast = current >= total - (window.innerWidth >= 768 ? 2 : 1);

    if (elements.navPrev) elements.navPrev.disabled = false;
    if (elements.navNext) elements.navNext.disabled = isLast;
    if (elements.mobilePrev) elements.mobilePrev.disabled = false;
    if (elements.mobileNext) elements.mobileNext.disabled = isLast;
  } catch (e) { }
}

// ===== Navigation =====
function flipPrev() {
  if (showingCover) return;

  if (pageFlip) {
    const current = pageFlip.getCurrentPageIndex();
    if (current <= 0) {
      showCover(currentJilid);
      destroyFlipbook();
    } else {
      try { pageFlip.flipPrev(); } catch (e) { }
    }
  }
}

function flipNext() {
  if (showingCover) {
    startReading();
    return;
  }

  if (pageFlip) {
    try { pageFlip.flipNext(); } catch (e) { }
  }
}

function flipToPage(pageIndex) {
  if (pageIndex === 0) {
    showCover(currentJilid);
    destroyFlipbook();
    return;
  }

  if (showingCover) {
    startReading();
    setTimeout(() => {
      if (pageFlip) {
        try { pageFlip.flip(pageIndex - 1); } catch (e) { }
      }
    }, 300);
    return;
  }

  if (pageFlip) {
    try { pageFlip.flip(pageIndex - 1); } catch (e) { }
  }
}

// ===== Close Book =====
function closeBook() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => { });
  }

  // Add closing animation
  elements.flipbookReader.classList.add('closing');

  // Wait for animation to complete before hiding
  setTimeout(() => {
    destroyFlipbook();
    showingCover = true;

    elements.flipbookReader.classList.add('hidden');
    elements.flipbookReader.classList.remove('closing');
    elements.bookSelection.classList.remove('hidden');
    document.body.style.overflow = '';
  }, 300); // Match animation duration
}

// ===== Keyboard Navigation =====
function handleKeydown(e) {
  if (!elements.flipbookReader || elements.flipbookReader.classList.contains('hidden')) return;

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      flipPrev();
      break;
    case 'ArrowRight':
      e.preventDefault();
      flipNext();
      break;
    case 'Escape':
      if (!document.fullscreenElement) closeBook();
      break;
    case 'Home':
      e.preventDefault();
      flipToPage(0);
      break;
    case 'End':
      e.preventDefault();
      flipToPage(MAX_PAGES);
      break;
    case 'f':
    case 'F':
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleFullscreen();
      }
      break;
  }
}

// ===== Fullscreen =====
function toggleFullscreen() {
  const reader = elements.flipbookReader;
  if (!reader) return;

  if (!document.fullscreenElement) {
    const req = reader.requestFullscreen || reader.webkitRequestFullscreen;
    if (req) req.call(reader).catch(() => { });
  } else {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) exit.call(document);
  }
}

function handleFullscreenChange() {
  const isFS = !!document.fullscreenElement || !!document.webkitFullscreenElement;

  if (elements.iconExpand) elements.iconExpand.classList.toggle('hidden', isFS);
  if (elements.iconCompress) elements.iconCompress.classList.toggle('hidden', !isFS);

  if (pageFlip && !showingCover) {
    setTimeout(() => {
      try {
        const size = getFlipbookSize();
        pageFlip.updateFromSettings({
          width: size.width,
          height: size.height
        });
      } catch (e) { }
    }, 300);
  }
}

// ===== Window Resize =====
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (pageFlip && !showingCover && !elements.flipbookReader.classList.contains('hidden')) {
      try {
        const size = getFlipbookSize();
        pageFlip.updateFromSettings({
          width: size.width,
          height: size.height,
          usePortrait: window.innerWidth < 768
        });
      } catch (e) { }
    }
  }, 200);
});
