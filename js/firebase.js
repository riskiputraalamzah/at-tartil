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
// ... (Sisa kode Firebase, Feedback, SweetAlert, dll. tetap sama) ...
// Feedback Drawer Logic
const floatingIcon = document.getElementById("floatingIcon");
const feedbackDrawer = document.getElementById("feedbackDrawer");
const closeDrawer = document.getElementById("closeDrawer");

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
  apiKey: "AIzaSyDA3UVos4OiS4WkaYWBL2IVk90_9CF-68g",
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
}

const feedbackForm = document.querySelector("#feedbackDrawer textarea");
const feedbackSubmit = document.querySelector("#feedbackDrawer .btn-success");
const globalSpinner = document.getElementById("spinner");
const adminKeyInput = document.getElementById("adminKey");
const authSubmitButton = document.getElementById("authSubmit");
const adminFeedbackList = document.getElementById("adminFeedbackList");
const unreadFeedbackCountEl = document.getElementById("unreadFeedbackCount");

async function loadSweetAlert() {
  if (!window.Swal) {
    if (!document.querySelector('link[href*="sweetalert2.min.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css";
      document.head.appendChild(link);
    }
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
        read: false,
      });
      if (globalSpinner) globalSpinner.style.display = "none";
      feedbackForm.value = "";
      if (feedbackDrawer) feedbackDrawer.classList.remove("open");
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

const updateFeedbackItemStyles = (feedbackItem, isRead) => {
  const button = feedbackItem.querySelector(".mark-as-read");
  if (!button) return;
  if (isRead) {
    button.textContent = "Sudah Dibaca";
    button.classList.remove("btn-danger");
    button.classList.add("btn-success");
    button.disabled = true;
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
    const q = query(collection(db, "at-tartil"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    if (adminFeedbackList) adminFeedbackList.innerHTML = "";
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const time = data.timestamp?.toDate
        ? new Date(data.timestamp.toDate()).toLocaleString("id-ID")
        : "Waktu tidak diketahui";
      const feedbackItem = document.createElement("div");
      feedbackItem.className = "list-group-item";
      feedbackItem.innerHTML = `<div><small class="text-muted">${time}</small><p class="mb-1">${data.message}</p><button class="btn btn-sm mark-as-read" data-id="${docSnapshot.id}"></button></div>`;
      updateFeedbackItemStyles(feedbackItem, data.read);
      if (adminFeedbackList) adminFeedbackList.appendChild(feedbackItem);
    });
    const feedbackAdminModalEl = document.getElementById("feedbackAdminModal");
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
    if (key !== "masokpakeko") {
      Swal.fire({ icon: "error", title: "Key Admin salah" });
      return;
    }
    adminKeyInput.value = "";
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
      await updateUnreadFeedbackCount();
      authModalInstance.show();
    }
  });
}

async function updateUnreadFeedbackCount() {
  if (!db || !unreadFeedbackCountEl) return;
  try {
    const q = query(collection(db, "at-tartil"));
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
    if (unreadFeedbackCountEl)
      unreadFeedbackCountEl.textContent = "Gagal memuat jumlah feedback.";
  }
}
if (db) updateUnreadFeedbackCount(); // Panggil jika db berhasil inisialisasi

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
        updateUnreadFeedbackCount();
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

const markAllAsReadButton = document.createElement("button");
markAllAsReadButton.textContent = "Tandai Semua Sudah Dibaca";
markAllAsReadButton.className = "btn btn-primary mb-3 d-block mx-auto";
markAllAsReadButton.addEventListener("click", async () => {
  if (!db) return;
  const Swal = await loadSweetAlert();
  if (globalSpinner) globalSpinner.style.display = "flex";
  try {
    const q = query(collection(db, "at-tartil"));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let LakukanBatch = false;
    snapshot.forEach((docSnapshot) => {
      if (!docSnapshot.data().read) {
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
      if (adminFeedbackList)
        adminFeedbackList
          .querySelectorAll(".list-group-item")
          .forEach((itemEl) => {
            const itemDataId =
              itemEl.querySelector(".mark-as-read")?.dataset.id;
            if (itemDataId) {
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
