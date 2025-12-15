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
const autoFilterColorImagesInput = document.getElementById('autoFilterColorImages');
const autoFilterGrayImagesInput = document.getElementById('autoFilterGrayImages');
const colorImageDownsampleThresholdInput = document.getElementById('colorImageDownsampleThreshold');
const grayImageDownsampleThresholdInput = document.getElementById('grayImageDownsampleThreshold');
const monoImageDownsampleThresholdInput = document.getElementById('monoImageDownsampleThreshold');
const detectDuplicateImagesInput = document.getElementById('detectDuplicateImages');
const compressPagesInput = document.getElementById('compressPages');

// Value display elements for range sliders
const colorResValue = document.getElementById('colorResValue');
const grayResValue = document.getElementById('grayResValue');
const monoResValue = document.getElementById('monoResValue');
const colorThresholdValue = document.getElementById('colorThresholdValue');
const grayThresholdValue = document.getElementById('grayThresholdValue');
const monoThresholdValue = document.getElementById('monoThresholdValue');

// Folder browse buttons
const browseSourceBtn = document.getElementById('browseSource');
const browseDestBtn = document.getElementById('browseDest');

let isRunning = false;

// Folder selection handlers
browseSourceBtn.addEventListener('click', () => {
    const userPath = prompt('Cole o caminho da pasta de origem:', sourceInput.value);
    if (userPath) {
        sourceInput.value = userPath;
    }
});

browseDestBtn.addEventListener('click', () => {
    const userPath = prompt('Cole o caminho da pasta de destino:', destInput.value);
    if (userPath) {
        destInput.value = userPath;
    }
});


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

// Update threshold slider value displays
colorImageDownsampleThresholdInput.addEventListener('input', (e) => {
    colorThresholdValue.textContent = parseFloat(e.target.value).toFixed(1);
});

grayImageDownsampleThresholdInput.addEventListener('input', (e) => {
    grayThresholdValue.textContent = parseFloat(e.target.value).toFixed(1);
});

monoImageDownsampleThresholdInput.addEventListener('input', (e) => {
    monoThresholdValue.textContent = parseFloat(e.target.value).toFixed(1);
});

// Set Default button - Restore default configuration
document.getElementById('setDefaultBtn').addEventListener('click', () => {
    // Restore default values
    pdfSettingsInput.value = '/screen';
    compatibilityLevelInput.value = '1.4';

    // Resolution to 115 DPI
    colorImageResolutionInput.value = 115;
    grayImageResolutionInput.value = 115;
    monoImageResolutionInput.value = 115;
    colorResValue.textContent = '115';
    grayResValue.textContent = '115';
    monoResValue.textContent = '115';

    // Downsampling type to Bicubic
    colorImageDownsampleTypeInput.value = '/Bicubic';
    grayImageDownsampleTypeInput.value = '/Bicubic';
    monoImageDownsampleTypeInput.value = '/Bicubic';

    // Threshold to 1.0
    colorImageDownsampleThresholdInput.value = 1.0;
    grayImageDownsampleThresholdInput.value = 1.0;
    monoImageDownsampleThresholdInput.value = 1.0;
    colorThresholdValue.textContent = '1.0';
    grayThresholdValue.textContent = '1.0';
    monoThresholdValue.textContent = '1.0';

    // Optimizations enabled
    detectDuplicateImagesInput.checked = true;
    compressPagesInput.checked = true;

    alert('✅ Configurações restauradas para o padrão (/screen + 115 DPI + Threshold 1.0)');
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
        colorImageResolutionInput.value = config.colorImageResolution || 115;
        grayImageResolutionInput.value = config.grayImageResolution || 115;
        monoImageResolutionInput.value = config.monoImageResolution || 115;

        // Update displays
        colorResValue.textContent = config.colorImageResolution || 115;
        grayResValue.textContent = config.grayImageResolution || 115;
        monoResValue.textContent = config.monoImageResolution || 115;

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

        // AutoFilter options
        autoFilterColorImagesInput.checked = config.autoFilterColorImages === true;
        autoFilterGrayImagesInput.checked = config.autoFilterGrayImages === true;

        // Threshold values
        colorImageDownsampleThresholdInput.value = config.colorImageDownsampleThreshold || 1.0;
        grayImageDownsampleThresholdInput.value = config.grayImageDownsampleThreshold || 1.0;
        monoImageDownsampleThresholdInput.value = config.monoImageDownsampleThreshold || 1.0;

        // Update threshold displays
        colorThresholdValue.textContent = (config.colorImageDownsampleThreshold || 1.0).toFixed(1);
        grayThresholdValue.textContent = (config.grayImageDownsampleThreshold || 1.0).toFixed(1);
        monoThresholdValue.textContent = (config.monoImageDownsampleThreshold || 1.0).toFixed(1);

        // Optimization flags
        detectDuplicateImagesInput.checked = config.detectDuplicateImages !== false;
        compressPagesInput.checked = config.compressPages !== false;
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
        autoFilterColorImages: autoFilterColorImagesInput.checked,
        autoFilterGrayImages: autoFilterGrayImagesInput.checked,
        colorImageDownsampleThreshold: parseFloat(colorImageDownsampleThresholdInput.value),
        grayImageDownsampleThreshold: parseFloat(grayImageDownsampleThresholdInput.value),
        monoImageDownsampleThreshold: parseFloat(monoImageDownsampleThresholdInput.value),
        detectDuplicateImages: detectDuplicateImagesInput.checked,
        compressPages: compressPagesInput.checked
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
