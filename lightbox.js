(function () {
  const style = document.createElement('style');
  style.textContent = `
    .global-lightbox {
      position: fixed;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      padding: 24px;
      box-sizing: border-box;
      cursor: zoom-out;
    }
    .global-lightbox.open {
      display: flex;
    }
    .global-lightbox img {
      max-width: min(95vw, 1400px);
      max-height: 92vh;
      width: auto;
      height: auto;
      border: 2px solid white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      background: white;
      cursor: auto;
    }
    .global-lightbox button {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      border: none;
      background: transparent;
      color: #fff;
      font-size: 42px;
      line-height: 1;
      cursor: pointer;
      padding: 0 8px;
      user-select: none;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
    }
    .global-lightbox button:hover {
      opacity: 0.75;
    }
    .global-lightbox button:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .global-lightbox .lightbox-prev {
      left: 16px;
    }
    .global-lightbox .lightbox-next {
      right: 16px;
    }
    img[data-lightbox-ready="true"] {
      cursor: zoom-in;
    }
  `;
  document.head.appendChild(style);

  const lightbox = document.createElement('div');
  lightbox.className = 'global-lightbox';
  lightbox.setAttribute('aria-hidden', 'true');

  const expandedImage = document.createElement('img');
  expandedImage.alt = '';
  const prevButton = document.createElement('button');
  prevButton.className = 'lightbox-prev';
  prevButton.type = 'button';
  prevButton.setAttribute('aria-label', 'Previous image');
  prevButton.textContent = '<';
  const nextButton = document.createElement('button');
  nextButton.className = 'lightbox-next';
  nextButton.type = 'button';
  nextButton.setAttribute('aria-label', 'Next image');
  nextButton.textContent = '>';
  lightbox.appendChild(prevButton);
  lightbox.appendChild(expandedImage);
  lightbox.appendChild(nextButton);
  document.body.appendChild(lightbox);

  const isDisplayPhoto = (img) => {
    if (!(img instanceof HTMLImageElement)) return false;
    if (img.closest('a')) return false; // Keep link behavior intact (logos/nav/icons)
    if (img.closest('noscript')) return false;
    if (img.closest('[data-no-lightbox="true"]')) return false;
    const src = (img.getAttribute('src') || '').toLowerCase();
    if (!src || src.startsWith('http')) return false;
    return true;
  };

  document.querySelectorAll('img').forEach((img) => {
    if (isDisplayPhoto(img)) {
      img.setAttribute('data-lightbox-ready', 'true');
    }
  });

  const galleryImages = Array.from(
    document.querySelectorAll('img[data-lightbox-ready="true"]')
  );
  const hasMultipleImages = galleryImages.length > 1;
  let currentIndex = -1;
  let openedFromImage = null;
  let touchStartX = null;
  let touchStartY = null;

  const updateImage = () => {
    const selected = galleryImages[currentIndex];
    if (!selected) return;
    expandedImage.src = selected.currentSrc || selected.src;
    expandedImage.alt = selected.alt || '';
  };

  const goTo = (index) => {
    if (!hasMultipleImages) return;
    if (!galleryImages.length) return;
    if (index < 0) index = galleryImages.length - 1;
    if (index >= galleryImages.length) index = 0;
    currentIndex = index;
    updateImage();
  };

  if (!hasMultipleImages) {
    prevButton.style.display = 'none';
    nextButton.style.display = 'none';
  }

  document.addEventListener('click', (event) => {
    const img = event.target.closest('img[data-lightbox-ready="true"]');
    if (!img) return;
    openedFromImage = img;
    currentIndex = galleryImages.indexOf(img);
    updateImage();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  });

  const close = () => {
    const activeThumb =
      currentIndex >= 0 && currentIndex < galleryImages.length
        ? galleryImages[currentIndex]
        : openedFromImage;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    expandedImage.src = '';
    if (activeThumb) {
      requestAnimationFrame(() => {
        activeThumb.scrollIntoView({ block: 'center', inline: 'nearest' });
      });
    }
    openedFromImage = null;
    currentIndex = -1;
  };

  prevButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!lightbox.classList.contains('open')) return;
    goTo(currentIndex - 1);
  });

  nextButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!lightbox.classList.contains('open')) return;
    goTo(currentIndex + 1);
  });

  lightbox.addEventListener(
    'touchstart',
    (event) => {
      if (!lightbox.classList.contains('open')) return;
      if (!event.touches || event.touches.length !== 1) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    },
    { passive: true }
  );

  lightbox.addEventListener(
    'touchend',
    (event) => {
      if (!lightbox.classList.contains('open')) return;
      if (touchStartX === null || touchStartY === null) return;
      const touch = event.changedTouches && event.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const swipeThreshold = 40;

      if (absX > swipeThreshold && absX > absY) {
        if (deltaX < 0) {
          goTo(currentIndex + 1);
        } else {
          goTo(currentIndex - 1);
        }
      }

      touchStartX = null;
      touchStartY = null;
    },
    { passive: true }
  );

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) close();
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('open')) return;
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key === 'ArrowLeft') {
      goTo(currentIndex - 1);
      return;
    }
    if (event.key === 'ArrowRight') {
      goTo(currentIndex + 1);
    }
  });
})();
