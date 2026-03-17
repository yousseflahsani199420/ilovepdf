const BASE_URL = "https://www.i-lovepdf.site";

let currentTool = null;
let uploadedFiles = [];
let processedBlob = null;
let processedFileName = "";
let resultDetailsHtml = "";
let signatureDataUrl = "";

const toolConfig = {
  merge: { title: "Merge PDF Files", accept: ".pdf", multiple: true, options: null },
  split: { title: "Split PDF", accept: ".pdf", multiple: false, options: "split" },
  compress: { title: "Compress PDF", accept: ".pdf", multiple: true, options: "compress" },
  cropdf: { title: "Crop PDF Pages", accept: ".pdf", multiple: false, options: "cropdf" },
  grayscalepdf: { title: "Grayscale PDF", accept: ".pdf", multiple: false, options: "grayscalepdf" },
  signpdf: { title: "Add Signature to PDF", accept: ".pdf", multiple: false, options: "signpdf" },
  metadatapdf: { title: "PDF Metadata Editor", accept: ".pdf", multiple: false, options: "metadatapdf" },
  removeblankpdf: { title: "Remove Blank PDF Pages", accept: ".pdf", multiple: false, options: "removeblankpdf" },
  resizepdfpages: { title: "PDF Page Size Converter", accept: ".pdf", multiple: false, options: "resizepdfpages" },
  pdftojpg: { title: "PDF to JPG Converter", accept: ".pdf", multiple: false, options: "pdftojpg" },
  pdftopng: { title: "PDF to PNG Converter", accept: ".pdf", multiple: false, options: "pdftopng" },
  imagetopdf: { title: "Image to PDF Converter", accept: "image/*", multiple: true, options: "imagetopdf" },
  ocrtool: { title: "OCR to Text", accept: ".pdf,image/*", multiple: false, options: "ocrtool" },
  qrtemplates: { title: "QR Templates", accept: "", multiple: false, options: "qrtemplates", noFile: true },
  qrcreate: { title: "QR Code Generator", accept: "", multiple: false, options: "qrcreate", noFile: true },
  qrscan: { title: "QR Code Scanner", accept: "image/*", multiple: false, options: "qrscan" },
  barcodegen: { title: "Barcode Generator", accept: "", multiple: false, options: "barcodegen", noFile: true },
  barcodescan: { title: "Barcode Scanner", accept: "image/*", multiple: false, options: "barcodescan" },
  imageconvert: { title: "Image Converter", accept: "image/*", multiple: false, options: "imageconvert" },
  imageresize: { title: "Image Resizer", accept: "image/*", multiple: false, options: "imageresize" },
  photocompress: { title: "Photo Compressor", accept: "image/*", multiple: false, options: "photocompress" },
  videotogif: { title: "Video to GIF", accept: "video/*", multiple: false, options: "videotogif" },
  videocompress: { title: "Video Compressor", accept: "video/*", multiple: false, options: "videocompress" },
  rotate: { title: "Rotate PDF", accept: ".pdf", multiple: false, options: "rotate" },
  deletepages: { title: "Delete PDF Pages", accept: ".pdf", multiple: false, options: "deletepages" },
  extractpages: { title: "Extract PDF Pages", accept: ".pdf", multiple: false, options: "extractpages" },
  reorder: { title: "Reorder PDF Pages", accept: ".pdf", multiple: false, options: "reorder" },
  pagenumbers: { title: "Add Page Numbers to PDF", accept: ".pdf", multiple: false, options: "pagenumbers" },
  watermark: { title: "Add Watermark to PDF", accept: ".pdf", multiple: false, options: "watermark" },
  pdftotext: { title: "PDF to Text", accept: ".pdf", multiple: false, options: "pdftotext" },
  protect: { title: "Protect PDF", accept: ".pdf", multiple: false, options: "protect" },
  unlock: { title: "Unlock PDF", accept: ".pdf", multiple: false, options: "unlock" }
};

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

const elements = {
  workspace: document.getElementById("workspace"),
  workspaceTitle: document.getElementById("workspace-title"),
  closeBtn: document.getElementById("closeBtn"),
  fileInput: document.getElementById("fileInput"),
  uploadContainer: document.getElementById("uploadContainer"),
  initialUpload: document.getElementById("initialUpload"),
  fileListContainer: document.getElementById("fileListContainer"),
  fileList: document.getElementById("fileList"),
  fileTypes: document.getElementById("fileTypes"),
  optionsPanel: document.getElementById("optionsPanel"),
  previewArea: document.getElementById("previewArea"),
  loader: document.getElementById("loader"),
  progressContainer: document.getElementById("progressContainer"),
  progressBar: document.getElementById("progressBar"),
  resultArea: document.getElementById("resultArea"),
  resultFileList: document.getElementById("resultFileList"),
  errorMessage: document.getElementById("errorMessage"),
  selectFilesBtn: document.getElementById("selectFilesBtn"),
  addMoreBtn: document.getElementById("addMoreBtn"),
  processBtn: document.getElementById("processBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  processAnotherBtn: document.getElementById("processAnotherBtn"),
  navLogo: document.getElementById("navLogo")
};

function initEventListeners() {
  document.querySelectorAll(".tool-card").forEach((card) => {
    card.addEventListener("click", function () {
      openTool(this.getAttribute("data-tool"));
    });
  });

  elements.closeBtn.addEventListener("click", closeTool);
  elements.fileInput.addEventListener("change", (e) => handleFiles(e.target.files));
  elements.selectFilesBtn.addEventListener("click", (e) => { e.stopPropagation(); elements.fileInput.click(); });
  elements.addMoreBtn.addEventListener("click", (e) => { e.stopPropagation(); elements.fileInput.click(); });
  elements.processBtn.addEventListener("click", processFiles);
  elements.downloadBtn.addEventListener("click", downloadResult);
  elements.processAnotherBtn.addEventListener("click", resetTool);

  elements.uploadContainer.addEventListener("dragover", (e) => { e.preventDefault(); e.currentTarget.classList.add("dragover"); });
  elements.uploadContainer.addEventListener("dragleave", (e) => e.currentTarget.classList.remove("dragover"));
  elements.uploadContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("dragover");
    handleFiles(e.dataTransfer.files);
  });
  elements.uploadContainer.addEventListener("click", (e) => {
    if (toolConfig[currentTool]?.noFile) return;
    if ((e.target === elements.uploadContainer || e.target.classList.contains("upload-content")) && uploadedFiles.length === 0) {
      elements.fileInput.click();
    }
  });

  elements.navLogo.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function humanAccept(accept) {
  if (accept === "image/*") return "Image files";
  if (accept === "video/*") return "Video files";
  if (accept === ".pdf") return "PDF";
  if (accept === ".pdf,image/*") return "PDF or image";
  if (!accept) return "No file needed";
  return accept;
}

function openTool(toolName) {
  if (!toolConfig[toolName]) return;
  currentTool = toolName;
  const cfg = toolConfig[toolName];
  elements.workspaceTitle.textContent = cfg.title;
  elements.fileInput.accept = cfg.accept;
  elements.fileInput.multiple = cfg.multiple;
  elements.fileTypes.textContent = `Supported: ${humanAccept(cfg.accept)}`;
  setupOptionsPanel(cfg.options);
  elements.workspace.classList.add("active");
  elements.workspace.scrollIntoView({ behavior: "smooth", block: "center" });
  resetTool();
}

function setupOptionsPanel(optionType) {
  if (!optionType) {
    elements.optionsPanel.style.display = "none";
    return;
  }

  elements.optionsPanel.style.display = "block";
  let html = "<h4>Options</h4>";

  switch (optionType) {
    case "split":
      html += `<div class="option-group"><label>Page Range (1-3,5,8)</label><input type="text" id="pageRange" placeholder="Enter page range"></div>`;
      break;
    case "compress":
      html += `<div class="option-group"><label>Compression Level</label><input type="range" id="qualityLevel" min="1" max="5" value="3" class="quality-slider"><div style="display:flex;justify-content:space-between;font-size:0.85rem;color:#64748B;"><span>Max compression</span><span>Best quality</span></div></div>`;
      break;
    case "cropdf":
      html += `<div class="option-group"><label>Crop Left (%)</label><input type="number" id="cropLeft" min="0" max="45" value="2"></div><div class="option-group"><label>Crop Right (%)</label><input type="number" id="cropRight" min="0" max="45" value="2"></div><div class="option-group"><label>Crop Top (%)</label><input type="number" id="cropTop" min="0" max="45" value="2"></div><div class="option-group"><label>Crop Bottom (%)</label><input type="number" id="cropBottom" min="0" max="45" value="2"></div>`;
      break;
    case "grayscalepdf":
      html += `<div class="option-group"><label>Render Quality</label><select id="grayscaleDpi"><option value="110">Fast</option><option value="150" selected>Balanced</option><option value="220">High quality</option></select></div>`;
      break;
    case "signpdf":
      html += `<div class="option-group"><label>Draw Signature</label><canvas id="signatureCanvas" width="500" height="140" style="width:100%;max-width:100%;border:1px solid #CBD5E1;border-radius:8px;background:white;"></canvas><div style="display:flex;gap:8px;margin-top:8px;"><button type="button" class="btn btn-secondary" id="signatureClearBtn">Clear</button></div></div><div class="option-group"><label>Or Upload Signature Image</label><input type="file" id="signatureImageInput" accept="image/png,image/jpeg,image/jpg"></div><div class="option-group"><label>Apply On</label><select id="signatureApplyOn"><option value="first" selected>First page</option><option value="all">All pages</option></select></div><div class="option-group"><label>Size (% of page width)</label><input type="number" id="signatureScale" min="10" max="60" value="26"></div>`;
      break;
    case "metadatapdf":
      html += `<div class="option-group"><label>Title</label><input type="text" id="metaTitle" placeholder="Document title"></div><div class="option-group"><label>Author</label><input type="text" id="metaAuthor" placeholder="Author"></div><div class="option-group"><label>Subject</label><input type="text" id="metaSubject" placeholder="Subject"></div><div class="option-group"><label>Keywords</label><input type="text" id="metaKeywords" placeholder="keyword1, keyword2"></div>`;
      break;
    case "removeblankpdf":
      html += `<div class="option-group"><label>Blank Detection Sensitivity</label><select id="blankSensitivity"><option value="strict">Strict (remove mostly empty)</option><option value="balanced" selected>Balanced</option><option value="loose">Loose (remove only fully blank)</option></select></div>`;
      break;
    case "resizepdfpages":
      html += `<div class="option-group"><label>Target Page Size</label><select id="targetPageSize"><option value="A4" selected>A4</option><option value="LETTER">Letter</option><option value="LEGAL">Legal</option></select></div><div class="option-group"><label>Fit Mode</label><select id="pageFitMode"><option value="contain" selected>Contain (keep full page)</option><option value="cover">Cover (fill page)</option></select></div>`;
      break;
    case "pdftojpg":
      html += `<div class="option-group"><label>Page Number</label><input type="number" id="pdfImagePage" min="1" value="1"></div><div class="option-group"><label>Render DPI</label><select id="imageQuality"><option value="150">150 DPI</option><option value="300" selected>300 DPI</option><option value="600">600 DPI</option></select></div><div class="option-group"><label>JPG Quality</label><select id="jpgQuality"><option value="0.7">70%</option><option value="0.85" selected>85%</option><option value="0.95">95%</option></select></div>`;
      break;
    case "pdftopng":
      html += `<div class="option-group"><label>Page Number</label><input type="number" id="pdfImagePage" min="1" value="1"></div><div class="option-group"><label>Render DPI</label><select id="imageQuality"><option value="150">150 DPI</option><option value="300" selected>300 DPI</option><option value="600">600 DPI</option></select></div>`;
      break;
    case "imagetopdf":
      html += `<div class="option-group"><label>Page Size</label><select id="pageSize"><option value="a4">A4</option><option value="letter">Letter</option><option value="original" selected>Original image size</option></select></div><div class="option-group"><label>Orientation</label><select id="orientation"><option value="auto" selected>Auto</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></div>`;
      break;
    case "ocrtool":
      html += `<div class="option-group"><label>OCR Language</label><select id="ocrLang"><option value="eng" selected>English</option><option value="fra">French</option><option value="spa">Spanish</option></select></div><div class="option-group"><label>Output Mode</label><select id="ocrMode"><option value="text" selected>Plain text</option><option value="lines">Line by line</option></select></div>`;
      break;
    case "qrtemplates":
      html += `<div class="option-group"><label>Template Type</label><select id="qrTemplateType"><option value="url" selected>URL</option><option value="wifi">Wi-Fi</option><option value="vcard">vCard</option><option value="whatsapp">WhatsApp</option></select></div><div class="option-group"><label>Main Value</label><input type="text" id="qrTplMain" placeholder="URL / SSID / Name / Phone"></div><div class="option-group"><label>Extra Value 1</label><input type="text" id="qrTplExtra1" placeholder="Password / Email / Message"></div><div class="option-group"><label>Extra Value 2</label><input type="text" id="qrTplExtra2" placeholder="Phone (for vCard)"></div><div class="option-group"><label>Size (px)</label><input type="number" id="qrTplSize" min="128" max="2048" value="512"></div>`;
      break;
    case "qrcreate":
      html += `<div class="option-group"><label>Text or URL</label><input type="text" id="qrText" placeholder="https://example.com or any text"></div><div class="option-group"><label>Size (px)</label><input type="number" id="qrSize" min="128" max="2048" value="512"></div><div class="option-group"><label>Error Correction</label><select id="qrErrorLevel"><option value="L">Low</option><option value="M" selected>Medium</option><option value="Q">Quartile</option><option value="H">High</option></select></div>`;
      break;
    case "qrscan":
      html += `<div class="option-group"><label>Scan Mode</label><select id="qrScanMode"><option value="text" selected>Save decoded text</option><option value="url">Open decoded URL (if valid)</option></select></div>`;
      break;
    case "barcodegen":
      html += `<div class="option-group"><label>Barcode Value</label><input type="text" id="barcodeValue" placeholder="123456789012"></div><div class="option-group"><label>Format</label><select id="barcodeFormat"><option value="CODE128" selected>CODE128</option><option value="EAN13">EAN13</option><option value="UPC">UPC</option><option value="CODE39">CODE39</option></select></div><div class="option-group"><label>Width</label><input type="number" id="barcodeWidth" min="1" max="6" value="2"></div><div class="option-group"><label>Height</label><input type="number" id="barcodeHeight" min="30" max="220" value="90"></div>`;
      break;
    case "barcodescan":
      html += `<div class="option-group"><label>Detected Value Action</label><select id="barcodeScanMode"><option value="text" selected>Save decoded value</option><option value="url">Open if URL</option></select></div>`;
      break;
    case "imageconvert":
      html += `<div class="option-group"><label>Output Format</label><select id="imageConvertFormat"><option value="image/jpeg" selected>JPG</option><option value="image/png">PNG</option><option value="image/webp">WEBP</option></select></div><div class="option-group"><label>Quality</label><input type="range" id="imageConvertQuality" min="20" max="95" value="85" class="quality-slider"></div>`;
      break;
    case "imageresize":
      html += `<div class="option-group"><label>Max Width (px)</label><input type="number" id="resizeWidth" min="32" max="12000" value="1920"></div><div class="option-group"><label>Max Height (px)</label><input type="number" id="resizeHeight" min="32" max="12000" value="1920"></div><div class="option-group"><label>Output Format</label><select id="resizeFormat"><option value="image/jpeg" selected>JPG</option><option value="image/png">PNG</option><option value="image/webp">WEBP</option></select></div>`;
      break;
    case "photocompress":
      html += `<div class="option-group"><label>Output Format</label><select id="photoFormat"><option value="image/jpeg" selected>JPG</option><option value="image/webp">WEBP</option><option value="image/png">PNG</option></select></div><div class="option-group"><label>Quality</label><input type="range" id="photoQuality" min="20" max="95" value="80" class="quality-slider"></div><div class="option-group"><label>Max Width (px, 0 keeps original)</label><input type="number" id="photoMaxWidth" min="0" max="12000" value="1920"></div>`;
      break;
    case "videotogif":
      html += `<div class="option-group"><label>GIF FPS</label><select id="gifFps"><option value="8">8</option><option value="12" selected>12</option><option value="16">16</option></select></div><div class="option-group"><label>Max GIF Width</label><input type="number" id="gifMaxWidth" min="120" max="1920" value="640"></div><div class="option-group"><label>GIF Quality</label><select id="gifQuality"><option value="5">High quality</option><option value="10" selected>Balanced</option><option value="20">Smaller size</option></select></div>`;
      break;
    case "videocompress":
      html += `<div class="option-group"><label>Scale</label><select id="videoScale"><option value="1">Original</option><option value="0.75" selected>75%</option><option value="0.5">50%</option></select></div><div class="option-group"><label>Target Bitrate (kbps)</label><input type="number" id="videoBitrate" min="300" max="12000" value="1800"></div><div class="option-group"><label>FPS</label><select id="videoFps"><option value="24" selected>24</option><option value="30">30</option></select></div>`;
      break;
    case "rotate":
      html += `<div class="option-group"><label>Rotation</label><select id="rotationAngle"><option value="90">90 clockwise</option><option value="180">180</option><option value="270">90 counter clockwise</option></select></div>`;
      break;
    case "deletepages":
      html += `<div class="option-group"><label>Pages to Delete</label><input type="text" id="deleteRange" placeholder="Example: 2,4-7"></div>`;
      break;
    case "extractpages":
      html += `<div class="option-group"><label>Pages to Extract</label><input type="text" id="extractRange" placeholder="Example: 1-3,8"></div>`;
      break;
    case "reorder":
      html += `<div class="option-group"><label>Page Order</label><input type="text" id="pageOrder" placeholder="Example: 3,1,2,4"><small style="color:#64748B;display:block;margin-top:6px;">Use every page number exactly once.</small></div>`;
      break;
    case "pagenumbers":
      html += `<div class="option-group"><label>Start Number</label><input type="number" id="numberStart" min="1" value="1"></div><div class="option-group"><label>Position</label><select id="numberPosition"><option value="bottom-center" selected>Bottom center</option><option value="bottom-right">Bottom right</option><option value="top-right">Top right</option><option value="top-left">Top left</option></select></div><div class="option-group"><label>Font Size</label><input type="number" id="numberSize" min="8" max="48" value="12"></div>`;
      break;
    case "watermark":
      html += `<div class="option-group"><label>Watermark Text</label><input type="text" id="watermarkText" placeholder="Example: CONFIDENTIAL"></div><div class="option-group"><label>Position</label><select id="watermarkPosition"><option value="center" selected>Center</option><option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option></select></div><div class="option-group"><label>Opacity</label><input type="range" id="watermarkOpacity" min="10" max="90" value="35" class="quality-slider"></div><div class="option-group"><label>Font Size</label><input type="number" id="watermarkSize" min="8" max="120" value="42"></div>`;
      break;
    case "pdftotext":
      html += `<div class="option-group"><label>Output</label><select id="textJoinMode"><option value="paragraphs" selected>Readable paragraphs</option><option value="lines">One line per text item</option></select></div>`;
      break;
    case "protect":
      html += `<div class="option-group"><label>Password</label><input type="password" id="pdfPassword" placeholder="Enter password"></div><div class="option-group"><label>Confirm Password</label><input type="password" id="confirmPassword" placeholder="Confirm password"></div>`;
      break;
    case "unlock":
      html += `<div class="option-group"><label>Current Password</label><input type="password" id="currentPassword" placeholder="Enter current password"></div>`;
      break;
    default:
      elements.optionsPanel.style.display = "none";
      return;
  }

  elements.optionsPanel.innerHTML = html;
  initDynamicOptionUI(optionType);
}

function initDynamicOptionUI(optionType) {
  if (optionType === "signpdf") {
    signatureDataUrl = "";
    const canvas = document.getElementById("signatureCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    let drawing = false;

    const getPoint = (event) => {
      const rect = canvas.getBoundingClientRect();
      const src = event.touches ? event.touches[0] : event;
      const x = ((src.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((src.clientY - rect.top) / rect.height) * canvas.height;
      return { x, y };
    };

    const start = (event) => {
      drawing = true;
      const p = getPoint(event);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      event.preventDefault();
    };

    const move = (event) => {
      if (!drawing) return;
      const p = getPoint(event);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      signatureDataUrl = canvas.toDataURL("image/png");
      event.preventDefault();
    };

    const end = () => {
      if (!drawing) return;
      drawing = false;
      signatureDataUrl = canvas.toDataURL("image/png");
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end, { passive: false });

    const clearBtn = document.getElementById("signatureClearBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        signatureDataUrl = "";
      });
    }

    const upload = document.getElementById("signatureImageInput");
    if (upload) {
      upload.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          signatureDataUrl = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }
  }

  if (optionType === "qrtemplates") {
    const typeEl = document.getElementById("qrTemplateType");
    const mainEl = document.getElementById("qrTplMain");
    const ex1El = document.getElementById("qrTplExtra1");
    const ex2El = document.getElementById("qrTplExtra2");
    if (!typeEl || !mainEl || !ex1El || !ex2El) return;

    const applyHints = () => {
      const type = typeEl.value;
      if (type === "url") {
        mainEl.placeholder = "https://example.com";
        ex1El.placeholder = "Optional label";
        ex2El.placeholder = "Unused";
      } else if (type === "wifi") {
        mainEl.placeholder = "Wi-Fi SSID";
        ex1El.placeholder = "Wi-Fi password";
        ex2El.placeholder = "Security (WPA/WEP)";
      } else if (type === "vcard") {
        mainEl.placeholder = "Full Name";
        ex1El.placeholder = "Email";
        ex2El.placeholder = "Phone";
      } else if (type === "whatsapp") {
        mainEl.placeholder = "Phone number with country code";
        ex1El.placeholder = "Message";
        ex2El.placeholder = "Unused";
      }
    };
    typeEl.addEventListener("change", applyHints);
    applyHints();
  }
}

function closeTool() {
  elements.workspace.classList.remove("active");
  currentTool = null;
}

function resetTool() {
  const cfg = toolConfig[currentTool];
  uploadedFiles = [];
  processedBlob = null;
  processedFileName = "";
  resultDetailsHtml = "";
  signatureDataUrl = "";
  elements.uploadContainer.style.display = "block";
  elements.uploadContainer.classList.remove("has-files");
  elements.initialUpload.style.display = "block";
  elements.fileListContainer.style.display = "none";
  elements.optionsPanel.style.display = cfg?.options ? "block" : "none";
  elements.previewArea.style.display = "none";
  elements.loader.style.display = "none";
  elements.progressContainer.style.display = "none";
  elements.resultArea.style.display = "none";
  elements.errorMessage.style.display = "none";
  elements.fileInput.value = "";
  elements.fileList.innerHTML = "";
  elements.previewArea.innerHTML = "";
  elements.addMoreBtn.style.display = "inline-block";
  elements.processBtn.textContent = "Process";
  updateProgress(0);

  if (cfg?.noFile) {
    elements.initialUpload.style.display = "none";
    elements.fileListContainer.style.display = "block";
    elements.uploadContainer.classList.add("has-files");
    elements.addMoreBtn.style.display = "none";
    elements.processBtn.textContent = "Generate";
    elements.fileList.innerHTML = `<div class="file-item"><span>No file is needed for this tool. Set options then click Generate.</span></div>`;
  }
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = "block";
  setTimeout(() => { elements.errorMessage.style.display = "none"; }, 5000);
}

function isPdf(file) {
  return file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
}

function isJpgOrPng(file) {
  const type = (file.type || "").toLowerCase();
  return type === "image/png" || type === "image/jpeg" || type === "image/jpg";
}

function isImage(file) {
  return (file.type || "").toLowerCase().startsWith("image/");
}

function isVideo(file) {
  return (file.type || "").toLowerCase().startsWith("video/");
}

function handleFiles(files) {
  if (!files.length || !toolConfig[currentTool]) return;
  const cfg = toolConfig[currentTool];
  const valid = Array.from(files).filter((file) => {
    if (cfg.accept === "image/*") {
      if (currentTool === "imagetopdf") return isJpgOrPng(file);
      return isImage(file);
    }
    if (cfg.accept === "video/*") return isVideo(file);
    if (cfg.accept === ".pdf,image/*") return isPdf(file) || isImage(file);
    return isPdf(file);
  });

  if (!valid.length) {
    if (cfg.accept === "image/*" && currentTool === "imagetopdf") {
      showError("Please upload JPG or PNG files.");
    } else if (cfg.accept === "image/*") {
      showError("Please upload a valid image file.");
    } else if (cfg.accept === "video/*") {
      showError("Please upload a valid video file.");
    } else if (cfg.accept === ".pdf,image/*") {
      showError("Please upload a PDF or image file.");
    } else {
      showError("Please upload valid PDF files.");
    }
    return;
  }

  if (!cfg.multiple && valid.length > 1) {
    showError("This tool accepts one file at a time. Using the first file only.");
  }

  uploadedFiles = cfg.multiple ? [...uploadedFiles, ...valid] : [valid[0]];
  displayFileList();
  if (["imagetopdf", "photocompress", "qrscan", "barcodescan", "imageconvert", "imageresize"].includes(currentTool)) showImagePreviews();
}

function displayFileList() {
  elements.initialUpload.style.display = "none";
  elements.fileListContainer.style.display = "block";
  elements.uploadContainer.classList.add("has-files");
  elements.fileList.innerHTML = uploadedFiles.map((file, idx) => `<div class="file-item"><span style="display:flex;align-items:center;"><span class="drag-handle">::</span>${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span><button data-index="${idx}" class="remove-btn">Remove</button></div>`).join("");
  document.querySelectorAll(".remove-btn").forEach((btn) => btn.addEventListener("click", function () { removeFile(parseInt(this.getAttribute("data-index"), 10)); }));
}

function removeFile(index) {
  uploadedFiles.splice(index, 1);
  if (!uploadedFiles.length) resetTool();
  else {
    displayFileList();
    if (["imagetopdf", "photocompress", "qrscan", "barcodescan", "imageconvert", "imageresize"].includes(currentTool)) showImagePreviews();
  }
}

function showImagePreviews() {
  elements.previewArea.style.display = "grid";
  elements.previewArea.innerHTML = "";
  uploadedFiles.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement("div");
      div.className = "preview-item";
      div.innerHTML = `<img src="${e.target.result}" alt="Preview image ${idx + 1}"><div class="page-num">Image ${idx + 1}</div>`;
      elements.previewArea.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function parsePageRange(value, maxPages) {
  if (!value || !value.trim()) throw new Error("Please enter a valid page range.");
  const pages = [];
  value.split(",").map((t) => t.trim()).filter(Boolean).forEach((token) => {
    if (token.includes("-")) {
      const [a, b] = token.split("-").map((n) => Number(n.trim()));
      if (!Number.isInteger(a) || !Number.isInteger(b) || a <= 0 || b <= 0) throw new Error(`Invalid token: ${token}`);
      const start = Math.min(a, b);
      const end = Math.max(a, b);
      for (let i = start; i <= end; i += 1) {
        if (i > maxPages) throw new Error(`Page ${i} is out of range (max ${maxPages}).`);
        pages.push(i - 1);
      }
    } else {
      const page = Number(token);
      if (!Number.isInteger(page) || page <= 0 || page > maxPages) throw new Error(`Invalid page: ${token}`);
      pages.push(page - 1);
    }
  });
  return [...new Set(pages)];
}

function parsePageOrder(value, pageCount) {
  if (!value || !value.trim()) throw new Error("Please enter a page order.");
  const list = value.split(",").map((v) => v.trim()).filter(Boolean);
  if (list.length !== pageCount) throw new Error(`You must provide exactly ${pageCount} page numbers.`);
  const order = list.map((v) => {
    const n = Number(v);
    if (!Number.isInteger(n) || n <= 0 || n > pageCount) throw new Error(`Invalid page number: ${v}`);
    return n - 1;
  });
  if (new Set(order).size !== pageCount) throw new Error("Page order has duplicates.");
  return order;
}

function updateProgress(percent) {
  const p = Math.max(0, Math.min(100, percent));
  elements.progressBar.style.width = `${p}%`;
  elements.progressBar.textContent = `${Math.floor(p)}%`;
}

async function processFiles() {
  if (!uploadedFiles.length && !toolConfig[currentTool]?.noFile) return;
  elements.uploadContainer.style.display = "none";
  elements.optionsPanel.style.display = "none";
  elements.previewArea.style.display = "none";
  elements.loader.style.display = "block";
  elements.progressContainer.style.display = "block";

  try {
    updateProgress(10);
    switch (currentTool) {
      case "merge": await mergePDFs(); break;
      case "split": await splitPDF(); break;
      case "compress": await compressPDF(); break;
      case "cropdf": await cropPDFPages(); break;
      case "grayscalepdf": await grayscalePDF(); break;
      case "signpdf": await addSignaturePDF(); break;
      case "metadatapdf": await editPDFMetadata(); break;
      case "removeblankpdf": await removeBlankPDFPages(); break;
      case "resizepdfpages": await convertPDFPageSize(); break;
      case "pdftojpg": await pdfToImage("jpg"); break;
      case "pdftopng": await pdfToImage("png"); break;
      case "imagetopdf": await imagesToPDF(); break;
      case "ocrtool": await runOCRTool(); break;
      case "qrtemplates": await generateTemplateQR(); break;
      case "qrcreate": await generateQRCode(); break;
      case "qrscan": await scanQRCode(); break;
      case "barcodegen": await generateBarcode(); break;
      case "barcodescan": await scanBarcode(); break;
      case "imageconvert": await convertImages(); break;
      case "imageresize": await resizeImages(); break;
      case "photocompress": await compressPhotos(); break;
      case "videotogif": await convertVideoToGIF(); break;
      case "videocompress": await compressVideo(); break;
      case "rotate": await rotatePDF(); break;
      case "deletepages": await deletePagesPDF(); break;
      case "extractpages": await extractPagesPDF(); break;
      case "reorder": await reorderPDFPages(); break;
      case "pagenumbers": await addPageNumbersPDF(); break;
      case "watermark": await addWatermarkPDF(); break;
      case "pdftotext": await pdfToText(); break;
      case "protect": await protectPDF(); break;
      case "unlock": await unlockPDF(); break;
      default: throw new Error("Tool not implemented yet.");
    }
    updateProgress(100);
    setTimeout(showResults, 450);
  } catch (error) {
    console.error(error);
    showError(`Error processing files: ${error.message}`);
    elements.loader.style.display = "none";
    elements.progressContainer.style.display = "none";
    elements.uploadContainer.style.display = "block";
    elements.optionsPanel.style.display = toolConfig[currentTool]?.options ? "block" : "none";
    if (uploadedFiles.length) {
      elements.initialUpload.style.display = "none";
      elements.fileListContainer.style.display = "block";
      elements.uploadContainer.classList.add("has-files");
    }
  }
}

async function mergePDFs() {
  const { PDFDocument } = PDFLib;
  const out = await PDFDocument.create();
  for (let i = 0; i < uploadedFiles.length; i += 1) {
    const pdf = await PDFDocument.load(await uploadedFiles[i].arrayBuffer());
    const pages = await out.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((p) => out.addPage(p));
    updateProgress(10 + ((i + 1) / uploadedFiles.length) * 80);
  }
  processedBlob = new Blob([await out.save()], { type: "application/pdf" });
  processedFileName = "merged.pdf";
}

async function splitPDF() {
  const { PDFDocument } = PDFLib;
  const inPdf = await PDFDocument.load(await uploadedFiles[0].arrayBuffer());
  const pages = parsePageRange(document.getElementById("pageRange").value, inPdf.getPageCount());
  if (!pages.length) throw new Error("No pages selected.");
  const out = await PDFDocument.create();
  (await out.copyPages(inPdf, pages)).forEach((p) => out.addPage(p));
  processedBlob = new Blob([await out.save()], { type: "application/pdf" });
  processedFileName = "split.pdf";
}

async function compressPDF() {
  const { PDFDocument } = PDFLib;
  const out = await PDFDocument.create();
  for (let i = 0; i < uploadedFiles.length; i += 1) {
    const pdf = await PDFDocument.load(await uploadedFiles[i].arrayBuffer());
    (await out.copyPages(pdf, pdf.getPageIndices())).forEach((p) => out.addPage(p));
    updateProgress(10 + ((i + 1) / uploadedFiles.length) * 55);
  }
  processedBlob = new Blob([await out.save({ useObjectStreams: true, addDefaultPage: false, preserveExistingEncryption: false })], { type: "application/pdf" });
  processedFileName = "compressed.pdf";
}

function getTargetPageSize() {
  const size = document.getElementById("targetPageSize").value;
  if (size === "LETTER") return [612, 792];
  if (size === "LEGAL") return [612, 1008];
  return [595.28, 841.89];
}

async function cropPDFPages() {
  const { PDFDocument } = PDFLib;
  const pdf = await PDFDocument.load(await uploadedFiles[0].arrayBuffer());
  const left = Math.max(0, parseFloat(document.getElementById("cropLeft").value || "0"));
  const right = Math.max(0, parseFloat(document.getElementById("cropRight").value || "0"));
  const top = Math.max(0, parseFloat(document.getElementById("cropTop").value || "0"));
  const bottom = Math.max(0, parseFloat(document.getElementById("cropBottom").value || "0"));
  if (left + right >= 90 || top + bottom >= 90) throw new Error("Crop values are too large.");

  const pages = pdf.getPages();
  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    const x = width * (left / 100);
    const y = height * (bottom / 100);
    const w = width * (1 - (left + right) / 100);
    const h = height * (1 - (top + bottom) / 100);
    page.setCropBox(x, y, w, h);
    updateProgress(10 + ((idx + 1) / pages.length) * 80);
  });

  processedBlob = new Blob([await pdf.save()], { type: "application/pdf" });
  processedFileName = "cropped.pdf";
}

async function renderPdfAsImagePdf(options = {}) {
  const grayscale = !!options.grayscale;
  const dpi = options.dpi || 150;
  const targetSize = options.targetSize || null;
  const fitMode = options.fitMode || "contain";
  const pdfDoc = await pdfjsLib.getDocument({ data: await uploadedFiles[0].arrayBuffer() }).promise;
  const out = await PDFLib.PDFDocument.create();

  for (let i = 1; i <= pdfDoc.numPages; i += 1) {
    const page = await pdfDoc.getPage(i);
    const renderViewport = page.getViewport({ scale: dpi / 72 });
    const originalViewport = page.getViewport({ scale: 1 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = Math.round(renderViewport.width);
    canvas.height = Math.round(renderViewport.height);
    await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;

    if (grayscale) {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let p = 0; p < data.data.length; p += 4) {
        const avg = Math.round((data.data[p] + data.data[p + 1] + data.data[p + 2]) / 3);
        data.data[p] = avg;
        data.data[p + 1] = avg;
        data.data[p + 2] = avg;
      }
      ctx.putImageData(data, 0, 0);
    }

    const jpgBlob = await canvasToBlob(canvas, "image/jpeg", 0.9);
    const jpgBytes = await jpgBlob.arrayBuffer();
    const image = await out.embedJpg(jpgBytes);
    const pageWidth = targetSize ? targetSize[0] : originalViewport.width;
    const pageHeight = targetSize ? targetSize[1] : originalViewport.height;
    const newPage = out.addPage([pageWidth, pageHeight]);
    const scale = fitMode === "cover"
      ? Math.max(pageWidth / image.width, pageHeight / image.height)
      : Math.min(pageWidth / image.width, pageHeight / image.height);
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    newPage.drawImage(image, {
      x: (pageWidth - drawW) / 2,
      y: (pageHeight - drawH) / 2,
      width: drawW,
      height: drawH
    });

    updateProgress(10 + (i / pdfDoc.numPages) * 80);
  }

  return out;
}

async function grayscalePDF() {
  const dpi = parseInt(document.getElementById("grayscaleDpi").value || "150", 10);
  const out = await renderPdfAsImagePdf({ grayscale: true, dpi });
  processedBlob = new Blob([await out.save()], { type: "application/pdf" });
  processedFileName = "grayscale.pdf";
}

async function addSignaturePDF() {
  const { PDFDocument } = PDFLib;
  if (!signatureDataUrl) throw new Error("Draw or upload a signature first.");
  const pdf = await PDFDocument.load(await uploadedFiles[0].arrayBuffer());
  const bytes = await dataUrlToBlob(signatureDataUrl).arrayBuffer();
  const image = signatureDataUrl.startsWith("data:image/png")
    ? await pdf.embedPng(bytes)
    : await pdf.embedJpg(bytes);
  const applyOn = document.getElementById("signatureApplyOn").value;
  const scalePct = Math.max(10, Math.min(60, parseInt(document.getElementById("signatureScale").value || "26", 10))) / 100;
  const pages = pdf.getPages();
  const targetPages = applyOn === "all" ? pages : [pages[0]];

  targetPages.forEach((page, idx) => {
    const { width } = page.getSize();
    const drawW = width * scalePct;
    const ratio = drawW / image.width;
    const drawH = image.height * ratio;
    page.drawImage(image, {
      x: width - drawW - 24,
      y: 24,
      width: drawW,
      height: drawH,
      opacity: 0.96
    });
    updateProgress(10 + ((idx + 1) / targetPages.length) * 80);
  });

  processedBlob = new Blob([await pdf.save()], { type: "application/pdf" });
  processedFileName = "signed.pdf";
}

async function editPDFMetadata() {
  const { PDFDocument } = PDFLib;
  const pdf = await PDFDocument.load(await uploadedFiles[0].arrayBuffer());
  const title = document.getElementById("metaTitle").value || "";
  const author = document.getElementById("metaAuthor").value || "";
  const subject = document.getElementById("metaSubject").value || "";
  const keywords = document.getElementById("metaKeywords").value || "";
  pdf.setTitle(title);
  pdf.setAuthor(author);
  pdf.setSubject(subject);
  if (keywords) pdf.setKeywords(keywords.split(",").map((k) => k.trim()).filter(Boolean));
  processedBlob = new Blob([await pdf.save()], { type: "application/pdf" });
  processedFileName = "metadata-updated.pdf";
}

async function removeBlankPDFPages() {
  const { PDFDocument } = PDFLib;
  const sensitivity = document.getElementById("blankSensitivity").value;
  const threshold = sensitivity === "strict" ? 0.015 : (sensitivity === "loose" ? 0.002 : 0.007);
  const fileBytes = await uploadedFiles[0].arrayBuffer();
  const renderPdf = await pdfjsLib.getDocument({ data: fileBytes }).promise;
  const sourcePdf = await PDFDocument.load(fileBytes);
  const keep = [];

  for (let i = 1; i <= renderPdf.numPages; i += 1) {
    const page = await renderPdf.getPage(i);
    const textContent = await page.getTextContent();
    if (textContent.items.length > 0) {
      keep.push(i - 1);
      updateProgress(10 + (i / renderPdf.numPages) * 80);
      continue;
    }

    const viewport = page.getViewport({ scale: 0.32 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    await page.render({ canvasContext: ctx, viewport }).promise;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let nonWhite = 0;
    for (let p = 0; p < pixels.length; p += 4) {
      const avg = (pixels[p] + pixels[p + 1] + pixels[p + 2]) / 3;
      if (avg < 246) nonWhite += 1;
    }
    const ratio = nonWhite / (pixels.length / 4);
    if (ratio > threshold) keep.push(i - 1);
    updateProgress(10 + (i / renderPdf.numPages) * 80);
  }

  if (!keep.length) keep.push(0);
  const out = await PDFDocument.create();
  (await out.copyPages(sourcePdf, keep)).forEach((p) => out.addPage(p));
  processedBlob = new Blob([await out.save()], { type: "application/pdf" });
  processedFileName = "blank-pages-removed.pdf";
}

async function convertPDFPageSize() {
  const targetSize = getTargetPageSize();
  const fitMode = document.getElementById("pageFitMode").value;
  const out = await renderPdfAsImagePdf({ grayscale: false, dpi: 150, targetSize, fitMode });
  processedBlob = new Blob([await out.save()], { type: "application/pdf" });
  processedFileName = "resized-pages.pdf";
}

async function pdfToImage(format) {
  const quality = parseInt(document.getElementById("imageQuality").value, 10);
  const jpgQuality = format === "jpg" ? parseFloat(document.getElementById("jpgQuality").value || "0.85") : 1;
  const pdf = await pdfjsLib.getDocument({ data: await uploadedFiles[0].arrayBuffer() }).promise;
  const inputPage = parseInt(document.getElementById("pdfImagePage")?.value || "1", 10);
  const pageNumber = Math.max(1, Math.min(pdf.numPages, Number.isFinite(inputPage) ? inputPage : 1));
  updateProgress(25);
  const page = await pdf.getPage(pageNumber);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const viewport = page.getViewport({ scale: quality / 72 });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport }).promise;
  const mime = format === "jpg" ? "image/jpeg" : "image/png";
  processedBlob = await canvasToBlob(canvas, mime, jpgQuality);
  processedFileName = `page_${pageNumber}.${format}`;
  resultDetailsHtml = `<span>Exported page ${pageNumber} of ${pdf.numPages}</span>`;
}

async function imagesToPDF() {
  const { PDFDocument, PageSizes } = PDFLib;
  const out = await PDFDocument.create();
  const pageSize = document.getElementById("pageSize").value;
  const orientation = document.getElementById("orientation").value;
  for (let i = 0; i < uploadedFiles.length; i += 1) {
    const file = uploadedFiles[i];
    const data = await file.arrayBuffer();
    const image = file.type === "image/png" ? await out.embedPng(data) : await out.embedJpg(data);
    const dims = image.scale(1);
    let w = dims.width;
    let h = dims.height;
    if (pageSize !== "original") {
      const size = pageSize === "a4" ? PageSizes.A4 : PageSizes.Letter;
      let pw = size[0], ph = size[1];
      if (orientation === "landscape" || (orientation === "auto" && w > h)) [pw, ph] = [ph, pw];
      const margin = 40;
      const scale = Math.min((pw - margin * 2) / w, (ph - margin * 2) / h);
      w *= scale; h *= scale;
      const page = out.addPage([pw, ph]);
      page.drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    } else {
      const page = out.addPage([w, h]);
      page.drawImage(image, { x: 0, y: 0, width: w, height: h });
    }
    updateProgress(10 + ((i + 1) / uploadedFiles.length) * 80);
  }
  processedBlob = new Blob([await out.save()], { type: "application/pdf" });
  processedFileName = "images.pdf";
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = (header.match(/data:(.*?);base64/) || [])[1] || "application/octet-stream";
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to create output file."));
        return;
      }
      resolve(blob);
    }, mime, quality);
  });
}

function extensionFromMime(mime) {
  if (mime === "image/webp") return "webp";
  if (mime === "image/png") return "png";
  if (mime === "video/webm") return "webm";
  return "jpg";
}

async function generateQRCode() {
  const qrText = (document.getElementById("qrText").value || "").trim();
  const size = Math.max(128, Math.min(2048, parseInt(document.getElementById("qrSize").value || "512", 10)));
  const level = document.getElementById("qrErrorLevel").value;

  if (!qrText) throw new Error("Please enter text or URL.");
  if (typeof QRCode === "undefined" || typeof QRCode.toDataURL !== "function") {
    throw new Error("QR generator library failed to load.");
  }

  const dataUrl = await QRCode.toDataURL(qrText, {
    width: size,
    margin: 2,
    errorCorrectionLevel: level
  });

  processedBlob = dataUrlToBlob(dataUrl);
  processedFileName = "qr-code.png";
  const safe = escapeHtml(qrText);
  resultDetailsHtml = `<span>QR text: ${safe}</span>`;
}

function buildQRTemplatePayload(type, main, ex1, ex2) {
  if (type === "wifi") {
    const security = (ex2 || "WPA").toUpperCase();
    return `WIFI:T:${security};S:${main};P:${ex1};;`;
  }
  if (type === "vcard") {
    return `BEGIN:VCARD\nVERSION:3.0\nFN:${main}\nEMAIL:${ex1}\nTEL:${ex2}\nEND:VCARD`;
  }
  if (type === "whatsapp") {
    const phone = (main || "").replace(/[^\d]/g, "");
    const text = encodeURIComponent(ex1 || "");
    return `https://wa.me/${phone}${text ? `?text=${text}` : ""}`;
  }
  return main;
}

async function generateTemplateQR() {
  const type = document.getElementById("qrTemplateType").value;
  const main = (document.getElementById("qrTplMain").value || "").trim();
  const ex1 = (document.getElementById("qrTplExtra1").value || "").trim();
  const ex2 = (document.getElementById("qrTplExtra2").value || "").trim();
  const size = Math.max(128, Math.min(2048, parseInt(document.getElementById("qrTplSize").value || "512", 10)));
  if (!main) throw new Error("Fill the main value for this QR template.");
  if (typeof QRCode === "undefined" || typeof QRCode.toDataURL !== "function") throw new Error("QR generator library failed to load.");

  const payload = buildQRTemplatePayload(type, main, ex1, ex2);
  const dataUrl = await QRCode.toDataURL(payload, { width: size, margin: 2, errorCorrectionLevel: "M" });
  processedBlob = dataUrlToBlob(dataUrl);
  processedFileName = `qr-${type}.png`;
  resultDetailsHtml = `<span>Template: ${escapeHtml(type.toUpperCase())}</span>`;
}

async function runOCRTool() {
  if (typeof Tesseract === "undefined") throw new Error("OCR library failed to load.");
  const lang = document.getElementById("ocrLang").value || "eng";
  const mode = document.getElementById("ocrMode").value || "text";
  const file = uploadedFiles[0];
  let output = "";

  if (isPdf(file)) {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.6 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const res = await Tesseract.recognize(canvas, lang);
      const text = mode === "lines" ? res.data.lines.map((l) => l.text).join("\n") : res.data.text;
      output += `--- Page ${i} ---\n${text.trim()}\n\n`;
      updateProgress(10 + (i / pdf.numPages) * 80);
    }
  } else {
    const res = await Tesseract.recognize(file, lang);
    output = mode === "lines" ? res.data.lines.map((l) => l.text).join("\n") : res.data.text;
    updateProgress(90);
  }

  processedBlob = new Blob([output], { type: "text/plain;charset=utf-8" });
  processedFileName = "ocr-text.txt";
}

async function scanQRCode() {
  const file = uploadedFiles[0];
  const bitmap = await createImageBitmap(file);
  let decoded = "";

  if ("BarcodeDetector" in window) {
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    const results = await detector.detect(bitmap);
    if (results.length && results[0].rawValue) decoded = results[0].rawValue.trim();
  }

  if (!decoded && typeof jsQR === "function") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(imageData.data, imageData.width, imageData.height);
    if (qr && qr.data) decoded = qr.data.trim();
  }

  if (!decoded) throw new Error("No QR code found or scanning is unsupported in this browser.");

  processedBlob = new Blob([decoded], { type: "text/plain;charset=utf-8" });
  processedFileName = "qr-decoded.txt";

  const mode = document.getElementById("qrScanMode").value;
  const safe = escapeHtml(decoded);
  if (mode === "url" && /^https?:\/\//i.test(decoded)) {
    window.open(decoded, "_blank", "noopener,noreferrer");
  }
  resultDetailsHtml = `<span>Decoded QR: ${safe}</span>`;
}

async function generateBarcode() {
  if (typeof JsBarcode === "undefined") throw new Error("Barcode library failed to load.");
  const value = (document.getElementById("barcodeValue").value || "").trim();
  if (!value) throw new Error("Enter barcode value.");
  const format = document.getElementById("barcodeFormat").value;
  const width = Math.max(1, Math.min(6, parseInt(document.getElementById("barcodeWidth").value || "2", 10)));
  const height = Math.max(30, Math.min(220, parseInt(document.getElementById("barcodeHeight").value || "90", 10)));

  const canvas = document.createElement("canvas");
  JsBarcode(canvas, value, { format, width, height, displayValue: true, margin: 12 });
  processedBlob = await canvasToBlob(canvas, "image/png", 1);
  processedFileName = "barcode.png";
  resultDetailsHtml = `<span>Format: ${escapeHtml(format)}</span>`;
}

async function scanBarcode() {
  if (!("BarcodeDetector" in window)) {
    throw new Error("Barcode scanning is not supported in this browser.");
  }
  const file = uploadedFiles[0];
  const bitmap = await createImageBitmap(file);
  const detector = new window.BarcodeDetector({
    formats: ["code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code"]
  });
  const results = await detector.detect(bitmap);
  if (!results.length || !results[0].rawValue) throw new Error("No barcode found in this image.");
  const raw = results[0].rawValue;
  const mode = document.getElementById("barcodeScanMode").value;
  if (mode === "url" && /^https?:\/\//i.test(raw)) window.open(raw, "_blank", "noopener,noreferrer");
  processedBlob = new Blob([raw], { type: "text/plain;charset=utf-8" });
  processedFileName = "barcode-decoded.txt";
  resultDetailsHtml = `<span>Decoded: ${escapeHtml(raw)}</span>`;
}

async function convertImages() {
  const outputMime = document.getElementById("imageConvertFormat").value;
  const quality = Math.max(0.2, Math.min(0.95, parseInt(document.getElementById("imageConvertQuality").value || "85", 10) / 100));
  const file = uploadedFiles[0];
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  processedBlob = await canvasToBlob(canvas, outputMime, quality);
  processedFileName = `${file.name.replace(/\.[^.]+$/, "")}.${extensionFromMime(outputMime)}`;
  updateProgress(90);
}

async function resizeImages() {
  const maxW = Math.max(32, parseInt(document.getElementById("resizeWidth").value || "1920", 10));
  const maxH = Math.max(32, parseInt(document.getElementById("resizeHeight").value || "1920", 10));
  const outputMime = document.getElementById("resizeFormat").value;
  const file = uploadedFiles[0];
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(maxW / bitmap.width, maxH / bitmap.height, 1);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  processedBlob = await canvasToBlob(canvas, outputMime, 0.9);
  processedFileName = `${file.name.replace(/\.[^.]+$/, "")}-resized.${extensionFromMime(outputMime)}`;
  updateProgress(90);
}

function waitForVideoSeek(video, time) {
  return new Promise((resolve, reject) => {
    const onSeeked = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error("Failed while reading video frames.")); };
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = Math.min(time, Math.max(0, video.duration - 0.05));
  });
}

async function convertVideoToGIF() {
  if (typeof GIF === "undefined") throw new Error("GIF library failed to load.");
  const file = uploadedFiles[0];
  const fps = parseInt(document.getElementById("gifFps").value || "12", 10);
  const quality = parseInt(document.getElementById("gifQuality").value || "10", 10);
  const maxWidth = Math.max(120, parseInt(document.getElementById("gifMaxWidth").value || "640", 10));

  const video = document.createElement("video");
  video.preload = "metadata";
  video.src = URL.createObjectURL(file);
  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = () => reject(new Error("Unable to read this video."));
  });

  const duration = Math.min(video.duration || 0, 12);
  if (!duration || !Number.isFinite(duration)) throw new Error("Invalid video duration.");
  const scale = Math.min(1, maxWidth / video.videoWidth);
  const width = Math.round(video.videoWidth * scale);
  const height = Math.round(video.videoHeight * scale);
  const frameStep = 1 / fps;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const gif = new GIF({
    workers: 2,
    quality,
    width,
    height,
    workerScript: "https://unpkg.com/gif.js.optimized/dist/gif.worker.js"
  });

  let frameCount = 0;
  for (let t = 0; t <= duration; t += frameStep) {
    await waitForVideoSeek(video, t);
    ctx.drawImage(video, 0, 0, width, height);
    gif.addFrame(canvas, { copy: true, delay: Math.round(1000 / fps) });
    frameCount += 1;
    updateProgress(10 + (t / duration) * 70);
    if (frameCount >= 180) break;
  }

  processedBlob = await new Promise((resolve, reject) => {
    gif.on("finished", resolve);
    gif.on("abort", () => reject(new Error("GIF conversion aborted.")));
    gif.render();
  });
  URL.revokeObjectURL(video.src);
  processedFileName = `${file.name.replace(/\.[^.]+$/, "")}.gif`;
  resultDetailsHtml = `<span>Frames: ${frameCount}</span>`;
}

async function compressPhotos() {
  const outputMime = document.getElementById("photoFormat").value;
  const quality = Math.max(0.2, Math.min(0.95, parseInt(document.getElementById("photoQuality").value || "80", 10) / 100));
  const maxWidth = Math.max(0, parseInt(document.getElementById("photoMaxWidth").value || "1920", 10));
  const file = uploadedFiles[0];
  const bitmap = await createImageBitmap(file);
  const scale = maxWidth > 0 ? Math.min(1, maxWidth / bitmap.width) : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(bitmap, 0, 0, width, height);

  processedBlob = await canvasToBlob(canvas, outputMime, quality);
  processedFileName = `${file.name.replace(/\.[^.]+$/, "")}-compressed.${extensionFromMime(outputMime)}`;
  updateProgress(90);
}

async function compressVideo() {
  if (!window.MediaRecorder) {
    throw new Error("This browser does not support video compression.");
  }

  const file = uploadedFiles[0];
  const scale = parseFloat(document.getElementById("videoScale").value || "0.75");
  const bitrate = Math.max(300000, parseInt(document.getElementById("videoBitrate").value || "1800", 10) * 1000);
  const fps = parseInt(document.getElementById("videoFps").value || "24", 10);

  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = URL.createObjectURL(file);
  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = () => reject(new Error("Unable to read this video file."));
  });

  const width = Math.max(2, Math.round(video.videoWidth * scale));
  const height = Math.max(2, Math.round(video.videoHeight * scale));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;

  const canvasStream = canvas.captureStream(fps);
  const outputStream = new MediaStream();
  canvasStream.getVideoTracks().forEach((t) => outputStream.addTrack(t));

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(video);
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);
    destination.stream.getAudioTracks().forEach((t) => outputStream.addTrack(t));
  } catch (_) {
    // Audio may be unavailable depending on browser permissions.
  }

  const preferredMime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
    ? "video/webm;codecs=vp9,opus"
    : (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus") ? "video/webm;codecs=vp8,opus" : "video/webm");

  const chunks = [];
  const recorder = new MediaRecorder(outputStream, {
    mimeType: preferredMime,
    videoBitsPerSecond: bitrate
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const duration = video.duration || 1;
  const progressTimer = setInterval(() => {
    const progress = 10 + (Math.min(video.currentTime, duration) / duration) * 80;
    updateProgress(progress);
  }, 220);

  const drawFrame = () => {
    if (video.paused || video.ended) return;
    ctx.drawImage(video, 0, 0, width, height);
    requestAnimationFrame(drawFrame);
  };

  try {
    await new Promise((resolve, reject) => {
      recorder.onerror = () => reject(new Error("Video encoding failed."));
      recorder.onstop = resolve;
      video.onended = () => recorder.stop();

      recorder.start(1000);
      video.play().then(() => {
        drawFrame();
      }).catch(() => {
        reject(new Error("Unable to play this video for compression."));
      });
    });
  } finally {
    clearInterval(progressTimer);
    URL.revokeObjectURL(video.src);
  }

  processedBlob = new Blob(chunks, { type: "video/webm" });
  processedFileName = `${file.name.replace(/\.[^.]+$/, "")}-compressed.webm`;
  resultDetailsHtml = `<span>Output format: WEBM (compressed)</span>`;
}

async function rotatePDF() {
  const { PDFDocument, degrees } = PDFLib;
  const pdf = await PDFDocument.load(await uploadedFiles[0].arrayBuffer());
  const angle = parseInt(document.getElementById("rotationAngle").value, 10);
  pdf.getPages().forEach((page) => page.setRotation(degrees(page.getRotation().angle + angle)));
  processedBlob = new Blob([await pdf.save()], { type: "application/pdf" });
  processedFileName = "rotated.pdf";
}

async function deletePagesPDF() {
  const { PDFDocument } = PDFLib;
  const src = await PDFDocument.load(await uploadedFiles[0].arrayBuffer());
  const total = src.getPageCount();
  const remove = new Set(parsePageRange(document.getElementById("deleteRange").value, total));
  if (!remove.size) throw new Error("Select at least one page to delete.");
  if (remove.size >= total) throw new Error("Cannot delete all pages.");
  const keep = [];
  for (let i = 0; i < total; i += 1) if (!remove.has(i)) keep.push(i);
  const out = await PDFDocument.create();
  (await out.copyPages(src, keep)).forEach((p) => out.addPage(p));
  processedBlob = new Blob([await out.save()], { type: "application/pdf" });
  processedFileName = "deleted-pages.pdf";
}

async function extractPagesPDF() {
  const { PDFDocument } = PDFLib;
  const src = await PDFDocument.load(await uploadedFiles[0].arrayBuffer());
  const pages = parsePageRange(document.getElementById("extractRange").value, src.getPageCount());
  if (!pages.length) throw new Error("Select at least one page to extract.");
  const out = await PDFDocument.create();
  (await out.copyPages(src, pages)).forEach((p) => out.addPage(p));
  processedBlob = new Blob([await out.save()], { type: "application/pdf" });
  processedFileName = "extracted-pages.pdf";
}

async function reorderPDFPages() {
  const { PDFDocument } = PDFLib;
  const src = await PDFDocument.load(await uploadedFiles[0].arrayBuffer());
  const order = parsePageOrder(document.getElementById("pageOrder").value, src.getPageCount());
  const out = await PDFDocument.create();
  (await out.copyPages(src, order)).forEach((p) => out.addPage(p));
  processedBlob = new Blob([await out.save()], { type: "application/pdf" });
  processedFileName = "reordered.pdf";
}

function getPosition(page, pos, size, textWidth) {
  const { width, height } = page.getSize();
  const pad = 24;
  if (pos === "top-left") return { x: pad, y: height - pad - size };
  if (pos === "top-right") return { x: width - pad - textWidth, y: height - pad - size };
  if (pos === "bottom-right") return { x: width - pad - textWidth, y: pad };
  if (pos === "bottom-left") return { x: pad, y: pad };
  if (pos === "bottom-center") return { x: (width - textWidth) / 2, y: pad };
  return { x: (width - textWidth) / 2, y: (height - size) / 2 };
}

async function addPageNumbersPDF() {
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const pdf = await PDFDocument.load(await uploadedFiles[0].arrayBuffer());
  const start = parseInt(document.getElementById("numberStart").value || "1", 10);
  const pos = document.getElementById("numberPosition").value;
  const fontSize = parseInt(document.getElementById("numberSize").value || "12", 10);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.getPages().forEach((page, idx) => {
    const text = `${start + idx}`;
    const coords = getPosition(page, pos, fontSize, font.widthOfTextAtSize(text, fontSize));
    page.drawText(text, { x: coords.x, y: coords.y, size: fontSize, font, color: rgb(0.12, 0.12, 0.12), opacity: 0.85 });
  });
  processedBlob = new Blob([await pdf.save()], { type: "application/pdf" });
  processedFileName = "numbered.pdf";
}

async function addWatermarkPDF() {
  const { PDFDocument, StandardFonts, rgb, degrees } = PDFLib;
  const pdf = await PDFDocument.load(await uploadedFiles[0].arrayBuffer());
  const text = (document.getElementById("watermarkText").value || "").trim();
  if (!text) throw new Error("Please enter watermark text.");
  const pos = document.getElementById("watermarkPosition").value;
  const opacity = parseInt(document.getElementById("watermarkOpacity").value || "35", 10) / 100;
  const fontSize = parseInt(document.getElementById("watermarkSize").value || "42", 10);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.getPages().forEach((page) => {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const coords = getPosition(page, pos, fontSize, textWidth);
    page.drawText(text, { x: coords.x, y: coords.y, size: fontSize, font, color: rgb(0.82, 0.13, 0.13), opacity, rotate: pos === "center" ? degrees(-35) : degrees(0) });
  });
  processedBlob = new Blob([await pdf.save()], { type: "application/pdf" });
  processedFileName = "watermarked.pdf";
}

async function pdfToText() {
  const pdf = await pdfjsLib.getDocument({ data: await uploadedFiles[0].arrayBuffer() }).promise;
  const mode = document.getElementById("textJoinMode").value;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const chunks = content.items.map((item) => item.str).filter(Boolean);
    text += `--- Page ${i} ---\n${mode === "lines" ? chunks.join("\n") : chunks.join(" ")}\n\n`;
    updateProgress(10 + (i / pdf.numPages) * 80);
  }
  processedBlob = new Blob([text], { type: "text/plain;charset=utf-8" });
  processedFileName = "extracted-text.txt";
}

async function protectPDF() {
  const { PDFDocument } = PDFLib;
  const password = document.getElementById("pdfPassword").value;
  const confirm = document.getElementById("confirmPassword").value;
  if (!password) throw new Error("Please enter a password.");
  if (password !== confirm) throw new Error("Passwords do not match.");
  const pdf = await PDFDocument.load(await uploadedFiles[0].arrayBuffer());
  const pdfBytes = await pdf.save({
    encryption: {
      userPassword: password,
      ownerPassword: password,
      permissions: {
        printing: "highResolution",
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: true,
        documentAssembly: false
      }
    }
  });
  processedBlob = new Blob([pdfBytes], { type: "application/pdf" });
  processedFileName = "protected.pdf";
}

async function unlockPDF() {
  const { PDFDocument } = PDFLib;
  try {
    const pdf = await PDFDocument.load(await uploadedFiles[0].arrayBuffer(), { password: document.getElementById("currentPassword").value || undefined });
    processedBlob = new Blob([await pdf.save()], { type: "application/pdf" });
    processedFileName = "unlocked.pdf";
  } catch {
    throw new Error("Invalid password or PDF is not encrypted.");
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showResults() {
  elements.loader.style.display = "none";
  elements.progressContainer.style.display = "none";
  elements.resultArea.style.display = "block";
  let html = `<div class="file-item" style="background:#F0FDF4;border-color:var(--success);"><span>${processedFileName}</span><span style="color:var(--success);font-weight:600;">${(processedBlob.size / 1024 / 1024).toFixed(2)} MB</span></div>`;
  if (resultDetailsHtml) {
    html += `<div class="file-item" style="background:#fff7ed;border-color:rgba(245,158,11,0.45);">${resultDetailsHtml}</div>`;
  }
  elements.resultFileList.innerHTML = html;
}

function downloadResult() {
  if (processedBlob) saveAs(processedBlob, processedFileName);
}

function appendStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "FreePDF Pro",
    description: "Free online PDF tools to edit, convert, compress, and organize PDF files",
    url: `${BASE_URL}/`,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "Merge PDF", "Split PDF", "Compress PDF", "Crop PDF", "Grayscale PDF", "Sign PDF",
      "PDF Metadata Editor", "Remove Blank Pages", "Page Size Converter",
      "PDF to JPG", "PDF to PNG", "Image to PDF", "OCR to Text",
      "QR Code Generator", "QR Templates", "QR Code Scanner",
      "Barcode Generator", "Barcode Scanner",
      "Image Converter", "Image Resizer", "Photo Compressor",
      "Video to GIF", "Video Compressor",
      "Rotate PDF", "Delete PDF Pages", "Extract PDF Pages", "Reorder PDF Pages",
      "Add Page Numbers", "Add Watermark", "PDF to Text", "Protect PDF", "Unlock PDF"
    ],
    image: `${BASE_URL}/pdflogo.png`,
    logo: `${BASE_URL}/pdflogo.png`
  };
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}

function openFromQuery() {
  const tool = new URLSearchParams(window.location.search).get("tool");
  if (tool && toolConfig[tool]) openTool(tool);
}

document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  appendStructuredData();
  openFromQuery();
});
