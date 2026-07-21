document.addEventListener('DOMContentLoaded', () => {
    // Header background change on scroll
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 1. Tab Switching Functionality (Header & Inline Links)
    const tabLinkButtons = document.querySelectorAll('.nav-tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(tabId) {
        // Remove active states from all tab controls
        tabLinkButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Toggle visibility of tab contents
        tabContents.forEach(content => {
            if (content.id === `tab-${tabId}`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        // Hide/show bio details based on active tab (Home shows them, Work and Reformatter hide them)
        if (tabId === 'resume') {
            document.body.classList.remove('profile-collapsed');
        } else {
            document.body.classList.add('profile-collapsed');
        }
    }

    tabLinkButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Support click triggers for tab switching inside pages (e.g. from bio links)
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.tab-link');
        if (trigger) {
            const tabId = trigger.getAttribute('data-tab');
            if (tabId) {
                switchTab(tabId);
                const tabsSection = document.getElementById('tabs-section');
                if (tabsSection) {
                    tabsSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    });

    // 2. Collapsible Experience Section
    const experienceHeaders = document.querySelectorAll('.experience-header');

    // Initialize expanded items (like Orange Charger by default)
    document.querySelectorAll('.experience-bar-item.expanded').forEach(item => {
        const wrapper = item.querySelector('.experience-details-wrapper');
        if (wrapper) {
            wrapper.style.maxHeight = 'none';
            wrapper.style.opacity = '1';
        }
    });

    experienceHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.closest('.experience-bar-item');
            const wrapper = item.querySelector('.experience-details-wrapper');
            const isExpanded = item.classList.contains('expanded');
            
            if (isExpanded) {
                // Transition back to 0: first set from 'none' to actual scrollHeight
                wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
                wrapper.offsetHeight; // Force reflow
                wrapper.style.maxHeight = '0px';
                wrapper.style.opacity = '0';
                item.classList.remove('expanded');
            } else {
                // Expand to scrollHeight
                wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
                wrapper.style.opacity = '1';
                item.classList.add('expanded');
                
                // Reset to 'none' after transition to allow responsive sizing
                const onTransitionEnd = (e) => {
                    if (e.propertyName === 'max-height') {
                        if (item.classList.contains('expanded')) {
                            wrapper.style.maxHeight = 'none';
                        }
                        wrapper.removeEventListener('transitionend', onTransitionEnd);
                    }
                };
                wrapper.addEventListener('transitionend', onTransitionEnd);
            }
        });
    });

    // 3. Project Navigation with Custom Gnome Loading Animation
    const loadingOverlay = document.getElementById('loading-overlay');
    const projectItems = document.querySelectorAll('.project-item');

    projectItems.forEach(item => {
        item.addEventListener('click', () => {
            const project = item.getAttribute('data-project');
            if (project) {
                // Show loader overlay
                loadingOverlay.classList.add('active');

                // Artificial delay for the walking gnome walking animation to run
                setTimeout(() => {
                    window.location.href = `${project}.html`;
                }, 1500);
            }
        });
    });

    // 3. Image Reformatter Tool (JPG, PNG, SVG, PDF Conversion)
    const dropZone = document.getElementById('drop-zone');
    const imageUpload = document.getElementById('image-upload');
    const canvas = document.getElementById('canvas-preview');
    const ctx = canvas.getContext('2d');
    
    const vibeButtons = document.querySelectorAll('.vibe-btn'); // Representing format buttons
    const btnDownload = document.getElementById('btn-download');
    const btnReset = document.getElementById('btn-reset');

    const thumbnailQueue = document.getElementById('thumbnail-queue');

    let fileQueue = [];
    let activeIndex = -1;
    let currentFormat = 'jpg';

    // File selection / drag & drop events
    dropZone.addEventListener('click', () => imageUpload.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    imageUpload.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    });

    function handleFiles(files) {
        const incomingFiles = Array.from(files).filter(file => {
            const isImageMime = file.type && file.type.startsWith('image/');
            const hasImageExtension = /\.(jpe?g|png|gif|webp|svg|heic|heif)$/i.test(file.name);
            return isImageMime || hasImageExtension;
        });
        
        if (incomingFiles.length === 0) {
            alert('Please select valid image files.');
            return;
        }

        const currentCount = fileQueue.length;
        let filesToLoad = incomingFiles;
        
        if (currentCount + incomingFiles.length > 5) {
            const allowed = 5 - currentCount;
            if (allowed <= 0) {
                alert('You have already reached the maximum limit of 5 images.');
                return;
            }
            alert(`You can upload a maximum of 5 images. Only the first ${allowed} additional image(s) will be loaded.`);
            filesToLoad = incomingFiles.slice(0, allowed);
        }

        let loadedCount = 0;
        const targetLoadCount = filesToLoad.length;

        filesToLoad.forEach(file => {
            const isHeic = /\.(heic|heif)$/i.test(file.name) || (file.type && (file.type.includes('heic') || file.type.includes('heif')));

            if (isHeic) {
                if (window.heic2any) {
                    heic2any({
                        blob: file,
                        toType: 'image/jpeg',
                        quality: 0.9
                    })
                    .then(convertedBlob => {
                        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                        const newFileName = file.name.replace(/\.(heic|heif)$/i, '') + '.jpg';
                        const convertedFile = new File([blob], newFileName, { type: 'image/jpeg' });
                        loadImageFile(convertedFile);
                    })
                    .catch(err => {
                        console.error('HEIC conversion error:', err);
                        alert(`Failed to convert HEIC image "${file.name}".`);
                        loadedCount++;
                        checkAllLoaded();
                    });
                } else {
                    alert(`HEIC converter library is still loading. Please wait a moment and try again, or upload standard formats like JPG, PNG, WebP, or SVG.`);
                    loadedCount++;
                    checkAllLoaded();
                }
            } else {
                loadImageFile(file);
            }
        });

        function loadImageFile(file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    fileQueue.push({
                        file: file,
                        img: img,
                        name: file.name
                    });

                    loadedCount++;
                    checkAllLoaded();
                };
                img.onerror = () => {
                    alert(`Failed to load image "${file.name}". Your browser may not support this format directly. Please try standard formats like JPG, PNG, WebP, or SVG.`);
                    loadedCount++;
                    checkAllLoaded();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }

        function checkAllLoaded() {
            if (loadedCount === targetLoadCount) {
                if (fileQueue.length > 0) {
                    const downloadStatus = document.getElementById('download-status');
                    if (downloadStatus) downloadStatus.style.display = 'none';

                    // All valid images loaded, transition UI states
                    dropZone.style.display = 'none';
                    canvas.style.display = 'block';
                    thumbnailQueue.style.display = 'flex';
                    btnDownload.removeAttribute('disabled');
                    btnReset.style.display = 'block';

                    if (activeIndex === -1) {
                        activeIndex = 0;
                    }

                    updateQueueUI();
                    processImage();
                } else {
                    // If no files were successfully loaded into the queue
                    resetReformatter();
                }
            }
        }
    }

    function updateQueueUI() {
        thumbnailQueue.innerHTML = '';
        fileQueue.forEach((item, idx) => {
            const thumb = document.createElement('div');
            thumb.className = `queue-thumbnail ${idx === activeIndex ? 'active' : ''}`;
            thumb.setAttribute('data-index', idx);

            const img = document.createElement('img');
            img.src = item.img.src;
            thumb.appendChild(img);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn-remove-thumb';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeItemFromQueue(idx);
            });
            thumb.appendChild(removeBtn);

            thumb.addEventListener('click', () => {
                activeIndex = idx;
                updateQueueUI();
                processImage();
            });

            thumbnailQueue.appendChild(thumb);
        });

        // Update button text
        const total = fileQueue.length;
        if (total > 1) {
            btnDownload.innerText = `Reformat ${total} Images`;
        } else if (total === 1) {
            btnDownload.innerText = 'Reformat Image';
        } else {
            btnDownload.innerText = 'Reformat Image';
            btnDownload.setAttribute('disabled', 'true');
        }
    }

    function removeItemFromQueue(indexToRemove) {
        fileQueue.splice(indexToRemove, 1);

        if (fileQueue.length === 0) {
            resetReformatter();
            return;
        }

        if (activeIndex >= fileQueue.length) {
            activeIndex = fileQueue.length - 1;
        }

        updateQueueUI();
        processImage();
    }

    function resetReformatter() {
        fileQueue = [];
        activeIndex = -1;
        imageUpload.value = '';
        
        // Reset active format
        vibeButtons.forEach(b => b.classList.remove('active'));
        vibeButtons[0].classList.add('active');
        currentFormat = 'jpg';

        // Revert views
        canvas.style.display = 'none';
        thumbnailQueue.style.display = 'none';
        btnDownload.setAttribute('disabled', 'true');
        btnDownload.innerText = 'Reformat Image';
        btnReset.style.display = 'none';
        dropZone.style.display = 'flex';
        
        const downloadStatus = document.getElementById('download-status');
        if (downloadStatus) downloadStatus.style.display = 'none';
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Toggle target output formats
    vibeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            vibeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFormat = btn.getAttribute('data-format');
        });
    });

    // Image Processing Pipeline (Draws full image on preview canvas)
    function processImage() {
        if (activeIndex === -1 || fileQueue.length === 0) return;

        const activeItem = fileQueue[activeIndex];
        const img = activeItem.img;

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    }

    const popupModal = document.getElementById('download-popup-modal');
    const popupCloseBtn = document.getElementById('popup-close-btn');
    const popupOkBtn = document.getElementById('popup-ok-btn');

    if (popupCloseBtn) popupCloseBtn.addEventListener('click', () => { if (popupModal) popupModal.style.display = 'none'; });
    if (popupOkBtn) popupOkBtn.addEventListener('click', () => { if (popupModal) popupModal.style.display = 'none'; });
    if (popupModal) popupModal.addEventListener('click', (e) => {
        if (e.target === popupModal) popupModal.style.display = 'none';
    });

    function showDownloadSuccess() {
        if (popupModal) {
            popupModal.style.display = 'flex';
        }
    }

    // Dynamic conversion downloader engine
    btnDownload.addEventListener('click', async () => {
        if (fileQueue.length === 0) return;

        // Single Image Download
        if (fileQueue.length === 1) {
            const item = fileQueue[0];
            const dataURL = canvas.toDataURL(getMimeType(currentFormat), currentFormat === 'jpg' ? 0.92 : undefined);
            if (currentFormat === 'pdf') {
                triggerPdfPrint(dataURL);
            } else {
                triggerDownload(dataURL, getOutputFilename(item.name, currentFormat));
            }
            showDownloadSuccess();
            return;
        }

        // Multiple Image Download - JSZip check
        if (window.JSZip) {
            const zip = new JSZip();
            const total = fileQueue.length;
            btnDownload.innerText = 'Creating ZIP...';
            btnDownload.setAttribute('disabled', 'true');

            for (let i = 0; i < total; i++) {
                const item = fileQueue[i];

                // Create offscreen canvas for processing batch items
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = item.img.width;
                tempCanvas.height = item.img.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(item.img, 0, 0);

                const dataURL = tempCanvas.toDataURL(getMimeType(currentFormat), currentFormat === 'jpg' ? 0.92 : undefined);
                const filename = getOutputFilename(item.name, currentFormat);

                if (currentFormat === 'pdf') {
                    const pdfData = dataURL.split(',')[1];
                    zip.file(`${filename}.jpg`, pdfData, { base64: true });
                } else if (currentFormat === 'svg') {
                    // Generate clean vector wrapper enclosing base64 data
                    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${item.img.width}" height="${item.img.height}">
  <image href="${dataURL}" width="${item.img.width}" height="${item.img.height}" />
</svg>`;
                    zip.file(filename, svgContent);
                } else {
                    const base64Data = dataURL.split(',')[1];
                    zip.file(filename, base64Data, { base64: true });
                }
            }

            try {
                const zipContent = await zip.generateAsync({ type: 'blob' });
                const zipUrl = URL.createObjectURL(zipContent);
                triggerDownload(zipUrl, 'reformatted_images.zip');
                setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
            } catch (err) {
                console.error('Error creating zip:', err);
                alert('An error occurred while compiling your batch. Falling back to individual downloads.');
                triggerSequentialDownloads();
            } finally {
                updateQueueUI();
                showDownloadSuccess();
            }
        } else {
            // JSZip CDN blocked fallback: sequential downloads
            triggerSequentialDownloads();
        }
    });

    function triggerSequentialDownloads() {
        const total = fileQueue.length;
        fileQueue.forEach((item, i) => {
            setTimeout(() => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = item.img.width;
                tempCanvas.height = item.img.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(item.img, 0, 0);

                const dataURL = tempCanvas.toDataURL(getMimeType(currentFormat), currentFormat === 'jpg' ? 0.92 : undefined);
                const filename = getOutputFilename(item.name, currentFormat);
                triggerDownload(dataURL, filename);
            }, i * 250);
        });
        showDownloadSuccess();
    }

    function getMimeType(format) {
        if (format === 'jpg') return 'image/jpeg';
        if (format === 'png') return 'image/png';
        if (format === 'svg') return 'image/png'; // SVG wrapping uses base64 png
        if (format === 'pdf') return 'image/jpeg';
        return 'image/jpeg';
    }

    // Strips the original extension and appends custom suffix
    function getOutputFilename(originalName, format) {
        const lastDot = originalName.lastIndexOf('.');
        const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
        const ext = format === 'pdf' ? 'jpg' : format;
        return `${baseName}.${ext}`;
    }

    function triggerPdfPrint(dataURL) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<html><head><title>reformatted_image</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#fff;"><img src="${dataURL}" style="max-width:100%;max-height:100%;object-fit:contain;"/></body></html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    }

    function triggerDownload(url, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
    }

    // Reset Tool State
    btnReset.addEventListener('click', resetReformatter);

    // Dynamic reconstruction of obfuscated email link on click (anti-spam)
    document.querySelectorAll('.obfuscated-email').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const user = el.getAttribute('data-user');
            const domain = el.getAttribute('data-domain');
            if (user && domain) {
                window.location.href = `mailto:${user}@${domain}`;
            }
        });
    });
});
