const video = document.getElementById("video");
const captureBtn = document.getElementById("captureBtn");
const downloadBtn = document.getElementById("downloadBtn");
const canvas = document.getElementById("canvas");

let slotCounter = 1;

/* ======================
   0. Konstanta Rasio
====================== */
// Rasio ideal slot yang diminta (Lebar: 1040, Tinggi: 760)
const SLOT_WIDTH_RATIO = 1040;
const SLOT_HEIGHT_RATIO = 760;

// Proporsi posisi slot dalam frame (Disesuaikan berdasarkan CSS di atas)
// Angka-angka ini harus sesuai dengan rasio frame.png Anda
const FRAME_NATURAL_WIDTH = 1920; // Asumsi lebar natural frame.png
const FRAME_NATURAL_HEIGHT = 4500; // Asumsi tinggi natural frame.png

const SLOT_POSITIONS = [
    // [Lebar, Tinggi, X-start, Y-start] dalam persentase dari ukuran natural frame
    { x: 0.23, y: 0.10, w: SLOT_WIDTH_RATIO / FRAME_NATURAL_WIDTH, h: SLOT_HEIGHT_RATIO / FRAME_NATURAL_HEIGHT },
    { x: 0.23, y: 0.35, w: SLOT_WIDTH_RATIO / FRAME_NATURAL_WIDTH, h: SLOT_HEIGHT_RATIO / FRAME_NATURAL_HEIGHT },
    { x: 0.23, y: 0.60, w: SLOT_WIDTH_RATIO / FRAME_NATURAL_WIDTH, h: SLOT_HEIGHT_RATIO / FRAME_NATURAL_HEIGHT }
];


/* ======================
   1. Nyalakan Kamera (Tidak mirror)
====================== */
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream)
  .catch(err => alert("Kamera tidak bisa diakses!"));

/* ======================
   2. Ambil Foto
====================== */
captureBtn.addEventListener("click", () => {
  const ctx = canvas.getContext("2d");

  // Canvas menggunakan dimensi ASLI video untuk kualitas terbaik
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Kamera TIDAK MIRROR: Tidak perlu ctx.scale(-1, 1) karena sudah diatur di CSS atau di-handle browser.
  // Jika masih mirror, hapus komentar pada 3 baris di bawah:
  // ctx.save();
  // ctx.scale(-1, 1); 
  // ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height); 
  // ctx.restore();

  // Jika tidak menggunakan flip:
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height); 

  let dataURL = canvas.toDataURL("image/png");

  // Masukkan gambar ke slot
  const currentSlot = document.getElementById(`slot${slotCounter}`);
  currentSlot.src = dataURL;

  slotCounter++;
  if (slotCounter > 3) slotCounter = 1;
});


/* ======================
   3. Fungsi Draw Cropped (Anti-Distorsi)
====================== */
// Fungsi untuk menggambar gambar ke canvas dengan efek 'object-fit: cover'
function drawCroppedImage(ctx, image, targetX, targetY, targetWidth, targetHeight) {
    const imgWidth = image.naturalWidth;
    const imgHeight = image.naturalHeight;
    const targetRatio = targetWidth / targetHeight;
    const imageRatio = imgWidth / imgHeight;

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = imgWidth;
    let sourceHeight = imgHeight;

    if (imageRatio > targetRatio) {
        // Gambar lebih lebar dari target, pangkas horizontal
        sourceWidth = imgHeight * targetRatio;
        sourceX = (imgWidth - sourceWidth) / 2;
    } else {
        // Gambar lebih tinggi dari target, pangkas vertikal
        sourceHeight = imgWidth / targetRatio;
        sourceY = (imgHeight - sourceHeight) / 2;
    }

    ctx.drawImage(
        image, 
        sourceX, sourceY, sourceWidth, sourceHeight, 
        targetX, targetY, targetWidth, targetHeight
    );
}

/* ======================
   4. Download Hasil (Frame di depan Foto)
====================== */
downloadBtn.addEventListener("click", () => {
  const finalCanvas = document.createElement("canvas");
  const ctx = finalCanvas.getContext("2d");

  const frameImg = document.querySelector(".frame-img");

  // Ukuran finalCanvas harus sama dengan ukuran natural frame.png
  finalCanvas.width = frameImg.naturalWidth;
  finalCanvas.height = frameImg.naturalHeight;

  // --- 1. Gambar Background Biru ---
  ctx.fillStyle = "#10163a"; // Sesuai template
  ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

  // --- 2. Gambar Semua Slot Foto (Async Handling) ---
  const slotsToDraw = [
      { id: "slot1", position: SLOT_POSITIONS[0] },
      { id: "slot2", position: SLOT_POSITIONS[1] },
      { id: "slot3", position: SLOT_POSITIONS[2] },
  ];
  let loadedImages = 0;
  
  // Fungsi utama untuk menggambar semua elemen secara berurutan
  function drawFinalResult() {
      
      slotsToDraw.forEach(slot => {
          const imgElement = document.getElementById(slot.id);
          // Hanya proses slot yang memiliki data gambar
          if (!imgElement.src.includes('data:image/png;base64,')) {
              loadedImages++; // Hitung sebagai dimuat jika kosong
              return;
          }
          
          const imageToDraw = new Image();
          imageToDraw.onload = function() {
              // Hitung posisi dan dimensi aktual di canvas (ukuran natural frame)
              const targetX = finalCanvas.width * slot.position.x;
              const targetY = finalCanvas.height * slot.position.y;
              const targetWidth = finalCanvas.width * slot.position.w;
              const targetHeight = finalCanvas.height * slot.position.h;

              // Gunakan fungsi drawCroppedImage untuk object-fit: cover (anti-distorsi)
              drawCroppedImage(ctx, imageToDraw, targetX, targetY, targetWidth, targetHeight);
              loadedImages++;

              // --- 3. Frame Digambar Paling Atas (Overlay) ---
              if (loadedImages === slotsToDraw.length) {
                   // Gambar frame di paling atas
                  ctx.drawImage(frameImg, 0, 0, finalCanvas.width, finalCanvas.height);

                  // Buat link download setelah semua selesai
                  const link = document.createElement("a");
                  link.download = "photobooth.png";
                  link.href = finalCanvas.toDataURL("image/png");
                  link.click();
              }
          }
          imageToDraw.src = imgElement.src;
      });
  }

  // Panggil fungsi download
  drawFinalResult();
});
