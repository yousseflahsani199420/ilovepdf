const fs = require("fs");
const path = require("path");

const BASE_URL = "https://www.i-lovepdf.site";
const OUTPUT_DIR = path.join(__dirname, "..", "tools");

const tools = [
  {
    id: "merge",
    slug: "merge-pdf",
    name: "Merge PDF",
    title: "Merge PDF Online for Free",
    description: "Combine multiple PDF files into one in seconds with FreePDF Pro.",
    keywords: "merge pdf, combine pdf, join pdf files online",
    howTo: [
      "Open the merge PDF tool.",
      "Upload two or more PDF files.",
      "Click process to combine all files into one PDF.",
      "Download your merged PDF instantly."
    ]
  },
  {
    id: "split",
    slug: "split-pdf",
    name: "Split PDF",
    title: "Split PDF by Page Range",
    description: "Split one PDF into a new file using custom page ranges.",
    keywords: "split pdf, extract pages from pdf, pdf splitter",
    howTo: [
      "Open the split PDF tool.",
      "Upload your PDF file.",
      "Enter the page range, for example 1-3,5,8.",
      "Process and download your split PDF."
    ]
  },
  {
    id: "compress",
    slug: "compress-pdf",
    name: "Compress PDF",
    title: "Compress PDF File Size Online",
    description: "Reduce PDF file size for email and web uploads with no installation.",
    keywords: "compress pdf, reduce pdf size, pdf compressor",
    howTo: [
      "Open the compress PDF tool.",
      "Upload one or more PDF files.",
      "Choose the compression level.",
      "Process and download the compressed PDF."
    ]
  },
  {
    id: "cropdf",
    slug: "crop-pdf",
    name: "Crop PDF",
    title: "Crop PDF Pages Online",
    description: "Crop page margins in PDF files to focus on content.",
    keywords: "crop pdf, trim pdf margins, pdf crop tool",
    howTo: [
      "Open crop PDF.",
      "Upload your PDF file.",
      "Set top, bottom, left, and right crop values.",
      "Process and download the cropped PDF."
    ]
  },
  {
    id: "grayscalepdf",
    slug: "grayscale-pdf",
    name: "Grayscale PDF",
    title: "Convert PDF to Grayscale",
    description: "Convert color PDF documents to black and white output.",
    keywords: "grayscale pdf, black and white pdf, convert color pdf",
    howTo: [
      "Open grayscale PDF.",
      "Upload your PDF document.",
      "Choose render quality.",
      "Process and download grayscale PDF."
    ]
  },
  {
    id: "signpdf",
    slug: "sign-pdf",
    name: "Sign PDF",
    title: "Add Signature to PDF",
    description: "Draw or upload your signature and place it on PDF pages.",
    keywords: "sign pdf, add signature to pdf, digital signature pdf",
    howTo: [
      "Open sign PDF.",
      "Upload your PDF file.",
      "Draw or upload your signature image.",
      "Process and download the signed PDF."
    ]
  },
  {
    id: "metadatapdf",
    slug: "pdf-metadata-editor",
    name: "PDF Metadata Editor",
    title: "Edit PDF Metadata Online",
    description: "Update PDF title, author, subject, and keywords online.",
    keywords: "pdf metadata editor, edit pdf title, pdf author metadata",
    howTo: [
      "Open PDF metadata editor.",
      "Upload your PDF file.",
      "Edit title, author, subject, and keywords.",
      "Process and download the updated PDF."
    ]
  },
  {
    id: "removeblankpdf",
    slug: "remove-blank-pdf-pages",
    name: "Remove Blank PDF Pages",
    title: "Remove Blank Pages from PDF",
    description: "Automatically detect and remove blank pages in PDF files.",
    keywords: "remove blank pdf pages, delete empty pages pdf",
    howTo: [
      "Open remove blank pages.",
      "Upload your PDF file.",
      "Select blank-page detection sensitivity.",
      "Process and download cleaned PDF."
    ]
  },
  {
    id: "resizepdfpages",
    slug: "pdf-page-size-converter",
    name: "PDF Page Size Converter",
    title: "Convert PDF Page Size",
    description: "Convert PDF pages to A4, Letter, or Legal page sizes.",
    keywords: "pdf page size converter, a4 to letter pdf, resize pdf pages",
    howTo: [
      "Open page size converter.",
      "Upload your PDF file.",
      "Choose target size and fit mode.",
      "Process and download resized PDF."
    ]
  },
  {
    id: "pdftojpg",
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    title: "Convert PDF to JPG Images",
    description: "Convert one selected PDF page to a JPG image file instantly.",
    keywords: "pdf to jpg, convert pdf to image, pdf to jpeg",
    howTo: [
      "Open PDF to JPG.",
      "Upload one PDF file.",
      "Choose page number, DPI, and JPG quality.",
      "Process and download a single JPG file."
    ]
  },
  {
    id: "pdftopng",
    slug: "pdf-to-png",
    name: "PDF to PNG",
    title: "Convert PDF to PNG Online",
    description: "Convert one selected PDF page to a high-quality PNG image.",
    keywords: "pdf to png, convert pdf pages to png, pdf image converter",
    howTo: [
      "Open PDF to PNG.",
      "Upload your PDF file.",
      "Choose page number and output DPI.",
      "Process and download a single PNG image."
    ]
  },
  {
    id: "imagetopdf",
    slug: "image-to-pdf",
    name: "Image to PDF",
    title: "Convert JPG and PNG to PDF",
    description: "Convert multiple image files into one PDF document online.",
    keywords: "image to pdf, jpg to pdf, png to pdf",
    howTo: [
      "Open image to PDF.",
      "Upload your JPG or PNG images.",
      "Choose page size and orientation.",
      "Process and download the PDF."
    ]
  },
  {
    id: "ocrtool",
    slug: "ocr-to-text",
    name: "OCR to Text",
    title: "OCR Image or PDF to Text",
    description: "Extract text from images and PDF files with OCR.",
    keywords: "ocr to text, image to text, pdf ocr online",
    howTo: [
      "Open OCR to text.",
      "Upload an image or PDF file.",
      "Select OCR language and output mode.",
      "Process and download extracted text."
    ]
  },
  {
    id: "imageconvert",
    slug: "image-converter",
    name: "Image Converter",
    title: "Image Converter Online",
    description: "Convert images between JPG, PNG, and WEBP formats.",
    keywords: "image converter, jpg to png, png to webp",
    howTo: [
      "Open image converter.",
      "Upload one image.",
      "Choose output format and quality.",
      "Convert and download a single output file."
    ]
  },
  {
    id: "imageresize",
    slug: "image-resizer",
    name: "Image Resizer",
    title: "Resize Images Online",
    description: "Resize one image with max width and height limits.",
    keywords: "image resizer, resize photos online, batch image resize",
    howTo: [
      "Open image resizer.",
      "Upload one image.",
      "Set max width, height, and output format.",
      "Resize and download a single optimized image."
    ]
  },
  {
    id: "qrcreate",
    slug: "qr-code-generator",
    name: "QR Code Generator",
    title: "QR Code Generator Online",
    description: "Generate QR codes from text or URLs and download as PNG.",
    keywords: "qr code generator, create qr code online, free qr maker",
    howTo: [
      "Open QR code generator.",
      "Enter text, link, or any content.",
      "Set QR size and error correction level.",
      "Generate and download your QR image."
    ]
  },
  {
    id: "qrtemplates",
    slug: "qr-templates",
    name: "QR Templates",
    title: "QR Templates Generator",
    description: "Generate QR templates for Wi-Fi, vCard, WhatsApp, and URLs.",
    keywords: "qr templates, wifi qr code, vcard qr code, whatsapp qr",
    howTo: [
      "Open QR templates.",
      "Select the template type.",
      "Fill the required template fields.",
      "Generate and download the QR code."
    ]
  },
  {
    id: "qrscan",
    slug: "qr-code-scanner",
    name: "QR Code Scanner",
    title: "Scan QR Code from Image",
    description: "Upload an image to scan and decode QR code content instantly.",
    keywords: "qr scanner online, decode qr code, read qr image",
    howTo: [
      "Open QR code scanner.",
      "Upload the image containing a QR code.",
      "Scan and decode the content.",
      "Download decoded text or open URL."
    ]
  },
  {
    id: "barcodegen",
    slug: "barcode-generator",
    name: "Barcode Generator",
    title: "Barcode Generator Online",
    description: "Generate CODE128, EAN13, UPC, and CODE39 barcodes.",
    keywords: "barcode generator, code128 generator, ean13 barcode",
    howTo: [
      "Open barcode generator.",
      "Enter value and select barcode format.",
      "Adjust width and height settings.",
      "Generate and download barcode image."
    ]
  },
  {
    id: "barcodescan",
    slug: "barcode-scanner",
    name: "Barcode Scanner",
    title: "Scan Barcode from Image",
    description: "Upload an image and decode barcode values quickly.",
    keywords: "barcode scanner online, read barcode image",
    howTo: [
      "Open barcode scanner.",
      "Upload an image containing a barcode.",
      "Scan and decode the value.",
      "Download decoded text or open URL."
    ]
  },
  {
    id: "photocompress",
    slug: "photo-compressor",
    name: "Photo Compressor",
    title: "Compress Photo Online",
    description: "Reduce photo file size with adjustable quality and width.",
    keywords: "photo compressor, image compressor, reduce image size",
    howTo: [
      "Open photo compressor.",
      "Upload one image file.",
      "Set format, quality, and max width.",
      "Compress and download a single optimized image."
    ]
  },
  {
    id: "videocompress",
    slug: "video-compressor",
    name: "Video Compressor",
    title: "Compress Video Online",
    description: "Compress videos in your browser by adjusting scale and bitrate.",
    keywords: "video compressor, reduce video size, compress video online",
    howTo: [
      "Open video compressor.",
      "Upload a video file.",
      "Set scale, bitrate, and FPS.",
      "Compress and download the optimized video."
    ]
  },
  {
    id: "videotogif",
    slug: "video-to-gif",
    name: "Video to GIF",
    title: "Convert Video to GIF",
    description: "Convert short video clips into GIF animations online.",
    keywords: "video to gif, convert mp4 to gif, gif creator",
    howTo: [
      "Open video to GIF.",
      "Upload your video clip.",
      "Choose FPS, width, and quality.",
      "Convert and download the GIF file."
    ]
  },
  {
    id: "rotate",
    slug: "rotate-pdf",
    name: "Rotate PDF",
    title: "Rotate PDF Pages Online",
    description: "Rotate all PDF pages by 90, 180, or 270 degrees quickly.",
    keywords: "rotate pdf, change pdf orientation, fix scanned pdf",
    howTo: [
      "Open rotate PDF.",
      "Upload your PDF.",
      "Choose rotation angle.",
      "Process and download the rotated PDF."
    ]
  },
  {
    id: "deletepages",
    slug: "delete-pdf-pages",
    name: "Delete PDF Pages",
    title: "Delete Pages from PDF",
    description: "Remove specific pages from PDF files with simple page ranges.",
    keywords: "delete pdf pages, remove pages from pdf, trim pdf",
    howTo: [
      "Open delete PDF pages.",
      "Upload your PDF.",
      "Enter pages to remove, for example 2,4-7.",
      "Process and download the updated PDF."
    ]
  },
  {
    id: "extractpages",
    slug: "extract-pdf-pages",
    name: "Extract PDF Pages",
    title: "Extract Specific PDF Pages",
    description: "Extract selected pages into a new PDF file online for free.",
    keywords: "extract pdf pages, select pages from pdf, pdf page extractor",
    howTo: [
      "Open extract PDF pages.",
      "Upload your PDF file.",
      "Enter pages to extract, for example 1-3,8.",
      "Process and download the new PDF."
    ]
  },
  {
    id: "reorder",
    slug: "reorder-pdf-pages",
    name: "Reorder PDF Pages",
    title: "Reorder PDF Pages Online",
    description: "Set a custom page order and reorganize your PDF in seconds.",
    keywords: "reorder pdf pages, organize pdf pages, page order pdf",
    howTo: [
      "Open reorder PDF pages.",
      "Upload your PDF file.",
      "Enter page order like 3,1,2,4.",
      "Process and download your reordered PDF."
    ]
  },
  {
    id: "pagenumbers",
    slug: "add-page-numbers-to-pdf",
    name: "Add Page Numbers",
    title: "Add Page Numbers to PDF",
    description: "Insert page numbers with custom position and start value.",
    keywords: "add page numbers to pdf, paginate pdf, pdf numbering tool",
    howTo: [
      "Open add page numbers.",
      "Upload your PDF document.",
      "Choose start number, font size, and position.",
      "Process and download your numbered PDF."
    ]
  },
  {
    id: "watermark",
    slug: "add-watermark-to-pdf",
    name: "Add Watermark",
    title: "Add Watermark to PDF Online",
    description: "Add a text watermark to all pages for branding or protection.",
    keywords: "add watermark to pdf, watermark pdf online, pdf branding",
    howTo: [
      "Open add watermark.",
      "Upload your PDF file.",
      "Set watermark text, position, opacity, and size.",
      "Process and download the watermarked PDF."
    ]
  },
  {
    id: "pdftotext",
    slug: "pdf-to-text",
    name: "PDF to Text",
    title: "Extract Text from PDF",
    description: "Convert PDF content into a plain text TXT file online.",
    keywords: "pdf to text, extract text from pdf, pdf text converter",
    howTo: [
      "Open PDF to text.",
      "Upload your PDF file.",
      "Choose output mode.",
      "Process and download the TXT file."
    ]
  },
  {
    id: "protect",
    slug: "protect-pdf",
    name: "Protect PDF",
    title: "Password Protect PDF Online",
    description: "Add password security and permission lock settings to a PDF.",
    keywords: "protect pdf, password pdf, encrypt pdf online",
    howTo: [
      "Open protect PDF.",
      "Upload your PDF file.",
      "Enter and confirm a password.",
      "Process and download the protected PDF."
    ]
  },
  {
    id: "unlock",
    slug: "unlock-pdf",
    name: "Unlock PDF",
    title: "Unlock PDF with Password",
    description: "Remove password protection from PDF files you own.",
    keywords: "unlock pdf, remove pdf password, decrypt pdf online",
    howTo: [
      "Open unlock PDF.",
      "Upload your protected PDF file.",
      "Enter the current password.",
      "Process and download the unlocked PDF."
    ]
  }
];

const categoryDefs = {
  pdf: { label: "PDF Tools", icon: "&#128196;" },
  image: { label: "Image Tools", icon: "&#128443;" },
  video: { label: "Video Tools", icon: "&#127909;" },
  qr: { label: "QR Tools", icon: "&#128273;" }
};

const categoryOrder = ["pdf", "image", "video", "qr"];

const categoryById = {
  merge: "pdf",
  split: "pdf",
  compress: "pdf",
  cropdf: "pdf",
  grayscalepdf: "pdf",
  signpdf: "pdf",
  metadatapdf: "pdf",
  removeblankpdf: "pdf",
  resizepdfpages: "pdf",
  pdftojpg: "pdf",
  pdftopng: "pdf",
  rotate: "pdf",
  deletepages: "pdf",
  extractpages: "pdf",
  reorder: "pdf",
  pagenumbers: "pdf",
  watermark: "pdf",
  pdftotext: "pdf",
  protect: "pdf",
  unlock: "pdf",
  imagetopdf: "image",
  ocrtool: "image",
  imageconvert: "image",
  imageresize: "image",
  photocompress: "image",
  videocompress: "video",
  videotogif: "video",
  qrcreate: "qr",
  qrtemplates: "qr",
  qrscan: "qr",
  barcodegen: "qr",
  barcodescan: "qr"
};

const iconById = {
  merge: "&#128206;",
  split: "&#9986;",
  compress: "&#128471;",
  cropdf: "&#9986;",
  grayscalepdf: "&#9681;",
  signpdf: "&#9998;",
  metadatapdf: "&#128221;",
  removeblankpdf: "&#128465;",
  resizepdfpages: "&#128196;",
  pdftojpg: "&#128247;",
  pdftopng: "&#127912;",
  imagetopdf: "&#128444;",
  ocrtool: "&#128269;",
  imageconvert: "&#8646;",
  imageresize: "&#8596;",
  qrcreate: "&#128273;",
  qrtemplates: "&#129516;",
  qrscan: "&#128270;",
  barcodegen: "&#9618;",
  barcodescan: "&#128270;",
  photocompress: "&#128248;",
  videocompress: "&#127909;",
  videotogif: "&#127916;",
  rotate: "&#8635;",
  deletepages: "&#128465;",
  extractpages: "&#128230;",
  reorder: "&#8645;",
  pagenumbers: "&#35;",
  watermark: "&#128167;",
  pdftotext: "&#128196;",
  protect: "&#128274;",
  unlock: "&#128275;"
};

const toolEntries = tools.map((tool) => {
  const category = categoryById[tool.id] || "pdf";
  return {
    ...tool,
    category,
    categoryLabel: categoryDefs[category].label,
    categoryIcon: categoryDefs[category].icon,
    icon: iconById[tool.id] || "&#128295;"
  };
});

const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
:root{--bg:#f7fafc;--ink:#0f172a;--muted:#475569;--primary:#ff6b35;--secondary:#004e89;--card:#ffffff;--ring:rgba(0,78,137,0.12)}
*{box-sizing:border-box}
body{margin:0;font-family:"Space Grotesk",system-ui,sans-serif;background:linear-gradient(145deg,#fff8f2 0%,#f4fbff 50%,#f8fafc 100%);color:var(--ink)}
a{color:var(--secondary)}
.wrap{max-width:980px;margin:0 auto;padding:24px}
.top{display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap}
.brand{font-weight:700;text-decoration:none;color:var(--ink)}
.actions{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-block;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:600}
.btn-main{background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff}
.btn-alt{background:#fff;color:var(--secondary);border:1px solid var(--ring)}
.hero{margin-top:20px;background:var(--card);border:1px solid var(--ring);border-radius:18px;padding:24px}
.hero-kicker{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--ring);border-radius:999px;padding:6px 12px;font-size:.88rem;font-weight:600;color:#0f172a;margin:0 0 12px}
.hero-kicker .icon{font-size:1rem;line-height:1}
.tool-hero-title{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.tool-hero-icon{display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff;font-size:1.2rem;line-height:1}
h1{margin:0 0 8px;font-size:2rem;line-height:1.15}
p{color:var(--muted)}
.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;margin-top:18px}
.card{background:var(--card);border:1px solid var(--ring);border-radius:16px;padding:18px}
.card h2{margin:0 0 8px;font-size:1.2rem}
ol,ul{margin:0;padding-left:18px}
li{margin:8px 0}
.related{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.related a{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--ring);border-radius:10px;background:#fff;text-decoration:none}
.foot{margin:24px 0 10px;color:#64748b;font-size:.95rem}
 .group-wrap{display:grid;gap:14px}
 .group-head{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-size:1.15rem}
 .group-head .icon{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:#fff6f2;border:1px solid rgba(255,107,53,.25)}
 .group-sub{color:#64748b;font-size:.92rem;margin:0 0 12px}
 .pill-count{display:inline-flex;align-items:center;justify-content:center;background:#eff6ff;border:1px solid rgba(0,78,137,.18);border-radius:999px;padding:3px 9px;font-size:.82rem;color:#0f172a;font-weight:600}
@media (max-width:760px){.grid{grid-template-columns:1fr}.related{grid-template-columns:1fr}h1{font-size:1.6rem}}
`;

const pageTemplate = (tool) => {
  const canonical = `${BASE_URL}/tools/${tool.slug}/`;
  const sameCategory = toolEntries.filter((t) => t.slug !== tool.slug && t.category === tool.category);
  const fallback = toolEntries.filter((t) => t.slug !== tool.slug && t.category !== tool.category);
  const related = [...sameCategory, ...fallback].slice(0, 6);
  const faq = [
    { q: `Is ${tool.name} free?`, a: `Yes. ${tool.name} is completely free on FreePDF Pro.` },
    { q: "Do files stay private?", a: "Files are processed in your browser for better privacy." }
  ];

  const faqJson = faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a }
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tool.title} | FreePDF Pro</title>
  <meta name="description" content="${tool.description}">
  <meta name="keywords" content="${tool.keywords}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${tool.title} | FreePDF Pro">
  <meta property="og:description" content="${tool.description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${BASE_URL}/pdflogo.png">
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:title" content="${tool.title} | FreePDF Pro">
  <meta property="twitter:description" content="${tool.description}">
  <meta property="twitter:image" content="${BASE_URL}/pdflogo.png">
  <link rel="icon" type="image/png" href="/pdflogo.png">
  <style>${css}</style>
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${tool.title} | FreePDF Pro`,
    description: tool.description,
    url: canonical,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${BASE_URL}/tools/` },
        { "@type": "ListItem", position: 3, name: tool.name, item: canonical }
      ]
    }
  })}</script>
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqJson
  })}</script>
</head>
<body>
  <main class="wrap">
    <div class="top">
      <a class="brand" href="/">FreePDF Pro</a>
      <div class="actions">
        <a class="btn btn-alt" href="/tools/">All Tool Pages</a>
        <a class="btn btn-main" href="/?tool=${tool.id}#tools">Open ${tool.name}</a>
      </div>
    </div>
    <section class="hero">
      <p class="hero-kicker"><span class="icon" aria-hidden="true">${tool.categoryIcon}</span><span>${tool.categoryLabel}</span></p>
      <h1 class="tool-hero-title"><span class="tool-hero-icon" aria-hidden="true">${tool.icon}</span>${tool.title}</h1>
      <p>${tool.description} No sign-up, no installation, and instant processing.</p>
    </section>

    <section class="grid">
      <article class="card">
        <h2>How To Use ${tool.name}</h2>
        <ol>
          ${tool.howTo.map((step) => `<li>${step}</li>`).join("")}
        </ol>
      </article>
      <aside class="card">
        <h2>Why Use FreePDF Pro</h2>
        <ul>
          <li>Free and easy to use on desktop and mobile.</li>
          <li>Fast browser-based processing.</li>
          <li>No account required to use tools.</li>
          <li>Direct download after processing.</li>
        </ul>
      </aside>
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Related Tools</h2>
      <div class="related">
        ${related.map((r) => `<a href="/tools/${r.slug}/"><span aria-hidden="true">${r.icon}</span><span>${r.name}</span></a>`).join("")}
      </div>
    </section>

    <p class="foot">FreePDF Pro SEO Tool Page: ${tool.name}</p>
  </main>
</body>
</html>`;
};

const indexTemplate = () => {
  const groups = categoryOrder.map((category) => {
    const def = categoryDefs[category];
    const items = toolEntries.filter((tool) => tool.category === category);
    const links = items
      .map((tool) => `<a href="/tools/${tool.slug}/"><span aria-hidden="true">${tool.icon}</span><span>${tool.name}</span></a>`)
      .join("");
    return `<section class="card">
      <h2 class="group-head"><span class="icon" aria-hidden="true">${def.icon}</span><span>${def.label}</span><span class="pill-count">${items.length}</span></h2>
      <p class="group-sub">Dedicated static SEO pages for ${def.label}.</p>
      <div class="list">${links}</div>
    </section>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All Tool Pages | FreePDF Pro</title>
  <meta name="description" content="Browse all FreePDF Pro SEO tool pages for PDF, QR, image, and video tools.">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${BASE_URL}/tools/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="All Tool Pages | FreePDF Pro">
  <meta property="og:description" content="Browse all FreePDF Pro SEO pages for PDF, QR, image, and video tools.">
  <meta property="og:url" content="${BASE_URL}/tools/">
  <meta property="og:image" content="${BASE_URL}/pdflogo.png">
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:title" content="All Tool Pages | FreePDF Pro">
  <meta property="twitter:description" content="Browse all FreePDF Pro SEO pages for PDF, QR, image, and video tools.">
  <meta property="twitter:image" content="${BASE_URL}/pdflogo.png">
  <link rel="icon" type="image/png" href="/pdflogo.png">
  <style>${css}
  .groups{display:grid;gap:14px}
  .list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
  .list a{display:flex;align-items:center;gap:8px;padding:12px;border-radius:10px;border:1px solid var(--ring);background:#fff;text-decoration:none}
  @media (max-width:760px){.list{grid-template-columns:1fr}}
  </style>
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "All Tool Pages",
    description: "SEO index page for FreePDF Pro tools",
    url: `${BASE_URL}/tools/`
  })}</script>
</head>
<body>
  <main class="wrap">
    <div class="top">
      <a class="brand" href="/">FreePDF Pro</a>
      <div class="actions"><a class="btn btn-main" href="/">Open Main App</a></div>
    </div>
    <section class="hero">
      <h1>All Tool Pages</h1>
      <p>SEO-optimized static pages for every FreePDF Pro tool.</p>
    </section>
    <section class="groups" style="margin-top:18px;">${groups}</section>
  </main>
</body>
</html>`;
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), indexTemplate(), "utf8");

for (const tool of toolEntries) {
  const dir = path.join(OUTPUT_DIR, tool.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), pageTemplate(tool), "utf8");
}

console.log(`Generated ${toolEntries.length} tool pages in /tools`);
