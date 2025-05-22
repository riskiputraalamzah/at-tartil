// Pastikan import firebase dan fungsi lainnya tetap di atas
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  // HIDE PAGE LOADING OVERLAY IF YOU ENABLED IT IN HTML
  // const pageLoadingOverlay = document.getElementById('pageLoadingOverlay');
  // if (pageLoadingOverlay) {
  //    pageLoadingOverlay.style.display = 'none';
  // }

  const modalElement = document.getElementById("tartilModal");
  const pageSelector = document.getElementById("pageSelector");
  const prevPageButton = document.getElementById("prevPage");
  const nextPageButton = document.getElementById("nextPage");
  const currentImage = document.getElementById("currentImage");
  // const tartilCards = document.getElementById("tartilCards"); // Tidak digunakan secara aktif di JS, bisa dihapus jika tidak ada rencana lain
  const fullscreenToggle = document.getElementById("fullscreenToggle");
  const tartilNumSpan = document.getElementById("tartilNum");

  let currentPage = 0;
  let currentTartil = 1;
  // isLoading dan imageRequestId tidak lagi terlalu krusial dengan event load/error,
  // tapi bisa dipertahankan untuk logika UI yang lebih kompleks.
  let isLoadingImageInModal = false;

  // Inisialisasi progressive-image.js jika masih digunakan untuk cover
  // Cek apakah library sudah dimuat
  if (window.ProgressiveImage) {
    const progressiveImages = new ProgressiveImage();
    progressiveImages.init();
  }

  // Lazy load progressive images for Tartil cards - Ini mungkin tidak perlu jika sudah pakai progressive-image.js init()
  // atau jika Anda beralih ke <img loading="lazy"> biasa.
  // const progressiveCards = document.querySelectorAll(".progressive.replace");
  // progressiveCards.forEach((card) => {
  //   if (!card.querySelector("img.preview")) { // Pastikan selector img benar
  //     const img = document.createElement("img");
  //     img.className = "img-fluid preview"; // Pastikan class sesuai
  //     // Ambil src dari data-progressive atau href, tergantung implementasi Anda
  //     img.src = card.dataset.progressive || card.getAttribute("href");
  //     img.alt = "Cover Tartil";
  //     img.style = "width: 100%; height: auto; object-fit: cover;";
  //     img.setAttribute("loading", "lazy"); // Tambahkan lazy loading
  //     card.appendChild(img);
  //   } else {
  //     // Jika img sudah ada, pastikan ada loading="lazy"
  //     const existingImg = card.querySelector("img.preview");
  //     if (existingImg && !existingImg.hasAttribute("loading")) {
  //       existingImg.setAttribute("loading", "lazy");
  //     }
  //   }
  // });

  // Modal event listener
  modalElement.addEventListener("show.bs.modal", (event) => {
    const button = event.relatedTarget;
    currentTartil = button.closest(".card").getAttribute("data-tartil");
    if (tartilNumSpan) tartilNumSpan.textContent = currentTartil;

    currentPage = 0;
    if (pageSelector) pageSelector.value = currentPage;
    updateImage();
  });

  modalElement.addEventListener("hidden.bs.modal", () => {
    isLoadingImageInModal = false;
    // Hapus spinner loading di dalam modal jika ada
    const existingSpinner = currentImage.parentElement.querySelector(
      ".image-loading-spinner"
    );
    if (existingSpinner) existingSpinner.remove();
    if (currentImage) currentImage.classList.remove("hidden");
    currentImage.src = ""; // Kosongkan src untuk menghemat memori jika modal ditutup
  });

  // Populate page selector
  if (pageSelector) {
    pageSelector.innerHTML = ""; // Clear existing options
    const coverOption = document.createElement("option");
    coverOption.value = 0;
    coverOption.textContent = "Cover";
    pageSelector.appendChild(coverOption);

    for (let i = 1; i <= 36; i++) {
      // Asumsi maksimal 36 halaman
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `Halaman ${i}`;
      pageSelector.appendChild(option);
    }
  }

  const updateImage = () => {
    if (isLoadingImageInModal && currentImage.src !== "") return; // Jangan proses jika sedang loading gambar yang sama
    isLoadingImageInModal = true;

    prevPageButton.disabled = true;
    nextPageButton.disabled = true;
    pageSelector.disabled = true;

    // Hapus spinner lama dan sembunyikan gambar
    const existingSpinner = currentImage.parentElement.querySelector(
      ".image-loading-spinner"
    );
    if (existingSpinner) existingSpinner.remove();
    currentImage.classList.add("hidden");
    // currentImage.src = ""; // Kosongkan dulu untuk menghindari flicker gambar lama

    // Buat dan tampilkan spinner baru
    // const spinnerDiv = document.createElement("div");
    // spinnerDiv.className = "spinner-border text-light image-loading-spinner"; // Gunakan class CSS
    // spinnerDiv.setAttribute("role", "status");
    // spinnerDiv.innerHTML = '<span class="visually-hidden">Loading...</span>';
    // currentImage.parentElement.appendChild(spinnerDiv);

    const pagePath = currentPage === 0 ? "cover" : currentPage;
    // PERTIMBANGKAN FORMAT WEBP DULU
    const imageUrl = `img/tartil${currentTartil}/${pagePath}.png`; // Coba WebP dulu
    const fallbackImageUrl = `img/tartil${currentTartil}/${pagePath}.png`;

    const tempImg = new Image();

    const loadSuccess = () => {
      currentImage.src = tempImg.src;
      currentImage.alt = `Halaman ${
        currentPage === 0 ? "Cover" : currentPage
      } dari Tartil ${currentTartil}`;
      currentImage.classList.remove("hidden");

      isLoadingImageInModal = false;
      prevPageButton.disabled = false;
      nextPageButton.disabled = false;
      pageSelector.disabled = false;
      // if (spinnerDiv.parentNode) spinnerDiv.remove(); // Hapus spinner
    };

    const loadError = () => {
      // Jika WebP gagal, coba PNG
      if (tempImg.src.endsWith(".webp")) {
        console.log(`WebP load failed for ${imageUrl}, trying PNG.`);
        tempImg.src = fallbackImageUrl; // src error handler akan terpanggil lagi jika ini juga error
      } else {
        console.error(`Failed to load image: ${tempImg.src}`);
        // Handle error (misalnya tampilkan pesan error)
        currentImage.alt = "Gagal memuat gambar";
        currentImage.classList.remove("hidden"); // Tampilkan area gambar (kosong atau dgn alt)

        isLoadingImageInModal = false;
        prevPageButton.disabled = false;
        nextPageButton.disabled = false;
        pageSelector.disabled = false;
        if (spinnerDiv.parentNode) spinnerDiv.remove();
      }
    };

    tempImg.onload = loadSuccess;
    tempImg.onerror = loadError;
    tempImg.src = imageUrl; // Mulai load WebP
  };

  // Event listeners for navigation
  if (prevPageButton) {
    prevPageButton.addEventListener("click", () => {
      if (isLoadingImageInModal) return;
      if (currentPage > 0) {
        currentPage--;
        pageSelector.value = currentPage;
        updateImage();
      }
    });
  }

  if (nextPageButton) {
    nextPageButton.addEventListener("click", () => {
      // alert("Next page clicked");
      if (isLoadingImageInModal) return;
      if (currentPage < 36) {
        // Asumsi maksimal 36 halaman
        currentPage++;
        pageSelector.value = currentPage;
        updateImage();
      }
    });
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

  // Dynamic copyright year
  const dynamicYearEl = document.getElementById("dynamicYear");
  if (dynamicYearEl) {
    const startYear = 2024; // Ganti ke tahun project dimulai jika berbeda
    const currentYear = new Date().getFullYear();
    dynamicYearEl.textContent =
      startYear === currentYear
        ? `${startYear}`
        : `${startYear} - ${currentYear}`;
  }

  // Feedback Drawer Logic
  const floatingIcon = document.getElementById("floatingIcon");
  const feedbackDrawer = document.getElementById("feedbackDrawer");
  const closeDrawer = document.getElementById("closeDrawer");
  // const feedbackTextarea = document.querySelector("#feedbackDrawer textarea.form-control"); // Tidak ada auto-resize

  if (floatingIcon && feedbackDrawer && closeDrawer) {
    floatingIcon.addEventListener("click", () => {
      feedbackDrawer.classList.add("open");
    });
    closeDrawer.addEventListener("click", () => {
      feedbackDrawer.classList.remove("open");
    });
  }

  // Firebase Initialization and Logic
  const firebaseConfig = {
    apiKey: "AIzaSyDA3UVos4OiS4WkaYWBL2IVk90_9CF-68g", // AMANKAN API KEY INI JIKA MUNGKIN (misal via environment variables di backend/functions)
    authDomain: "portfolio-38ac1.firebaseapp.com",
    projectId: "portfolio-38ac1",
    storageBucket: "portfolio-38ac1.firebasestorage.app",
    messagingSenderId: "236861676265",
    appId: "1:236861676265:web:4baa6ffb8d6678be30ee78",
    measurementId: "G-96YDFGB2CV",
  };

  let db;
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // Mungkin tampilkan pesan ke user bahwa fitur feedback tidak tersedia
  }

  const feedbackForm = document.querySelector("#feedbackDrawer textarea");
  const feedbackSubmit = document.querySelector("#feedbackDrawer .btn-success");
  const globalSpinner = document.getElementById("spinner"); // Spinner untuk aksi global seperti submit feedback
  const adminKeyInput = document.getElementById("adminKey");
  const authSubmitButton = document.getElementById("authSubmit"); // Ganti nama variabel agar tidak bentrok
  const adminFeedbackList = document.getElementById("adminFeedbackList");
  const unreadFeedbackCountEl = document.getElementById("unreadFeedbackCount"); // Cache element

  // Load SweetAlert2 dynamically if needed
  async function loadSweetAlert() {
    if (!window.Swal) {
      // Load CSS
      if (!document.querySelector('link[href*="sweetalert2.min.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css";
        document.head.appendChild(link);
      }
      // Load JS
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      script.defer = true;
      document.body.appendChild(script);
      await new Promise((resolve) => (script.onload = resolve));
    }
    return window.Swal;
  }

  if (feedbackSubmit && feedbackForm && db) {
    feedbackSubmit.addEventListener("click", async () => {
      const message = feedbackForm.value.trim();
      const Swal = await loadSweetAlert();

      if (!message) {
        Swal.fire({
          icon: "warning",
          title: "Oops...",
          text: "Kritik dan saran tidak boleh kosong!",
        });
        return;
      }

      if (globalSpinner) globalSpinner.style.display = "flex";

      try {
        await addDoc(collection(db, "at-tartil"), {
          message,
          timestamp: serverTimestamp(),
          read: false, // Tambahkan status default 'belum dibaca'
        });
        if (globalSpinner) globalSpinner.style.display = "none";
        feedbackForm.value = "";
        feedbackDrawer.classList.remove("open"); // Tutup drawer setelah submit
        Swal.fire({
          icon: "success",
          title: "Terima kasih!",
          text: "Kritik dan saran berhasil dikirim!",
        });
      } catch (error) {
        if (globalSpinner) globalSpinner.style.display = "none";
        Swal.fire({
          icon: "error",
          title: "Gagal mengirim",
          text: "Silakan coba lagi nanti.",
        });
        console.error("Feedback submission error:", error);
      }
    });
  }

  // Fungsi updateFeedbackItemStyles didefinisikan sekali di scope yang benar
  const updateFeedbackItemStyles = (feedbackItem, isRead) => {
    const button = feedbackItem.querySelector(".mark-as-read");
    if (!button) return;
    if (isRead) {
      button.textContent = "Sudah Dibaca";
      button.classList.remove("btn-danger");
      button.classList.add("btn-success");
      button.disabled = true; // Disable tombol jika sudah dibaca
    } else {
      button.textContent = "Tandai Sudah Dibaca";
      button.classList.remove("btn-success");
      button.classList.add("btn-danger");
      button.disabled = false;
    }
  };

  async function displayAdminFeedback() {
    const Swal = await loadSweetAlert();
    if (!db) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Koneksi database gagal.",
      });
      return;
    }
    if (globalSpinner) globalSpinner.style.display = "flex";

    try {
      const q = query(
        collection(db, "at-tartil"),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);

      if (adminFeedbackList) adminFeedbackList.innerHTML = "";

      snapshot.forEach((docSnapshot) => {
        // Ganti nama variabel agar tidak bentrok dengan 'doc' dari firestore
        const data = docSnapshot.data();
        const time = data.timestamp?.toDate
          ? new Date(data.timestamp.toDate()).toLocaleString("id-ID")
          : "Waktu tidak diketahui";

        const feedbackItem = document.createElement("div");
        feedbackItem.className = "list-group-item";
        feedbackItem.innerHTML = `
                <div>
                <small class="text-muted">${time}</small>
                <p class="mb-1">${data.message}</p>
                <button class="btn btn-sm mark-as-read" data-id="${docSnapshot.id}"></button>
                </div>
            `;
        updateFeedbackItemStyles(feedbackItem, data.read);
        if (adminFeedbackList) adminFeedbackList.appendChild(feedbackItem);
      });

      const feedbackAdminModalEl =
        document.getElementById("feedbackAdminModal");
      if (feedbackAdminModalEl) {
        const feedbackAdminModal =
          bootstrap.Modal.getInstance(feedbackAdminModalEl) ||
          new bootstrap.Modal(feedbackAdminModalEl);
        feedbackAdminModal.show();
      }
    } catch (error) {
      console.error("Error fetching admin feedback:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal memuat data feedback.",
      });
    } finally {
      if (globalSpinner) globalSpinner.style.display = "none";
    }
  }

  if (authSubmitButton && adminKeyInput && db) {
    authSubmitButton.addEventListener("click", async () => {
      const key = adminKeyInput.value.trim();
      const Swal = await loadSweetAlert();

      // SIMPAN KEY DI TEMPAT YANG LEBIH AMAN JIKA MUNGKIN
      // Untuk aplikasi client-side murni, ini sulit, tapi hindari hardcode langsung jika ada alternatif
      if (key !== "masokpakeko") {
        Swal.fire({ icon: "error", title: "Key Admin salah" });
        return;
      }
      adminKeyInput.value = ""; // Clear key
      const authModalEl = document.getElementById("authModal");
      if (authModalEl) {
        const authModalInstance = bootstrap.Modal.getInstance(authModalEl);
        if (authModalInstance) authModalInstance.hide();
      }
      await displayAdminFeedback();
    });
  }

  const triggerAuthModal = document.getElementById("triggerAuthModal");
  if (triggerAuthModal) {
    triggerAuthModal.addEventListener("dblclick", async () => {
      const authModalEl = document.getElementById("authModal");
      if (authModalEl) {
        const authModalInstance =
          bootstrap.Modal.getInstance(authModalEl) ||
          new bootstrap.Modal(authModalEl);
        await updateUnreadFeedbackCount(); // Update count sebelum modal tampil
        authModalInstance.show();
      }
    });
  }

  async function updateUnreadFeedbackCount() {
    if (!db || !unreadFeedbackCountEl) return;
    try {
      const q = query(collection(db, "at-tartil")); // Tidak perlu order by untuk count
      const snapshot = await getDocs(q);
      let unreadCount = 0;
      snapshot.forEach((docSnapshot) => {
        if (!docSnapshot.data().read) {
          unreadCount++;
        }
      });
      unreadFeedbackCountEl.textContent = `Kritik & Saran belum terbaca: ${unreadCount}`;
    } catch (error) {
      console.error("Error updating unread feedback count:", error);
      unreadFeedbackCountEl.textContent = "Gagal memuat jumlah feedback.";
    }
  }
  // Panggil sekali saat load untuk inisialisasi
  updateUnreadFeedbackCount();

  if (adminFeedbackList && db) {
    adminFeedbackList.addEventListener("click", async (event) => {
      if (
        event.target.classList.contains("mark-as-read") &&
        !event.target.disabled
      ) {
        const feedbackId = event.target.dataset.id;
        const feedbackRef = doc(db, "at-tartil", feedbackId);
        const Swal = await loadSweetAlert();

        try {
          await updateDoc(feedbackRef, { read: true });
          const feedbackItem = event.target.closest(".list-group-item");
          if (feedbackItem) updateFeedbackItemStyles(feedbackItem, true);
          updateUnreadFeedbackCount(); // Update count setelah menandai
        } catch (error) {
          console.error("Error updating feedback as read: ", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Gagal menandai feedback.",
          });
        }
      }
    });
  }

  // Mark all feedback as read
  const markAllAsReadButton = document.createElement("button");
  markAllAsReadButton.textContent = "Tandai Semua Sudah Dibaca";
  markAllAsReadButton.className = "btn btn-primary mb-3 d-block mx-auto"; // Style tombol
  markAllAsReadButton.addEventListener("click", async () => {
    if (!db) return;
    const Swal = await loadSweetAlert();
    if (globalSpinner) globalSpinner.style.display = "flex";

    try {
      const q = query(collection(db, "at-tartil")); // Bisa filter where('read', '==', false) jika datanya banyak
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      let LakukanBatch = false;
      snapshot.forEach((docSnapshot) => {
        if (!docSnapshot.data().read) {
          // Hanya update yang belum dibaca
          const feedbackRef = docSnapshot.ref;
          batch.update(feedbackRef, { read: true });
          LakukanBatch = true;
        }
      });

      if (LakukanBatch) {
        await batch.commit();
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Semua kritik & saran telah ditandai sudah dibaca.",
        });
        // Update UI untuk semua item yang terlihat
        adminFeedbackList
          .querySelectorAll(".list-group-item")
          .forEach((itemEl) => {
            const itemDataId =
              itemEl.querySelector(".mark-as-read")?.dataset.id;
            if (itemDataId) {
              // Pastikan elemen ada
              // Cek apakah item ini termasuk yang di-batch (opsional, bisa update semua saja)
              // Untuk simpelnya, kita update semua yang tampil
              updateFeedbackItemStyles(itemEl, true);
            }
          });
      } else {
        Swal.fire({
          icon: "info",
          title: "Info",
          text: "Tidak ada feedback baru untuk ditandai.",
        });
      }
      updateUnreadFeedbackCount();
    } catch (error) {
      console.error("Error marking all as read: ", error);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal menandai semua. Silakan coba lagi.",
      });
    } finally {
      if (globalSpinner) globalSpinner.style.display = "none";
    }
  });

  const feedbackAdminModalBody = document.querySelector(
    "#feedbackAdminModal .modal-body"
  );
  if (feedbackAdminModalBody && adminFeedbackList) {
    feedbackAdminModalBody.insertBefore(markAllAsReadButton, adminFeedbackList);
  }

  const authForm = document.querySelector("#authModal form");
  if (authForm && authSubmitButton) {
    authForm.addEventListener("submit", (event) => {
      event.preventDefault();
      authSubmitButton.click();
    });
  }

  // Global lazy loading untuk gambar yang mungkin ditambahkan dinamis atau terlewat
  // Ini bisa dihapus jika Anda yakin semua <img> sudah punya loading="lazy"
  // const images = document.querySelectorAll("img:not([loading])"); // Hanya target yg belum ada atribut loading
  // images.forEach((img) => {
  //   img.setAttribute("loading", "lazy");
  // });
}); // Akhir DOMContentLoaded
