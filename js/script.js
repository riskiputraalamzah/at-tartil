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

  if (window.ProgressiveImage) {
    const progressiveImages = new ProgressiveImage();
    progressiveImages.init();
  }

  modalElement.addEventListener("show.bs.modal", (event) => {
    const button = event.relatedTarget;
    currentTartil = button.closest(".card").getAttribute("data-tartil");
    if (tartilNumSpan) tartilNumSpan.textContent = currentTartil;
    currentPage = 0;
    if (pageSelector) pageSelector.value = currentPage;
    updateImage();
    // Tambahkan event listener untuk navigasi keyboard saat modal terbuka
    document.addEventListener("keydown", handleModalKeyNavigation);
  });

  modalElement.addEventListener("hidden.bs.modal", () => {
    isLoadingImageInModal = false;
    const existingSpinner = currentImage.parentElement.querySelector(
      ".image-loading-spinner"
    );
    if (existingSpinner) existingSpinner.remove();
    if (currentImage) currentImage.classList.remove("hidden");
    currentImage.src = "";
    // Hapus event listener keyboard saat modal ditutup
    document.removeEventListener("keydown", handleModalKeyNavigation);
    // Jika keluar dari fullscreen saat modal ditutup
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
      if (prevPageButton) prevPageButton.disabled = false; // Atau sesuaikan dengan logika error
      if (nextPageButton) nextPageButton.disabled = false;
      if (pageSelector) pageSelector.disabled = false;
    };

    tempImg.onload = loadSuccess;
    tempImg.onerror = loadError;
    setTimeout(() => {
      tempImg.src = imageUrl;
    }, 200); // Beri sedikit waktu untuk fade out & spinner muncul
  };

  // --- FUNGSI NAVIGASI ---
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
  // --- AKHIR FUNGSI NAVIGASI ---

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

  // --- LOGIKA FULLSCREEN DAN NAVIGASI FULLSCREEN ---
  if (fullscreenToggle) {
    fullscreenToggle.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        if (currentImage.requestFullscreen) {
          currentImage
            .requestFullscreen()
            .then(() => {
              // Anda bisa menambahkan logika khusus saat berhasil masuk fullscreen di sini jika perlu
            })
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

  // Event listener untuk perubahan status fullscreen (masuk/keluar)
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement === currentImage) {
      console.log("Entered fullscreen for currentImage.");
      console.log("Fullscreen element:", document.fullscreenElement);
      document.fullscreenElement.addEventListener(
        "mousemove",
        handleFullscreenMouseMove
      );
      // Tambahkan kursor custom atau styling jika perlu saat fullscreen
      // currentImage.style.cursor = "pointer"; // Contoh sederhana
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

  // Navigasi dengan klik pada gambar saat fullscreen
  currentImage.addEventListener("click", (event) => {
    if (document.fullscreenElement === currentImage) {
      const imageWidth = currentImage.offsetWidth;
      const clickX = event.offsetX; // Posisi X klik relatif terhadap elemen gambar

      if (clickX < imageWidth / 2) {
        // Klik di sisi kiri
        goToPrevPage();
      } else {
        // Klik di sisi kanan
        goToNextPage();
      }
    }
  });

  // Navigasi dengan keyboard (panah kiri/kanan) saat gambar fullscreen ATAU modal aktif
  // Fungsi ini akan dipanggil oleh dua event listener terpisah
  function handleGlobalKeyNavigation(event) {
    // Cek apakah modal At-Tartil sedang aktif DAN gambar sedang tidak loading
    const isModalActive = modalElement.classList.contains("show");

    if (isLoadingImageInModal) return;

    if (document.fullscreenElement === currentImage) {
      // Jika sedang fullscreen
      if (event.key === "ArrowLeft") {
        goToPrevPage();
        event.preventDefault(); // Mencegah scroll halaman jika ada
      } else if (event.key === "ArrowRight") {
        goToNextPage();
        event.preventDefault();
      }
      // Tombol Escape sudah ditangani browser untuk keluar fullscreen
    } else if (isModalActive) {
      // Jika modal aktif tapi tidak fullscreen
      if (event.key === "ArrowLeft") {
        goToPrevPage();
        event.preventDefault();
      } else if (event.key === "ArrowRight") {
        goToNextPage();
        event.preventDefault();
      }
    }
  }
  // Event listener global untuk keyboard
  document.addEventListener("keydown", handleGlobalKeyNavigation);

  // Fungsi terpisah untuk navigasi keyboard khusus saat modal saja (jika ingin perilaku berbeda)
  // Ini dipanggil saat modal 'show' dan dihapus saat 'hidden'
  // Anda bisa memilih untuk menggunakan handleGlobalKeyNavigation atau yang ini + modifikasi
  // Untuk saat ini, handleGlobalKeyNavigation sudah mencakup kedua kasus.
  function handleModalKeyNavigation(event) {
    if (isLoadingImageInModal || document.fullscreenElement === currentImage)
      return; // Jangan jalankan jika fullscreen (sudah ditangani)

    if (event.key === "ArrowLeft") {
      goToPrevPage();
      event.preventDefault();
    } else if (event.key === "ArrowRight") {
      goToNextPage();
      event.preventDefault();
    }
  }
  // ... di dalam 'fullscreenchange' atau event 'mousemove' pada currentImage saat fullscreen
  // if (document.fullscreenElement === currentImage) {
  //   currentImage.addEventListener("mousemove", handleFullscreenMouseMove);
  // } else {
  //   currentImage.removeEventListener("mousemove", handleFullscreenMouseMove);
  //   currentImage.classList.remove(
  //     "fullscreen-nav-left",
  //     "fullscreen-nav-right"
  //   );
  //   currentImage.style.cursor = "";
  // }

  function handleFullscreenMouseMove(event) {
    if (document.fullscreenElement !== currentImage) return;
    console.log("Mouse moved in fullscreen");
    const imageWidth = currentImage.offsetWidth;
    const clickX = event.offsetX;
    currentImage.classList.remove(
      "fullscreen-nav-left",
      "fullscreen-nav-right"
    ); // Reset
    if (clickX < imageWidth / 3) {
      // Zona kiri
      // currentImage.style.cursor = 'w-resize'; // Atau
      currentImage.classList.add("fullscreen-nav-left");
    } else if (clickX > (imageWidth * 2) / 3) {
      // Zona kanan
      // currentImage.style.cursor = 'e-resize'; // Atau
      currentImage.classList.add("fullscreen-nav-right");
    } else {
      // currentImage.style.cursor = 'default';
    }
  }

  // --- AKHIR LOGIKA FULLSCREEN ---

  const dynamicYearEl = document.getElementById("dynamicYear");
  if (dynamicYearEl) {
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    dynamicYearEl.textContent =
      startYear === currentYear
        ? `${startYear}`
        : `${startYear} - ${currentYear}`;
  }
}); // Akhir DOMContentLoaded
