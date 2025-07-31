const fs = require('fs');
const path = require('path');

// 读取文件内容
function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

// 主打包函数
function buildSingleFile() {
    try {
        // 读取所有源文件
        const htmlContent = readFile('index.html');
        const cssContent = readFile('html/style.css');
        const jsContent = readFile('html/script.js');

        // 将CSS和JavaScript内联到HTML中
        let finalContent = htmlContent
            // 替换CSS链接为内联样式
            .replace(
                '<link rel="stylesheet" href="html/style.css">',
                `<style>\n${cssContent}\n</style>`
            )
            // 替换JavaScript引用为内联脚本
            .replace(
                '<script src="html/script.js"></script>',
                `<script>\n${jsContent}\n</script>`
            );

        // 创建dist目录（如果不存在）
        if (!fs.existsSync('dist')) {
            fs.mkdirSync('dist');
        }

        // 写入打包后的文件
        fs.writeFileSync('dist/markdown-crypto.html', finalContent);
        console.log('打包成功！文件已保存到: dist/markdown-crypto.html');
    } catch (error) {
        console.error('打包失败:', error.message);
    }
}

// 执行打包
buildSingleFile();