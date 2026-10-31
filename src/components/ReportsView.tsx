import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  Eye,
  Sliders,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { assets, defects, inspections, priorityWeights, exportDataAsJson, setIsPdfStudioOpen } = useApp();

  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const abauAssets = assets.filter(a => a.district === 'Abau');
  const aromaAssets = assets.filter(a => a.llg === 'Aroma LLG');
  const kupianoAssets = assets.filter(a => a.llg === 'Kupiano LLG');
  const cloudyBayAssets = assets.filter(a => a.llg === 'Cloudy Bay LLG');
  const amazonBayAssets = assets.filter(a => a.llg === 'Amazon Bay LLG');

  const getAvg = (list: typeof assets) =>
    list.length > 0 ? Math.round(list.reduce((s, a) => s + a.conditionScore, 0) / list.length) : 0;

  const abauAvg = getAvg(abauAssets);
  const aromaAvg = getAvg(aromaAssets);
  const kupianoAvg = getAvg(kupianoAssets);
  const cloudyBayAvg = getAvg(cloudyBayAssets);
  const amazonBayAvg = getAvg(amazonBayAssets);

  const totalValueKina = abauAssets.reduce((sum, a) => sum + (a.replacementValueKina || 0), 0);
  const criticalDefects = defects.filter(d => d.district === 'Abau' && (d.severity === 'Critical' || d.severity === 'Severe'));
  const criticalAssets = abauAssets.filter(a => a.conditionClassification === 'Critical' || a.maintenancePriority === 'Critical');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 print:hidden">
        <div>
          <span className="text-[11px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            Abau District Statutory Reporting &bull; Rigo Data Frozen
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Abau District Infrastructure Health & Priority Report
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Executive briefing for Central Province Government leadership, Department of Works & Highways, and Abau District Development Authority.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PRIMARY ACTIVATION: REVIEW & SAVE AS PDF */}
          <button
            onClick={() => setIsPdfStudioOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Review & Save as PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Print Dialog</span>
          </button>

          <button
            onClick={exportDataAsJson}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            title="Download JSON schema bundle"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* PDF Quick Review Callout Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black">
            PDF
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Interactive A4 PDF Export & Layout Review Active</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">Guaranteed A4 Fit</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Review A4 paginated margins, 4-LLG scorecards, priority works schedules, defect ledgers, and official seal in portrait or landscape format.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsPdfStudioOpen(true)}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-amber-500/30 flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Launch PDF Layout Studio &rarr;</span>
        </button>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Document Header & Crest */}
        <div className="border-b-2 border-slate-800 pb-6 print:border-slate-300">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest font-mono text-amber-500 font-bold print:text-amber-800">
                Independent State of Papua New Guinea
              </span>
              <h2 className="text-2xl font-black text-white print:text-slate-950">
                CENTRAL PROVINCE GOVERNMENT
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600 font-medium">
                Directorate of Works, Transport & Strategic Asset Infrastructure &bull; Abau District Directorate
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 print:text-slate-600">
              <p className="font-mono">Ref: CPG-ABAU-REP-2026</p>
              <p>Date: {reportDate}</p>
              <p className="font-semibold text-emerald-400 print:text-slate-800">Target Focus: Abau District</p>
              <p className="text-[10px] text-blue-300 print:text-slate-500">Rigo District Frozen (Directive 2026-CPG)</p>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white print:text-slate-900 flex items-center gap-2 border-b border-slate-800 print:border-slate-300 pb-1">
            <Building2 className="w-4 h-4 text-amber-500" />
            1. Executive Summary & Asset Valuation — Abau District
          </h3>
          <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
            This strategic report synthesizes current field condition evaluations, defect reports, and multi-factor prioritisation algorithms for the road, bridge, and hydraulic drainage assets across <b>Abau District</b> (Aroma, Kupiano, Cloudy Bay, and Amazon Bay LLGs). The monitored network encompasses <b>{abauAssets.length} core assets</b> with an estimated aggregate replacement value of <b>PGK {(totalValueKina / 1000000).toFixed(2)} Million</b>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="bg-slate-950 print:bg-slate-100 p-3 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-slate-400 print:text-slate-600 block text-[10px]">Total Assets Monitored</span>
              <span className="text-xl font-bold text-white print:text-slate-900">{abauAssets.length}</span>
            </div>
            <div className="bg-slate-950 print:bg-slate-100 p-3 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-slate-400 print:text-slate-600 block text-[10px]">Critical / Poor Assets</span>
              <span className="text-xl font-bold text-rose-400 print:text-rose-700">{criticalAssets.length}</span>
            </div>
            <div className="bg-slate-950 print:bg-slate-100 p-3 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-slate-400 print:text-slate-600 block text-[10px]">Open Defect Incidents</span>
              <span className="text-xl font-bold text-amber-400 print:text-amber-700">{criticalDefects.length}</span>
            </div>
            <div className="bg-slate-950 print:bg-slate-100 p-3 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-slate-400 print:text-slate-600 block text-[10px]">Network Book Value</span>
              <span className="text-lg font-bold font-mono text-emerald-400 print:text-emerald-800">
                PGK {(totalValueKina / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>
        </div>

        {/* 4-LLG Scorecards */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white print:text-slate-900 flex items-center gap-2 border-b border-slate-800 print:border-slate-300 pb-1">
            <Layers className="w-4 h-4 text-amber-500" />
            2. Abau District Local-Level Government (LLG) Health Scorecard
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-white print:text-slate-900">Aroma LLG</span>
                <span className="font-mono font-bold text-amber-400 print:text-amber-800">Index: {aromaAvg} / 100</span>
              </div>
              <p className="text-[11px] text-slate-400 print:text-slate-600">
                Corridors: Aroma Coast Highway, Pelagai-Maopa Causeway, Kinikalana culverts.
              </p>
              <div className="text-[11px] text-slate-300 print:text-slate-700 pt-1 border-t border-slate-800 print:border-slate-300 flex justify-between">
                <span>Assets: <b>{aromaAssets.length}</b></span>
                <span>Defects: <b>{defects.filter(d => d.llg === 'Aroma LLG').length}</b></span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-white print:text-slate-900">Kupiano LLG (District HQ)</span>
                <span className="font-mono font-bold text-emerald-400 print:text-emerald-800">Index: {kupianoAvg} / 100</span>
              </div>
              <p className="text-[11px] text-slate-400 print:text-slate-600">
                Corridors: District Station Spine, Lagoon Causeway & Marine Wharf road.
              </p>
              <div className="text-[11px] text-slate-300 print:text-slate-700 pt-1 border-t border-slate-800 print:border-slate-300 flex justify-between">
                <span>Assets: <b>{kupianoAssets.length}</b></span>
                <span>Defects: <b>{defects.filter(d => d.llg === 'Kupiano LLG').length}</b></span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-white print:text-slate-900">Cloudy Bay LLG</span>
                <span className="font-mono font-bold text-rose-400 print:text-rose-800">Index: {cloudyBayAvg} / 100</span>
              </div>
              <p className="text-[11px] text-slate-400 print:text-slate-600">
                Corridors: Robinson River Bridge, Cape Rodney Twin Armco Culvert, Bomguina Bridge.
              </p>
              <div className="text-[11px] text-slate-300 print:text-slate-700 pt-1 border-t border-slate-800 print:border-slate-300 flex justify-between">
                <span>Assets: <b>{cloudyBayAssets.length}</b></span>
                <span>Defects: <b>{defects.filter(d => d.llg === 'Cloudy Bay LLG').length}</b></span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-white print:text-slate-900">Amazon Bay LLG</span>
                <span className="font-mono font-bold text-amber-400 print:text-amber-800">Index: {amazonBayAvg} / 100</span>
              </div>
              <p className="text-[11px] text-slate-400 print:text-slate-600">
                Corridors: Magarida Coastal Feeder Link, Bailebo River Bridge, Magarida Causeway.
              </p>
              <div className="text-[11px] text-slate-300 print:text-slate-700 pt-1 border-t border-slate-800 print:border-slate-300 flex justify-between">
                <span>Assets: <b>{amazonBayAssets.length}</b></span>
                <span>Defects: <b>{defects.filter(d => d.llg === 'Amazon Bay LLG').length}</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Maintenance Priority Table */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white print:text-slate-900 flex items-center gap-2 border-b border-slate-800 print:border-slate-300 pb-1">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            3. High & Critical Maintenance Capital Priority Schedule
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300 rounded-xl overflow-hidden table-fixed border-collapse">
              <thead className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-800 font-bold text-[10px] uppercase border-b border-slate-800 print:border-slate-300">
                <tr>
                  <th style={{ width: '15%' }} className="p-2.5 border-r border-slate-800 print:border-slate-300">Asset ID</th>
                  <th style={{ width: '25%' }} className="p-2.5 border-r border-slate-800 print:border-slate-300">Asset Name</th>
                  <th style={{ width: '12%' }} className="p-2.5 border-r border-slate-800 print:border-slate-300">LLG / District</th>
                  <th style={{ width: '14%' }} className="p-2.5 border-r border-slate-800 print:border-slate-300">Condition</th>
                  <th style={{ width: '12%' }} className="p-2.5 border-r border-slate-800 print:border-slate-300">Priority</th>
                  <th style={{ width: '22%' }} className="p-2.5">Recommended Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-300 text-[11px]">
                {criticalAssets.map(a => (
                  <tr key={a.id} className="hover:bg-slate-950/50 print:hover:bg-transparent">
                    <td className="p-2.5 font-mono font-bold text-amber-400 print:text-slate-900 border-r border-slate-800 print:border-slate-300 align-top break-words">
                      {a.id}
                    </td>
                    <td className="p-2.5 font-semibold text-slate-200 print:text-slate-900 border-r border-slate-800 print:border-slate-300 align-top break-words">
                      <div>{a.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 print:text-slate-500">{a.code}</div>
                    </td>
                    <td className="p-2.5 text-slate-400 print:text-slate-700 border-r border-slate-800 print:border-slate-300 align-top break-words">
                      <div>{a.llg}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{a.district}</div>
                    </td>
                    <td className="p-2.5 border-r border-slate-800 print:border-slate-300 align-top">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                        a.conditionClassification === 'Critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 print:bg-rose-100 print:text-rose-900 print:border-rose-300'
                          : a.conditionClassification === 'Poor'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 print:bg-orange-100 print:text-orange-900 print:border-orange-300'
                          : a.conditionClassification === 'Fair'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 print:bg-amber-100 print:text-amber-900 print:border-amber-300'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:bg-emerald-100 print:text-emerald-900 print:border-emerald-300'
                      }`}>
                        {a.conditionClassification} ({a.conditionScore})
                      </span>
                    </td>
                    <td className="p-2.5 border-r border-slate-800 print:border-slate-300 align-top">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold inline-block bg-rose-500/20 text-rose-300 border border-rose-500/30 print:bg-rose-100 print:text-rose-900 print:border-rose-300">
                        {a.maintenancePriority}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-300 print:text-slate-700 align-top break-words leading-relaxed">
                      {a.recommendedAction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures & Certification Block */}
        <div className="pt-6 border-t-2 border-slate-800 print:border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-400 print:text-slate-700">
          <div>
            <p className="font-semibold text-slate-300 print:text-slate-900">Prepared & Verified By:</p>
            <div className="h-12 border-b border-dashed border-slate-700 print:border-slate-400 my-2"></div>
            <p className="font-bold text-slate-200 print:text-slate-900">Chief District Works Engineer</p>
            <p className="text-[11px]">Central Provincial Works Directorate &bull; PNG</p>
          </div>
          <div>
            <p className="font-semibold text-slate-300 print:text-slate-900">Provincial Administrator Approval:</p>
            <div className="h-12 border-b border-dashed border-slate-700 print:border-slate-400 my-2"></div>
            <p className="font-bold text-slate-200 print:text-slate-900">Provincial Works Administrator</p>
            <p className="text-[11px]">Central Province Government</p>
          </div>
        </div>
      </div>
    </div>
  );
};
