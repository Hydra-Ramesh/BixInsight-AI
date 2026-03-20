const fs = require('fs');
const diffText = `    const copyShareLink = () => {
        const link = \`\${window.location.origin}/shared/\${shareToken}\`
        navigator.clipboard.writeText(link)
        setCopiedContent(true)
        setTimeout(() => setCopiedContent(false), 2000)
    }

    const handleExportPdf = async () => {
        setGeneratingPdf(true)
        try {
            // Momentarily switch to charts tab if not there
            const prevTab = activeTab
            setActiveTab('charts')

            // Wait a tick for render
            await new Promise(r => setTimeout(r, 500))

            const element = document.getElementById('dashboard-content')
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#0a0a1a'
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
            pdf.save(\`BixInsight_\${analysis.fileName.split('.')[0]}_Report.pdf\`)

            setActiveTab(prevTab)
        } catch (err) {
            console.error('Failed to export PDF', err)
        }
        setGeneratingPdf(false)
    }

    const handleExportPpt = async () => {
        try {
            const token = localStorage.getItem('bixinsight_token')
            const response = await fetch(\`\${API}/analysis/\${id}/export/pptx\`, {
                headers: { Authorization: \`Bearer \${token}\` }
            })
            if (!response.ok) throw new Error('Failed to export PPTX')
            
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.style.display = 'none'
            a.href = url
            a.download = \`BixInsight_\${analysis.fileName.split('.')[0]}_Report.pptx\`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Export PPT error:', err)
        }
    }

    if (loading) {
        return (
            <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <div className="spinner" />
            </div>
        )
    }

    if (!analysis) {
        return (
            <div className="main-content">
                <div className="glass-card empty-state">
                    <h3>Analysis not found</h3>
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
                </div>
            </div>
        )
    }

    const insightIcon = (cat) => {
        switch (cat) {
            case 'trend': return <TrendingUp size={18} />
            case 'anomaly': return <AlertTriangle size={18} />
            case 'correlation': return <Zap size={18} />
            case 'recommendation': return <Star size={18} />
            default: return <Lightbulb size={18} />
        }
    }

    const insightColor = (imp) => {
        switch (imp) {
            case 'high': return 'var(--accent-pink)'
            case 'low': return 'var(--accent-cyan)'
            default: return 'var(--accent-primary)'
        }
    }

    const renderChart = (chart, index) => {
        const data = filteredCharts[index]?.data || chart.data
        const colors = chart.colors?.length ? chart.colors : CHART_COLORS

        switch (chart.chartType) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey={chart.xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-15} textAnchor="end" />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            {chart.yKeys.map((key, i) => (
                                <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey={chart.xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-15} textAnchor="end" />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {chart.yKeys.map((key, i) => (
                                <Line key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={130} innerRadius={60} paddingAngle={3} label={({ name, value }) => \`\${name}: \${value}\`} labelLine={{ stroke: '#64748b' }}>
                                {data.map((_, i) => (
                                    <Cell key={i} fill={colors[i % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                            <defs>
                                {chart.yKeys.map((key, i) => (
                                    <linearGradient key={key} id={\`area-gradient-\${index}-\${i}\`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey={chart.xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-15} textAnchor="end" />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {chart.yKeys.map((key, i) => (
                                <Area key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} fill={\`url(#area-gradient-\${index}-\${i})\`} strokeWidth={2} />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                )

            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey={chart.xKey} name={chart.xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <YAxis dataKey={chart.yKeys[0]} name={chart.yKeys[0]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Scatter data={data} fill={colors[0]}>
                                {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                )

            default:
                return <p>Unsupported chart type: {chart.chartType}</p>
        }
    }

    return (
        <div className="main-content analysis-page">
            {/* Header */}
            <div className="analysis-header">
                <div className="analysis-header-left">
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div>
                        <h1 className="page-title">{analysis.fileName}</h1>
                        <p className="page-subtitle">
                            {analysis.rowCount?.toLocaleString()} rows · {analysis.columnCount} columns · {new Date(analysis.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="analysis-header-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowShareModal(true)}>
                        <Share2 size={16} /> Share
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={handleExportPpt}>
                        <Presentation size={16} /> Export PPT
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={handleExportPdf} disabled={generatingPdf}>
                        {generatingPdf ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Download size={16} />} 
                        {generatingPdf ? ' Exporting...' : ' Export PDF'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={16} /> {showFilters ? 'Hide' : 'Show'} Filters
                    </button>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Share Analysis</h2>
                        <p className="modal-subtitle">Generate a public link so anyone can view this analysis dashboard.</p>
                        
                        {shareToken ? (
                            <div className="share-active">
                                <p style={{ color: 'var(--accent-green)', fontSize: '0.9rem', marginBottom: 12 }}>✔️ Link is active</p>
                                <div className="share-link-box">
                                    <input type="text" value={\`\${window.location.origin}/shared/\${shareToken}\`} readOnly className="form-input" />
                                    <button className="btn btn-primary" onClick={copyShareLink}>
                                        {copiedContent ? <span style={{fontSize:'0.8rem'}}>Copied!</span> : <Copy size={18} />}
                                    </button>
                                </div>
                                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                    <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>Close</button>
                                    <button className="btn" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }} onClick={() => handleToggleShare(false)}>
                                        <Trash size={16} /> Disable Link
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="share-inactive">
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>Currently private. Only you can access this.</p>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                    <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={() => handleToggleShare(true)}>
                                        <Share2 size={16} /> Generate Link
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div id="dashboard-content" style={{ padding: '2px' }}>
                {/* Summary */}
            {analysis.summary && (
                <div className="glass-card summary-card">
                    <div className="summary-icon"><Brain size={20} /></div>
                    <div>
                        <h3 className="summary-title">AI Summary</h3>
                        <p className="summary-text">{analysis.summary}</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="view-tabs">
                <button className={\`tab-btn \${activeTab === 'charts' ? 'active' : ''}\`} onClick={() => setActiveTab('charts')}>
                    <BarChart3 size={16} /> Charts
                </button>
                <button className={\`tab-btn \${activeTab === 'insights' ? 'active' : ''}\`} onClick={() => setActiveTab('insights')}>
                    <Lightbulb size={16} /> Insights ({analysis.insights?.length || 0})
                </button>
                <button className={\`tab-btn \${activeTab === 'data' ? 'active' : ''}\`} onClick={() => setActiveTab('data')}>
                    <Table size={16} /> Data Preview
                </button>
            </div>

            <div className="analysis-body">
                {/* Filter Sidebar */}
                {showFilters && analysis.filters?.length > 0 && (
                    <aside className="filter-sidebar glass-card">
                        <div className="filter-header">
                            <h3><Filter size={16} /> Filters</h3>
                            {Object.keys(activeFilters).length > 0 && (
                                <button className="btn btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={clearFilters}>Clear</button>
                            )}
                        </div>
                        {analysis.filters.map((filter, i) => (
                            <div key={i} className="filter-group">
                                <label className="filter-label">{filter.column.replace(/_/g, ' ')}</label>
                                {filter.type === 'select' ? (
                                    <select
                                        className="filter-select"
                                        value={activeFilters[filter.column] || '__all__'}
                                        onChange={e => handleFilterChange(filter.column, e.target.value)}
                                    >
                                        <option value="__all__">All</option>
                                        {filter.options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : filter.type === 'range' ? (
                                    <div className="filter-range">
                                        <input
                                            type="number"
                                            className="filter-range-input"
                                            placeholder={\`Min (\${filter.options[0]})\`}
                                            value={activeFilters[filter.column]?.min ?? ''}
                                            onChange={e => {
                                                const val = e.target.value
                                                const current = activeFilters[filter.column] || { min: filter.options[0], max: filter.options[1] }
                                                handleFilterChange(filter.column, {
                                                    ...current,
                                                    min: val === '' ? filter.options[0] : Number(val)
                                                })
                                            }}
                                        />
                                        <span className="range-sep">to</span>
                                        <input
                                            type="number"
                                            className="filter-range-input"
                                            placeholder={\`Max (\${filter.options[1]})\`}
                                            value={activeFilters[filter.column]?.max ?? ''}
                                            onChange={e => {
                                                const val = e.target.value
                                                const current = activeFilters[filter.column] || { min: filter.options[0], max: filter.options[1] }
                                                handleFilterChange(filter.column, {
                                                    ...current,
                                                    max: val === '' ? filter.options[1] : Number(val)
                                                })
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <input
                                        type="date"
                                        className="filter-select"
                                        onChange={e => handleFilterChange(filter.column, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                    </aside>
                )}

                {/* Main Content */}
                <div className="analysis-main">
                    {/* Charts Tab */}
                    {activeTab === 'charts' && (
                        <div className="charts-grid">
                            {analysis.charts?.map((chart, i) => (
                                <div key={i} className="glass-card chart-card" style={{ animationDelay: \`\${i * 0.1}s\` }}>
                                    <div className="chart-card-header">
                                        <div>
                                            <h3 className="chart-title">{chart.title}</h3>
                                            <p className="chart-description">{chart.description}</p>
                                            {chart.recommendation && (
                                                <div className="chart-recommendation" style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 12, padding: '8px 12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 6, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                                    <Brain size={14} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                                                    <div>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Why this chart?</span>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, marginTop: 2, lineHeight: 1.4 }}>{chart.recommendation}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="chart-body">
                                        {renderChart(chart, i)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Insights Tab */}
                    {activeTab === 'insights' && (
                        <div className="insights-grid">
                            {analysis.insights?.map((insight, i) => (
                                <div key={i} className="glass-card insight-card" style={{ animationDelay: \`\${i * 0.08}s\` }}>
                                    <div className="insight-header">
                                        <div className="insight-icon" style={{ color: insightColor(insight.importance), background: \`\${insightColor(insight.importance)}15\` }}>
                                            {insightIcon(insight.category)}
                                        </div>
                                        <span className={\`badge badge-\${insight.importance === 'high' ? 'danger' : insight.importance === 'low' ? 'info' : 'warning'}\`}>
                                            {insight.importance}
                                        </span>
                                    </div>
                                    <h3 className="insight-title">{insight.title}</h3>
                                    <p className="insight-description">{insight.description}</p>
                                    {insight.metric && (
                                        <div className="insight-metric">
                                            <span className="metric-label">{insight.metric}</span>
                                            {insight.value && <span className="metric-value">{insight.value}</span>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Data Tab */}
                    {activeTab === 'data' && (
                        <div className="glass-card data-preview-card">
                            <div className="data-preview-header">
                                <h3>Data Preview</h3>
                                <span className="badge badge-info">First 50 rows</span>
                            </div>
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            {analysis.columns?.map(col => (
                                                <th key={col.name} className="interactive-th" style={{position: 'relative', cursor: 'pointer'}} onClick={() => setActiveTransformCol(activeTransformCol === col.name ? null : col.name)}>
                                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                                        <span>{col.name.replace(/_/g, ' ')}</span>
                                                    </div>
                                                    {activeTransformCol === col.name && (
                                                        <div className="transform-dropdown glass-card" style={{position: 'absolute', top: '100%', left: 0, zIndex: 100, minWidth: 180, padding: 8, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)'}}>
                                                            <div className="dropdown-item" style={{padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: 4}} onClick={(e) => { e.stopPropagation(); handleTransform('fill_mean', col.name) }}>Fill missing with Mean</div>
                                                            <div className="dropdown-item" style={{padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: 4}} onClick={(e) => { e.stopPropagation(); handleTransform('fill_zero', col.name) }}>Fill missing with 0</div>
                                                            <div className="dropdown-item" style={{padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: 4}} onClick={(e) => { e.stopPropagation(); handleTransform('drop_na', col.name) }}>Drop rows with nulls</div>
                                                            <div className="dropdown-item" style={{padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: 4, color: '#ef4444'}} onClick={(e) => { e.stopPropagation(); handleTransform('drop_column', col.name) }}>Delete Column</div>
                                                        </div>
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>`;

const content = fs.readFileSync('c:/Users/dasra/Desktop/BixInsight AI/client/src/pages/AnalysisView.jsx', 'utf8');

const lines = content.split('\n');
const handleExportIdx = lines.findIndex(l => l.includes('const handleExportPpt = async () => {'));
const mapIdx = lines.findIndex((l, i) => i > handleExportIdx && l.includes('{analysis.columns?.map(col => ('));

if (handleExportIdx !== -1 && mapIdx !== -1) {
    const before = lines.slice(0, handleExportIdx).join('\n');
    const after = lines.slice(mapIdx + 1).join('\n'); // skip the map line since it's in diffText
    const newContent = before + '\n' + diffText + '\n' + after;
    fs.writeFileSync('c:/Users/dasra/Desktop/BixInsight AI/client/src/pages/AnalysisView.jsx', newContent);
    console.log('Successfully patched AnalysisView.jsx!');
} else {
    console.error('Failed to patch', handleExportIdx, mapIdx);
}
