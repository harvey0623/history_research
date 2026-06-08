const fs = require('fs');
const path = require('path');

// 定義專案根目錄
const rootDir = path.join(__dirname, '..');

// 定義朝代目錄（排除 .git, .agents, analyze 等非朝代目錄）
const excludeDirs = ['.git', '.agents', 'analyze', 'node_modules', '待研究'];

function getDynastyData() {
  const dirs = fs.readdirSync(rootDir).filter(file => {
    const fullPath = path.join(rootDir, file);
    return fs.statSync(fullPath).isDirectory() && !excludeDirs.includes(file);
  });

  const result = {};

  dirs.forEach(dynasty => {
    result[dynasty] = {
      fileCount: 0,
      totalSize: 0,
      charCount: 0,
      imageCount: 0,
      files: []
    };

    scanDirectory(path.join(rootDir, dynasty), dynasty, result[dynasty]);
  });

  return result;
}

function scanDirectory(dirPath, dynasty, stats) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath, dynasty, stats);
    } else {
      const ext = path.extname(file).toLowerCase();
      const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
      
      if (ext === '.md') {
        stats.fileCount++;
        stats.totalSize += stat.size;
        
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          // 移除 markdown 語法與空白字元，以進行粗略的字數統計
          const cleanText = content
            .replace(/---\s*[\s\S]*?\s*---/g, '') // 移除 frontmatter
            .replace(/[#*`~_\-–—[\]()]/g, '')    // 移除 Markdown 標記
            .replace(/\s+/g, '');                // 移除所有空白
          stats.charCount += cleanText.length;
          
          stats.files.push({
            name: path.basename(file, '.md'),
            path: relativePath,
            size: stat.size,
            chars: cleanText.length
          });
        } catch (e) {
          // 讀取失敗則只用檔案大小估算字數
          stats.charCount += Math.round(stat.size / 3); 
        }
      } else if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) {
        stats.imageCount++;
      }
    }
  });
}

try {
  console.log('正在掃描專案朝代資料...');
  const data = getDynastyData();
  
  // 計算總計
  const summary = {
    totalDynasties: Object.keys(data).length,
    totalFiles: 0,
    totalSize: 0,
    totalChars: 0,
    totalImages: 0,
    lastUpdated: new Date().toISOString()
  };

  Object.values(data).forEach(d => {
    summary.totalFiles += d.fileCount;
    summary.totalSize += d.totalSize;
    summary.totalChars += d.charCount;
    summary.totalImages += d.imageCount;
  });

  const outputData = {
    summary,
    dynasties: data
  };

  // 確保 analyze 目錄存在
  const analyzeDir = path.join(rootDir, 'analyze');
  if (!fs.existsSync(analyzeDir)) {
    fs.mkdirSync(analyzeDir);
  }

  // 寫入 data.json
  const jsonContent = JSON.stringify(outputData, null, 2);
  fs.writeFileSync(path.join(analyzeDir, 'data.json'), jsonContent, 'utf8');
  
  // 刪除舊的 data.js 以保持乾淨
  const oldDataJs = path.join(analyzeDir, 'data.js');
  if (fs.existsSync(oldDataJs)) {
    try {
      fs.unlinkSync(oldDataJs);
    } catch (e) {
      // 忽略刪除錯誤
    }
  }

  console.log('數據掃描完成！已更新 analyze/data.json');
  console.log(`統計概要: 共 ${summary.totalDynasties} 個目錄, ${summary.totalFiles} 個 Markdown 檔案, ${summary.totalChars} 字, ${summary.totalImages} 張圖片。`);
} catch (error) {
  console.error('掃描過程發生錯誤:', error);
}
