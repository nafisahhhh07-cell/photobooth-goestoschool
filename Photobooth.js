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

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0);

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

  finalCanvas.width = frameImg.naturalWidth;
  finalCanvas.height = frameImg.naturalHeight;

  // gambar frame dulu
  ctx.drawImage(frameImg, 0, 0, finalCanvas.width, finalCanvas.height);

  // lalu gambar tiap slot
  function drawSlot(slotId, x, y, w, h) {
    const img = document.getElementById(slotId);
    if (img.src) ctx.drawImage(img, x, y, w, h);
  }

  // sesuaikan angka posisi dgn desain asli
  drawSlot("slot1", 140, 250, 1500, 850);
  drawSlot("slot2", 140, 1500, 1500, 850);
  drawSlot("slot3", 140, 2750, 1500, 850);

  const link = document.createElement("a");
  link.download = "photobooth.png";
  link.href = finalCanvas.toDataURL();
  link.click();
});