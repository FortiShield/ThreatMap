<script setup lang="ts">
import { computed, ref } from "vue";

type Severity = "Critical" | "High" | "Medium" | "Low";
type Finding = {
  id: string;
  title: string;
  asset: string;
  path: string;
  severity: Severity;
  category: string;
  discovered: string;
  description: string;
  evidence: string;
};

const severityFilters = ["All", "Critical", "High", "Medium", "Low"] as const;

const findings = ref<Finding[]>([
  {
    id: "TM-1042",
    title: "Exposed administrative endpoint",
    asset: "api.staging.acme.test",
    path: "/v1/admin/users",
    severity: "Critical",
    category: "Access control",
    discovered: "12 min ago",
    description:
      "An administrative endpoint appears to be reachable without the expected access controls.",
    evidence: "GET /v1/admin/users → 200 OK",
  },
  {
    id: "TM-1038",
    title: "Cross-site scripting risk",
    asset: "app.acme.test",
    path: "/search?q=",
    severity: "High",
    category: "Injection",
    discovered: "38 min ago",
    description:
      "User-controlled input is reflected in the response. Review output encoding before rendering it in the browser.",
    evidence: "Reflected parameter: q",
  },
  {
    id: "TM-1034",
    title: "Sensitive data in response",
    asset: "api.staging.acme.test",
    path: "/v1/debug/config",
    severity: "High",
    category: "Information exposure",
    discovered: "1 hr ago",
    description:
      "The response includes configuration details that may help an attacker understand the application environment.",
    evidence: "Response contains environment metadata",
  },
  {
    id: "TM-1029",
    title: "Missing content security policy",
    asset: "app.acme.test",
    path: "/",
    severity: "Medium",
    category: "Security headers",
    discovered: "2 hrs ago",
    description:
      "The response does not define a Content-Security-Policy header to constrain script and resource loading.",
    evidence: "Content-Security-Policy header not present",
  },
  {
    id: "TM-1021",
    title: "Cookie missing Secure flag",
    asset: "auth.acme.test",
    path: "/session",
    severity: "Medium",
    category: "Session security",
    discovered: "3 hrs ago",
    description:
      "A session cookie was observed without the Secure attribute, so it may be sent over an unencrypted connection.",
    evidence: "Set-Cookie: session_id=…; HttpOnly; SameSite=Lax",
  },
  {
    id: "TM-1017",
    title: "Verbose server banner",
    asset: "docs.acme.test",
    path: "/",
    severity: "Low",
    category: "Information exposure",
    discovered: "5 hrs ago",
    description:
      "The server response discloses product and version information that is not needed by clients.",
    evidence: "Server: nginx/1.24.0",
  },
]);

const filter = ref<Severity | "All">("All");
const search = ref("");
const selectedFinding = ref<Finding | null>(findings.value[0] ?? null);
const isScanDialogOpen = ref(false);
const isDark = ref(false);
const previewVisible = ref(true);
const toastMessage = ref("");
const target = ref("https://app.acme.test");
let toastTimer: number | undefined;

const visibleFindings = computed(() => {
  const query = search.value.trim().toLowerCase();
  return findings.value.filter((finding) => {
    const matchesSeverity =
      filter.value === "All" || finding.severity === filter.value;
    const matchesSearch =
      query.length === 0 ||
      `${finding.title} ${finding.asset} ${finding.path} ${finding.id}`
        .toLowerCase()
        .includes(query);
    return matchesSeverity && matchesSearch;
  });
});

function selectFinding(finding: Finding) {
  selectedFinding.value = finding;
}

function showToast(message: string) {
  if (toastTimer !== undefined) {
    globalThis.clearTimeout(toastTimer);
  }
  toastMessage.value = message;
  toastTimer = globalThis.setTimeout(() => {
    toastMessage.value = "";
  }, 3200);
}

function saveScanConfiguration() {
  isScanDialogOpen.value = false;
  showToast(
    "Configuration saved in this preview. Connect the scan API to run it.",
  );
}

function exportFindings() {
  const header = ["ID", "Title", "Severity", "Asset", "Path", "Category"];
  const rows = visibleFindings.value.map((finding) => [
    finding.id,
    finding.title,
    finding.severity,
    finding.asset,
    finding.path,
    finding.category,
  ]);
  const csv = [header, ...rows]
    .map((row) =>
      row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = globalThis.document.createElement("a");
  link.href = url;
  link.download = "threatmap-findings.csv";
  link.click();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toggleTheme() {
  isDark.value = !isDark.value;
  globalThis.document.documentElement.dataset.appearance = isDark.value
    ? "dark"
    : "light";
}

function dismissPreview() {
  previewVisible.value = false;
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#overview" aria-label="ThreatMap home">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path
              d="M16 3.5 27 8v7.6c0 6.2-4.1 10.8-11 13.1C9.1 26.4 5 21.8 5 15.6V8l11-4.5Z"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
            <path
              d="m11.5 16.3 3 3 6-6.5"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span>threat<span class="brand-light">map</span></span>
      </a>

      <div class="workspace-switcher">
        <span class="workspace-avatar">A</span>
        <span class="workspace-copy">
          <strong>Acme Security</strong>
          <span>Workspace</span>
        </span>
        <svg class="chevron" viewBox="0 0 16 16" aria-hidden="true">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </div>

      <p class="nav-label">WORKSPACE</p>
      <nav class="main-nav" aria-label="Main navigation">
        <a class="nav-item is-active" href="#overview">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <rect x="3" y="3" width="5" height="6" rx="1" />
            <rect x="12" y="3" width="5" height="4" rx="1" />
            <rect x="12" y="10" width="5" height="7" rx="1" />
            <rect x="3" y="12" width="5" height="5" rx="1" />
          </svg>
          Overview
        </a>
        <a class="nav-item" href="#findings">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 3 18 17H2L10 3Z" />
            <path d="M10 8v4m0 2v.1" />
          </svg>
          Findings
          <span class="nav-count">18</span>
        </a>
        <a class="nav-item" href="#scans">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 10a7 7 0 0 1 12-5l2 2" />
            <path d="M17 3v4h-4M17 10a7 7 0 0 1-12 5l-2-2" />
            <path d="M3 17v-4h4" />
          </svg>
          Scans
        </a>
        <a class="nav-item" href="#assets">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <rect x="3" y="4" width="14" height="12" rx="2" />
            <path d="M7 8h6m-6 4h3" />
          </svg>
          Assets
        </a>
        <a class="nav-item" href="#activity">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 16V9m5 7V4m5 12v-5m5 5V7" />
          </svg>
          Activity
        </a>
      </nav>

      <p class="nav-label nav-label-lower">PREFERENCES</p>
      <nav class="main-nav" aria-label="Preferences">
        <button class="nav-item" type="button" @click="toggleTheme">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="3" />
            <path
              d="M10 2v2m0 12v2M2 10h2m12 0h2M4.3 4.3l1.4 1.4m8.6 8.6 1.4 1.4m0-11.4-1.4 1.4m-8.6 8.6-1.4 1.4"
            />
          </svg>
          Appearance
        </button>
        <a class="nav-item" href="#settings">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="3" />
            <path
              d="m16 11.5 1 1.7-2 2-1.7-1A6 6 0 0 1 12 15l-.5 2h-3L8 15a6 6 0 0 1-1.3-.8l-1.7 1-2-2 1-1.7A6 6 0 0 1 3.5 10L2 9.5v-3L3.5 6a6 6 0 0 1 .8-1.3l-1-1.7 2-2 1.7 1A6 6 0 0 1 8.5 1l.5-2h3l.5 2a6 6 0 0 1 1.3.8l1.7-1 2 2-1 1.7a6 6 0 0 1 .8 1.3l1.5.5v3L17.5 10a6 6 0 0 1-1.5 1.5Z"
              transform="translate(0 2)"
            />
          </svg>
          Settings
        </a>
      </nav>

      <div class="sidebar-bottom">
        <div class="upgrade-card">
          <span class="upgrade-icon">✦</span>
          <strong>Stay ahead of risk</strong>
          <p>Keep your attack surface in view with continuous monitoring.</p>
          <a href="#assets">Explore assets <span aria-hidden="true">→</span></a>
        </div>
        <button
          class="profile-button"
          type="button"
          @click="showToast('Account menu is not connected in this preview.')"
        >
          <span class="profile-avatar">AC</span>
          <span class="profile-copy"
            ><strong>Alex Carter</strong><span>Security analyst</span></span
          >
          <svg class="more-icon" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="4" cy="10" r="1" />
            <circle cx="10" cy="10" r="1" />
            <circle cx="16" cy="10" r="1" />
          </svg>
        </button>
      </div>
    </aside>

    <main id="overview" class="main-content">
      <header class="topbar">
        <div class="breadcrumbs">
          <span>Workspace</span><span class="breadcrumb-slash">/</span
          ><strong>Overview</strong>
        </div>
        <div class="topbar-actions">
          <span class="environment-pill"><span></span> Demo environment</span>
          <button
            class="icon-button notification-button"
            type="button"
            aria-label="Notifications"
            @click="showToast('You’re all caught up.')"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M15 8a5 5 0 0 0-10 0c0 6-2 6-2 7h14c0-1-2-1-2-7m-7 9h4"
              />
            </svg>
            <span class="notification-dot"></span>
          </button>
          <button
            class="help-button"
            type="button"
            @click="showToast('Help center is not connected in this preview.')"
          >
            ?
          </button>
        </div>
      </header>

      <div class="page-wrap">
        <section class="page-heading">
          <div>
            <div class="eyebrow">
              <span class="live-indicator"></span> SECURITY POSTURE
            </div>
            <h1>
              Good morning, Alex <span class="wave" aria-hidden="true">✦</span>
            </h1>
            <p class="page-subtitle">
              Here’s what’s happening across your attack surface today.
            </p>
          </div>
          <button
            class="primary-button"
            type="button"
            @click="isScanDialogOpen = true"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 4v12M4 10h12" />
            </svg>
            Configure scan
          </button>
        </section>

        <div v-if="previewVisible" class="preview-banner" role="note">
          <span class="preview-banner-icon">i</span>
          <span
            ><strong>Interactive preview</strong> — findings and scan activity
            below are sample data.</span
          >
          <button
            type="button"
            aria-label="Dismiss preview note"
            @click="dismissPreview"
          >
            ×
          </button>
        </div>

        <section class="metrics-grid" aria-label="Security summary">
          <article class="metric-card">
            <div class="metric-top">
              <span>Total findings</span
              ><span class="metric-icon metric-icon-red"
                ><svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 3 18 17H2L10 3Z" />
                  <path d="M10 8v4m0 2v.1" /></svg
              ></span>
            </div>
            <div class="metric-value">
              18 <span class="metric-change change-negative">+3</span>
            </div>
            <p><span class="metric-muted">compared to last week</span></p>
            <div class="mini-bars" aria-hidden="true">
              <i style="height: 30%"></i><i style="height: 45%"></i
              ><i style="height: 38%"></i><i style="height: 56%"></i
              ><i style="height: 48%"></i><i style="height: 65%"></i
              ><i style="height: 80%"></i><i style="height: 61%"></i
              ><i style="height: 72%"></i><i style="height: 91%"></i
              ><i style="height: 75%"></i><i style="height: 100%"></i>
            </div>
          </article>
          <article class="metric-card">
            <div class="metric-top">
              <span>Critical &amp; high</span
              ><span class="metric-icon metric-icon-orange"
                ><svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 3 18 17H2L10 3Z" />
                  <path d="M10 8v4m0 2v.1" /></svg
              ></span>
            </div>
            <div class="metric-value">
              11 <span class="metric-change change-positive">−2</span>
            </div>
            <p><span class="metric-muted">compared to last week</span></p>
            <div class="metric-progress"><span style="width: 61%"></span></div>
            <div class="progress-caption">
              <span>61% of all findings</span><span>11 / 18</span>
            </div>
          </article>
          <article class="metric-card">
            <div class="metric-top">
              <span>Monitored assets</span
              ><span class="metric-icon metric-icon-blue"
                ><svg viewBox="0 0 20 20" aria-hidden="true">
                  <rect x="3" y="4" width="14" height="12" rx="2" />
                  <path d="M7 8h6m-6 4h3" /></svg
              ></span>
            </div>
            <div class="metric-value">
              06 <span class="metric-change change-neutral">+1</span>
            </div>
            <p><span class="metric-muted">across 3 environments</span></p>
            <div
              class="asset-stack"
              aria-label="Production, staging, and development environments"
            >
              <span class="stack-avatar stack-a">A</span
              ><span class="stack-avatar stack-b">S</span
              ><span class="stack-avatar stack-c">D</span
              ><span class="stack-label">3 environments</span>
            </div>
          </article>
          <article class="metric-card">
            <div class="metric-top">
              <span>Requests analyzed</span
              ><span class="metric-icon metric-icon-green"
                ><svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M3 10h3l2-5 4 10 2-5h3" /></svg
              ></span>
            </div>
            <div class="metric-value">
              2,418 <span class="metric-change change-positive">+12%</span>
            </div>
            <p><span class="metric-muted">over the last 7 days</span></p>
            <div class="sparkline" aria-hidden="true">
              <svg viewBox="0 0 180 32" preserveAspectRatio="none">
                <path
                  class="sparkline-fill"
                  d="M0 27 15 23 30 25 45 15 60 19 75 12 90 17 105 8 120 13 135 5 150 11 165 3 180 6V32H0Z"
                />
                <path
                  class="sparkline-line"
                  d="M0 27 15 23 30 25 45 15 60 19 75 12 90 17 105 8 120 13 135 5 150 11 165 3 180 6"
                />
              </svg>
            </div>
          </article>
        </section>

        <section class="overview-grid">
          <article id="activity" class="panel activity-panel">
            <div class="panel-heading">
              <div>
                <h2>Scan activity</h2>
                <p>Findings discovered over time</p>
              </div>
              <button
                class="select-button"
                type="button"
                @click="showToast('Showing the last 7 days.')"
              >
                Last 7 days
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 6 4 4 4-4" />
                </svg>
              </button>
            </div>
            <div class="chart-legend">
              <span><i class="legend-dot dot-critical"></i>Critical</span
              ><span><i class="legend-dot dot-high"></i>High</span
              ><span><i class="legend-dot dot-medium"></i>Medium</span
              ><span><i class="legend-dot dot-low"></i>Low</span>
            </div>
            <div
              class="chart-area"
              aria-label="Stacked bar chart of findings from Monday through Sunday"
            >
              <div class="chart-y-labels">
                <span>12</span><span>9</span><span>6</span><span>3</span
                ><span>0</span>
              </div>
              <div class="chart-plot">
                <div class="chart-gridlines">
                  <i></i><i></i><i></i><i></i><i></i>
                </div>
                <div class="chart-bars">
                  <div class="chart-column">
                    <span class="bar bar-critical" style="height: 9%"></span
                    ><span class="bar bar-high" style="height: 22%"></span
                    ><span class="bar bar-medium" style="height: 17%"></span
                    ><span class="bar bar-low" style="height: 9%"></span>
                  </div>
                  <div class="chart-column">
                    <span class="bar bar-critical" style="height: 17%"></span
                    ><span class="bar bar-high" style="height: 26%"></span
                    ><span class="bar bar-medium" style="height: 17%"></span>
                  </div>
                  <div class="chart-column">
                    <span class="bar bar-high" style="height: 17%"></span
                    ><span class="bar bar-medium" style="height: 26%"></span
                    ><span class="bar bar-low" style="height: 9%"></span>
                  </div>
                  <div class="chart-column">
                    <span class="bar bar-critical" style="height: 9%"></span
                    ><span class="bar bar-high" style="height: 35%"></span
                    ><span class="bar bar-medium" style="height: 17%"></span>
                  </div>
                  <div class="chart-column">
                    <span class="bar bar-critical" style="height: 17%"></span
                    ><span class="bar bar-high" style="height: 26%"></span
                    ><span class="bar bar-medium" style="height: 26%"></span
                    ><span class="bar bar-low" style="height: 9%"></span>
                  </div>
                  <div class="chart-column">
                    <span class="bar bar-high" style="height: 26%"></span
                    ><span class="bar bar-medium" style="height: 35%"></span>
                  </div>
                  <div class="chart-column is-current">
                    <span class="bar bar-critical" style="height: 26%"></span
                    ><span class="bar bar-high" style="height: 35%"></span
                    ><span class="bar bar-medium" style="height: 26%"></span
                    ><span class="bar bar-low" style="height: 9%"></span>
                  </div>
                </div>
                <div class="chart-x-labels">
                  <span>Mon</span><span>Tue</span><span>Wed</span
                  ><span>Thu</span><span>Fri</span><span>Sat</span
                  ><span>Sun</span>
                </div>
              </div>
            </div>
          </article>

          <article id="assets" class="panel posture-panel">
            <div class="panel-heading">
              <div>
                <h2>Risk overview</h2>
                <p>Across all monitored assets</p>
              </div>
              <button
                class="more-button"
                type="button"
                aria-label="More risk overview options"
                @click="
                  showToast(
                    'More risk overview options are not available in this preview.',
                  )
                "
              >
                ···
              </button>
            </div>
            <div class="risk-content">
              <div
                class="risk-ring"
                role="img"
                aria-label="Risk score 72 out of 100"
              >
                <div><strong>72</strong><span>of 100</span></div>
              </div>
              <div class="risk-copy">
                <span class="risk-label">Elevated risk</span>
                <p>
                  Your security posture needs attention. Resolve critical
                  findings to improve your score.
                </p>
                <a href="#findings"
                  >View priority findings <span aria-hidden="true">→</span></a
                >
              </div>
            </div>
            <div class="risk-divider"></div>
            <div class="risk-breakdown">
              <div>
                <span class="breakdown-dot dot-critical"></span>Critical
                <strong>4</strong>
              </div>
              <div>
                <span class="breakdown-dot dot-high"></span>High
                <strong>7</strong>
              </div>
              <div>
                <span class="breakdown-dot dot-medium"></span>Medium
                <strong>5</strong>
              </div>
              <div>
                <span class="breakdown-dot dot-low"></span>Low
                <strong>2</strong>
              </div>
            </div>
          </article>
        </section>

        <section id="findings" class="panel findings-panel">
          <div class="panel-heading findings-heading">
            <div>
              <div class="heading-with-count">
                <h2>Recent findings</h2>
                <span class="total-pill">18</span>
              </div>
              <p>Prioritize and review issues across your assets</p>
            </div>
            <div class="finding-actions">
              <label class="search-box">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="8.5" cy="8.5" r="5.5" />
                  <path d="m13 13 4 4" />
                </svg>
                <input
                  v-model="search"
                  type="search"
                  aria-label="Search findings"
                  placeholder="Search findings..."
                />
                <kbd>/</kbd>
              </label>
              <button
                class="secondary-button"
                type="button"
                @click="exportFindings"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 3v9m0 0 3-3m-3 3L7 9M4 14v3h12v-3" />
                </svg>
                Export
              </button>
            </div>
          </div>
          <div
            class="filter-row"
            role="group"
            aria-label="Filter findings by severity"
          >
            <button
              v-for="severity in severityFilters"
              :key="severity"
              class="filter-chip"
              :class="{ 'filter-active': filter === severity }"
              type="button"
              @click="filter = severity"
            >
              {{ severity }}
              <span>{{
                severity === "All"
                  ? 18
                  : severity === "Critical"
                    ? 4
                    : severity === "High"
                      ? 7
                      : severity === "Medium"
                        ? 5
                        : 2
              }}</span>
            </button>
          </div>
          <div class="findings-table-wrap">
            <table class="findings-table">
              <thead>
                <tr>
                  <th scope="col">FINDING</th>
                  <th scope="col">SEVERITY</th>
                  <th scope="col">ASSET</th>
                  <th scope="col">CATEGORY</th>
                  <th scope="col">DETECTED</th>
                  <th scope="col"><span class="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="finding in visibleFindings"
                  :key="finding.id"
                  :class="{
                    'row-selected': selectedFinding?.id === finding.id,
                  }"
                  @click="selectFinding(finding)"
                >
                  <td>
                    <div class="finding-title">{{ finding.title }}</div>
                    <div class="finding-id">
                      {{ finding.id }} <span>·</span> {{ finding.path }}
                    </div>
                  </td>
                  <td>
                    <span
                      class="severity-badge"
                      :class="`severity-${finding.severity.toLowerCase()}`"
                      ><i></i>{{ finding.severity }}</span
                    >
                  </td>
                  <td>
                    <span class="asset-cell"
                      ><span class="asset-favicon">{{
                        finding.asset.charAt(0).toUpperCase()
                      }}</span
                      >{{ finding.asset }}</span
                    >
                  </td>
                  <td>
                    <span class="category-cell">{{ finding.category }}</span>
                  </td>
                  <td>
                    <span class="detected-cell">{{ finding.discovered }}</span>
                  </td>
                  <td>
                    <button
                      class="row-more"
                      type="button"
                      :aria-label="`View ${finding.title}`"
                      @click.stop="selectFinding(finding)"
                    >
                      ···
                    </button>
                  </td>
                </tr>
                <tr v-if="visibleFindings.length === 0">
                  <td class="empty-state" colspan="6">
                    No findings match your search.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="table-footer">
            <span
              >Showing <strong>{{ visibleFindings.length }}</strong> of
              <strong>18</strong> findings</span
            ><button
              type="button"
              @click="
                filter = 'All';
                search = '';
              "
            >
              View all findings <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        <footer class="page-footer">
          <span
            >ThreatMap <span class="footer-separator">·</span> Security, in
            focus.</span
          ><span
            >Sample workspace <span class="footer-separator">·</span> Updated
            just now</span
          >
        </footer>
      </div>
    </main>

    <Transition name="slide">
      <aside
        v-if="selectedFinding"
        class="detail-panel"
        aria-label="Finding details"
      >
        <div class="detail-top">
          <span class="detail-overline">FINDING DETAILS</span
          ><button
            class="icon-button close-detail"
            type="button"
            aria-label="Close details"
            @click="selectedFinding = null"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        </div>
        <div class="detail-content">
          <span
            class="severity-badge"
            :class="`severity-${selectedFinding.severity.toLowerCase()}`"
            ><i></i>{{ selectedFinding.severity }} severity</span
          >
          <h2>{{ selectedFinding.title }}</h2>
          <p class="detail-id">
            {{ selectedFinding.id }} <span>·</span>
            {{ selectedFinding.discovered }}
          </p>
          <div class="detail-divider"></div>
          <div class="detail-field">
            <span>ASSET</span
            ><strong
              ><span class="asset-favicon">{{
                selectedFinding.asset.charAt(0).toUpperCase()
              }}</span
              >{{ selectedFinding.asset }}</strong
            >
          </div>
          <div class="detail-field">
            <span>PATH</span
            ><strong class="mono">{{ selectedFinding.path }}</strong>
          </div>
          <div class="detail-field">
            <span>CATEGORY</span><strong>{{ selectedFinding.category }}</strong>
          </div>
          <div class="detail-section">
            <h3>What we found</h3>
            <p>{{ selectedFinding.description }}</p>
          </div>
          <div class="evidence-card">
            <div>
              <span class="evidence-icon">⌘</span><strong>Evidence</strong>
            </div>
            <code>{{ selectedFinding.evidence }}</code>
          </div>
          <div class="detail-recommendation">
            <span class="recommendation-icon">✦</span>
            <div>
              <strong>Recommended action</strong>
              <p>
                Review this issue with your application team and verify the fix
                in a follow-up scan.
              </p>
            </div>
          </div>
        </div>
        <div class="detail-actions">
          <button
            class="primary-button detail-primary"
            type="button"
            @click="
              showToast(
                'Finding status updates are not connected in this preview.',
              )
            "
          >
            Mark as resolved</button
          ><button
            class="secondary-button detail-secondary"
            type="button"
            @click="showToast('Finding has been added to your review queue.')"
          >
            Add to review queue
          </button>
        </div>
      </aside>
    </Transition>

    <div
      v-if="isScanDialogOpen"
      class="modal-backdrop"
      @click.self="isScanDialogOpen = false"
    >
      <section
        class="scan-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-dialog-title"
      >
        <div class="dialog-heading">
          <span class="dialog-icon"
            ><svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3 10a7 7 0 0 1 12-5l2 2" />
              <path d="M17 3v4h-4M17 10a7 7 0 0 1-12 5l-2-2" />
              <path d="M3 17v-4h4" /></svg></span
          ><button
            class="icon-button"
            type="button"
            aria-label="Close dialog"
            @click="isScanDialogOpen = false"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        </div>
        <h2 id="scan-dialog-title">Configure a scan</h2>
        <p class="dialog-description">
          Choose an asset to include in your next security review.
        </p>
        <label class="field-label" for="scan-target">Target URL</label>
        <input
          id="scan-target"
          v-model="target"
          class="target-input"
          type="url"
          placeholder="https://example.com"
        />
        <div class="scan-mode-label">SCAN MODE</div>
        <label class="scan-mode-option"
          ><input type="radio" name="scan-mode" checked /><span
            ><strong>Passive checks</strong
            ><small
              >Analyze captured traffic without sending additional
              requests.</small
            ></span
          ><span class="mode-tag">SAFE</span></label
        >
        <label class="scan-mode-option"
          ><input type="radio" name="scan-mode" /><span
            ><strong>Active checks</strong
            ><small>Probe the target for common security issues.</small></span
          ><span class="mode-tag mode-tag-muted">PREVIEW</span></label
        >
        <p class="dialog-preview-note">
          This preview does not connect to a scanner. No requests will be sent
          to the target.
        </p>
        <div class="dialog-actions">
          <button
            class="secondary-button"
            type="button"
            @click="isScanDialogOpen = false"
          >
            Cancel</button
          ><button
            class="primary-button"
            type="button"
            :disabled="!target.trim()"
            @click="saveScanConfiguration"
          >
            Save configuration <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
    </div>

    <Transition name="toast"
      ><div v-if="toastMessage" class="toast-message" role="status">
        <span class="toast-check">✓</span>{{ toastMessage }}
      </div></Transition
    >
  </div>
</template>
