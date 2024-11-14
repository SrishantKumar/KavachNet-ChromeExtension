import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';
import { minify } from 'terser';
import CleanCSS from 'clean-css';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function build() {
    // Build configuration
    const BUILD_DIR = 'dist';
    const SOURCE_DIR = '.';

    // Files to copy
    const FILES_TO_COPY = [
        'manifest.json',
        'popup.html',
        'styles.css',
        'logo.png',
        'js'
    ];

    // Clean build directory
    console.log('Cleaning build directory...');
    fs.removeSync(BUILD_DIR);
    fs.ensureDirSync(BUILD_DIR);

    // Copy files
    console.log('Copying files...');
    FILES_TO_COPY.forEach(file => {
        const sourcePath = path.join(SOURCE_DIR, file);
        const targetPath = path.join(BUILD_DIR, file);
        
        if (fs.existsSync(sourcePath)) {
            if (fs.lstatSync(sourcePath).isDirectory()) {
                fs.copySync(sourcePath, targetPath);
            } else {
                fs.copyFileSync(sourcePath, targetPath);
            }
            console.log(`Copied: ${file}`);
        } else {
            console.warn(`Warning: ${file} not found`);
        }
    });

    // Minify JavaScript files
    console.log('\nMinifying JavaScript files...');
    const jsFiles = fs.readdirSync(path.join(BUILD_DIR, 'js')).filter(file => file.endsWith('.js'));
    for (const file of jsFiles) {
        const filePath = path.join(BUILD_DIR, 'js', file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        try {
            const result = await minify(content, {
                compress: true,
                mangle: true
            });
            if (result.code) {
                fs.writeFileSync(filePath, result.code);
                console.log(`Minified: ${file}`);
            }
        } catch (err) {
            console.error(`Error minifying ${file}:`, err);
        }
    }

    // Minify CSS
    console.log('\nMinifying CSS...');
    const cssFile = path.join(BUILD_DIR, 'styles.css');
    if (fs.existsSync(cssFile)) {
        const css = fs.readFileSync(cssFile, 'utf8');
        const minified = new CleanCSS().minify(css);
        fs.writeFileSync(cssFile, minified.styles);
        console.log('Minified: styles.css');
    }

    // Create zip file
    console.log('\nCreating extension package...');
    const zipFileName = 'kavach-net-extension.zip';
    const zipFilePath = path.join(SOURCE_DIR, zipFileName);

    if (fs.existsSync(zipFilePath)) {
        fs.unlinkSync(zipFilePath);
    }

    execSync(`cd ${BUILD_DIR} && zip -r ../${zipFileName} .`);
    console.log(`\nBuild complete! Extension package created: ${zipFileName}`);
}

build().catch(console.error);
