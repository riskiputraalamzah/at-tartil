// Pastikan import firebase dan fungsi lainnya tetap di atas

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  const modalElement = document.getElementById("tartilModal");
  const pageSelector = document.getElementById("pageSelector");
  const prevPageButton = document.getElementById("prevPage");
  const nextPageButton = document.getElementById("nextPage");
  const currentImage = document.getElementById("currentImage");
  const fullscreenToggle = document.getElementById("fullscreenToggle");
  const tartilNumSpan = document.getElementById("tartilNum");

  let currentPage = 0;
  let currentTartil = 1;
  let isLoadingImageInModal = false;
  const MAX_PAGES = 36; // Definisikan jumlah halaman maksimal

  // BARU: Variabel untuk deteksi swipe
  let touchStartX = 0;
  let touchEndX = 0;
  let isSwiping = false; // Untuk memastikan touchend tidak diproses jika touchstart tidak diawali pada gambar
  const SWIPE_THRESHOLD = 50;

  // ...

  // BARU: Fungsi untuk menangani awal sentuhan
  function handleTouchStart(event) {
    // Hanya proses sentuhan pertama jika ada multiple touches
    if (event.touches.length === 1) {
      touchStartX = event.changedTouches[0].clientX; // Menggunakan clientX untuk konsistensi
      isSwiping = true; // Tandai bahwa swipe dimulai dari elemen ini
      console.log("handleTouchStart triggered. StartX:", touchStartX);
    }
  }

  // BARU: Fungsi untuk menangani akhir sentuhan
  function handleTouchEnd(event) {
    if (!isSwiping || event.changedTouches.length !== 1) {
      // Jika swipe tidak dimulai dari sini atau ada multiple touches, abaikan
      isSwiping = false;
      return;
    }

    touchEndX = event.changedTouches[0].clientX; // Menggunakan clientX
    console.log("handleTouchEnd triggered. EndX:", touchEndX);

    if (isLoadingImageInModal) {
      console.log("Image is loading, swipe ignored.");
      isSwiping = false;
      return;
    }
    handleSwipeGesture();
    isSwiping = false; // Reset setelah proses swipe
  }

  // BARU: Fungsi untuk memproses gestur swipe
  function handleSwipeGesture() {
    const deltaX = touchEndX - touchStartX;
    console.log(
      "handleSwipeGesture. DeltaX:",
      deltaX,
      "Threshold:",
      SWIPE_THRESHOLD
    );

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) {
      console.log("Swipe distance too short.");
      return; // Swipe tidak cukup jauh
    }

    if (deltaX > 0) {
      // Jari bergerak dari kiri ke kanan
      console.log("Swipe Right Detected -> goToPrevPage");
      goToPrevPage();
    } else {
      // Jari bergerak dari kanan ke kiri
      console.log("Swipe Left Detected -> goToNextPage");
      goToNextPage();
    }

    // Reset nilai tidak perlu di sini karena sudah dihandle oleh isSwiping
    // touchStartX = 0;
    // touchEndX = 0;
  }

  modalElement.addEventListener("show.bs.modal", (event) => {
    const button = event.relatedTarget;
    currentTartil = button.closest(".card").getAttribute("data-tartil");
    if (tartilNumSpan) tartilNumSpan.textContent = currentTartil;
    currentPage = 0;
    if (pageSelector) pageSelector.value = currentPage;
    updateImage();
    document.addEventListener("keydown", handleModalKeyNavigation);

    // BARU: Tambahkan event listener untuk swipe pada gambar di dalam modal
    // Gunakan { passive: true } untuk performa yang lebih baik jika tidak memanggil preventDefault() di handler
    currentImage.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    currentImage.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });
  });

  modalElement.addEventListener("hidden.bs.modal", () => {
    isLoadingImageInModal = false;
    const existingSpinner = currentImage.parentElement.querySelector(
      ".image-loading-spinner"
    );
    if (existingSpinner) existingSpinner.remove();
    if (currentImage) currentImage.classList.remove("hidden");
    currentImage.src = "";
    document.removeEventListener("keydown", handleModalKeyNavigation);

    // BARU: Hapus event listener swipe saat modal ditutup
    currentImage.removeEventListener("touchstart", handleTouchStart);
    currentImage.removeEventListener("touchend", handleTouchEnd);

    if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .catch((err) =>
          console.error("Error exiting fullscreen on modal close:", err.message)
        );
    }
  });

  if (pageSelector) {
    pageSelector.innerHTML = "";
    const coverOption = document.createElement("option");
    coverOption.value = 0;
    coverOption.textContent = "Cover";
    pageSelector.appendChild(coverOption);
    for (let i = 1; i <= MAX_PAGES; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `Halaman ${i}`;
      pageSelector.appendChild(option);
    }
  }

  const updateImage = () => {
    if (isLoadingImageInModal && currentImage.src !== "") return;
    isLoadingImageInModal = true;

    if (prevPageButton) prevPageButton.disabled = true;
    if (nextPageButton) nextPageButton.disabled = true;
    if (pageSelector) pageSelector.disabled = true;

    currentImage.classList.add("hidden");

    let spinnerDiv = currentImage.parentElement.querySelector(
      ".image-loading-spinner"
    );
    if (spinnerDiv) spinnerDiv.remove();

    spinnerDiv = document.createElement("div");
    spinnerDiv.className =
      "d-flex justify-content-center gap-2 image-loading-spinner";
    spinnerDiv.setAttribute("role", "status");
    for (let i = 0; i < 3; i++) {
      const spinner = document.createElement("div");
      spinner.className = "spinner-grow text-light";
      spinner.innerHTML = '<span class="visually-hidden">Loading...</span>';
      spinnerDiv.appendChild(spinner);
    }
    currentImage.parentElement.appendChild(spinnerDiv);

    const pagePath = currentPage === 0 ? "cover" : currentPage;
    const imageUrl = `img/tartil${currentTartil}/${pagePath}.png`;
    const tempImg = new Image();

    const loadSuccess = () => {
      currentImage.src = tempImg.src;
      currentImage.alt = `Halaman ${
        currentPage === 0 ? "Cover" : currentPage
      } dari Tartil ${currentTartil}`;
      if (spinnerDiv && spinnerDiv.parentNode) spinnerDiv.remove();
      currentImage.classList.remove("hidden");
      isLoadingImageInModal = false;
      if (prevPageButton) prevPageButton.disabled = currentPage === 0;
      if (nextPageButton) nextPageButton.disabled = currentPage === MAX_PAGES;
      if (pageSelector) pageSelector.disabled = false;
    };

    const loadError = () => {
      console.error(`Failed to load image: ${tempImg.src}`);
      currentImage.alt = "Gagal memuat gambar";
      if (spinnerDiv && spinnerDiv.parentNode) spinnerDiv.remove();
      currentImage.classList.remove("hidden");
      isLoadingImageInModal = false;
      if (prevPageButton) prevPageButton.disabled = false;
      if (nextPageButton) nextPageButton.disabled = false;
      if (pageSelector) pageSelector.disabled = false;
    };

    tempImg.onload = loadSuccess;
    tempImg.onerror = loadError;
    setTimeout(() => {
      tempImg.src = imageUrl;
    }, 200);
  };

  function goToPrevPage() {
    if (isLoadingImageInModal) return;
    if (currentPage > 0) {
      currentPage--;
      if (pageSelector) pageSelector.value = currentPage;
      updateImage();
    }
  }

  function goToNextPage() {
    if (isLoadingImageInModal) return;
    if (currentPage < MAX_PAGES) {
      currentPage++;
      if (pageSelector) pageSelector.value = currentPage;
      updateImage();
    }
  }

  if (prevPageButton) {
    prevPageButton.addEventListener("click", goToPrevPage);
  }

  if (nextPageButton) {
    nextPageButton.addEventListener("click", goToNextPage);
  }

  if (pageSelector) {
    pageSelector.addEventListener("change", (event) => {
      if (isLoadingImageInModal) return;
      currentPage = parseInt(event.target.value, 10);
      updateImage();
    });
  }

  if (fullscreenToggle) {
    fullscreenToggle.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        if (currentImage.requestFullscreen) {
          currentImage
            .requestFullscreen()
            .catch((err) => console.error(`Fullscreen error: ${err.message}`));
        } else {
          console.warn(
            "Fullscreen API not supported on this image element or browser."
          );
        }
      } else {
        if (document.exitFullscreen) {
          document
            .exitFullscreen()
            .catch((err) =>
              console.error(`Exit fullscreen error: ${err.message}`)
            );
        }
      }
    });
  }

  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement === currentImage) {
      console.log("Entered fullscreen for currentImage.");
      currentImage.addEventListener("mousemove", handleFullscreenMouseMove);
    } else {
      console.log("Exited fullscreen.");
      currentImage.removeEventListener("mousemove", handleFullscreenMouseMove);
      currentImage.classList.remove(
        "fullscreen-nav-left",
        "fullscreen-nav-right"
      );
      currentImage.style.cursor = "";
    }
  });

  currentImage.addEventListener("click", (event) => {
    if (document.fullscreenElement === currentImage) {
      // Cek agar tidak konflik dengan swipe, mungkin bisa ditambahkan delay
      // atau pastikan ini hanya untuk tap, bukan drag
      // Untuk saat ini, kita asumsikan swipe handler tidak mencegah click event
      // jika swipe tidak terdeteksi (misal, deltaX < SWIPE_THRESHOLD).
      const imageWidth = currentImage.offsetWidth;
      const clickX = event.offsetX;

      if (clickX < imageWidth / 2) {
        goToPrevPage();
      } else {
        goToNextPage();
      }
    }
  });

  function handleGlobalKeyNavigation(event) {
    const isModalActive = modalElement.classList.contains("show");
    if (isLoadingImageInModal) return;

    if (document.fullscreenElement === currentImage) {
      if (event.key === "ArrowLeft") {
        goToPrevPage();
        console.log("ArrowLeft pressed");
        event.preventDefault();
      } else if (event.key === "ArrowRight") {
        console.log("ArrowRight pressed");
        goToNextPage();
        event.preventDefault();
      }
    } else if (isModalActive) {
      // Ini akan di-handle oleh handleModalKeyNavigation
      // Jadi, bisa kita skip atau pastikan tidak ada duplikasi
    }
  }
  document.addEventListener("keydown", handleGlobalKeyNavigation);

  function handleModalKeyNavigation(event) {
    // MODIFIKASI: Pastikan modal aktif dan tidak dalam mode fullscreen (karena fullscreen ditangani global)
    if (
      isLoadingImageInModal ||
      document.fullscreenElement === currentImage ||
      !modalElement.classList.contains("show")
    )
      return;

    if (event.key === "ArrowLeft") {
      goToPrevPage();
      console.log("ArrowLeft pressed");
      event.preventDefault();
    } else if (event.key === "ArrowRight") {
      console.log("ArrowRight pressed");
      goToNextPage();
      event.preventDefault();
    }
  }

  function handleFullscreenMouseMove(event) {
    if (document.fullscreenElement !== currentImage) return;
    const imageWidth = currentImage.offsetWidth;
    const moveX = event.offsetX; // Menggunakan offsetX karena relatif terhadap elemen gambar
    currentImage.classList.remove(
      "fullscreen-nav-left",
      "fullscreen-nav-right"
    );
    if (moveX < imageWidth / 3) {
      currentImage.classList.add("fullscreen-nav-left");
    } else if (moveX > (imageWidth * 2) / 3) {
      currentImage.classList.add("fullscreen-nav-right");
    }
  }

  const dynamicYearEl = document.getElementById("dynamicYear");
  if (dynamicYearEl) {
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    dynamicYearEl.textContent =
      startYear === currentYear
        ? `${startYear}`
        : `${startYear} - ${currentYear}`;
  }
});
