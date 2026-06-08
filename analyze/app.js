document.addEventListener('DOMContentLoaded', () => {
    let summary = null;
    let dynasties = null;
    let currentMetric = 'fileCount'; // 預設指標：文件數
    let activeChart = null;

    // 定義朝代專屬古典色系
    const colorPalette = {
        '漢朝': '#c94a4a',       // 硃砂紅
        '唐朝': '#d4af37',       // 盛唐金
        '五代十國': '#2c97a7',    // 石青藍
        '宋朝': '#3a8e7e',       // 翡翠綠
        '元朝': '#7a5eb7',       // 黛紫色
        '明朝': '#d97736',       // 琉璃橙
        '待研究': '#6e7681'      // 玄石灰
    };

    // 如果有未定義的朝代，動態生成顏色
    const getDynastyColor = (name, index) => {
        if (colorPalette[name]) return colorPalette[name];
        // 否則生成一個隨機但好看的 HSL 顏色
        return `hsl(${(index * 137.5) % 360}, 60%, 55%)`;
    };

    // 格式化數字 (例如: 12345 -> 12,345)
    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(num);
    };

    // 格式化檔案大小
    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        return (bytes / 1024).toFixed(1) + ' KB';
    };

    // 初始化頁面數據
    const initDashboard = () => {
        // 更新時間
        const updateTimeEl = document.getElementById('update-time');
        const updateDate = new Date(summary.lastUpdated);
        updateTimeEl.textContent = `最後更新：${updateDate.toLocaleString('zh-Hant')}`;

        // 頂部卡片
        document.getElementById('val-dynasties').textContent = summary.totalDynasties;
        document.getElementById('val-files').textContent = summary.totalFiles;
        document.getElementById('val-chars').textContent = formatNumber(summary.totalChars);
        document.getElementById('val-images').textContent = summary.totalImages;

        // 渲染詳細列表
        renderDynastyList();

        // 初始化圖表
        renderChart(currentMetric);

        // 綁定圖表控制按鈕事件
        const controlBtns = document.querySelectorAll('.control-btn');
        controlBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                controlBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentMetric = e.target.dataset.metric;
                renderChart(currentMetric);
            });
        });
    };

    // 取得圖表所需的 Label 與 Data
    const getChartData = (metric) => {
        const labels = [];
        const dataValues = [];
        const backgroundColors = [];
        let index = 0;

        for (const [name, stats] of Object.entries(dynasties)) {
            // 如果該指標數值為 0，則不放入圓餅圖，避免圖表混亂
            let val = stats[metric];
            if (metric === 'totalSize') {
                // 將 Size 轉為 KB 顯示
                val = parseFloat((stats.totalSize / 1024).toFixed(2));
            }

            if (val > 0) {
                labels.push(name);
                dataValues.push(val);
                backgroundColors.push(getDynastyColor(name, index));
            }
            index++;
        }

        return { labels, dataValues, backgroundColors };
    };

    // 渲染或更新 Chart.js
    const renderChart = (metric) => {
        const ctx = document.getElementById('dynastyPieChart').getContext('2d');
        const { labels, dataValues, backgroundColors } = getChartData(metric);

        // 建立指標標題對照表
        const metricTitles = {
            fileCount: '文件數量 (份)',
            charCount: '字數統計 (字)',
            totalSize: '檔案容量 (KB)',
            imageCount: '圖片數量 (張)'
        };

        if (activeChart) {
            activeChart.destroy();
        }

        activeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: backgroundColors,
                    borderColor: '#121824',
                    borderWidth: 2,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#90a0b7',
                            font: {
                                family: '"Outfit", "Noto Serif TC"',
                                size: 12
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return ` ${label}: ${formatNumber(value)} (${percentage}%)`;
                            }
                        },
                        backgroundColor: '#121824',
                        titleColor: '#d4af37',
                        bodyColor: '#f0f4f8',
                        borderColor: 'rgba(201, 160, 99, 0.3)',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                cutout: '60%', // 甜甜圈圖內圈空心比例
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 800,
                    easing: 'easeOutQuart'
                }
            }
        });
    };

    // 渲染詳細朝代列表
    const renderDynastyList = () => {
        const container = document.getElementById('dynasty-list-container');
        container.innerHTML = '';

        // 將 dynasties 轉為陣列，並依據 charCount (字數) 進行遞減排序
        const sortedDynasties = Object.entries(dynasties).sort((a, b) => b[1].charCount - a[1].charCount);

        let index = 0;
        for (const [name, stats] of sortedDynasties) {
            const color = getDynastyColor(name, index);
            const item = document.createElement('div');
            item.className = 'dynasty-item';
            item.innerHTML = `
                <div class="dynasty-meta">
                    <span class="color-dot" style="color: ${color}; background-color: ${color};"></span>
                    <span class="dynasty-name">${name}</span>
                </div>
                <div class="dynasty-stats-preview">
                    <span class="stat-badge">${stats.fileCount} 份文獻</span>
                    <span class="stat-badge">${formatNumber(stats.charCount)} 字</span>
                </div>
            `;
            
            // 綁定點擊事件顯示該朝代的文獻列表
            item.addEventListener('click', () => showDynastyFiles(name, stats.files));
            container.appendChild(item);
            index++;
        }
    };

    // 彈出視窗邏輯
    const modal = document.getElementById('files-modal');
    const modalTitle = document.getElementById('modal-title');
    const tableBody = document.getElementById('files-table-body');
    const closeModalBtn = document.getElementById('close-modal');
    const searchInput = document.getElementById('file-search-input');

    let currentModalFiles = []; // 保存目前 Modal 中該朝代的所有檔案

    // 渲染文獻表格內容的輔助函數
    const renderFileList = (filesToRender) => {
        tableBody.innerHTML = '';

        if (filesToRender.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 2rem;">未找到相符的文獻檔案</td></tr>';
            return;
        }

        // 按字數降序排序
        const sortedFiles = [...filesToRender].sort((a, b) => b.chars - a.chars);
        
        sortedFiles.forEach(file => {
            const tr = document.createElement('tr');
            // 將 path 對應為相對路徑（專案根目錄的上一層為 analyze/index.html，所以要用 ../ 聯結）
            const relativeUrl = `../${file.path}`;
            tr.innerHTML = `
                <td>
                    <a href="${relativeUrl}" class="file-link" target="_blank" title="在新分頁開啟文獻">
                        📄 ${file.name}
                    </a>
                </td>
                <td style="font-family: var(--font-sans);">${formatNumber(file.chars)}</td>
                <td style="font-family: var(--font-sans);">${formatSize(file.size)}</td>
            `;
            tableBody.appendChild(tr);
        });
    };

    const showDynastyFiles = (dynastyName, files) => {
        modalTitle.textContent = `${dynastyName} - 研究文獻列表`;
        currentModalFiles = files;
        searchInput.value = ''; // 每次開啟時重置輸入框
        
        renderFileList(files); // 預設列出全部檔案

        modal.classList.add('show');
        
        // 自動將游標 focus 到搜尋輸入框
        setTimeout(() => {
            searchInput.focus();
        }, 100);
    };

    // 模糊搜尋事件監聽
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim().toLowerCase();
        
        if (keyword === '') {
            renderFileList(currentModalFiles);
        } else {
            const filtered = currentModalFiles.filter(file => 
                file.name.toLowerCase().includes(keyword)
            );
            renderFileList(filtered);
        }
    });

    const hideModal = () => {
        modal.classList.remove('show');
    };

    closeModalBtn.addEventListener('click', hideModal);
    
    // 點擊彈窗外部關閉
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // ESC 鍵關閉彈窗
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            hideModal();
        }
    });

    // 使用 Fetch API 讀取 JSON 檔
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('無法載入 data.json 資料');
            }
            return response.json();
        })
        .then(data => {
            summary = data.summary;
            dynasties = data.dynasties;
            // 執行初始化
            initDashboard();
        })
        .catch(error => {
            console.error('載入資料錯誤:', error);
            // 本地 file:// 協定的 CORS 提示
            const errorMsg = document.createElement('div');
            errorMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#c94a4a;color:#fff;padding:1.5rem 2rem;border-radius:10px;text-align:center;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,0.5);width:90%;max-width:500px;line-height:1.5;';
            errorMsg.innerHTML = `
                <h3 style="margin-bottom:0.5rem;font-family:sans-serif;font-size:1.2rem;">📊 數據載入失敗</h3>
                <p style="font-size:0.9rem;opacity:0.9;margin-bottom:1rem;text-align:left;">無法讀取 data.json。如果是本地直接雙擊開啟 HTML (file:// 協定)，現代瀏覽器基於安全性考量會限制 fetch 請求。</p>
                <p style="font-size:0.8rem;background:rgba(0,0,0,0.2);padding:0.5rem;border-radius:4px;font-family:monospace;text-align:left;word-break:break-all;margin-bottom:1rem;">Error: ${error.message}</p>
                <p style="font-size:0.85rem;font-weight:bold;text-align:left;border-top:1px solid rgba(255,255,255,0.2);padding-top:0.75rem;">解決方案提示：</p>
                <ul style="font-size:0.8rem;text-align:left;padding-left:1.2rem;margin-top:0.25rem;opacity:0.9;">
                    <li>使用 VS Code 的 <b>Live Server</b> 插件啟動網頁。</li>
                    <li>在終端機執行 <code>npx http-server analyze</code> 啟動本地伺服器後，再用網址開啟。</li>
                </ul>
            `;
            document.body.appendChild(errorMsg);
        });
});
