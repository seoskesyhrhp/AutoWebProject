(function () {
    const logEl = document.getElementById("log");
    const jobMeta = document.getElementById("jobMeta");
    const refreshBtn = document.getElementById("refresh");
    const stateInput = document.getElementById("state");
    const listMeta = document.getElementById("listMeta");
    const refreshListBtn = document.getElementById("refreshList");
    const listStatsEl = document.getElementById("listStats");
    const listTbody = document.getElementById("listTbody");
    const statusChart = document.getElementById("statusChart");
    const tableWrap = document.getElementById("tableWrap");
    const stickyHeadToggle = document.getElementById("stickyHeadToggle");
    const listSearchInput = document.getElementById("listSearch");
    const clearListSearchBtn = document.getElementById("clearListSearch");
    const LIST_REFRESH_INTERVAL = 10000;
    let pollTimer = null;
    let listRefreshTimer = null;
    let currentJobId = null;
    let lastListParsed = null;
    let lastListAllItems = null;
    let lastChartSignature = "";
    let searchTimer = null;

    function applyStickyHead(enabled) {
        if (!tableWrap) return;
        tableWrap.classList.toggle("no-sticky", !enabled);
    }

    function setLog(text) {
        logEl.textContent = text;
    }

    function appendMeta(job) {
        jobMeta.textContent = job
            ? "jobId=" + job.id + " · " + job.type + " · " + job.status
            : "";
    }

    async function fetchJob(id) {
        const r = await fetch("/api/jobs/" + encodeURIComponent(id));
        if (!r.ok) {
            throw new Error("HTTP " + r.status);
        }
        return r.json();
    }

    function escapeHtml(str) {
        return String(str ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function setListMeta(text) {
        if (listMeta) listMeta.textContent = text || "";
    }

    function toSearchHaystack(it) {
        if (!it || typeof it !== "object") return "";
        const parts = [];
        Object.keys(it).forEach(function (k) {
            const v = it[k];
            if (v === null || v === undefined) return;
            if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
                parts.push(String(v));
            }
        });
        return parts.join(" ").toLowerCase();
    }

    function applyListFilter() {
        const q = String((listSearchInput && listSearchInput.value) || "").trim().toLowerCase();
        const all = Array.isArray(lastListAllItems) ? lastListAllItems : [];
        const filtered = q
            ? all.filter(function (it) {
                return toSearchHaystack(it).includes(q);
            })
            : all;

        renderTable(filtered);

        const metaBase = "已加载 · 明细 " + all.length + " 条";
        const meta = q ? metaBase + " · 筛选 " + filtered.length + " 条" : metaBase;
        setListMeta(meta);

        if (clearListSearchBtn) {
            clearListSearchBtn.disabled = !q;
        }
    }

    function scheduleApplyListFilter() {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            applyListFilter();
        }, 120);
    }

    function parseListResponse(payload) {
        // /api/list now reuses /ehs/list response format: {code,msg,status,message,data:[...]}
        const rows = payload && typeof payload === "object" && Array.isArray(payload.data)
            ? payload.data
            : payload;
        const arr = Array.isArray(rows) ? rows : [];
        const summary = arr.length ? arr[arr.length - 1] : null;
        const hasSummary =
            summary &&
            typeof summary === "object" &&
            ("total" in summary || "completed" in summary || "inProgress" in summary || "notStarted" in summary);

        const items = hasSummary ? arr.slice(0, -1) : arr;
        const stats = hasSummary
            ? {
                notStarted: Number(summary.notStarted ?? 0),
                inProgress: Number(summary.inProgress ?? 0),
                completed: Number(summary.completed ?? 0),
                total: Number(summary.total ?? 0),
            }
            : {
                notStarted: 0,
                inProgress: 0,
                completed: 0,
                total: items.length,
            };
        return {items, stats};
    }

    function renderStats(stats) {
        if (!listStatsEl) return;
        const cells = [
            {label: "未开始", value: stats.notStarted},
            {label: "进行中", value: stats.inProgress},
            {label: "已完成", value: stats.completed},
            {label: "总计", value: stats.total},
        ];
        listStatsEl.innerHTML = cells
            .map(function (c) {
                return (
                    '<div class="stat">' +
                    '<div class="stat-k">' + escapeHtml(c.label) + "</div>" +
                    '<div class="stat-v">' + escapeHtml(c.value) + "</div>" +
                    "</div>"
                );
            })
            .join("");
    }

    function renderTable(items) {
        if (!listTbody) return;
        listTbody.innerHTML = items
            .map(function (it) {
                const name = it && typeof it === "object" ? it.CheckAreaName : "";
                const code = it && typeof it === "object" ? it.CheckAreaCode : "";
                const cnt = it && typeof it === "object" ? it.CheckCnt : "";
                const elevators = it && typeof it === "object" ? it.numberOfElevators : "";
                return (
                    "<tr>" +
                    "<td>" + escapeHtml(name) + "</td>" +
                    "<td>" + escapeHtml(code) + "</td>" +
                    "<td>" + escapeHtml(cnt) + "</td>" +
                    "<td>" + escapeHtml(elevators) + "</td>" +
                    "</tr>"
                );
            })
            .join("");
    }

    function getChartSignature(stats) {
        return JSON.stringify({
            notStarted: Number(stats && stats.notStarted ? stats.notStarted : 0),
            inProgress: Number(stats && stats.inProgress ? stats.inProgress : 0),
            completed: Number(stats && stats.completed ? stats.completed : 0),
            total: Number(stats && stats.total ? stats.total : 0),
        });
    }

    function drawStatusChart(stats, forceRedraw) {
        if (!statusChart || !statusChart.getContext) return;

        const signature = getChartSignature(stats);
        if (!forceRedraw && signature === lastChartSignature) {
            return;
        }
        lastChartSignature = signature;

        const ctx = statusChart.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const chartWrap = statusChart.parentElement;
        const parentWidth = chartWrap
            ? chartWrap.getBoundingClientRect().width
            : 0;
        const cssW = Math.max(240, Math.floor(parentWidth || 320));
        const cssH = chartWrap
            ? Math.max(140, Math.floor(chartWrap.getBoundingClientRect().height || 140))
            : 140;

        statusChart.style.width = cssW + "px";
        statusChart.style.height = cssH + "px";
        statusChart.width = Math.floor(cssW * dpr);
        statusChart.height = Math.floor(cssH * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const w = cssW;
        const h = cssH;
        ctx.clearRect(0, 0, w, h);

        const bars = [
            {label: "未开始", value: stats.notStarted, color: "#ff6b6b"},
            {label: "进行中", value: stats.inProgress, color: "#ffd166"},
            {label: "已完成", value: stats.completed, color: "#06d6a0"},
        ];
        const max = Math.max(1, ...bars.map(b => b.value));
        const pad = 12;
        const gap = 10;
        const barW = (w - pad * 2 - gap * (bars.length - 1)) / bars.length;
        const chartH = h - 34;

        // grid
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = "#9bdcff";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = pad + (chartH * i) / 4;
            ctx.beginPath();
            ctx.moveTo(pad, y);
            ctx.lineTo(w - pad, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // bars + labels
        ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        bars.forEach(function (b, i) {
            const x = pad + i * (barW + gap);
            const bh = Math.round((b.value / max) * (chartH - 4));
            const y = pad + chartH - bh;
            ctx.fillStyle = b.color;
            ctx.fillRect(x, y, barW, bh);
            ctx.fillStyle = "#eaf7ff";
            ctx.fillText(String(b.value), x + barW / 2, y - 4);
            ctx.textBaseline = "top";
            ctx.fillStyle = "#9bdcff";
            ctx.fillText(b.label, x + barW / 2, pad + chartH + 8);
            ctx.textBaseline = "bottom";
        });
    }

    function startPoll(id) {
        stopPoll();
        currentJobId = id;
        refreshBtn.disabled = false;
        const tick = async () => {
            try {
                const j = await fetchJob(id);
                appendMeta(j);
                setLog((j.logs && j.logs.length ? j.logs.join("\n") : "(暂无日志)"));
                if (j.status === "SUCCEEDED" || j.status === "FAILED") {
                    stopPoll();
                }
            } catch (e) {
                setLog("拉取失败: " + e.message);
            }
        };
        tick();
        pollTimer = setInterval(tick, 1500);
    }

    function stopPoll() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    refreshBtn.addEventListener("click", function () {
        if (currentJobId) {
            fetchJob(currentJobId).then(function (j) {
                appendMeta(j);
                setLog((j.logs && j.logs.length ? j.logs.join("\n") : "(暂无日志)"));
            });
        }
    });

    async function loadDataList() {
        if (refreshListBtn) refreshListBtn.disabled = true;
        setListMeta("加载中…");
        try {
            const r = await fetch("/api/list", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({enableTest: true}),
            });
            if (!r.ok) {
                const t = await r.text();
                throw new Error(t || "HTTP " + r.status);
            }
            const data = await r.json();
            const parsed = parseListResponse(data);
            lastListParsed = parsed;
            lastListAllItems = parsed.items;
            renderStats(parsed.stats);
            drawStatusChart(parsed.stats, false);
            applyListFilter();
        } catch (e) {
            setListMeta("加载失败: " + (e && e.message ? e.message : String(e)));
            if (listTbody) listTbody.innerHTML = "";
            if (listStatsEl) listStatsEl.innerHTML = "";
            lastChartSignature = "";
            drawStatusChart({notStarted: 0, inProgress: 0, completed: 0, total: 0}, true);
            lastListParsed = null;
            lastListAllItems = null;
            if (clearListSearchBtn) clearListSearchBtn.disabled = true;
        } finally {
            if (refreshListBtn) refreshListBtn.disabled = false;
        }
    }

    function startListAutoRefresh() {
        stopListAutoRefresh();
        listRefreshTimer = setInterval(function () {
            loadDataList();
        }, LIST_REFRESH_INTERVAL);
    }

    function stopListAutoRefresh() {
        if (listRefreshTimer) {
            clearInterval(listRefreshTimer);
            listRefreshTimer = null;
        }
    }

    document.querySelectorAll(".actions button").forEach(function (btn) {
        btn.addEventListener("click", async function () {
            const type = btn.getAttribute("data-type");
            const state = parseInt(stateInput.value || "0", 10);
            setLog("正在启动 " + type + " …");
            appendMeta(null);
            try {
                const r = await fetch("/api/jobs/start", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({type: type, state: state}),
                });
                if (!r.ok) {
                    const t = await r.text();
                    throw new Error(t || "HTTP " + r.status);
                }
                const data = await r.json();
                setLog("已创建任务 " + data.jobId + "，正在轮询日志…");
                startPoll(data.jobId);
            } catch (e) {
                setLog("启动失败: " + e.message);
            }
        });
    });

    if (refreshListBtn) {
        refreshListBtn.addEventListener("click", function () {
            loadDataList();
        });
    }

    if (listSearchInput) {
        listSearchInput.addEventListener("input", function () {
            scheduleApplyListFilter();
        });
        listSearchInput.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                listSearchInput.value = "";
                applyListFilter();
            }
        });
    }

    if (clearListSearchBtn && listSearchInput) {
        clearListSearchBtn.disabled = true;
        clearListSearchBtn.addEventListener("click", function () {
            listSearchInput.value = "";
            applyListFilter();
            listSearchInput.focus();
        });
    }

    window.addEventListener("resize", function () {
        // resize 时只重绘图表，避免反复请求接口
        if (window.__ehsResizeRAF) cancelAnimationFrame(window.__ehsResizeRAF);
        window.__ehsResizeRAF = requestAnimationFrame(function () {
            if (lastListParsed) {
                drawStatusChart(lastListParsed.stats, true);
            }
        });
    });

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            stopListAutoRefresh();
            return;
        }
        loadDataList();
        startListAutoRefresh();
    });

    if (stickyHeadToggle) {
        applyStickyHead(!!stickyHeadToggle.checked);
        stickyHeadToggle.addEventListener("change", function () {
            applyStickyHead(!!stickyHeadToggle.checked);
        });
    } else {
        applyStickyHead(true);
    }

    // Load data list on page load
    loadDataList();
    startListAutoRefresh();
})();
