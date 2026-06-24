"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Server, Database, Cpu, Network, Cloud,
  CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw,
  Terminal, Shield, HardDrive, Zap, Eye, EyeOff,
  ChevronDown, ChevronRight, Copy, Check, Info,
  Workflow, Package, Key, Globe
} from "lucide-react";
import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus = "online" | "offline" | "degraded" | "not_configured" | "not_required" | "warning" | "error" | "connected" | "running";

interface DiagnosticsReport {
  overall_status: "healthy" | "degraded" | "critical";
  audit_timestamp: string;
  audit_duration_ms: number;
  platform: { name: string; version: string; environment: string };
  services: Record<string, {
    status: string;
    description: string;
    endpoint?: string;
    latency_ms?: number;
    error?: string | null;
    system_stats?: any;
    path?: string;
    polling_interval_s?: number;
    concurrency_limit?: number;
    is_running?: boolean;
    active_jobs?: number;
  }>;
  external_providers: Record<string, {
    status: string;
    note?: string;
    api_key_present?: boolean;
  }>;
  database_detail: {
    connectivity: { status: string; latency_ms: number; error?: string | null };
    schema_check: {
      tables: Record<string, { expected: boolean; exists: boolean; model: string }>;
      all_tables_exist: boolean;
    };
    record_counts: Record<string, number>;
  };
  orm_contract: {
    request_fields: string[];
    orm_fields: string[];
    unmapped_request_fields: string[];
    dangerous_unmapped_fields: string[];
    contract_ok: boolean;
    notes: string;
  };
  configuration: {
    env_vars: {
      vars: { name: string; present: boolean; required: boolean; optional: boolean; value_hint: string }[];
      missing_required: string[];
      all_required_present: boolean;
    };
    storage: {
      directories: Record<string, { path: string; exists: boolean; writable: boolean }>;
      all_ok: boolean;
    };
    python_deps: {
      packages: Record<string, { installed: boolean; version?: string; error?: string }>;
      all_required_installed: boolean;
    };
  };
  workflow_engine: {
    total_workflows: number;
    active_workflows: number;
    total_versions: number;
    registry_populated: boolean;
    error?: string;
  };
  issues: { severity: string; service: string; message: string }[];
  remediation_steps: string[];
  issue_count: number;
  critical_count: number;
  warning_count: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function fetchDiagnostics(): Promise<DiagnosticsReport> {
  const res = await fetch(`${API_URL}/api/v1/diagnostics/`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

async function runDryRun(): Promise<any> {
  const res = await fetch(`${API_URL}/api/v1/diagnostics/test-generation`, {
    method: "POST",
    cache: "no-store",
  });
  return res.json();
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function getStatusColor(status: string) {
  switch (status) {
    case "online": case "connected": case "running": case "healthy":
      return "text-emerald-400";
    case "offline": case "error": case "critical":
      return "text-red-400";
    case "degraded": case "warning":
      return "text-amber-400";
    case "not_configured": case "not_required":
      return "text-slate-400";
    default:
      return "text-slate-400";
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case "online": case "connected": case "running": case "healthy":
      return "bg-emerald-500/10 border-emerald-500/20";
    case "offline": case "error": case "critical":
      return "bg-red-500/10 border-red-500/20";
    case "degraded": case "warning":
      return "bg-amber-500/10 border-amber-500/20";
    default:
      return "bg-slate-500/10 border-slate-500/20";
  }
}

function getStatusIcon(status: string, size = "w-4 h-4") {
  const cls = cn(size, getStatusColor(status));
  switch (status) {
    case "online": case "connected": case "running": case "healthy":
      return <CheckCircle2 className={cls} />;
    case "offline": case "error": case "critical":
      return <XCircle className={cls} />;
    case "degraded": case "warning":
      return <AlertTriangle className={cls} />;
    default:
      return <Info className={cls} />;
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusPill({ status, label }: { status: string; label?: string }) {
  const text = label ?? status.replace(/_/g, " ").toUpperCase();
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest border",
      getStatusBg(status),
      getStatusColor(status),
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", {
        "bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite]": ["online","connected","running","healthy"].includes(status),
        "bg-red-400 animate-pulse": ["offline","error","critical"].includes(status),
        "bg-amber-400": ["degraded","warning"].includes(status),
        "bg-slate-400": !["online","connected","running","healthy","offline","error","critical","degraded","warning"].includes(status),
      })} />
      {text}
    </span>
  );
}

function ServiceCard({
  icon,
  title,
  subtitle,
  status,
  extra,
  error,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  status: string;
  extra?: React.ReactNode;
  error?: string | null;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border p-4 transition-all duration-200",
        ["offline","error","critical"].includes(status)
          ? "border-red-500/30 bg-red-500/5"
          : ["degraded","warning"].includes(status)
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-white/8 bg-white/3 hover:bg-white/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
            ["offline","error","critical"].includes(status) ? "bg-red-500/15" :
            ["degraded","warning"].includes(status) ? "bg-amber-500/15" :
            "bg-white/8"
          )}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white leading-tight">{title}</div>
            {subtitle && <div className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusPill status={status} />
          {(extra || children) && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 ml-12 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs font-mono text-red-300 break-words leading-relaxed">{error}</p>
        </div>
      )}

      {extra && <div className="mt-3 ml-12">{extra}</div>}

      {children && expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 ml-12"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

function MetricRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={cn("text-xs text-white/80", mono && "font-mono")}>{value}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-slate-500">{icon}</div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h2>
        <div className="flex-1 h-px bg-white/5" />
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DiagnosticsPage() {
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDiagnostics();
      setReport(data);
      setLastFetch(new Date());
    } catch (e: any) {
      setError(e.message ?? "Failed to connect to backend API");
    } finally {
      setLoading(false);
    }
  }, []);

  const runTest = async () => {
    setDryRunLoading(true);
    try {
      const res = await runDryRun();
      setDryRunResult(res);
    } catch (e: any) {
      setDryRunResult({ status: "error", message: e.message });
    } finally {
      setDryRunLoading(false);
    }
  };

  useEffect(() => { runAudit(); }, [runAudit]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(runAudit, 15000);
    return () => clearInterval(t);
  }, [autoRefresh, runAudit]);

  const overallStatus = report?.overall_status ?? (error ? "critical" : "degraded");

  return (
    <div className="min-h-screen bg-[#080d12] text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
                System Diagnostics
              </h1>
            </div>
            <p className="text-sm text-slate-400 ml-13">
              Complete connectivity audit — every service, API, and integration
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(v => !v)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                autoRefresh
                  ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              {autoRefresh ? "Auto 15s" : "Auto Off"}
            </button>

            {/* Dry run */}
            <button
              onClick={runTest}
              disabled={dryRunLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-purple-500/15 border border-purple-500/30 text-purple-400 hover:bg-purple-500/25 transition-all disabled:opacity-50"
            >
              <Terminal className={cn("w-3.5 h-3.5", dryRunLoading && "animate-pulse")} />
              Dry-Run Test
            </button>

            {/* Refresh */}
            <button
              onClick={runAudit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              {loading ? "Auditing…" : "Run Audit"}
            </button>
          </div>
        </div>

        {/* ── API connection error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
            >
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-red-300">Cannot reach backend API</div>
                <div className="text-xs text-red-400/80 mt-1 font-mono">{error}</div>
                <div className="text-xs text-slate-400 mt-2">
                  Ensure the FastAPI backend is running:{" "}
                  <code className="bg-white/10 px-1 rounded">python -m uvicorn backend.main:app --port 8000</code>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Overall status banner ── */}
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mb-6 p-5 rounded-2xl border flex items-center justify-between gap-4",
              overallStatus === "healthy"
                ? "bg-emerald-500/8 border-emerald-500/25"
                : overallStatus === "critical"
                ? "bg-red-500/8 border-red-500/25"
                : "bg-amber-500/8 border-amber-500/25"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                overallStatus === "healthy" ? "bg-emerald-500/15" :
                overallStatus === "critical" ? "bg-red-500/15" : "bg-amber-500/15"
              )}>
                {overallStatus === "healthy" ? "✅" : overallStatus === "critical" ? "🚨" : "⚠️"}
              </div>
              <div>
                <div className="text-base font-bold text-white capitalize">
                  Platform {overallStatus === "healthy" ? "Healthy" : overallStatus === "critical" ? "Critical Issues" : "Degraded"}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {report.issue_count} issue{report.issue_count !== 1 ? "s" : ""} detected
                  {report.critical_count > 0 && ` · ${report.critical_count} critical`}
                  {report.warning_count > 0 && ` · ${report.warning_count} warnings`}
                  {" · "}{report.audit_duration_ms}ms audit
                </div>
              </div>
            </div>
            <div className="text-right">
              <StatusPill status={overallStatus} />
              {lastFetch && (
                <div className="text-[10px] text-slate-500 mt-1.5">
                  {lastFetch.toLocaleTimeString()}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Stat cards ── */}
        {report && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Workflows", value: report.workflow_engine.total_workflows, icon: <Workflow className="w-4 h-4" />, color: "cyan" },
              { label: "Generations", value: report.database_detail.record_counts.generations ?? "—", icon: <Zap className="w-4 h-4" />, color: "purple" },
              { label: "DB Tables", value: `${Object.values(report.database_detail.schema_check.tables ?? {}).filter(t => t.exists).length}/${Object.keys(report.database_detail.schema_check.tables ?? {}).length}`, icon: <Database className="w-4 h-4" />, color: "blue" },
              { label: "Issues", value: report.issue_count, icon: <AlertTriangle className="w-4 h-4" />, color: report.issue_count > 0 ? "red" : "green" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="p-4 rounded-xl bg-white/3 border border-white/8 hover:bg-white/5 transition-colors">
                <div className={`text-${color}-400 mb-2`}>{icon}</div>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {report && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── LEFT COLUMN ── */}
            <div className="space-y-6">

              {/* Core Services */}
              <Section title="Core Services" icon={<Server className="w-4 h-4" />}>
                {Object.entries(report.services).map(([key, svc]) => (
                  <ServiceCard
                    key={key}
                    icon={
                      key === "database" ? <Database className="w-4 h-4 text-blue-400" /> :
                      key === "comfyui" ? <Cpu className="w-4 h-4 text-purple-400" /> :
                      key === "websocket" ? <Network className="w-4 h-4 text-cyan-400" /> :
                      key === "generation_worker" ? <Zap className="w-4 h-4 text-amber-400" /> :
                      <Server className="w-4 h-4 text-slate-400" />
                    }
                    title={svc.description}
                    subtitle={svc.endpoint ?? svc.path}
                    status={svc.status}
                    error={svc.error}
                    extra={
                      svc.latency_ms !== undefined ? (
                        <MetricRow label="Latency" value={`${svc.latency_ms} ms`} mono />
                      ) : undefined
                    }
                  >
                    {svc.system_stats && (
                      <div className="space-y-1">
                        <MetricRow label="ComfyUI Build" value={svc.system_stats?.system?.comfyui_version ?? "—"} />
                        <MetricRow label="Python" value={svc.system_stats?.system?.python_version ?? "—"} />
                        <MetricRow label="PyTorch" value={svc.system_stats?.system?.pytorch_version ?? "—"} />
                      </div>
                    )}
                    {svc.concurrency_limit !== undefined && (
                      <div className="space-y-1">
                        <MetricRow label="Active Jobs" value={svc.active_jobs ?? 0} />
                        <MetricRow label="Concurrency Limit" value={svc.concurrency_limit} />
                        <MetricRow label="Poll Interval" value={`${svc.polling_interval_s}s`} />
                      </div>
                    )}
                  </ServiceCard>
                ))}
              </Section>

              {/* ORM Contract */}
              <Section title="ORM Contract Audit" icon={<Shield className="w-4 h-4" />}>
                <ServiceCard
                  icon={<Shield className={cn("w-4 h-4", report.orm_contract.contract_ok ? "text-emerald-400" : "text-red-400")} />}
                  title="Generation ORM Contract"
                  subtitle="GenerationCreateRequest ↔ Generation model"
                  status={report.orm_contract.contract_ok ? "online" : "error"}
                  error={
                    !report.orm_contract.contract_ok
                      ? `Dangerous unmapped fields: ${report.orm_contract.dangerous_unmapped_fields.join(", ")}`
                      : null
                  }
                >
                  <div className="space-y-1.5">
                    <MetricRow label="Request fields" value={report.orm_contract.request_fields.length} />
                    <MetricRow label="ORM columns" value={report.orm_contract.orm_fields.length} />
                    <MetricRow
                      label="Unmapped (stripped)"
                      value={report.orm_contract.unmapped_request_fields.join(", ") || "None"}
                      mono
                    />
                    <div className="mt-2 p-2 rounded bg-white/5 text-[10px] text-slate-400 leading-relaxed">
                      {report.orm_contract.notes}
                    </div>
                  </div>
                </ServiceCard>
              </Section>

              {/* Workflow Engine */}
              <Section title="Workflow Engine" icon={<Workflow className="w-4 h-4" />}>
                <ServiceCard
                  icon={<Workflow className="w-4 h-4 text-cyan-400" />}
                  title="Workflow Registry"
                  subtitle="ComfyUI workflow definitions"
                  status={report.workflow_engine.registry_populated ? "online" : "warning"}
                  error={report.workflow_engine.error}
                >
                  <div className="space-y-1">
                    <MetricRow label="Total Workflows" value={report.workflow_engine.total_workflows} />
                    <MetricRow label="Active Workflows" value={report.workflow_engine.active_workflows} />
                    <MetricRow label="Total Versions" value={report.workflow_engine.total_versions} />
                  </div>
                </ServiceCard>
              </Section>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="space-y-6">

              {/* Execution Pipeline */}
              <Section title="Execution Pipeline" icon={<Cpu className="w-4 h-4" />}>
                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-white">ComfyUI Engine</span>
                    </div>
                    <StatusPill status={report.services.comfyui.status} />
                  </div>
                  
                  <div className="space-y-2">
                    <MetricRow label="Latency" value={`${report.services.comfyui.latency_ms ?? 0} ms`} mono />
                    <MetricRow label="Queue Length" value={report.services.comfyui.active_jobs ?? 0} mono />
                    <MetricRow label="ComfyUI Build" value={report.services.comfyui.system_stats?.system?.comfyui_version ?? "—"} />
                    
                    {report.services.comfyui.system_stats?.devices?.map((dev: any, i: number) => (
                      <div key={i} className="mt-3 p-3 rounded-lg bg-black/40 border border-white/5">
                        <div className="text-xs font-semibold text-purple-300 mb-2 truncate" title={dev.name}>{dev.name}</div>
                        <MetricRow label="Type" value={dev.type} />
                        <MetricRow 
                          label="VRAM Free" 
                          value={`${((dev.vram_free ?? 0) / (1024*1024*1024)).toFixed(2)} GB / ${((dev.vram_total ?? 0) / (1024*1024*1024)).toFixed(2)} GB`} 
                          mono 
                        />
                      </div>
                    ))}
                    {!report.services.comfyui.system_stats?.devices && (
                       <MetricRow label="GPU Availability" value="Unknown (Check logs)" />
                    )}
                  </div>
                </div>
              </Section>

              {/* External Providers */}
              <Section title="External AI Providers" icon={<Cloud className="w-4 h-4" />}>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(report.external_providers).map(([key, prov]) => (
                    <div key={key} className="p-3 rounded-lg bg-white/3 border border-white/8">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-white/70 capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        {prov.api_key_present !== undefined && (
                          <Key className={cn("w-3 h-3", prov.api_key_present ? "text-emerald-400" : "text-slate-600")} />
                        )}
                      </div>
                      <StatusPill
                        status={prov.status}
                        label={
                          prov.status === "not_configured" ? "NO KEY" :
                          prov.status === "not_required" ? "N/A" :
                          prov.status.toUpperCase()
                        }
                      />
                      {prov.note && (
                        <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">{prov.note}</p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-2 bg-white/3 border border-white/8 p-2.5 rounded-lg">
                  💡 This is a <strong>local ComfyUI platform</strong>. No external AI provider API keys are required.
                  All inference runs locally via ComfyUI.
                </p>
              </Section>

              {/* Database Schema */}
              <Section title="Database Schema" icon={<Database className="w-4 h-4" />}>
                <div className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-white/8 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">Table Existence</span>
                    <StatusPill
                      status={report.database_detail.schema_check.all_tables_exist ? "online" : "error"}
                      label={report.database_detail.schema_check.all_tables_exist ? "ALL PRESENT" : "MISSING TABLES"}
                    />
                  </div>
                  <div className="divide-y divide-white/5">
                    {Object.entries(report.database_detail.schema_check.tables ?? {}).map(([tbl, info]) => (
                      <div key={tbl} className="flex items-center justify-between px-4 py-2">
                        <div>
                          <div className="text-xs font-mono text-white/80">{tbl}</div>
                          <div className="text-[10px] text-slate-500">{info.model}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">
                            {(report.database_detail.record_counts[tbl] ?? 0).toLocaleString()} rows
                          </span>
                          {info.exists
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            : <XCircle className="w-3.5 h-3.5 text-red-400" />
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>

              {/* Environment Variables */}
              <Section title="Environment Variables" icon={<Key className="w-4 h-4" />}>
                <div className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-white/8 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">Configuration</span>
                    <StatusPill
                      status={report.configuration.env_vars.all_required_present ? "online" : "warning"}
                      label={report.configuration.env_vars.all_required_present ? "ALL SET" : "MISSING VARS"}
                    />
                  </div>
                  <div className="divide-y divide-white/5 max-h-52 overflow-y-auto">
                    {report.configuration.env_vars.vars.map(v => (
                      <div key={v.name} className="flex items-center justify-between px-4 py-2">
                        <div>
                          <div className="text-[10px] font-mono text-white/80">{v.name}</div>
                          {v.optional && (
                            <div className="text-[9px] text-slate-500">optional</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {v.present && (
                            <span className="text-[9px] font-mono text-slate-500">{v.value_hint}</span>
                          )}
                          {v.present
                            ? <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            : v.required
                            ? <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                            : <span className="w-3 h-3 rounded-full bg-slate-700 flex-shrink-0 inline-block" />
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>

              {/* Storage */}
              <Section title="Storage & File System" icon={<HardDrive className="w-4 h-4" />}>
                <div className="space-y-2">
                  {Object.entries(report.configuration.storage.directories).map(([key, dir]) => (
                    <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/8">
                      <HardDrive className={cn("w-4 h-4 flex-shrink-0",
                        dir.exists && dir.writable ? "text-emerald-400" : "text-red-400")} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white">{key}</div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">{dir.path}</div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {dir.exists
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                        {dir.writable
                          ? <span className="text-[9px] text-emerald-400">RW</span>
                          : <span className="text-[9px] text-red-400">RO</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

            </div>
          </div>
        )}

        {/* ── Issues & Remediation ── */}
        {report && report.issues.length > 0 && (
          <div className="mt-6">
            <Section title="Issues & Remediation Steps" icon={<AlertTriangle className="w-4 h-4" />}>
              <div className="space-y-3">
                {report.issues.map((issue, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "p-4 rounded-xl border flex items-start gap-3",
                      issue.severity === "critical"
                        ? "bg-red-500/8 border-red-500/25"
                        : "bg-amber-500/8 border-amber-500/25"
                    )}
                  >
                    {issue.severity === "critical"
                      ? <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      : <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xs font-bold uppercase tracking-wider",
                          issue.severity === "critical" ? "text-red-400" : "text-amber-400"
                        )}>
                          {issue.severity}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-300 font-medium">{issue.service}</span>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed">{issue.message}</p>
                      {report.remediation_steps[i] && (
                        <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/8">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] text-slate-300 leading-relaxed flex-1">
                              🔧 {report.remediation_steps[i]}
                            </p>
                            <CopyButton text={report.remediation_steps[i]} />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── Dry-run result ── */}
        <AnimatePresence>
          {dryRunResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6"
            >
              <Section title="Generation Pipeline Dry-Run" icon={<Terminal className="w-4 h-4" />}>
                <div className={cn(
                  "p-5 rounded-xl border",
                  dryRunResult.would_succeed ? "bg-emerald-500/8 border-emerald-500/25" : "bg-red-500/8 border-red-500/25"
                )}>
                  <div className="flex items-center gap-2 mb-4">
                    {dryRunResult.would_succeed
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      : <XCircle className="w-5 h-5 text-red-400" />}
                    <span className={cn("text-sm font-semibold",
                      dryRunResult.would_succeed ? "text-emerald-300" : "text-red-300"
                    )}>
                      {dryRunResult.message}
                    </span>
                  </div>

                  {dryRunResult.stripped_fields?.length > 0 && (
                    <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="text-xs font-semibold text-amber-400 mb-1">Fields stripped before DB insert:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {dryRunResult.stripped_fields.map((f: string) => (
                          <span key={f} className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono rounded">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {dryRunResult.safe_insert_payload && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 mb-2">Safe DB insert payload:</div>
                      <pre className="text-[10px] font-mono text-slate-300 bg-black/30 border border-white/8 rounded-lg p-3 overflow-x-auto leading-relaxed">
                        {JSON.stringify(dryRunResult.safe_insert_payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Python deps ── */}
        {report && (
          <div className="mt-6">
            <Section title="Python Dependencies" icon={<Package className="w-4 h-4" />}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(report.configuration.python_deps.packages).map(([pkg, info]) => (
                  <div key={pkg} className="p-3 rounded-lg bg-white/3 border border-white/8">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-white/80">{pkg}</span>
                      {info.installed
                        ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        : <XCircle className="w-3 h-3 text-red-400" />}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {info.installed ? info.version : "not installed"}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-8 pt-6 border-t border-white/8 flex items-center justify-between text-xs text-slate-500">
          <span>AI Image Generation Platform · System Diagnostics</span>
          {lastFetch && <span>Last audit: {lastFetch.toLocaleString()}</span>}
        </div>
      </div>
    </div>
  );
}
