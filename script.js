const video = document.getElementById("video");
const captureBtn = document.getElementById("captureBtn");
const downloadBtn = document.getElementById("downloadBtn");
const canvas = document.getElementById("canvas");

let slotCounter = 1;

/* ======================
   1. Nyalakan Kamera
====================== */
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream)
  .catch(err => alert("Kamera tidak bisa diakses!"));

/* ======================
   2. Ambil Foto
====================== */
captureBtn.addEventListener("click", () => {
  const ctx = canvas.getContext("2d");

  // Pastikan canvas berukuran sama dengan video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Perbaikan: Flip horizontal untuk mencegah kamera depan mirror
  ctx.save();
  ctx.scale(-1, 1); // Flip horizontal
  ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height); // Geser kembali gambar
  ctx.restore();

  let dataURL = canvas.toDataURL("image/png");

  if (slotCounter === 1) {
    document.getElementById("slot1").src = dataURL;
  } else if (slotCounter === 2) {
    document.getElementById("slot2").src = dataURL;
  } else if (slotCounter === 3) {
    document.getElementById("slot3").src = dataURL;
  }

  slotCounter++;
  if (slotCounter > 3) slotCounter = 1;
});

/* ======================
   3. Download Hasil
====================== */
downloadBtn.addEventListener("click", () => {
  const finalCanvas = document.createElement("canvas");
  const ctx = finalCanvas.getContext("2d");

  const frameImg = document.querySelector(".frame-img");

  // Ukuran finalCanvas harus sama dengan ukuran natural frame.png
  finalCanvas.width = frameImg.naturalWidth;
  finalCanvas.height = frameImg.naturalHeight;

  // Nilai posisi slot (x, y, w, h) harus didasarkan pada proporsi frame.png (bukan ukuran yg ditampilkan di layar/CSS)

  // Asumsi lebar natural frame.png adalah 1920px (berdasarkan proporsi angka di kodingan sebelumnya)
  // dan tinggi natural frame.png adalah 4750px (dihitung dari frame.png)
  const FRAME_WIDTH = finalCanvas.width;
  const FRAME_HEIGHT = finalCanvas.height;

  // Hitung proporsi persentase dari CSS
  // Posisi kiri slot di CSS: left: 40px (dari 420px container) -> ~9.5% dari lebar container
  // Lebar slot di CSS: width: 78%
  // Tinggi slot di CSS: height: 20% (dari tinggi frame.png)
  
  // Posisi slot dalam ukuran natural frame.png:
  // Lebar slot: 0.78 * FRAME_WIDTH
  // Posisi X: (1 - 0.78) / 2 * FRAME_WIDTH = 0.11 * FRAME_WIDTH (jika dipusatkan), tapi di CSS ada `left: 40px`
  // Berdasarkan estimasi frame.png:
  // x = 12% dari lebar frame (sekitar 230px)
  // w = 76% dari lebar frame (sekitar 1460px)
  // h = proporsi tinggi yg benar dari 20% CSS (sekitar 950px)

  // Nilai yg disesuaikan agar tidak distorsi (gunakan proporsi aslinya):
  const x_pos = FRAME_WIDTH * 0.11; // 11% dari lebar
  const w_slot = FRAME_WIDTH * 0.78; // 78% dari lebar

  // Tinggi tiap slot (dihitung berdasarkan tinggi frame natural):
  // (Tinggi frame dibagi 4 slot kosong, lalu dikali 20%) -> perkiraan tinggi sekitar 950px
  const h_slot = FRAME_HEIGHT * 0.20; // 20% dari tinggi total

  // Nilai Y (posisi atas) yang disesuaikan:
  // slot1: 110px (di CSS) -> y_pos1: 110/4750 * FRAME_HEIGHT -> sekitar 540px (menggunakan angka yg lebih akurat)
  // slot2: 370px (di CSS) -> y_pos2: 370/4750 * FRAME_HEIGHT -> sekitar 1700px
  // slot3: 640px (di CSS) -> y_pos3: 640/4750 * FRAME_HEIGHT -> sekitar 2960px

  // Angka posisi baru (didekati berdasarkan proporsi frame.png):
  const y1 = FRAME_HEIGHT * 0.11;  // Posisi Y untuk slot1
  const y2 = FRAME_HEIGHT * 0.35;  // Posisi Y untuk slot2
  const y3 = FRAME_HEIGHT * 0.59;  // Posisi Y untuk slot3

  // Perhitungan lebih akurat:
  const offsetTop = FRAME_HEIGHT * 0.11; // Jarak dari atas ke slot 1
  const slotSpacing = FRAME_HEIGHT * 0.24; // Jarak vertikal antara slot
  const slotHeight = FRAME_HEIGHT * 0.20; // Tinggi slot

  const y_slot1 = offsetTop;
  const y_slot2 = offsetTop + slotSpacing;
  const y_slot3 = offsetTop + slotSpacing * 2;


  // Gambar frame dulu
  ctx.drawImage(frameImg, 0, 0, finalCanvas.width, finalCanvas.height);

  // Lalu gambar tiap slot
  function drawSlot(slotId, y) {
    const img = document.getElementById(slotId);
    // Pastikan gambar sudah di-capture
    if (img.src && !img.src.includes('data:image/png;base64,')) {
        // Hanya gambar jika ada isinya
        return;
    }

    // Buat canvas sementara untuk gambar dari slot untuk memastikan ukuran yg benar
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;

    // Gambar ke canvas sementara agar bisa di-draw ulang dengan ukuran yg benar
    const imageToDraw = new Image();
    imageToDraw.onload = function() {
        // Pastikan gambar tidak di-flip lagi
        tempCtx.drawImage(imageToDraw, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Gambar ke finalCanvas dengan posisi dan ukuran yang benar
        ctx.drawImage(tempCanvas, x_pos, y, w_slot, slotHeight);
    }
    imageToDraw.src = img.src;
  }
  
  // Panggil drawSlot untuk setiap slot dengan posisi Y yang sudah dihitung
  // Perhatian: Karena proses drawImage di dalam imageToDraw.onload bersifat asynchronous,
  // download link mungkin terbuat sebelum semua gambar selesai digambar.
  // Untuk project photobooth sederhana ini, kita akan coba dengan `ctx.drawImage` langsung, 
  // menggunakan ukuran dari naturalWidth/Height img aslinya.
  // Jika masih terdistorsi, berarti koordinat di bawah yang perlu disesuaikan dengan benar-benar presisi.

  // --- Implementasi Synchronous yang Disesuaikan (Menggunakan ukuran natural dari slot1/2/3 yang diisi dari canvas) ---
  function drawFinalSlot(slotId, y) {
    const img = document.getElementById(slotId);
    if (img.src && !img.src.includes('data:image/png;base64,')) {
        return;
    }

    const imageToDraw = new Image();
    imageToDraw.onload = function() {
        // Gambarkan langsung ke finalCanvas
        ctx.drawImage(imageToDraw, x_pos, y, w_slot, slotHeight);
        
        // Setelah slot terakhir digambar, baru buat link download
        if (slotId === "slot3") {
             setTimeout(() => {
                const link = document.createElement("a");
                link.download = "photobooth.png";
                link.href = finalCanvas.toDataURL("image/png");
                link.click();
            }, 100); // Tunda sebentar untuk memastikan gambar selesai di-render
        }
    }
    imageToDraw.src = img.src;
  }

  // Panggil fungsi download untuk semua slot secara berurutan
  drawFinalSlot("slot1", y_slot1);
  drawFinalSlot("slot2", y_slot2);
  drawFinalSlot("slot3", y_slot3);

  // Hapus kode link download yang lama karena sudah dipindahkan ke dalam drawFinalSlot (asynchronous)
  // const link = document.createElement("a");
  // link.download = "photobooth.png";
  // link.href = finalCanvas.toDataURL();
  // link.click();
});
