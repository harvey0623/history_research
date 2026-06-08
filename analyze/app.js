document.addEventListener('DOMContentLoaded', () => {
    let summary = null;
    let dynasties = null;
    let currentMetric = 'fileCount'; // 預設指標：文件數
    let activeChart = null;

    // 定義朝代專屬國風古典色系
    const colorPalette = {
        '漢朝': '#9c2828',       // 硃砂紅（宮牆紅）
        '唐朝': '#d49b28',       // 赤金/明黃
        '五代十國': '#4a7c59',    // 石綠/青苔綠
        '宋朝': '#5b8c85',       // 天青色/雨過天晴
        '元朝': '#665577',       // 黛紫/古藤紫
        '明朝': '#c96828',       // 琉璃橙/柿紅
        '待研究': '#7a756b'      // 水墨灰/玄石灰
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

    // 數字遞增動畫效果 (CountUp)
    const animateCountUp = (element, targetValue, duration = 1200) => {
        let startTimestamp = null;
        const target = parseInt(targetValue, 10);
        if (isNaN(target)) {
            element.textContent = targetValue;
            return;
        }

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // 使用 easeOutQuart 減速曲線讓動畫結尾更平滑自然
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(easeProgress * target);
            
            element.textContent = formatNumber(currentValue);
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = formatNumber(target);
            }
        };
        
        window.requestAnimationFrame(step);
    };

    // 啟動數字 CountUp 動畫
    const startCountUpAnimations = () => {
        animateCountUp(document.getElementById('val-dynasties'), summary.totalDynasties);
        animateCountUp(document.getElementById('val-files'), summary.totalFiles);
        animateCountUp(document.getElementById('val-chars'), summary.totalChars);
        animateCountUp(document.getElementById('val-images'), summary.totalImages);
    };

    // 初始化頁面數據
    const initDashboard = () => {
        // 更新時間
        const updateTimeEl = document.getElementById('update-time');
        const updateDate = new Date(summary.lastUpdated);
        updateTimeEl.textContent = `最後更新：${updateDate.toLocaleString('zh-Hant')}`;

        // 頂部卡片設為 0，等待 Loading 結束後再執行動畫
        document.getElementById('val-dynasties').textContent = '0';
        document.getElementById('val-files').textContent = '0';
        document.getElementById('val-chars').textContent = '0';
        document.getElementById('val-images').textContent = '0';

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
                    borderColor: '#fefcf7', // 使用卡片背景色
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
                            color: '#2b1d11', // 水墨黑文字
                            font: {
                                family: '"Noto Serif TC", "Outfit"',
                                size: 12,
                                weight: 'bold'
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
                        backgroundColor: '#fbf9f3', // 絹布白
                        titleColor: '#8b2626',      // 硃砂紅
                        bodyColor: '#2b1d11',       // 焦茶水墨黑
                        borderColor: 'rgba(178, 136, 60, 0.4)', // 鎏金邊框
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

    // 隱藏 Loading 畫面的輔助函數 (確保動畫至少完整播放 1.2 秒，以展示精美效果)
    const startTime = Date.now();
    const hideLoading = () => {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (!loadingOverlay) return;

        const elapsedTime = Date.now() - startTime;
        const minDuration = 1200;
        const delay = Math.max(0, minDuration - elapsedTime);

        setTimeout(() => {
            loadingOverlay.classList.add('fade-out');
            
            // 載入畫面開始淡出、露出儀表板的瞬間，啟動數字滾動動畫
            startCountUpAnimations();
            
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        }, delay);
    };

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
            // 隱藏載入畫面
            hideLoading();
        })
        .catch(error => {
            console.error('載入資料錯誤:', error);
            // 隱藏載入畫面以顯示錯誤資訊
            hideLoading();
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
                    <li>在終端機執行 <code>pnpm run dev</code> 啟動本地伺服器後，再用網址開啟。</li>
                </ul>
            `;
            document.body.appendChild(errorMsg);
        });
});
