document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const fileInput = document.getElementById('fileInput');
    const textInput = document.getElementById('textInput');
    const keyInput = document.getElementById('keyInput');
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const preview = document.getElementById('preview');
    const result = document.getElementById('result');
    const downloadBtn = document.getElementById('downloadBtn');
    const loadTestFile = document.getElementById('loadTestFile');
    const togglePassword = document.getElementById('togglePassword');
    const copyPreview = document.getElementById('copyPreview');
    const copyResult = document.getElementById('copyResult');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    let currentContent = '';
    let currentMode = 'file'; // 'file' 或 'text'
    let currentOperation = ''; // 'encrypt' 或 'decrypt'
    let processedContent = ''; // 存储加密或解密后的内容

    // 创建文件名输入对话框
    function createFilenameDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'filename-dialog';
        dialog.innerHTML = `
            <h3>请输入文件名</h3>
            <input type="text" class="filename-input" value="${getDefaultFilename()}" placeholder="请输入文件名">
            <div class="dialog-buttons">
                <button class="btn btn-icon" data-action="cancel">取消</button>
                <button class="btn btn-download" data-action="save">保存</button>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';

        document.body.appendChild(overlay);
        document.body.appendChild(dialog);

        const input = dialog.querySelector('.filename-input');
        input.select();

        return new Promise((resolve, reject) => {
            dialog.addEventListener('click', e => {
                const action = e.target.closest('button')?.dataset.action;
                if (action === 'save') {
                    const filename = input.value.trim() || getDefaultFilename();
                    cleanup();
                    resolve(filename);
                } else if (action === 'cancel') {
                    cleanup();
                    reject();
                }
            });

            overlay.addEventListener('click', () => {
                cleanup();
                reject();
            });

            function cleanup() {
                dialog.remove();
                overlay.remove();
            }
        });
    }

    // 获取默认文件名
    function getDefaultFilename() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const operation = currentOperation === 'encrypt' ? '加密' : '解密';
        return `${operation}_${timestamp}.md`;
    }

    // 标签页切换
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // 更新按钮状态
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新内容显示
            tabContents.forEach(content => {
                if (content.id === targetTab + 'Tab') {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
            
            currentMode = targetTab;
            updatePreview();
        });
    });

    // 密码显示切换
    togglePassword.addEventListener('click', () => {
        const type = keyInput.type === 'password' ? 'text' : 'password';
        keyInput.type = type;
        togglePassword.innerHTML = type === 'password' ? 
            '<svg class="eye-icon" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>' :
            '<svg class="eye-icon" viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>';
    });

    // 复制按钮功能
    copyPreview.addEventListener('click', () => copyToClipboard(preview.textContent, '预览内容'));
    copyResult.addEventListener('click', () => copyToClipboard(result.textContent, '结果内容'));

    // 复制到剪贴板
    async function copyToClipboard(text, type) {
        try {
            await navigator.clipboard.writeText(text);
            showToast(`${type}已复制到剪贴板`);
        } catch (err) {
            showToast('复制失败，请手动复制');
        }
    }

    // 显示提示信息
    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 1000;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    // 文件选择处理
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            currentContent = await file.text();
            updatePreview();
            result.textContent = '';
            downloadBtn.style.display = 'none';
        } catch (error) {
            showToast('读取文件失败：' + error.message);
        }
    });

    // 文本输入处理
    textInput.addEventListener('input', (e) => {
        currentContent = e.target.value;
        updatePreview();
    });

    // 更新预览内容
    function updatePreview() {
        if (currentMode === 'file') {
            preview.textContent = currentContent;
        } else {
            preview.textContent = textInput.value;
            currentContent = textInput.value;
        }
    }

    // 加密功能
    encryptBtn.addEventListener('click', async () => {
        if (!currentContent) {
            showToast('请先选择文件或输入文本');
            return;
        }

        const key = keyInput.value;
        if (!key) {
            showToast('请输入加密密钥');
            return;
        }

        try {
            processedContent = await encryptText(currentContent, key);
            result.textContent = processedContent;
            downloadBtn.style.display = 'block';
            currentOperation = 'encrypt';
            setupDownload();
        } catch (error) {
            showToast('加密过程中发生错误：' + error.message);
        }
    });

    // 解密功能
    decryptBtn.addEventListener('click', async () => {
        if (!currentContent) {
            showToast('请先选择文件或输入文本');
            return;
        }

        const key = keyInput.value;
        if (!key) {
            showToast('请输入解密密钥');
            return;
        }

        try {
            processedContent = await decryptText(currentContent, key);
            result.textContent = processedContent;
            downloadBtn.style.display = 'block';
            currentOperation = 'decrypt';
            setupDownload();
        } catch (error) {
            showToast('解密失败，请检查密钥是否正确');
        }
    });

    // 设置下载功能
    function setupDownload() {
        downloadBtn.onclick = async () => {
            try {
                // 检查是否支持 showSaveFilePicker API
                if ('showSaveFilePicker' in window) {
                    const opts = {
                        suggestedName: getDefaultFilename(),
                        types: [{
                            description: 'Markdown 文件',
                            accept: { 'text/markdown': ['.md'] }
                        }]
                    };

                    try {
                        const handle = await window.showSaveFilePicker(opts);
                        const writable = await handle.createWritable();
                        await writable.write(processedContent);
                        await writable.close();
                        showToast('文件保存成功');
                    } catch (err) {
                        if (err.name !== 'AbortError') {
                            throw err;
                        }
                    }
                } else {
                    // 回退到传统下载方式
                    try {
                        const filename = await createFilenameDialog();
                        const blob = new Blob([processedContent], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        showToast('文件下载成功');
                    } catch (err) {
                        if (err) { // 忽略用户取消操作
                            throw err;
                        }
                    }
                }
            } catch (error) {
                if (error) { // 忽略用户取消操作
                    showToast('文件保存失败：' + error.message);
                }
            }
        };
    }

    // 加密文本
    async function encryptText(text, key) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        
        // 从密钥生成加密密钥
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(key),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        // 生成随机盐值
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        
        // 生成加密密钥
        const cryptoKey = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        // 生成随机 IV
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        // 加密数据
        const encryptedContent = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            cryptoKey,
            data
        );

        // 组合加密数据、盐值和 IV
        const encryptedArray = new Uint8Array(encryptedContent);
        const combinedArray = new Uint8Array(salt.length + iv.length + encryptedArray.length);
        combinedArray.set(salt, 0);
        combinedArray.set(iv, salt.length);
        combinedArray.set(encryptedArray, salt.length + iv.length);

        // 转换为 Base64 字符串
        return btoa(String.fromCharCode.apply(null, combinedArray));
    }

    // 解密文本
    async function decryptText(encryptedText, key) {
        try {
            // 解码 Base64 字符串
            const encryptedArray = new Uint8Array(atob(encryptedText).split('').map(char => char.charCodeAt(0)));
            
            // 提取盐值、IV 和加密数据
            const salt = encryptedArray.slice(0, 16);
            const iv = encryptedArray.slice(16, 28);
            const data = encryptedArray.slice(28);

            const encoder = new TextEncoder();
            
            // 从密钥生成加密密钥
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw',
                encoder.encode(key),
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
            );

            // 生成解密密钥
            const cryptoKey = await window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
            );

            // 解密数据
            const decryptedContent = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                cryptoKey,
                data
            );

            // 转换为文本
            return new TextDecoder().decode(decryptedContent);
        } catch (error) {
            throw new Error('解密失败，请检查密钥是否正确');
        }
    }
});