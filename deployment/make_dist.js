#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { rollup } = require('rollup');
const archiver = require('archiver');

// Paths
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(__dirname, 'dist');
const assetsDir = path.join(rootDir, 'assets');
const webConfigPath = path.join(__dirname, 'Web.config');
const htmlSourcePath = path.join(rootDir, 'Orcs.html');
const responsiveCssPath = path.join(rootDir, 'responsive.css');
const mobileEnhancementsPath = path.join(rootDir, 'mobile-enhancements.js');

console.log('⚔️  ROLLUP BUILD - BRUTAL MODULE CRUSHING!');

// Clean and create dist directory
if (fs.existsSync(distDir)) {
  console.log('🧹 PURGING existing dist directory with extreme prejudice...');
  fs.rmSync(distDir, { recursive: true, force: true });
  console.log('💀 Previous build obliterated!');
}
fs.mkdirSync(distDir, { recursive: true });
console.log('📁 Fresh battlefield prepared!');

// Rollup input configuration
const inputFile = path.join(rootDir, 'gamelogic', 'setup.js');

// Rollup configuration for brutal bundling
const rollupConfig = {
  input: inputFile,
  output: {
    file: path.join(distDir, 'main.js'),
    format: 'iife',
    name: 'OrcBattleArena',
    banner: `// Orc Battle Arena - BRUTALLY BUNDLED WITH ROLLUP\\n// Generated on ${new Date().toISOString()}`,
    inlineDynamicImports: true,
  },

  external: [],

  plugins: [
    {
      name: 'resolve-local',
      resolveId(id, importer) {
        if (id.startsWith('./') || id.startsWith('../')) {
          const resolved = path.resolve(path.dirname(importer), id);
          if (fs.existsSync(`${resolved}.js`)) {
            return `${resolved}.js`;
          }
          if (fs.existsSync(resolved)) {
            return resolved;
          }
        }

        if (!id.startsWith('/') && !id.includes(':') && !id.startsWith('http')) {
          const gamelogicPath = path.join(rootDir, 'gamelogic', id);
          if (fs.existsSync(`${gamelogicPath}.js`)) {
            return `${gamelogicPath}.js`;
          }
          if (fs.existsSync(gamelogicPath)) {
            return gamelogicPath;
          }
        }

        return null;
      },
    },

    {
      name: 'expose-globals',
      generateBundle(options, bundle) {
        const mainChunk = bundle['main.js'];
        if (mainChunk && mainChunk.type === 'chunk') {
          mainChunk.code += `

// EXPOSE FUNCTIONS TO THE GLOBAL BATTLEFIELD!
window.startBattle = OrcBattleArena.startBattle;
window.showSetup = OrcBattleArena.showSetup;
window.replayBattle = OrcBattleArena.replayBattle;

// Initialize the war machine when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  OrcBattleArena.showSetup();
});`;
        }
      },
    },
  ],

  onwarn(warning, warn) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
      console.warn('🔄 Circular dependency detected:', warning.message);
      return;
    }
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    if (warning.code === 'MISSING_EXPORT') return;

    warn(warning);
  },
};

async function brutuallyBundle() {
  try {
    console.log('⚡ ROLLUP CHARGING INTO BATTLE...');

    const bundle = await rollup(rollupConfig);
    await bundle.write(rollupConfig.output);
    await bundle.close();

    console.log('💥 ROLLUP VICTORY! main.js has been forged!');

    // Process HTML file
    console.log('📜 Processing battle scroll (HTML)...');
    let htmlContent = fs.readFileSync(htmlSourcePath, 'utf8');

    htmlContent = htmlContent.replace(
      /<script type="module" src="gamelogic\/setup\.js"><\/script>/,
      '<script src="main.js"></script>',
    );

    htmlContent = htmlContent.replace(
      '<title>Orc Battle Arena</title>',
      '<title>Orc Battle Arena - ROLLUP PRODUCTION BUILD</title>',
    );

    fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
    console.log('⚔️  Battle scroll inscribed as index.html');

    // Copy CSS
    console.log('🎨 Copying war paint (CSS)...');
    fs.copyFileSync(responsiveCssPath, path.join(distDir, 'responsive.css'));
    console.log('🎨 War paint applied!');

    // Copy mobile enhancements
    console.log('📱 Copying mobile battle tactics...');
    fs.copyFileSync(mobileEnhancementsPath, path.join(distDir, 'mobile-enhancements.js'));
    console.log('📱 Mobile warriors equipped!');

    // Copy assets folder
    console.log('🏺 Plundering assets treasure...');
    function copyDir(src, dest) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }

      const items = fs.readdirSync(src);
      for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    copyDir(assetsDir, path.join(distDir, 'assets'));
    console.log('🏺 Treasure plundered successfully!');

    // Process Web.config
    console.log('⚙️  Forging server battle plans (Web.config)...');
    let webConfigContent = fs.readFileSync(webConfigPath, 'utf8');

    webConfigContent = webConfigContent.replace(
      '<add value="orcs.html" />',
      '<add value="index.html" />',
    );

    fs.writeFileSync(path.join(distDir, 'Web.config'), webConfigContent);
    console.log('⚙️  Server battle plans updated!');

    // CREATE DEPLOYMENT ZIP
    console.log('📦 Creating deployment package (orc_build.zip)...');
    const zipPath = path.join(distDir, 'orc_build.zip');

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    output.on('close', () => {
      const zipSize = (archive.pointer() / 1024).toFixed(1);
      console.log(`📦 Deployment package created: ${zipSize} KB`);
      console.log(`📦 Package location: ${zipPath}`);

      showVictoryStats();
    });

    archive.on('error', (err) => {
      console.error('💀 ZIP PACKAGING FAILED:', err);
      throw err;
    });

    archive.pipe(output);

    // Add all files except the zip itself
    const distContents = fs.readdirSync(distDir);
    for (const item of distContents) {
      if (item === 'orc_build.zip') continue;

      const itemPath = path.join(distDir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        archive.directory(itemPath, item);
      } else {
        archive.file(itemPath, { name: item });
      }
    }

    archive.finalize();
  } catch (error) {
    console.error('💀 ROLLUP DEFEATED! BUILD FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function showVictoryStats() {
  function getDirectoryTree(dir, prefix = '') {
    const items = [];
    const contents = fs.readdirSync(dir);

    for (const item of contents) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        items.push(`${prefix}📁 ${item}/`);
        items.push(...getDirectoryTree(fullPath, `${prefix}  `));
      } else {
        const size = (stat.size / 1024).toFixed(1);
        items.push(`${prefix}📄 ${item} (${size} KB)`);
      }
    }

    return items;
  }

  console.log('\\n🏆 TOTAL VICTORY! ROLLUP BUILD COMPLETED!');
  console.log('\\n📊 Spoils of war:');
  const tree = getDirectoryTree(distDir);
  tree.forEach((item) => console.log(item));

  const mainJsStats = fs.statSync(path.join(distDir, 'main.js'));
  const bundleSize = (mainJsStats.size / 1024).toFixed(1);
  console.log(`\\n⚔️  Battle-ready bundle: ${bundleSize} KB`);
  console.log(`🚀 READY FOR DEPLOYMENT TO: ${distDir}`);
  console.log('\\n🔥 ROLLUP HAS CRUSHED ALL MODULES INTO SUBMISSION! 🔥');
}

// CHARGE INTO BATTLE!
brutuallyBundle();
