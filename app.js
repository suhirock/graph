// Chart.js Datalabels プラグインを登録
Chart.register(ChartDataLabels);

// ドーナツグラフの中央にテキストを表示するプラグイン
const centerTextPlugin = {
    id: 'centerText',
    afterDatasetsDraw(chart) {
        const { ctx, chartArea: { width, height } } = chart;

        // ドーナツグラフの場合のみ実行
        if (chart.config.type !== 'doughnut') return;

        // 総数を計算
        const total = chart.data.datasets[0].data.reduce((sum, value) => sum + value, 0);

        ctx.save();

        // テキストのスタイル設定
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 中央に総数を表示
        const centerX = width / 2;
        const centerY = height / 2;
        ctx.fillText(`総数`, centerX, centerY - 15);

        ctx.font = 'bold 32px Arial';
        ctx.fillText(`${total}件`, centerX, centerY + 15);

        ctx.restore();
    }
};

// プラグインを登録
Chart.register(centerTextPlugin);

function chartApp() {
    return {
        chartType: 'pie',
        customTitle: '',
        selectedColorSet: '',
        chartWidth: 800,
        chartHeight: 600,
        dataRows: [
            { id: 1, label: 'カテゴリA', value: 30, color: '#FF6384' },
            { id: 2, label: 'カテゴリB', value: 50, color: '#36A2EB' },
            { id: 3, label: 'カテゴリC', value: 20, color: '#FFCE56' }
        ],
        nextId: 4,
        chartInstance: null,
        draggedIndex: null,
        dragOverIndex: null,
        dragOverThrottle: null,

        // 色セット定義
        colorSets: {
            blue: { name: '青系', base: { r: 33, g: 150, b: 243 } },
            red: { name: '赤系', base: { r: 244, g: 67, b: 54 } },
            green: { name: '緑系', base: { r: 76, g: 175, b: 80 } },
            yellow: { name: '黄色系', base: { r: 255, g: 235, b: 59 } },
            purple: { name: '紫系', base: { r: 156, g: 39, b: 176 } },
            orange: { name: 'オレンジ系', base: { r: 255, g: 152, b: 0 } },
            pink: { name: 'ピンク系', base: { r: 233, g: 30, b: 99 } },
            teal: { name: 'ティール系', base: { r: 0, g: 150, b: 136 } }
        },

        init() {
            // ページ読み込み時にグラフを初期化
            this.$nextTick(() => {
                this.createChart();
            });
        },

        handleDragStart(event, index) {
            this.draggedIndex = index;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', index);
            console.log('[DRAG START] index:', index, 'label:', this.dataRows[index].label);
        },

        handleDragOver(event, index) {
            if (event.preventDefault) {
                event.preventDefault();
            }
            event.dataTransfer.dropEffect = 'move';

            // スロットル処理：50msに1回だけ更新
            if (this.draggedIndex !== index && this.dragOverIndex !== index) {
                if (!this.dragOverThrottle) {
                    this.dragOverIndex = index;
                    this.dragOverThrottle = setTimeout(() => {
                        this.dragOverThrottle = null;
                    }, 50);
                }
            }

            return false;
        },

        handleDrop(event, dropIndex) {
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            if (event.preventDefault) {
                event.preventDefault();
            }

            const dragIndex = this.draggedIndex;

            if (dragIndex !== null && dragIndex !== dropIndex) {
                console.log('[DROP] from:', dragIndex, 'to:', dropIndex);
                console.log('[BEFORE] dataRows:', this.dataRows.map(r => r.label));

                // 配列を並び替え
                const newDataRows = [...this.dataRows];
                const draggedItem = newDataRows[dragIndex];

                // 古い位置から削除
                newDataRows.splice(dragIndex, 1);

                // 新しい位置に挿入
                newDataRows.splice(dropIndex, 0, draggedItem);

                this.dataRows = newDataRows;

                console.log('[AFTER] dataRows:', this.dataRows.map(r => r.label));

                // グラフを更新
                this.$nextTick(() => {
                    this.updateChart();
                });
            }

            // ハイライトを解除
            this.dragOverIndex = null;

            return false;
        },

        handleDragEnd(event) {
            this.draggedIndex = null;
            this.dragOverIndex = null;
            if (this.dragOverThrottle) {
                clearTimeout(this.dragOverThrottle);
                this.dragOverThrottle = null;
            }
            console.log('[DRAG END]');
        },

        addRow() {
            if (this.dataRows.length < 10) {
                // ランダムな色を生成
                const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

                this.dataRows.push({
                    id: this.nextId++,
                    label: '',
                    value: 0,
                    color: randomColor
                });
            }
        },

        removeRow(index) {
            this.dataRows.splice(index, 1);
        },

        applyColorSet() {
            if (!this.selectedColorSet || !this.colorSets[this.selectedColorSet]) {
                return;
            }

            const colorSet = this.colorSets[this.selectedColorSet];
            const colors = this.generateColorShades(colorSet.base, this.dataRows.length);

            // 各行に色を適用
            this.dataRows.forEach((row, index) => {
                if (colors[index]) {
                    row.color = colors[index];
                }
            });
        },

        generateColorShades(baseColor, count) {
            // 基本色から濃淡のバリエーションを生成
            const colors = [];

            if (count === 1) {
                // 1色の場合は基本色のみ
                colors.push(this.rgbToHex(baseColor.r, baseColor.g, baseColor.b));
            } else {
                // 複数色の場合は明るい色から暗い色へのグラデーション
                for (let i = 0; i < count; i++) {
                    // 明度の調整係数（0.4〜1.6の範囲で変化）
                    const factor = 1.6 - (i / (count - 1)) * 1.2;

                    let r = Math.round(baseColor.r * factor);
                    let g = Math.round(baseColor.g * factor);
                    let b = Math.round(baseColor.b * factor);

                    // 0-255の範囲に制限
                    r = Math.max(0, Math.min(255, r));
                    g = Math.max(0, Math.min(255, g));
                    b = Math.max(0, Math.min(255, b));

                    colors.push(this.rgbToHex(r, g, b));
                }
            }

            return colors;
        },

        rgbToHex(r, g, b) {
            return '#' + [r, g, b].map(x => {
                const hex = x.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        },

        createChart() {
            const ctx = document.getElementById('myChart');
            if (!ctx) return;

            // canvasのサイズを設定
            const canvas = ctx;
            const container = canvas.parentElement;

            // コンテナのサイズを設定
            container.style.width = this.chartWidth + 'px';
            container.style.height = this.chartHeight + 'px';
            container.style.maxHeight = 'none';

            const config = this.getChartConfig();

            if (this.chartInstance) {
                this.chartInstance.destroy();
            }

            this.chartInstance = new Chart(ctx, config);
        },

        updateChart() {
            // グラフを完全に再作成して全ての変更を確実に反映
            this.createChart();
        },

        getChartConfig() {
            const labels = this.dataRows.map(row => row.label || '未設定');
            const data = this.dataRows.map(row => row.value || 0);
            const colors = this.dataRows.map(row => row.color || '#CCCCCC');

            // 横棒グラフの場合はtypeを'bar'にしてindexAxisを設定
            const chartType = this.chartType === 'horizontalBar' ? 'bar' : this.chartType;

            const baseConfig = {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'データ',
                        data: data,
                        backgroundColor: colors,
                        borderColor: colors.map(color => this.darkenColor(color)),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    indexAxis: this.chartType === 'horizontalBar' ? 'y' : 'x',
                    layout: {
                        padding: {
                            top: (this.chartType === 'bar' || this.chartType === 'horizontalBar') ? 40 : 10
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom'
                        },
                        title: {
                            display: true,
                            text: this.getChartTitle(),
                            padding: {
                                bottom: (this.chartType === 'bar' || this.chartType === 'horizontalBar') ? 30 : 10
                            }
                        },
                        datalabels: {
                            display: false  // デフォルトでは非表示
                        }
                    }
                }
            };

            // 円グラフまたはドーナツグラフの場合はデータラベルを表示
            if (this.chartType === 'pie' || this.chartType === 'doughnut') {
                const total = data.reduce((sum, value) => sum + value, 0);

                baseConfig.options.plugins.datalabels = {
                    display: true,
                    color: '#fff',
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    formatter: (value) => {
                        if (total === 0) return '';
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${value}件\n${percentage}%`;
                    },
                    textAlign: 'center'
                };

                // レジェンドのカスタマイズ
                baseConfig.options.plugins.legend = {
                    display: true,
                    position: 'bottom',
                    labels: {
                        generateLabels: (chart) => {
                            const data = chart.data;
                            return data.labels.map((label, i) => ({
                                text: `${label}: ${data.datasets[0].data[i]}`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                hidden: false,
                                index: i
                            }));
                        }
                    }
                };
            }

            // 棒グラフまたは横棒グラフの場合はデータラベルを表示
            if (this.chartType === 'bar' || this.chartType === 'horizontalBar') {
                baseConfig.options.plugins.datalabels = {
                    display: true,
                    color: '#000',
                    font: {
                        weight: 'bold',
                        size: 13
                    },
                    formatter: (value) => {
                        return `${value}件`;
                    },
                    anchor: 'end',
                    align: this.chartType === 'horizontalBar' ? 'right' : 'end',
                    offset: 4
                };

                // レジェンドのカスタマイズ（右側に配置）
                baseConfig.options.plugins.legend = {
                    display: true,
                    position: 'right',
                    labels: {
                        generateLabels: (chart) => {
                            const data = chart.data;
                            return data.labels.map((label, i) => ({
                                text: `${label}: ${data.datasets[0].data[i]}`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                hidden: false,
                                index: i
                            }));
                        }
                    }
                };
            }

            // グラフタイプごとの追加設定
            if (this.chartType === 'bar' || this.chartType === 'line') {
                const maxValue = Math.max(...data, 1);
                const yAxisMax = Math.ceil(maxValue * 1.2);

                baseConfig.options.scales = {
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 0,
                            minRotation: 0,
                            callback: function(value, index, ticks) {
                                const label = this.getLabelForValue(value);
                                // 10文字以上の場合は改行
                                if (label.length > 10) {
                                    const words = [];
                                    for (let i = 0; i < label.length; i += 10) {
                                        words.push(label.substring(i, i + 10));
                                    }
                                    return words;
                                }
                                return label;
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: yAxisMax,
                        title: {
                            display: true,
                            text: '値'
                        }
                    }
                };
            } else if (this.chartType === 'horizontalBar') {
                const maxValue = Math.max(...data, 1);
                const xAxisMax = Math.ceil(maxValue * 1.2);

                baseConfig.options.scales = {
                    x: {
                        beginAtZero: true,
                        max: xAxisMax,
                        title: {
                            display: true,
                            text: '値'
                        }
                    },
                    y: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 0,
                            minRotation: 0,
                            callback: function(value, index, ticks) {
                                const label = this.getLabelForValue(value);
                                // 10文字以上の場合は改行
                                if (label.length > 10) {
                                    const words = [];
                                    for (let i = 0; i < label.length; i += 10) {
                                        words.push(label.substring(i, i + 10));
                                    }
                                    return words;
                                }
                                return label;
                            }
                        }
                    }
                };
            }

            return baseConfig;
        },

        getChartTitle() {
            // カスタムタイトルがあればそれを使用、なければデフォルトのグラフタイプ名
            if (this.customTitle && this.customTitle.trim() !== '') {
                return this.customTitle.trim();
            }

            const titles = {
                'pie': '円グラフ',
                'doughnut': 'ドーナツグラフ',
                'bar': '棒グラフ',
                'line': '折れ線グラフ',
                'horizontalBar': '横棒グラフ'
            };
            return titles[this.chartType] || 'グラフ';
        },

        darkenColor(color) {
            // 色を少し暗くする（境界線用）
            const hex = color.replace('#', '');
            const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 30);
            const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 30);
            const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 30);
            return '#' + r.toString(16).padStart(2, '0') +
                         g.toString(16).padStart(2, '0') +
                         b.toString(16).padStart(2, '0');
        },

        exportSVG() {
            if (!this.chartInstance) {
                alert('グラフが作成されていません。');
                return;
            }

            try {
                const canvas = document.getElementById('myChart');
                let svgContent;

                // 円グラフまたはドーナツグラフの場合は真のベクターSVGを生成
                if (this.chartType === 'pie') {
                    svgContent = this.generatePieChartSVG(canvas.width, canvas.height);
                } else if (this.chartType === 'doughnut') {
                    svgContent = this.generateDoughnutChartSVG(canvas.width, canvas.height);
                } else if (this.chartType === 'bar') {
                    // 棒グラフの場合も真のベクターSVGを生成
                    svgContent = this.generateBarChartSVG(canvas.width, canvas.height);
                } else if (this.chartType === 'horizontalBar') {
                    // 横棒グラフの場合も真のベクターSVGを生成
                    svgContent = this.generateHorizontalBarChartSVG(canvas.width, canvas.height);
                } else {
                    // 他のグラフタイプはCanvasをSVGに埋め込む
                    const imageData = canvas.toDataURL('image/png');
                    svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}"
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="${canvas.width}" height="${canvas.height}" xlink:href="${imageData}"/>
</svg>`;
                }

                // ダウンロード
                const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `chart-${this.chartType}-${Date.now()}.svg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                console.log('SVGエクスポート成功');
            } catch (error) {
                console.error('SVGエクスポートエラー:', error);
                alert('SVGのエクスポートに失敗しました。');
            }
        },

        generatePieChartSVG(width, height) {
            // 円グラフ用の真のベクターSVGを生成
            const centerX = width / 2;
            const centerY = height / 2.2; // タイトルとレジェンド用にスペースを確保
            const radius = Math.min(width, height) / 3.5;

            const data = this.dataRows.map(row => row.value || 0);
            const labels = this.dataRows.map(row => row.label || '未設定');
            const colors = this.dataRows.map(row => row.color || '#CCCCCC');
            const total = data.reduce((sum, value) => sum + value, 0);

            let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .pie-segment { stroke: #fff; stroke-width: 2; }
      .pie-label { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #fff; text-anchor: middle; }
      .legend-text { font-family: Arial, sans-serif; font-size: 12px; fill: #333; }
      .title-text { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #333; text-anchor: middle; }
    </style>
  </defs>

  <!-- タイトル -->
  <text x="${centerX}" y="30" class="title-text">${this.getChartTitle()}</text>

  <!-- 円グラフ -->
  <g id="pie-chart">
`;

            let currentAngle = -Math.PI / 2; // 12時の位置から開始

            data.forEach((value, index) => {
                if (value > 0) {
                    const percentage = (value / total) * 100;
                    const sliceAngle = (value / total) * 2 * Math.PI;
                    const endAngle = currentAngle + sliceAngle;

                    // パスを描画
                    const startX = centerX + radius * Math.cos(currentAngle);
                    const startY = centerY + radius * Math.sin(currentAngle);
                    const endX = centerX + radius * Math.cos(endAngle);
                    const endY = centerY + radius * Math.sin(endAngle);

                    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

                    const pathData = `M ${centerX},${centerY} L ${startX},${startY} A ${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY} Z`;

                    svg += `    <path d="${pathData}" fill="${colors[index]}" class="pie-segment" data-label="${labels[index]}" data-value="${value}"/>\n`;

                    // ラベル（値とパーセンテージ）を追加
                    const labelAngle = currentAngle + sliceAngle / 2;
                    const labelRadius = radius * 0.65;
                    const labelX = centerX + labelRadius * Math.cos(labelAngle);
                    const labelY = centerY + labelRadius * Math.sin(labelAngle);

                    // 2行表示：値（件数）とパーセンテージ
                    svg += `    <text x="${labelX}" y="${labelY - 5}" class="pie-label">${value}件</text>\n`;
                    svg += `    <text x="${labelX}" y="${labelY + 12}" class="pie-label">${percentage.toFixed(1)}%</text>\n`;

                    currentAngle = endAngle;
                }
            });

            svg += `  </g>

  <!-- レジェンド -->
  <g id="legend">
`;

            const legendStartY = height - (labels.length * 25) - 20;
            const legendX = 20;

            labels.forEach((label, index) => {
                const legendY = legendStartY + (index * 25);
                svg += `    <rect x="${legendX}" y="${legendY}" width="15" height="15" fill="${colors[index]}"/>
    <text x="${legendX + 20}" y="${legendY + 12}" class="legend-text">${label}: ${data[index]}</text>
`;
            });

            svg += `  </g>
</svg>`;

            return svg;
        },

        generateBarChartSVG(width, height) {
            // 棒グラフ用の真のベクターSVGを生成
            const data = this.dataRows.map(row => row.value || 0);
            const labels = this.dataRows.map(row => row.label || '未設定');
            const colors = this.dataRows.map(row => row.color || '#CCCCCC');
            const maxValue = Math.max(...data, 1) * 1.2;

            // グラフエリアの設定
            const titleY = 35;
            const margin = { top: 100, right: 40, bottom: 80, left: 60 };
            const chartWidth = width - margin.left - margin.right;
            const chartHeight = height - margin.top - margin.bottom;
            const barWidth = chartWidth / data.length * 0.7;
            const barSpacing = chartWidth / data.length;

            let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .bar { stroke: #fff; stroke-width: 1; }
      .bar-label { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; fill: #333; text-anchor: middle; }
      .axis-label { font-family: Arial, sans-serif; font-size: 11px; fill: #666; text-anchor: middle; }
      .axis-line { stroke: #ccc; stroke-width: 1; }
      .grid-line { stroke: #e0e0e0; stroke-width: 1; }
      .title-text { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #333; text-anchor: middle; }
      .axis-title { font-family: Arial, sans-serif; font-size: 12px; fill: #666; }
    </style>
  </defs>

  <!-- タイトル -->
  <text x="${width / 2}" y="${titleY}" class="title-text">${this.getChartTitle()}</text>

  <!-- 背景グリッド線 -->
  <g id="grid">
`;

            // Y軸グリッド線（5本）
            for (let i = 0; i <= 5; i++) {
                const y = margin.top + (chartHeight * i / 5);
                svg += `    <line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" class="grid-line"/>\n`;
            }

            svg += `  </g>

  <!-- 棒グラフ -->
  <g id="bars">
`;

            // 各棒を描画
            data.forEach((value, index) => {
                const barHeight = (value / maxValue) * chartHeight;
                const x = margin.left + (barSpacing * index) + (barSpacing - barWidth) / 2;
                const y = margin.top + chartHeight - barHeight;

                svg += `    <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${colors[index]}" class="bar" data-label="${labels[index]}" data-value="${value}"/>\n`;

                // バーの上に値を表示
                svg += `    <text x="${x + barWidth / 2}" y="${y - 5}" class="bar-label">${value}件</text>\n`;
            });

            svg += `  </g>

  <!-- X軸 -->
  <g id="x-axis">
    <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" class="axis-line"/>
`;

            // X軸ラベル
            labels.forEach((label, index) => {
                const x = margin.left + (barSpacing * index) + barSpacing / 2;
                svg += `    <text x="${x}" y="${margin.top + chartHeight + 20}" class="axis-label">${label}</text>\n`;
            });

            svg += `  </g>

  <!-- Y軸 -->
  <g id="y-axis">
    <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" class="axis-line"/>
`;

            // Y軸ラベル（目盛り）
            for (let i = 0; i <= 5; i++) {
                const value = Math.round(maxValue * (5 - i) / 5);
                const y = margin.top + (chartHeight * i / 5);
                svg += `    <text x="${margin.left - 10}" y="${y + 4}" class="axis-label" text-anchor="end">${value}</text>\n`;
            }

            svg += `    <text x="${margin.left - 40}" y="${margin.top + chartHeight / 2}" class="axis-title" text-anchor="middle" transform="rotate(-90, ${margin.left - 40}, ${margin.top + chartHeight / 2})">値</text>
  </g>

  <!-- レジェンド -->
  <g id="legend">
`;

            // レジェンドを追加（円グラフと同じスタイル）
            const legendStartY = height - (labels.length * 25) - 20;
            const legendX = 20;

            labels.forEach((label, index) => {
                const legendY = legendStartY + (index * 25);
                svg += `    <rect x="${legendX}" y="${legendY}" width="15" height="15" fill="${colors[index]}"/>
    <text x="${legendX + 20}" y="${legendY + 12}" class="legend-text">${label}: ${data[index]}</text>
`;
            });

            svg += `  </g>
</svg>`;

            return svg;
        },

        generateHorizontalBarChartSVG(width, height) {
            // 横棒グラフ用の真のベクターSVGを生成
            const data = this.dataRows.map(row => row.value || 0);
            const labels = this.dataRows.map(row => row.label || '未設定');
            const colors = this.dataRows.map(row => row.color || '#CCCCCC');
            const maxValue = Math.max(...data, 1) * 1.2;

            // グラフエリアの設定
            const titleY = 35;
            const margin = { top: 100, right: 60, bottom: 80, left: 100 };
            const chartWidth = width - margin.left - margin.right;
            const chartHeight = height - margin.top - margin.bottom;
            const barHeight = chartHeight / data.length * 0.7;
            const barSpacing = chartHeight / data.length;

            let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .bar { stroke: #fff; stroke-width: 1; }
      .bar-label { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; fill: #333; text-anchor: start; }
      .axis-label { font-family: Arial, sans-serif; font-size: 11px; fill: #666; text-anchor: middle; }
      .y-axis-label { font-family: Arial, sans-serif; font-size: 11px; fill: #666; text-anchor: end; }
      .axis-line { stroke: #ccc; stroke-width: 1; }
      .grid-line { stroke: #e0e0e0; stroke-width: 1; }
      .title-text { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #333; text-anchor: middle; }
      .axis-title { font-family: Arial, sans-serif; font-size: 12px; fill: #666; }
      .legend-text { font-family: Arial, sans-serif; font-size: 12px; fill: #333; }
    </style>
  </defs>

  <!-- タイトル -->
  <text x="${width / 2}" y="${titleY}" class="title-text">${this.getChartTitle()}</text>

  <!-- 背景グリッド線 -->
  <g id="grid">
`;

            // X軸グリッド線（5本）
            for (let i = 0; i <= 5; i++) {
                const x = margin.left + (chartWidth * i / 5);
                svg += `    <line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + chartHeight}" class="grid-line"/>\n`;
            }

            svg += `  </g>

  <!-- 横棒グラフ -->
  <g id="bars">
`;

            // 各棒を描画
            data.forEach((value, index) => {
                const barWidth = (value / maxValue) * chartWidth;
                const x = margin.left;
                const y = margin.top + (barSpacing * index) + (barSpacing - barHeight) / 2;

                svg += `    <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${colors[index]}" class="bar" data-label="${labels[index]}" data-value="${value}"/>\n`;

                // バーの右側に値を表示
                svg += `    <text x="${x + barWidth + 5}" y="${y + barHeight / 2 + 4}" class="bar-label">${value}件</text>\n`;
            });

            svg += `  </g>

  <!-- X軸 -->
  <g id="x-axis">
    <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" class="axis-line"/>
`;

            // X軸ラベル
            for (let i = 0; i <= 5; i++) {
                const value = Math.round(maxValue * i / 5);
                const x = margin.left + (chartWidth * i / 5);
                svg += `    <text x="${x}" y="${margin.top + chartHeight + 20}" class="axis-label">${value}</text>\n`;
            }

            svg += `    <text x="${margin.left + chartWidth / 2}" y="${margin.top + chartHeight + 40}" class="axis-title" text-anchor="middle">値</text>
  </g>

  <!-- Y軸 -->
  <g id="y-axis">
    <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" class="axis-line"/>
`;

            // Y軸ラベル
            labels.forEach((label, index) => {
                const y = margin.top + (barSpacing * index) + barSpacing / 2;
                svg += `    <text x="${margin.left - 10}" y="${y + 4}" class="y-axis-label">${label}</text>\n`;
            });

            svg += `  </g>

  <!-- レジェンド -->
  <g id="legend">
`;

            // レジェンドを追加（円グラフと同じスタイル）
            const legendStartY = height - (labels.length * 25) - 20;
            const legendX = 20;

            labels.forEach((label, index) => {
                const legendY = legendStartY + (index * 25);
                svg += `    <rect x="${legendX}" y="${legendY}" width="15" height="15" fill="${colors[index]}"/>
    <text x="${legendX + 20}" y="${legendY + 12}" class="legend-text">${label}: ${data[index]}</text>
`;
            });

            svg += `  </g>
</svg>`;

            return svg;
        },

        generateDoughnutChartSVG(width, height) {
            // ドーナツグラフ用の真のベクターSVGを生成
            const centerX = width / 2;
            const centerY = height / 2.2; // タイトルとレジェンド用にスペースを確保
            const outerRadius = Math.min(width, height) / 3.5;
            const innerRadius = outerRadius * 0.5; // 内側の半径は外側の50%

            const data = this.dataRows.map(row => row.value || 0);
            const labels = this.dataRows.map(row => row.label || '未設定');
            const colors = this.dataRows.map(row => row.color || '#CCCCCC');
            const total = data.reduce((sum, value) => sum + value, 0);

            let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .doughnut-segment { stroke: #fff; stroke-width: 2; }
      .doughnut-label { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #fff; text-anchor: middle; }
      .legend-text { font-family: Arial, sans-serif; font-size: 12px; fill: #333; }
      .title-text { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #333; text-anchor: middle; }
      .center-text-label { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #333; text-anchor: middle; }
      .center-text-value { font-family: Arial, sans-serif; font-size: 32px; font-weight: bold; fill: #333; text-anchor: middle; }
    </style>
  </defs>

  <!-- タイトル -->
  <text x="${centerX}" y="30" class="title-text">${this.getChartTitle()}</text>

  <!-- ドーナツグラフ -->
  <g id="doughnut-chart">
`;

            let currentAngle = -Math.PI / 2; // 12時の位置から開始

            data.forEach((value, index) => {
                if (value > 0) {
                    const percentage = (value / total) * 100;
                    const sliceAngle = (value / total) * 2 * Math.PI;
                    const endAngle = currentAngle + sliceAngle;

                    // 外側の円のパス
                    const outerStartX = centerX + outerRadius * Math.cos(currentAngle);
                    const outerStartY = centerY + outerRadius * Math.sin(currentAngle);
                    const outerEndX = centerX + outerRadius * Math.cos(endAngle);
                    const outerEndY = centerY + outerRadius * Math.sin(endAngle);

                    // 内側の円のパス
                    const innerStartX = centerX + innerRadius * Math.cos(currentAngle);
                    const innerStartY = centerY + innerRadius * Math.sin(currentAngle);
                    const innerEndX = centerX + innerRadius * Math.cos(endAngle);
                    const innerEndY = centerY + innerRadius * Math.sin(endAngle);

                    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

                    // ドーナツ形状のパスを描画（外側の円弧→内側の円弧を逆方向）
                    const pathData = `M ${outerStartX},${outerStartY} A ${outerRadius},${outerRadius} 0 ${largeArcFlag},1 ${outerEndX},${outerEndY} L ${innerEndX},${innerEndY} A ${innerRadius},${innerRadius} 0 ${largeArcFlag},0 ${innerStartX},${innerStartY} Z`;

                    svg += `    <path d="${pathData}" fill="${colors[index]}" class="doughnut-segment" data-label="${labels[index]}" data-value="${value}"/>\n`;

                    // ラベル（値とパーセンテージ）を追加
                    const labelAngle = currentAngle + sliceAngle / 2;
                    const labelRadius = (outerRadius + innerRadius) / 2;
                    const labelX = centerX + labelRadius * Math.cos(labelAngle);
                    const labelY = centerY + labelRadius * Math.sin(labelAngle);

                    // 2行表示：値（件数）とパーセンテージ
                    svg += `    <text x="${labelX}" y="${labelY - 5}" class="doughnut-label">${value}件</text>\n`;
                    svg += `    <text x="${labelX}" y="${labelY + 12}" class="doughnut-label">${percentage.toFixed(1)}%</text>\n`;

                    currentAngle = endAngle;
                }
            });

            svg += `  </g>

  <!-- 中央のテキスト（総数） -->
  <g id="center-text">
    <text x="${centerX}" y="${centerY - 10}" class="center-text-label">総数</text>
    <text x="${centerX}" y="${centerY + 20}" class="center-text-value">${total}件</text>
  </g>

  <!-- レジェンド -->
  <g id="legend">
`;

            const legendStartY = height - (labels.length * 25) - 20;
            const legendX = 20;

            labels.forEach((label, index) => {
                const legendY = legendStartY + (index * 25);
                svg += `    <rect x="${legendX}" y="${legendY}" width="15" height="15" fill="${colors[index]}"/>
    <text x="${legendX + 20}" y="${legendY + 12}" class="legend-text">${label}: ${data[index]}</text>
`;
            });

            svg += `  </g>
</svg>`;

            return svg;
        },

        exportJSON() {
            // グラフの状態をJSONとしてエクスポート
            const graphState = {
                version: '1.0',
                chartType: this.chartType,
                customTitle: this.customTitle,
                chartWidth: this.chartWidth,
                chartHeight: this.chartHeight,
                dataRows: this.dataRows
            };

            const jsonString = JSON.stringify(graphState, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `graph-${this.chartType}-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('JSONエクスポート成功');
        },

        importJSON(event) {
            // JSONファイルを読み込んでグラフの状態を復元
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const graphState = JSON.parse(e.target.result);

                    // バリデーション
                    if (!graphState.dataRows || !Array.isArray(graphState.dataRows)) {
                        throw new Error('無効なJSONフォーマットです');
                    }

                    // 状態を復元
                    this.chartType = graphState.chartType || 'pie';
                    this.customTitle = graphState.customTitle || '';
                    this.chartWidth = graphState.chartWidth || 800;
                    this.chartHeight = graphState.chartHeight || 600;

                    // dataRowsを復元（IDがない場合は追加）
                    this.dataRows = graphState.dataRows.map((row, index) => {
                        if (!row.id) {
                            return { ...row, id: index + 1 };
                        }
                        return row;
                    });

                    // nextIdを設定
                    const maxId = Math.max(...this.dataRows.map(r => r.id || 0), 0);
                    this.nextId = maxId + 1;

                    // グラフを更新
                    this.updateChart();

                    alert('JSONファイルを読み込みました！');
                    console.log('JSONインポート成功:', graphState);
                } catch (error) {
                    console.error('JSONインポートエラー:', error);
                    alert('JSONファイルの読み込みに失敗しました。正しいフォーマットか確認してください。');
                }
            };
            reader.readAsText(file);

            // ファイル入力をリセット（同じファイルを再度選択できるようにする）
            event.target.value = '';
        }
    };
}
