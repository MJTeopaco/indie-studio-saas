## UI Pro Max Search Results
**Domain:** chart | **Query:** sprint velocity timeline task comparison status
**Source:** charts.csv | **Found:** 5 results

### Result 1
- **Data Type:** Multi-Variable Comparison
- **Keywords:** radar, spider, multi-variable, attributes, dimensions, comparison
- **Best Chart Type:** Radar / Spider Chart
- **Secondary Options:** Parallel Coordinates, Grouped Bar
- **When to Use:** Comparing multiple entities across the same fixed set of attributes (e.g., product feature comparison)
- **When NOT to Use:** Axes > 8 (unreadable); values need precise comparison (use grouped bar); audience unfamiliar with radar charts
- **Data Volume Threshold:** 2ΓÇô3 datasets maximum per chart; 5ΓÇô8 axes; beyond 8 axes switch to parallel coordinates
- **Color Guidance:** Single dataset: #0080FF at 20% fill. Multiple: distinct hues with 30% fill. Border: full opacity
- **Accessibility Grade:** B
- **Accessibility Notes:** Limit axes to 5ΓÇô8. Always provide grouped bar chart alternative for precise reading.
- **A11y Fallback:** Grouped bar chart as mandatory alternative; include raw data table
- **Library Recommendation:** Chart.js, Recharts, ApexCharts
- **Interactive Level:** Hover + Toggle

### Result 2
- **Data Type:** Real-Time Streaming
- **Keywords:** streaming, real-time, ticker, live, velocity, pulse, monitoring
- **Best Chart Type:** Streaming Area Chart
- **Secondary Options:** Ticker Tape, Moving Gauge
- **When to Use:** Live monitoring dashboards; IoT/ops data updating at ΓëÑ1 Hz; user needs current value at a glance
- **When NOT to Use:** Update frequency < 1/min (use periodic-refresh line chart); flashing content without reduced-motion support
- **Data Volume Threshold:** Canvas/WebGL required. Buffer last 60ΓÇô300s of data. Downsample older data on scroll
- **Color Guidance:** Current pulse: #00FF00 (dark theme) or #0080FF (light theme). History: fading opacity. Grid: dark background
- **Accessibility Grade:** B
- **Accessibility Notes:** Pause/resume control required. Current value as large visible text KPI. Respect prefers-reduced-motion.
- **A11y Fallback:** Pause/resume button required; current value shown as large text KPI; prefers-reduced-motion: freeze animation
- **Library Recommendation:** Smoothed D3.js, CanvasJS
- **Interactive Level:** Real-time + Pause + Zoom

### Result 3
- **Data Type:** Trend Over Time
- **Keywords:** trend, time-series, line, growth, timeline, progress
- **Best Chart Type:** Line Chart
- **Secondary Options:** Area Chart, Smooth Area
- **When to Use:** Data has a time axis; user needs to observe rise/fall trends or rate of change over a continuous period
- **When NOT to Use:** Fewer than 4 data points (use stat card); more than 6 series (visual noise); no time dimension exists
- **Data Volume Threshold:** <1000 pts: SVG; ΓëÑ1000 pts: Canvas + downsampling; >10000: aggregate to intervals
- **Color Guidance:** Primary: #0080FF. Multiple series: distinct colors + distinct line styles. Fill: 20% opacity
- **Accessibility Grade:** AA
- **Accessibility Notes:** Differentiate series by line style (solid/dashed/dotted) not color alone. Add pattern overlays for colorblind users.
- **A11y Fallback:** Dashed/dotted lines per series; togglable data table with timestamps and values
- **Library Recommendation:** Chart.js, Recharts, ApexCharts
- **Interactive Level:** Hover + Zoom

### Result 4
- **Data Type:** Geographic Data
- **Keywords:** geographic, map, location, region, geo, spatial, choropleth
- **Best Chart Type:** Choropleth Map or Bubble Map
- **Secondary Options:** Geographic Heat Map
- **When to Use:** Data has a regional/location dimension; spatial distribution is the core insight for the user
- **When NOT to Use:** Regions have very different sizes making visual comparison misleading (use bar); mobile-primary context
- **Data Volume Threshold:** <1000 regions: SVG; ΓëÑ1000: Canvas/WebGL (Deck.gl); global maps: tile-based rendering
- **Color Guidance:** Single color gradient per region group. Categorized colors for discrete types. Legend with clear scale breaks
- **Accessibility Grade:** B
- **Accessibility Notes:** Include text labels for major regions. Provide keyboard navigation between regions.
- **A11y Fallback:** Region text labels; sortable data table by region name and value; keyboard-navigable regions
- **Library Recommendation:** D3.js, Mapbox, Leaflet
- **Interactive Level:** Pan + Zoom + Drill

### Result 5
- **Data Type:** Compare Categories
- **Keywords:** compare, categories, bar, comparison, ranking
- **Best Chart Type:** Bar Chart (Horizontal or Vertical)
- **Secondary Options:** Column Chart, Grouped Bar
- **When to Use:** Comparing discrete categories by magnitude; ranking or ordering is the core insight; categories Γëñ 15
- **When NOT to Use:** Categories > 15 (use table or search); data has time dimension (use line); showing proportions (use waffle/stacked)
- **Data Volume Threshold:** <20 categories: vertical bar; 20ΓÇô50: horizontal bar; >50: paginated table
- **Color Guidance:** Each bar: distinct color. Grouped: same hue family. Always sort descending by value
- **Accessibility Grade:** AAA
- **Accessibility Notes:** Value labels on each bar by default. Sort control for user reordering.
- **A11y Fallback:** Value labels always visible; provide CSV export
- **Library Recommendation:** Chart.js, Recharts, D3.js
- **Interactive Level:** Hover + Sort

