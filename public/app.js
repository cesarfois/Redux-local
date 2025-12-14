// Basic configuration elements
const sourceInput = document.getElementById('sourcePath');
const destInput = document.getElementById('destPath');
const qualitySelect = document.getElementById('quality');
const saveBtn = document.getElementById('saveBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const logArea = document.getElementById('logArea');
const statusIndicator = document.getElementById('statusIndicator');

// Advanced settings elements
const toggleAdvancedBtn = document.getElementById('toggleAdvanced');
const toggleIcon = document.getElementById('toggleIcon');
const advancedSettings = document.getElementById('advancedSettings');

// Advanced configuration inputs
const pdfSettingsInput = document.getElementById('pdfSettings');
const compatibilityLevelInput = document.getElementById('compatibilityLevel');
const colorImageResolutionInput = document.getElementById('colorImageResolution');
const grayImageResolutionInput = document.getElementById('grayImageResolution');
const monoImageResolutionInput = document.getElementById('monoImageResolution');
const colorImageFilterInput = document.getElementById('colorImageFilter');
const grayImageFilterInput = document.getElementById('grayImageFilter');
const colorImageDownsampleTypeInput = document.getElementById('colorImageDownsampleType');
const grayImageDownsampleTypeInput = document.getElementById('grayImageDownsampleType');
const monoImageDownsampleTypeInput = document.getElementById('monoImageDownsampleType');
const subsetFontsInput = document.getElementById('subsetFonts');
const compressFontsInput = document.getElementById('compressFonts');
const embedAllFontsInput = document.getElementById('embedAllFonts');
const downsampleColorImagesInput = document.getElementById('downsampleColorImages');
const downsampleGrayImagesInput = document.getElementById('downsampleGrayImages');
const downsampleMonoImagesInput = document.getElementById('downsampleMonoImages');

// Value display elements for range sliders
const colorResValue = document.getElementById('colorResValue');
const grayResValue = document.getElementById('grayResValue');
const monoResValue = document.getElementById('monoResValue');

let isRunning = false;

// Toggle Advanced Settings
toggleAdvancedBtn.addEventListener('click', () => {
    const isVisible = advancedSettings.style.display !== 'none';
    advancedSettings.style.display = isVisible ? 'none' : 'block';
    toggleIcon.classList.toggle('rotated');
});

// Update range slider value displays
colorImageResolutionInput.addEventListener('input', (e) => {
    colorResValue.textContent = e.target.value;
});

grayImageResolutionInput.addEventListener('input', (e) => {
    grayResValue.textContent = e.target.value;
});

monoImageResolutionInput.addEventListener('input', (e) => {
    monoResValue.textContent = e.target.value;
});

// API Helper
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const res = await fetch(endpoint, options);
        return await res.json();
    } catch (err) {
        console.error('API Error:', err);
        return null;
    }
}

// Load Config
async function loadConfig() {
    const config = await apiCall('/api/config');
    if (config) {
        // Basic settings
        sourceInput.value = config.sourcePath || '';
        destInput.value = config.destPath || '';
        qualitySelect.value = config.quality || '/ebook';

        // Advanced settings
        pdfSettingsInput.value = config.pdfSettings || '/printer';
        compatibilityLevelInput.value = config.compatibilityLevel || '1.4';

        // Resolutions
        colorImageResolutionInput.value = config.colorImageResolution || 200;
        grayImageResolutionInput.value = config.grayImageResolution || 200;
        monoImageResolutionInput.value = config.monoImageResolution || 200;

        // Update displays
        colorResValue.textContent = config.colorImageResolution || 200;
        grayResValue.textContent = config.grayImageResolution || 200;
        monoResValue.textContent = config.monoImageResolution || 200;

        // Filters
        colorImageFilterInput.value = config.colorImageFilter || '/DCTEncode';
        grayImageFilterInput.value = config.grayImageFilter || '/DCTEncode';

        // Downsampling types
        colorImageDownsampleTypeInput.value = config.colorImageDownsampleType || '/Bicubic';
        grayImageDownsampleTypeInput.value = config.grayImageDownsampleType || '/Bicubic';
        monoImageDownsampleTypeInput.value = config.monoImageDownsampleType || '/Bicubic';

        // Fonts
        subsetFontsInput.checked = config.subsetFonts !== false;
        compressFontsInput.checked = config.compressFonts !== false;
        embedAllFontsInput.checked = config.embedAllFonts === true;

        // Downsampling options
        downsampleColorImagesInput.checked = config.downsampleColorImages !== false;
        downsampleGrayImagesInput.checked = config.downsampleGrayImages !== false;
        downsampleMonoImagesInput.checked = config.downsampleMonoImages !== false;
    }
}

// Update Logs
async function updateLogs() {
    const logs = await apiCall('/api/logs');
    if (logs && Array.isArray(logs)) {
        logArea.innerHTML = logs.map(log => `
            <div class="log-entry">
                <span class="log-time">[${log.timestamp}]</span>
                <span class="log-msg type-${log.type}">${log.message}</span>
            </div>
        `).join('');
    }
}

// Save Configuration
saveBtn.addEventListener('click', async () => {
    const config = {
        sourcePath: sourceInput.value.trim(),
        destPath: destInput.value.trim(),
        quality: qualitySelect.value,
        // Advanced parameters
        pdfSettings: pdfSettingsInput.value,
        compatibilityLevel: compatibilityLevelInput.value,
        colorImageResolution: parseInt(colorImageResolutionInput.value),
        grayImageResolution: parseInt(grayImageResolutionInput.value),
        monoImageResolution: parseInt(monoImageResolutionInput.value),
        colorImageFilter: colorImageFilterInput.value,
        grayImageFilter: grayImageFilterInput.value,
        colorImageDownsampleType: colorImageDownsampleTypeInput.value,
        grayImageDownsampleType: grayImageDownsampleTypeInput.value,
        monoImageDownsampleType: monoImageDownsampleTypeInput.value,
        subsetFonts: subsetFontsInput.checked,
        compressFonts: compressFontsInput.checked,
        embedAllFonts: embedAllFontsInput.checked,
        downsampleColorImages: downsampleColorImagesInput.checked,
        downsampleGrayImages: downsampleGrayImagesInput.checked,
        downsampleMonoImages: downsampleMonoImagesInput.checked,
        autoFilterColorImages: false,
        autoFilterGrayImages: false
    };

    const res = await apiCall('/api/config', 'POST', config);
    if (res && res.success) {
        // Configuration saved - logs will show confirmation
    }
});

// Start Monitoring
startBtn.addEventListener('click', async () => {
    const res = await apiCall('/api/start', 'POST');
    if (res && res.success) {
        isRunning = true;
        updateStatus();
    }
});

// Stop Monitoring
stopBtn.addEventListener('click', async () => {
    const res = await apiCall('/api/stop', 'POST');
    if (res && res.success) {
        isRunning = false;
        updateStatus();
    }
});

// Update Status Indicator
function updateStatus() {
    if (isRunning) {
        statusIndicator.classList.add('status-active');
        statusIndicator.classList.remove('status-inactive');
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        statusIndicator.classList.add('status-inactive');
        statusIndicator.classList.remove('status-active');
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

// Polling
setInterval(updateLogs, 2000);

// Initialize
loadConfig();
updateStatus();
