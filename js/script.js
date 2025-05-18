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

  const modal = document.getElementById("tartilModal");
  const pageSelector = document.getElementById("pageSelector");
  const prevPageButton = document.getElementById("prevPage");
  const nextPageButton = document.getElementById("nextPage");
  const currentImage = document.getElementById("currentImage");
  const tartilCards = document.getElementById("tartilCards");
  const fullscreenToggle = document.getElementById("fullscreenToggle");

  let currentPage = 0; // Start with the cover page
  let currentTartil = 1;
  let isLoading = false; // Prevent spamming navigation buttons
  let imageRequestId = 0; // Untuk memastikan hanya permintaan terakhir yang diproses

  // Lazy load progressive images for Tartil cards
  const progressiveCards = document.querySelectorAll(".progressive.replace");
  progressiveCards.forEach((card) => {
    if (!card.querySelector("img")) {
      // Check if img already exists
      const img = document.createElement("img");
      img.className = "preview";
      img.src = card.getAttribute("href");
      img.alt = "Cover Tartil";
      img.style = "width: 100%; height: auto; object-fit: cover;";
      card.appendChild(img);
    }
  });

  // Modal event listener
  modal.addEventListener("show.bs.modal", (event) => {
    const button = event.relatedTarget;
    currentTartil = button.closest(".card").getAttribute("data-tartil");
    document.getElementById("tartilNum").textContent = currentTartil;

    // Reset to the cover page when modal is opened
    currentPage = 0; // 0 represents the cover page
    pageSelector.value = currentPage;
    updateImage();
  });

  modal.addEventListener("hidden.bs.modal", () => {
    isLoading = false;
    imageRequestId++;
    // Hapus semua spinner loading di dalam modal
    const spinners = modal.querySelectorAll(".loading-overlay");
    spinners.forEach((el) => el.remove());
    if (currentImage) currentImage.classList.remove("hidden");
  });

  // Populate page selector
  pageSelector.innerHTML = ""; // Clear existing options
  const coverOption = document.createElement("option");
  coverOption.value = 0;
  coverOption.textContent = "Cover";
  pageSelector.appendChild(coverOption);

  for (let i = 1; i <= 36; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Halaman ${i}`;
    pageSelector.appendChild(option);
  }

  // Function to update the displayed image with loading effect
  const updateImage = () => {
    if (isLoading) return; // Abaikan jika masih loading
    isLoading = true;
    imageRequestId++;
    const thisRequestId = imageRequestId;

    // Hapus spinner loading sebelumnya jika ada
    const prevSpinner =
      currentImage.parentElement.querySelector(".loading-overlay");
    if (prevSpinner) prevSpinner.remove();

    const loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay";
    loadingOverlay.innerHTML =
      '<div class="spinner-border text-light" role="status"><span class="visually-hidden">Loading...</span></div>';
    currentImage.parentElement.appendChild(loadingOverlay);

    currentImage.classList.add("hidden");
    // Simulasi loading gambar (ganti src gambar di sini)
    // Misal:
    // currentImage.src = ...
    // Untuk contoh, gunakan setTimeout
    setTimeout(() => {
      // Jika requestId sudah berubah, abaikan hasil loading ini
      if (imageRequestId !== thisRequestId) return;
      const pagePath = currentPage === 0 ? "cover" : currentPage;
      currentImage.src = `img/tartil${currentTartil}/${pagePath}.png`;
      currentImage.alt = `Halaman ${
        currentPage === 0 ? "Cover" : currentPage
      } dari Tartil ${currentTartil}`;
      currentImage.onload = () => {
        currentImage.classList.remove("hidden");
        // Hapus spinner loading
        const spinner =
          currentImage.parentElement.querySelector(".loading-overlay");
        if (spinner) spinner.remove();
        isLoading = false; // Reset loading state
      };
    }, 500);
  };

  // Event listeners for navigation
  prevPageButton.addEventListener("click", () => {
    if (isLoading) return; // Abaikan jika masih loading
    if (currentPage > 0) {
      currentPage--;
      pageSelector.value = currentPage;
      updateImage();
    }
  });

  nextPageButton.addEventListener("click", () => {
    if (isLoading) return; // Abaikan jika masih loading
    if (currentPage < 36) {
      currentPage++;
      pageSelector.value = currentPage;
      updateImage();
    }
  });

  pageSelector.addEventListener("change", (event) => {
    if (isLoading) return; // Abaikan jika masih loading
    currentPage = parseInt(event.target.value, 10);
    updateImage();
  });

  fullscreenToggle.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      currentImage.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable fullscreen mode: ${err.message}`
        );
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error(
          `Error attempting to exit fullscreen mode: ${err.message}`
        );
      });
    }
  });

  // Dynamic copyright year
  const startYear = 2025; // Tahun dibuat
  const currentYear = new Date().getFullYear();
  const yearText =
    startYear === currentYear
      ? `${startYear}`
      : `${startYear} - ${currentYear}`;
  document.getElementById("dynamicYear").textContent = yearText;

  // Improved logic to ensure loading overlay hides only after full load
  const loadingOverlay = document.getElementById("loadingOverlay");
  const loadingProgress = document.getElementById("loadingProgress");

  // Function to hide the loading overlay
  const hideLoadingOverlay = () => {
    loadingOverlay.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  };

  // Check if the website is already fully loaded
  // if (document.readyState === "complete") {
  //   loadingProgress.textContent = "100%";
  //   hideLoadingOverlay();
  // } else {
  //   // Show the loading overlay and update progress dynamically
  //   let progress = 0;
  //   const updateProgress = () => {
  //     if (document.readyState === "complete") {
  //       // If fully loaded, set progress to 100% and hide the overlay
  //       loadingProgress.textContent = "100%";
  //       hideLoadingOverlay();
  //     } else {
  //       // Otherwise, increment progress dynamically and continue updating
  //       const increment = Math.floor(Math.random() * 10) + 1; // Random increment between 1 and 10
  //       progress = Math.min(progress + increment, 99); // Cap progress at 99%
  //       loadingProgress.textContent = `${progress}%`;
  //       setTimeout(updateProgress, Math.random() * 500 + 200); // Random delay between 200ms and 700ms
  //     }
  //   };

  //   // Start updating progress
  //   updateProgress();

  //   // Ensure overlay hides when the load event fires
  //   window.addEventListener("load", () => {
  //     loadingProgress.textContent = "100%";
  //     hideLoadingOverlay();
  //   });
  // }

  const floatingIcon = document.getElementById("floatingIcon");
  const feedbackDrawer = document.getElementById("feedbackDrawer");
  const closeDrawer = document.getElementById("closeDrawer");
  const feedbackTextarea = document.querySelector("textarea.form-control");

  floatingIcon.addEventListener("click", () => {
    feedbackDrawer.classList.add("open");
  });

  closeDrawer.addEventListener("click", () => {
    feedbackDrawer.classList.remove("open");
  });

  // Auto-resize textarea based on input
  // feedbackTextarea.addEventListener("input", () => {
  //   feedbackTextarea.style.height = "auto"; // Reset height
  //   feedbackTextarea.style.height = `${feedbackTextarea.scrollHeight}px`; // Adjust to content
  // });

  const firebaseConfig = {
    apiKey: "AIzaSyDA3UVos4OiS4WkaYWBL2IVk90_9CF-68g",
    authDomain: "portfolio-38ac1.firebaseapp.com",
    projectId: "portfolio-38ac1",
    storageBucket: "portfolio-38ac1.firebasestorage.app",
    messagingSenderId: "236861676265",
    appId: "1:236861676265:web:4baa6ffb8d6678be30ee78",
    measurementId: "G-96YDFGB2CV",
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const feedbackForm = document.querySelector("#feedbackDrawer textarea");
  const feedbackSubmit = document.querySelector("#feedbackDrawer .btn-success");
  const spinner = document.getElementById("spinner");
  const adminKeyInput = document.getElementById("adminKey");
  const authSubmit = document.getElementById("authSubmit");
  const adminFeedbackList = document.getElementById("adminFeedbackList");

  feedbackSubmit.addEventListener("click", async () => {
    const message = feedbackForm.value.trim();

    if (!message) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Kritik dan saran tidak boleh kosong!",
      });
      return;
    }

    spinner.style.display = "flex";

    try {
      await addDoc(collection(db, "at-tartil"), {
        message,
        timestamp: serverTimestamp(),
      });

      spinner.style.display = "none";
      feedbackForm.value = "";
      Swal.fire({
        icon: "success",
        title: "Terima kasih!",
        text: "Kritik dan saran berhasil dikirim!",
      });
    } catch (error) {
      spinner.style.display = "none";
      Swal.fire({
        icon: "error",
        title: "Gagal mengirim kritik dan saran",
        text: "Silakan coba lagi nanti.",
      });
      console.error(error);
    }
  });

  authSubmit.addEventListener("click", async () => {
    const key = adminKeyInput.value.trim();

    if (key !== "masokpakeko") {
      Swal.fire({
        icon: "error",
        title: "Key Admin salah",
      });
      return;
    }

    const q = query(collection(db, "at-tartil"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    adminFeedbackList.innerHTML = "";

    // Update feedback item button styles based on read status
    const updateFeedbackItemStyles = (feedbackItem, isRead) => {
      const button = feedbackItem.querySelector(".mark-as-read");
      if (isRead) {
        button.textContent = "Sudah Dibaca";
        button.classList.remove("btn-danger");
        button.classList.add("btn-success");
      } else {
        button.textContent = "Belum Dibaca";
        button.classList.remove("btn-success");
        button.classList.add("btn-danger");
      }
    };

    // Update feedback list rendering logic
    snapshot.forEach((doc) => {
      const data = doc.data();
      const time = data.timestamp?.toDate
        ? new Date(data.timestamp.toDate()).toLocaleString()
        : "Waktu tidak diketahui";

      const feedbackItem = document.createElement("div");
      feedbackItem.className = "list-group-item";
      feedbackItem.innerHTML = `
        <div>
          <strong>${time}</strong>
          <p>${data.message}</p>
          <button class="btn mark-as-read" data-id="${doc.id}"></button>
        </div>
      `;

      updateFeedbackItemStyles(feedbackItem, data.read);
      adminFeedbackList.appendChild(feedbackItem);
    });

    const feedbackAdminModal = new bootstrap.Modal(
      document.getElementById("feedbackAdminModal")
    );
    feedbackAdminModal.show();
  });

  const triggerAuthModal = document.getElementById("triggerAuthModal");
  const authModal = new bootstrap.Modal(document.getElementById("authModal"));

  triggerAuthModal.addEventListener("dblclick", () => {
    authModal.show();
  });

  // Function to update unread feedback count
  const updateUnreadFeedbackCount = async () => {
    const q = query(collection(db, "at-tartil"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    let unreadCount = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.read) {
        unreadCount++;
      }
    });

    const unreadFeedbackCount = document.getElementById("unreadFeedbackCount");
    if (unreadFeedbackCount) {
      unreadFeedbackCount.textContent = `Kritik & Saran belum terbaca: ${unreadCount}`;
    }
  };

  // Call the function when the auth modal is shown
  const authModalElement = document.getElementById("authModal");
  if (authModalElement) {
    authModalElement.addEventListener(
      "show.bs.modal",
      updateUnreadFeedbackCount
    );
  }

  // Mark feedback as read
  adminFeedbackList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("mark-as-read")) {
      const feedbackId = event.target.dataset.id;
      const feedbackRef = doc(db, "at-tartil", feedbackId);

      try {
        await updateDoc(feedbackRef, { read: true });
        const feedbackItem = event.target.closest(".list-group-item");
        updateFeedbackItemStyles(feedbackItem, true);
        updateUnreadFeedbackCount();
      } catch (error) {
        console.error("Error updating feedback: ", error);
      }
    }
  });

  // Mark all feedback as read
  const markAllAsReadButton = document.createElement("button");
  markAllAsReadButton.textContent = "Tandai Semua Sudah Dibaca";
  markAllAsReadButton.className = "btn btn-primary mb-3";
  markAllAsReadButton.addEventListener("click", async () => {
    const q = query(collection(db, "at-tartil"));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.forEach((doc) => {
      const feedbackRef = doc.ref;
      batch.update(feedbackRef, { read: true });
    });

    try {
      await batch.commit();
      Swal.fire({
        icon: "success",
        title: "Semua kritik & saran telah ditandai sebagai sudah dibaca!",
      });
      updateUnreadFeedbackCount();

      // Update UI for all feedback items
      snapshot.forEach((doc) => {
        const feedbackItem = document
          .querySelector(`[data-id='${doc.id}']`)
          .closest(".list-group-item");
        if (feedbackItem) {
          updateFeedbackItemStyles(feedbackItem, true);
        }
      });
    } catch (error) {
      console.error("Error marking all feedback as read: ", error);
      Swal.fire({
        icon: "error",
        title: "Gagal menandai semua sebagai sudah dibaca",
        text: "Silakan coba lagi nanti.",
      });
    }
  });

  // Append the button to the feedback admin modal
  const feedbackAdminModalBody = document.querySelector(
    "#feedbackAdminModal .modal-body"
  );
  if (feedbackAdminModalBody) {
    feedbackAdminModalBody.insertBefore(markAllAsReadButton, adminFeedbackList);
  }

  // Ensure the form submission in the admin modal triggers the same logic as the 'authSubmit' button
  const authForm = document.querySelector("#authModal form");
  if (authForm) {
    authForm.addEventListener("submit", (event) => {
      event.preventDefault(); // Prevent default form submission
      authSubmit.click(); // Trigger the same logic as the 'authSubmit' button
    });
  }

  // Ensure lazy loading is applied dynamically if needed
  const images = document.querySelectorAll("img");
  images.forEach((img) => {
    if (!img.hasAttribute("loading")) {
      img.setAttribute("loading", "lazy");
    }
  });
});

// Ensure updateFeedbackItemStyles is defined globally
const updateFeedbackItemStyles = (feedbackItem, isRead) => {
  const button = feedbackItem.querySelector(".mark-as-read");
  if (isRead) {
    button.textContent = "Sudah Dibaca";
    button.classList.remove("btn-danger");
    button.classList.add("btn-success");
  } else {
    button.textContent = "Belum Dibaca";
    button.classList.remove("btn-success");
    button.classList.add("btn-danger");
  }
};
