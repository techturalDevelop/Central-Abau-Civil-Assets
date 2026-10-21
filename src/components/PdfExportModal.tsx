import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Layers,
  Building2,
  DollarSign,
  Shield,
  Eye,
  RefreshCw,
  MapPin,
  Compass,
} from 'lucide-react';
import { District, Asset, Defect } from '../types';
import { ABAU_VILLAGES, CENTRAL_PROVINCE_ROAD_WAYPOINTS } from '../data/abauVillages';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDistrictScope?: 'All' | District;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  initialDistrictScope = 'Abau',
}) => {
  const { assets, defects, inspections, currentUserRole, priorityWeights } = useApp();

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Configuration options
  const [districtScope, setDistrictScope] = useState<'All' | District>(initialDistrictScope);
  const [llgFilter, setLlgFilter] = useState<string>('All');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [zoomLevel, setZoomLevel] = useState<number>(90);
  const [viewPage, setViewPage] = useState<'all' | '1' | '2' | '3' | '4'>('all');

  // Status feedback
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const [exportErrorMsg, setExportErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtered dataset focused on Abau District as requested
  const scopedAssets = assets.filter(a => {
    if (districtScope === 'Abau' && a.district !== 'Abau') return false;
    if (districtScope === 'Rigo' && a.district !== 'Rigo') return false;
    if (llgFilter !== 'All' && a.llg !== llgFilter) return false;
    return true;
  });

  const scopedDefects = defects.filter(d => {
    if (districtScope === 'Abau' && d.district !== 'Abau') return false;
    if (districtScope === 'Rigo' && d.district !== 'Rigo') return false;
    if (llgFilter !== 'All' && d.llg !== llgFilter) return false;
    return true;
  });

  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const totalValueKina = scopedAssets.reduce(
    (sum, a) => sum + (a.replacementValueKina || 0),
    0
  );
  const criticalAssets = scopedAssets.filter(
    a => a.conditionClassification === 'Critical' || a.maintenancePriority === 'Critical'
  );
  const poorAssets = scopedAssets.filter(
    a => a.conditionClassification === 'Poor'
  );

  // 4 LLGs of Abau District statistics
  const aromaAssets = assets.filter(a => a.llg === 'Aroma LLG');
  const kupianoAssets = assets.filter(a => a.llg === 'Kupiano LLG');
  const cloudyBayAssets = assets.filter(a => a.llg === 'Cloudy Bay LLG');
  const amazonBayAssets = assets.filter(a => a.llg === 'Amazon Bay LLG');

  const getAvgScore = (list: Asset[]) =>
    list.length > 0 ? Math.round(list.reduce((s, a) => s + a.conditionScore, 0) / list.length) : 0;

  const aromaAvg = getAvgScore(aromaAssets);
  const kupianoAvg = getAvgScore(kupianoAssets);
  const cloudyBayAvg = getAvgScore(cloudyBayAssets);
  const amazonBayAvg = getAvgScore(amazonBayAssets);

  // SAVE AS PDF via html2pdf with automatic oklch -> RGB normalization
  const handleSaveAsPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);
    setExportSuccessMsg(null);
    setExportErrorMsg(null);

    // Pure mathematical OKLAB to sRGB converter
    const oklabToRgb = (l: number, a_: number, b_: number, a = 1): string => {
      const l_ = l + 0.3963377774 * a_ + 0.2158037573 * b_;
      const m_ = l - 0.1055613458 * a_ - 0.0638541728 * b_;
      const s_ = l - 0.0894841775 * a_ - 1.2914855480 * b_;

      const l3 = l_ * l_ * l_;
      const m3 = m_ * m_ * m_;
      const s3 = s_ * s_ * s_;

      const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
      const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
      const b = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

      const toSrgb = (x: number) => {
        const clamped = Math.max(0, Math.min(1, x));
        return clamped <= 0.0031308
          ? 12.92 * clamped
          : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
      };

      const R = Math.round(toSrgb(r) * 255);
      const G = Math.round(toSrgb(g) * 255);
      const B = Math.round(toSrgb(b) * 255);

      if (a < 1) {
        return `rgba(${R}, ${G}, ${B}, ${a})`;
      }
      return `rgb(${R}, ${G}, ${B})`;
    };

    const oklchToRgb = (l: number, c: number, h: number, a = 1): string => {
      const hr = (h * Math.PI) / 180;
      const a_ = c * Math.cos(hr);
      const b_ = c * Math.sin(hr);
      return oklabToRgb(l, a_, b_, a);
    };

    const convertModernColorsToRgb = (str: string): string => {
      if (typeof str !== 'string') return str;
      if (!str.includes('oklch') && !str.includes('oklab')) return str;

      // Convert oklch(...)
      let result = str.replace(
        /oklch\(\s*([-\d.]+%?|none)[\s,]+([-\d.]+|none)[\s,]+([-\d.]+|none)(?:[\s,/]+([-\d.]+%?|none))?\s*\)/gi,
        (_match, lStr, cStr, hStr, aStr) => {
          try {
            const l = lStr === 'none' ? 0 : lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
            const c = cStr === 'none' ? 0 : parseFloat(cStr);
            const h = hStr === 'none' ? 0 : parseFloat(hStr);
            let a = 1;
            if (aStr && aStr !== 'none') {
              a = aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr);
            }
            return oklchToRgb(l, c, h, a);
          } catch {
            return 'rgb(15, 23, 42)';
          }
        }
      );

      // Convert oklab(...)
      result = result.replace(
        /oklab\(\s*([-\d.]+%?|none)[\s,]+([-\d.]+|none)[\s,]+([-\d.]+|none)(?:[\s,/]+([-\d.]+%?|none))?\s*\)/gi,
        (_match, lStr, aStr_, bStr_, alphaStr) => {
          try {
            const l = lStr === 'none' ? 0 : lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
            const a_ = aStr_ === 'none' ? 0 : parseFloat(aStr_);
            const b_ = bStr_ === 'none' ? 0 : parseFloat(bStr_);
            let alpha = 1;
            if (alphaStr && alphaStr !== 'none') {
              alpha = alphaStr.endsWith('%') ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
            }
            return oklabToRgb(l, a_, b_, alpha);
          } catch {
            return 'rgb(15, 23, 42)';
          }
        }
      );

      // Ultimate safety fallback for any other oklch expression
      if (result.includes('oklch')) {
        result = result.replace(/oklch\([^)]+\)/gi, 'rgb(15, 23, 42)');
      }
      if (result.includes('oklab')) {
        result = result.replace(/oklab\([^)]+\)/gi, 'rgb(15, 23, 42)');
      }

      return result;
    };

    // Helper to wrap CSSStyleDeclaration in a safe proxy that converts oklch to rgb without Illegal invocation
    const createSafeStyleProxy = (realStyle: CSSStyleDeclaration) => {
      return new Proxy(realStyle, {
        get(target, prop) {
          if (prop === 'getPropertyValue') {
            return function (propertyName: string) {
              const val = target.getPropertyValue(propertyName);
              if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
                return convertModernColorsToRgb(val);
              }
              return val;
            };
          }
          try {
            const val = (target as any)[prop];
            if (typeof val === 'function') {
              return val.bind(target);
            }
            if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
              return convertModernColorsToRgb(val);
            }
            return val;
          } catch {
            return '';
          }
        },
      });
    };

    // Patch window.getComputedStyle during generation to prevent html2canvas from receiving raw oklch
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
      const realStyle = originalGetComputedStyle.call(window, elt, pseudoElt);
      return createSafeStyleProxy(realStyle);
    };

    try {
      // Dynamic import of html2pdf.js
      // @ts-ignore
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const element = printAreaRef.current;
      const fileName = `Central_Province_Abau_District_Asset_Report_${orientation}_${new Date().toISOString().split('T')[0]}.pdf`;

      const opt = {
        margin: [6, 6, 6, 6] as [number, number, number, number],
        filename: fileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          scrollY: 0,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc: Document) => {
            // Guarantee light background and color on html and body
            if (clonedDoc.documentElement) {
              clonedDoc.documentElement.style.backgroundColor = '#ffffff';
              clonedDoc.documentElement.style.color = '#0f172a';
            }
            if (clonedDoc.body) {
              clonedDoc.body.style.backgroundColor = '#ffffff';
              clonedDoc.body.style.color = '#0f172a';
              clonedDoc.body.className = '';
            }

            // Also patch defaultView of the cloned document if available
            if (clonedDoc.defaultView && clonedDoc.defaultView !== window) {
              const clonedOrig = clonedDoc.defaultView.getComputedStyle;
              if (clonedOrig) {
                clonedDoc.defaultView.getComputedStyle = function (elt: Element, pseudo?: string | null) {
                  const real = clonedOrig.call(clonedDoc.defaultView, elt, pseudo);
                  return createSafeStyleProxy(real);
                };
              }
            }

            // Replace any oklch color references in <style> elements
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach((tag) => {
              if (tag.textContent && (tag.textContent.includes('oklch') || tag.textContent.includes('oklab'))) {
                tag.textContent = convertModernColorsToRgb(tag.textContent);
              }
            });

            // Replace any oklch color references in inline styles
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((node) => {
              const el = node as HTMLElement;
              const styleAttr = el.getAttribute('style');
              if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
                el.setAttribute('style', convertModernColorsToRgb(styleAttr));
              }
            });

            // Inject print-safe styles
            const printReset = clonedDoc.createElement('style');
            printReset.textContent = `
              html, body {
                background-color: #ffffff !important;
                background: #ffffff !important;
                color: #0f172a !important;
              }
              * {
                color-scheme: light !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            `;
            clonedDoc.head.appendChild(printReset);
          },
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: orientation,
        },
        pagebreak: {
          mode: ['css', 'legacy'],
          before: '.a4-page-break',
        },
      };

      await html2pdf().set(opt).from(element).save();

      setIsGeneratingPdf(false);
      setExportSuccessMsg(`A4 PDF exported successfully: ${fileName}`);
      setTimeout(() => setExportSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      setIsGeneratingPdf(false);
      setExportErrorMsg('Direct PDF export encountered an issue. Opening Browser Print Dialog...');
      setTimeout(() => {
        window.print();
        setExportErrorMsg(null);
      }, 1000);
    } finally {
      // Always restore original getComputedStyle
      window.getComputedStyle = originalGetComputedStyle;
    }
  };

  // Browser Print trigger
  const handleBrowserPrint = () => {
    window.print();
  };

  // Standalone HTML Download
  const handleDownloadHtml = () => {
    if (!printAreaRef.current) return;
    const content = printAreaRef.current.innerHTML;
    const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Central Province Infrastructure Report - Abau District</title>
  <style>
    @page { size: A4 ${orientation}; margin: 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #fff; color: #0f172a; margin: 0; padding: 10mm; font-size: 9pt; line-height: 1.4; }
    .a4-page { page-break-after: always; break-after: page; box-sizing: border-box; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 8.5pt; table-layout: fixed; }
    th, td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; vertical-align: top; }
    th { background-color: #f1f5f9; font-weight: 700; color: #1e293b; text-transform: uppercase; font-size: 7.5pt; }
    .header-box { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
    .grid { display: flex; gap: 10px; margin-bottom: 10px; }
    .card { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #f8fafc; }
    .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 7.5pt; font-weight: bold; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-poor { background: #ffedd5; color: #9a3412; }
    .badge-fair { background: #fef3c7; color: #92400e; }
    .badge-good { background: #d1fae5; color: #065f46; }
    @media print { body { padding: 0; } .a4-page { margin-bottom: 0; } }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

    const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Central_Province_Abau_District_Dossier_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Reusable Running Header for each A4 Sheet
  const renderRunningHeader = (pageNum: number, title: string) => (
    <div className="border-b-2 border-slate-900 pb-2 mb-3 avoid-break-inside">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase font-mono tracking-widest text-amber-700 font-bold">
              Independent State of Papua New Guinea
            </span>
            <span className="text-[8px] px-1.5 py-0.2 rounded bg-slate-100 border border-slate-300 font-mono text-slate-700 font-bold">
              REF: CPG-ABAU-INFRA-2026-Q4
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight">
            CENTRAL PROVINCE GOVERNMENT
          </h1>
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-bold uppercase">
            <span>Directorate of Works & Strategic Asset Infrastructure</span>
            <span>&bull;</span>
            <span className="text-amber-800 font-bold">Abau District Primary Register</span>
          </div>
        </div>

        <div className="text-right text-[9px] text-slate-600 space-y-0.5">
          <p><b>Date:</b> {reportDate}</p>
          <p><b>District Scope:</b> <span className="font-bold text-slate-900">{districtScope === 'Abau' ? 'Abau District (Rigo Frozen)' : `${districtScope} District`}</span></p>
          <p><b>Section:</b> {title}</p>
        </div>
      </div>
    </div>
  );

  // Reusable Running Footer for each A4 Sheet
  const renderRunningFooter = (pageNum: number, totalPages: number = 4) => (
    <div className="border-t border-slate-300 pt-1.5 mt-auto text-[8.5px] text-slate-500 flex items-center justify-between avoid-break-inside">
      <div>
        <span>Central Province Government &bull; Abau District Digital Asset Management Platform (Aroma, Kupiano, Cloudy Bay, Amazon Bay)</span>
      </div>
      <div className="font-mono font-bold text-slate-700">
        Page {pageNum} of {totalPages}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1300] bg-slate-950/90 backdrop-blur-md flex flex-col justify-between overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white">
                A4 PDF Layout & Export Studio
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold uppercase">
                A4 Guaranteed Fit
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Abau District Targeted Register &bull; Structured into standard paginated A4 sheets
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom controls */}
          <div className="hidden md:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300 font-semibold">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 15))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download Standalone HTML */}
          <button
            onClick={handleDownloadHtml}
            className="hidden lg:flex px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 items-center gap-1.5 transition-colors cursor-pointer"
            title="Download standalone HTML document"
          >
            <span>HTML Dossier</span>
          </button>

          {/* Browser Native Print */}
          <button
            onClick={handleBrowserPrint}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Native Print Dialog (Ctrl + P)"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">System Print (Ctrl+P)</span>
          </button>

          {/* SAVE AS PDF PRIMARY BUTTON */}
          <button
            onClick={handleSaveAsPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            {isGeneratingPdf ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Save as PDF (.pdf)</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-lg font-bold cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sub-bar with Filters & Page Selection */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 no-print">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* District Scope */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold text-[11px]">Scope:</span>
            <select
              value={districtScope}
              onChange={e => setDistrictScope(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="Abau">Abau District (Active Priority)</option>
              <option value="All">All Central Province (Includes Frozen Rigo)</option>
              <option value="Rigo">Rigo District Only (Frozen Archive)</option>
            </select>
          </div>

          {/* LLG Scope Filter */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="text-slate-400 font-semibold text-[11px]">LLG:</span>
            <select
              value={llgFilter}
              onChange={e => setLlgFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="All">All 4 Abau LLGs</option>
              <option value="Aroma LLG">Aroma LLG</option>
              <option value="Kupiano LLG">Kupiano LLG</option>
              <option value="Cloudy Bay LLG">Cloudy Bay LLG</option>
              <option value="Amazon Bay LLG">Amazon Bay LLG</option>
            </select>
          </div>

          {/* Orientation Toggle: Portrait vs Landscape */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="text-slate-400 font-semibold text-[11px]">Layout:</span>
            <button
              onClick={() => setOrientation('portrait')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                orientation === 'portrait'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              Portrait (A4)
            </button>
            <button
              onClick={() => setOrientation('landscape')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                orientation === 'landscape'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              Landscape (A4)
            </button>
          </div>

          {/* Page View Selector */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <span className="text-slate-400 font-semibold text-[11px]">View:</span>
            {(['all', '1', '2', '3', '4'] as const).map(p => (
              <button
                key={p}
                onClick={() => setViewPage(p)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                  viewPage === p
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p === 'all' ? 'All 4 Pages' : `Page ${p}`}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Messages */}
        <div>
          {exportSuccessMsg && (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>{exportSuccessMsg}</span>
            </span>
          )}
          {exportErrorMsg && (
            <span className="text-amber-400 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>{exportErrorMsg}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Document Preview Canvas Container */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-8 flex justify-center items-start">
        {/* Printable Paper Canvas */}
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="my-2 space-y-8"
        >
          <div ref={printAreaRef} id="pdf-printable-content">
            {/* ============================================================== */}
            {/* PAGE 1: EXECUTIVE BRIEFING, VALUATION, & 4-LLG HEALTH SCORECARD */}
            {/* ============================================================== */}
            {(viewPage === 'all' || viewPage === '1') && (
              <div
                className={`bg-white text-slate-900 shadow-2xl a4-page flex flex-col justify-between ${
                  orientation === 'portrait'
                    ? 'w-[210mm] min-h-[297mm] max-h-[297mm] p-[10mm]'
                    : 'w-[297mm] min-h-[210mm] max-h-[210mm] p-[8mm]'
                }`}
                style={{ boxSizing: 'border-box' }}
              >
                <div>
                  {renderRunningHeader(1, 'Executive Briefing & LLG Health Scorecard')}

                  {/* Section 1: Executive Summary */}
                  <div className="mb-3">
                    <div className="border-b border-slate-300 pb-1 mb-1.5 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>1. Executive Summary & Asset Valuation — Abau District</span>
                      </h3>
                      <span className="text-[8.5px] font-mono text-slate-500">Official Strategic Record</span>
                    </div>

                    <p className="text-[9.5px] text-slate-700 leading-relaxed text-justify mb-2">
                      Under the strategic directive of the Central Province Government, this statutory infrastructure dossier provides a targeted, location-based audit of critical transport corridors, modular bridges, armco culverts, and coastal drainage infrastructure across <b>Abau District</b>. The monitored network encompasses <b>{scopedAssets.length} core infrastructure assets</b> with an aggregate book replacement valuation of <b>PGK {(totalValueKina / 1000000).toFixed(2)} Million</b> across <b>Aroma, Kupiano, Cloudy Bay, and Amazon Bay Local Level Governments (LLGs)</b>. Infrastructure datasets for <b>Rigo District</b> have been frozen and placed into archived status to direct primary civil engineering capital works to Abau District lifelines.
                    </p>

                    {/* KPI Stat Blocks */}
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded bg-slate-50 border border-slate-300">
                        <span className="text-[8.5px] text-slate-500 block uppercase font-semibold">Active Monitored Assets</span>
                        <span className="text-base font-bold text-slate-900 font-mono">{scopedAssets.length}</span>
                        <span className="text-[8px] text-slate-500 block">Abau District Network</span>
                      </div>
                      <div className="p-2 rounded bg-rose-50 border border-rose-300">
                        <span className="text-[8.5px] text-rose-800 block uppercase font-bold">Critical Priority Spans</span>
                        <span className="text-base font-bold text-rose-700 font-mono">{criticalAssets.length}</span>
                        <span className="text-[8px] text-rose-700 block">Immediate Action Required</span>
                      </div>
                      <div className="p-2 rounded bg-amber-50 border border-amber-300">
                        <span className="text-[8.5px] text-amber-800 block uppercase font-bold">Poor Sub-base / Decks</span>
                        <span className="text-base font-bold text-amber-700 font-mono">{poorAssets.length}</span>
                        <span className="text-[8px] text-amber-700 block">Scheduled Capital Works</span>
                      </div>
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-300">
                        <span className="text-[8.5px] text-emerald-800 block uppercase font-bold">Total Replacement Value</span>
                        <span className="text-sm font-bold text-emerald-800 font-mono">
                          PGK {(totalValueKina / 1000000).toFixed(1)}M
                        </span>
                        <span className="text-[8px] text-emerald-700 block">Current Civil Asset Base</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: 4-LLG Infrastructure Health Scorecard */}
                  <div className="mb-3">
                    <div className="border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        2. Abau District Local-Level Government (LLG) Health Scorecard
                      </h3>
                      <span className="text-[8.5px] font-mono text-slate-500">4 Operational LLGs</span>
                    </div>

                    <div className={`grid gap-2 text-xs ${orientation === 'portrait' ? 'grid-cols-2' : 'grid-cols-4'}`}>
                      {/* Aroma LLG */}
                      <div className="p-2.5 rounded border border-slate-300 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-[10px]">Aroma LLG</span>
                          <span className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded text-[9px]">
                            Index: {aromaAvg}/100
                          </span>
                        </div>
                        <p className="text-[8.5px] text-slate-600 leading-tight">
                          Key Localities: Maopa, Pelagai, Kinikalana, Wapagai, Waro, Vuru, Wairavanua, Kwapeupa.
                        </p>
                        <div className="grid grid-cols-3 gap-1 text-[8.5px] text-center pt-1 border-t border-slate-200">
                          <div>Assets: <b>{aromaAssets.length}</b></div>
                          <div className="text-rose-700">Critical: <b>{aromaAssets.filter(a => a.conditionClassification === 'Critical').length}</b></div>
                          <div className="text-amber-800">Defects: <b>{defects.filter(d => d.llg === 'Aroma LLG').length}</b></div>
                        </div>
                      </div>

                      {/* Kupiano LLG */}
                      <div className="p-2.5 rounded border border-slate-300 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-[10px]">Kupiano LLG (HQ)</span>
                          <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.2 rounded text-[9px]">
                            Index: {kupianoAvg}/100
                          </span>
                        </div>
                        <p className="text-[8.5px] text-slate-600 leading-tight">
                          Administrative Centre: Kupiano Station, Vilirupu, Obaha, Government Wharf & Hospital.
                        </p>
                        <div className="grid grid-cols-3 gap-1 text-[8.5px] text-center pt-1 border-t border-slate-200">
                          <div>Assets: <b>{kupianoAssets.length}</b></div>
                          <div className="text-rose-700">Critical: <b>{kupianoAssets.filter(a => a.conditionClassification === 'Critical').length}</b></div>
                          <div className="text-amber-800">Defects: <b>{defects.filter(d => d.llg === 'Kupiano LLG').length}</b></div>
                        </div>
                      </div>

                      {/* Cloudy Bay LLG */}
                      <div className="p-2.5 rounded border border-slate-300 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-[10px]">Cloudy Bay LLG</span>
                          <span className="font-mono font-bold text-rose-900 bg-rose-100 px-1.5 py-0.2 rounded text-[9px]">
                            Index: {cloudyBayAvg}/100
                          </span>
                        </div>
                        <p className="text-[8.5px] text-slate-600 leading-tight">
                          Key Localities: Amau, Abau, Bomguina, Merani, Badubadu, Baramata No. 4, Moreguipa.
                        </p>
                        <div className="grid grid-cols-3 gap-1 text-[8.5px] text-center pt-1 border-t border-slate-200">
                          <div>Assets: <b>{cloudyBayAssets.length}</b></div>
                          <div className="text-rose-700">Critical: <b>{cloudyBayAssets.filter(a => a.conditionClassification === 'Critical').length}</b></div>
                          <div className="text-amber-800">Defects: <b>{defects.filter(d => d.llg === 'Cloudy Bay LLG').length}</b></div>
                        </div>
                      </div>

                      {/* Amazon Bay LLG */}
                      <div className="p-2.5 rounded border border-slate-300 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-[10px]">Amazon Bay LLG</span>
                          <span className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded text-[9px]">
                            Index: {amazonBayAvg}/100
                          </span>
                        </div>
                        <p className="text-[8.5px] text-slate-600 leading-tight">
                          Key Localities: Magarida, Laua, Arau, Bilaga, Nunumai, Selai, Wowolo, Magori, Moduala.
                        </p>
                        <div className="grid grid-cols-3 gap-1 text-[8.5px] text-center pt-1 border-t border-slate-200">
                          <div>Assets: <b>{amazonBayAssets.length}</b></div>
                          <div className="text-rose-700">Critical: <b>{amazonBayAssets.filter(a => a.conditionClassification === 'Critical').length}</b></div>
                          <div className="text-amber-800">Defects: <b>{defects.filter(d => d.llg === 'Amazon Bay LLG').length}</b></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Spatial Corridor Overview (Incorporating Attachment Coordinates) */}
                  <div className="p-2 rounded border border-slate-300 bg-slate-50/70 text-[9px] text-slate-700 leading-normal">
                    <div className="font-bold text-slate-900 mb-0.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Compass className="w-3 h-3 text-amber-600" />
                        <span>Magi Highway Corridor & 61 Localities GIS Audit Summary</span>
                      </span>
                      <span className="font-mono text-[8px] text-slate-500">Attachment Spec 2026</span>
                    </div>
                    <p className="text-[8.5px] text-slate-600">
                      The active digital mapping platform tracks all <b>61 gazetted villages and localities</b> across the four LLGs of Abau District, integrated with the Central Province Road corridor starting at <b>Tubusereia (-9.550, 147.320)</b>, traversing <b>Barakau, Gaire, Manugoro, Deugolo, and Gabagaba (-9.802, 147.516)</b>, and connecting through the arterial highway directly to Kupiano District Station, Cape Rodney, Robinson River basin, and eastward to Magarida in Amazon Bay.
                    </p>
                  </div>
                </div>

                {renderRunningFooter(1)}
              </div>
            )}

            {/* Page Break for html2pdf and print */}
            <div className="a4-page-break my-4 hidden print:block"></div>

            {/* ============================================================== */}
            {/* PAGE 2: CAPITAL WORKS PRIORITISATION SCHEDULE & MULTI-FACTOR */}
            {/* ============================================================== */}
            {(viewPage === 'all' || viewPage === '2') && (
              <div
                className={`bg-white text-slate-900 shadow-2xl a4-page flex flex-col justify-between ${
                  orientation === 'portrait'
                    ? 'w-[210mm] min-h-[297mm] max-h-[297mm] p-[10mm]'
                    : 'w-[297mm] min-h-[210mm] max-h-[210mm] p-[8mm]'
                }`}
                style={{ boxSizing: 'border-box' }}
              >
                <div>
                  {renderRunningHeader(2, 'Capital Works Prioritisation Schedule')}

                  <div className="mb-2 flex items-center justify-between border-b border-slate-300 pb-1">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        3. High & Critical Maintenance Capital Priority Schedule
                      </h3>
                      <p className="text-[8.5px] text-slate-600">
                        Objective ranking produced by Central Province Multi-Criteria Engineering Model
                      </p>
                    </div>
                    <div className="text-right text-[8px] font-mono text-slate-500">
                      Formula: W₁·Deficit + W₂·Defects + W₃·Safety + W₄·Importance + W₅·Disruption
                    </div>
                  </div>

                  {/* Priority Assets Table */}
                  <table className="w-full text-left text-[8.5px] border border-slate-300 mb-3 table-fixed">
                    <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[7.5px] border-b border-slate-300">
                      <tr>
                        <th style={{ width: '14%' }} className="p-1 border-r border-slate-300">Asset Code / ID</th>
                        <th style={{ width: '22%' }} className="p-1 border-r border-slate-300">Asset & Location</th>
                        <th style={{ width: '13%' }} className="p-1 border-r border-slate-300">LLG</th>
                        <th style={{ width: '12%' }} className="p-1 border-r border-slate-300">Condition</th>
                        <th style={{ width: '11%' }} className="p-1 border-r border-slate-300">Score / Rank</th>
                        <th style={{ width: '28%' }} className="p-1">Recommended Intervention Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {[...scopedAssets]
                        .filter(a => a.priorityScore > 0)
                        .sort((a, b) => b.priorityScore - a.priorityScore)
                        .slice(0, orientation === 'portrait' ? 8 : 7)
                        .map((a, idx) => (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="p-1 font-mono font-bold border-r border-slate-300 truncate">
                              #{idx + 1} {a.id}
                            </td>
                            <td className="p-1 font-semibold text-slate-900 border-r border-slate-300 truncate">
                              {a.name}
                            </td>
                            <td className="p-1 border-r border-slate-300 truncate">{a.llg}</td>
                            <td className="p-1 border-r border-slate-300 whitespace-nowrap">
                              <span
                                className={`px-1 py-0.2 rounded font-bold text-[7.5px] ${
                                  a.conditionClassification === 'Critical'
                                    ? 'bg-rose-100 text-rose-800'
                                    : a.conditionClassification === 'Poor'
                                    ? 'bg-orange-100 text-orange-800'
                                    : a.conditionClassification === 'Fair'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {a.conditionClassification} ({a.conditionScore})
                              </span>
                            </td>
                            <td className="p-1 font-mono font-bold text-rose-800 border-r border-slate-300">
                              {a.priorityScore.toFixed(1)}/100
                            </td>
                            <td className="p-1 text-slate-700 leading-tight truncate">
                              {a.recommendedAction}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {/* Multi-Factor Formula Breakdown Panel */}
                  <div className="p-2.5 rounded border border-slate-300 bg-slate-50 text-[8.5px] space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center justify-between text-[9px]">
                      <span>Statutory Multi-Factor Scoring Weight Configuration</span>
                      <span className="font-mono text-emerald-700">Weights Sum: 100%</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2 text-center pt-1 border-t border-slate-200">
                      <div className="p-1 bg-white rounded border border-slate-200">
                        <span className="block text-slate-500 text-[7.5px] uppercase">Condition Deficit</span>
                        <span className="font-mono font-bold text-slate-900 text-[10px]">
                          {(priorityWeights.conditionDeficitWeight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-1 bg-white rounded border border-slate-200">
                        <span className="block text-slate-500 text-[7.5px] uppercase">Defect Severity</span>
                        <span className="font-mono font-bold text-slate-900 text-[10px]">
                          {(priorityWeights.defectSeverityWeight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-1 bg-white rounded border border-slate-200">
                        <span className="block text-slate-500 text-[7.5px] uppercase">Public Safety Risk</span>
                        <span className="font-mono font-bold text-slate-900 text-[10px]">
                          {(priorityWeights.safetyRiskWeight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-1 bg-white rounded border border-slate-200">
                        <span className="block text-slate-500 text-[7.5px] uppercase">Route Importance</span>
                        <span className="font-mono font-bold text-slate-900 text-[10px]">
                          {(priorityWeights.infrastructureImportanceWeight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-1 bg-white rounded border border-slate-200">
                        <span className="block text-slate-500 text-[7.5px] uppercase">Service Disruption</span>
                        <span className="font-mono font-bold text-slate-900 text-[10px]">
                          {(priorityWeights.serviceDisruptionWeight * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-[8px] text-slate-500 leading-tight pt-1">
                      *Note: Priority scores dynamically guide budget distribution under the Central Province Infrastructure Capital Development Plan. Any engineering overrides require written technical justification from the Chief District Works Engineer.
                    </p>
                  </div>
                </div>

                {renderRunningFooter(2)}
              </div>
            )}

            {/* Page Break for html2pdf and print */}
            <div className="a4-page-break my-4 hidden print:block"></div>

            {/* ============================================================== */}
            {/* PAGE 3: ABAU DISTRICT MASTER ASSET INVENTORY REGISTER */}
            {/* ============================================================== */}
            {(viewPage === 'all' || viewPage === '3') && (
              <div
                className={`bg-white text-slate-900 shadow-2xl a4-page flex flex-col justify-between ${
                  orientation === 'portrait'
                    ? 'w-[210mm] min-h-[297mm] max-h-[297mm] p-[10mm]'
                    : 'w-[297mm] min-h-[210mm] max-h-[210mm] p-[8mm]'
                }`}
                style={{ boxSizing: 'border-box' }}
              >
                <div>
                  {renderRunningHeader(3, 'Master Asset Inventory Register')}

                  <div className="mb-2 flex items-center justify-between border-b border-slate-300 pb-1">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        4. Master Infrastructure Asset Inventory Register ({scopedAssets.length} Assets)
                      </h3>
                      <p className="text-[8.5px] text-slate-600">
                        Roads, Composite Bridges, Modular Bailey Trusses, Hydraulic Armco Culverts, & Causeways
                      </p>
                    </div>
                    <span className="text-[8px] font-mono text-slate-500">Abau District Primary Register</span>
                  </div>

                  <table className="w-full text-left text-[8px] border border-slate-300 mb-2 table-fixed">
                    <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[7px] border-b border-slate-300">
                      <tr>
                        <th style={{ width: '13%' }} className="p-1 border-r border-slate-300">Asset ID</th>
                        <th style={{ width: '23%' }} className="p-1 border-r border-slate-300">Asset Name</th>
                        <th style={{ width: '10%' }} className="p-1 border-r border-slate-300">Type</th>
                        <th style={{ width: '14%' }} className="p-1 border-r border-slate-300">LLG</th>
                        <th style={{ width: '14%' }} className="p-1 border-r border-slate-300">Technical Specs</th>
                        <th style={{ width: '11%' }} className="p-1 border-r border-slate-300">Condition</th>
                        <th style={{ width: '15%' }} className="p-1">Valuation (PGK)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {scopedAssets.slice(0, orientation === 'portrait' ? 12 : 9).map(a => (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="p-1 font-mono font-bold border-r border-slate-300 truncate">{a.id}</td>
                          <td className="p-1 font-semibold text-slate-900 border-r border-slate-300 truncate">{a.name}</td>
                          <td className="p-1 border-r border-slate-300 capitalize truncate">{a.type}</td>
                          <td className="p-1 border-r border-slate-300 truncate">{a.llg}</td>
                          <td className="p-1 border-r border-slate-300 truncate text-[7.5px]">
                            {a.technicalSpecs.spanMeters
                              ? `${a.technicalSpecs.spanMeters}m span`
                              : a.technicalSpecs.lengthMeters
                              ? `${(a.technicalSpecs.lengthMeters / 1000).toFixed(1)}km`
                              : a.technicalSpecs.culvertDiameterMm
                              ? `Ø${a.technicalSpecs.culvertDiameterMm}mm`
                              : a.technicalSpecs.surfaceType || '-'}
                          </td>
                          <td className="p-1 border-r border-slate-300 whitespace-nowrap">
                            <span
                              className={`px-1 py-0.2 rounded font-bold text-[7px] ${
                                a.conditionClassification === 'Critical'
                                  ? 'bg-rose-100 text-rose-800'
                                  : a.conditionClassification === 'Poor'
                                  ? 'bg-orange-100 text-orange-800'
                                  : a.conditionClassification === 'Fair'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {a.conditionClassification} ({a.conditionScore})
                            </span>
                          </td>
                          <td className="p-1 font-mono font-bold text-slate-900">
                            PGK {(a.replacementValueKina / 1000000).toFixed(2)}M
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary note below table */}
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[8px] text-slate-600 flex items-center justify-between">
                    <span>Active Abau District asset inventory maintained according to Papua New Guinea Department of Works & Highways asset classification codes.</span>
                    <span className="font-mono font-bold text-slate-700">Audit Status: Current Q4-2026</span>
                  </div>
                </div>

                {renderRunningFooter(3)}
              </div>
            )}

            {/* Page Break for html2pdf and print */}
            <div className="a4-page-break my-4 hidden print:block"></div>

            {/* ============================================================== */}
            {/* PAGE 4: ACTIVE DEFECTS LEDGER & STATUTORY ENGINEERING SIGN-OFF */}
            {/* ============================================================== */}
            {(viewPage === 'all' || viewPage === '4') && (
              <div
                className={`bg-white text-slate-900 shadow-2xl a4-page flex flex-col justify-between ${
                  orientation === 'portrait'
                    ? 'w-[210mm] min-h-[297mm] max-h-[297mm] p-[10mm]'
                    : 'w-[297mm] min-h-[210mm] max-h-[210mm] p-[8mm]'
                }`}
                style={{ boxSizing: 'border-box' }}
              >
                <div>
                  {renderRunningHeader(4, 'Defect Ledger & Statutory Endorsement')}

                  {/* Section 5: Defect Hazard Ledger */}
                  <div className="mb-2.5">
                    <div className="border-b border-slate-300 pb-1 mb-1.5 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        5. Active Defect Incidents & Structural Hazard Log ({scopedDefects.length} Defects)
                      </h3>
                      <span className="text-[8px] font-mono text-slate-500">Field Technical Inspections</span>
                    </div>

                    <table className="w-full text-left text-[8px] border border-slate-300 mb-2 table-fixed">
                      <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[7px] border-b border-slate-300">
                        <tr>
                          <th style={{ width: '13%' }} className="p-1 border-r border-slate-300">Defect ID</th>
                          <th style={{ width: '22%' }} className="p-1 border-r border-slate-300">Asset & Location</th>
                          <th style={{ width: '20%' }} className="p-1 border-r border-slate-300">Defect Type</th>
                          <th style={{ width: '11%' }} className="p-1 border-r border-slate-300">Severity</th>
                          <th style={{ width: '11%' }} className="p-1 border-r border-slate-300">Status</th>
                          <th style={{ width: '11%' }} className="p-1 border-r border-slate-300">Est. Cost</th>
                          <th style={{ width: '12%' }} className="p-1">Assigned Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {scopedDefects.slice(0, 6).map(d => (
                          <tr key={d.id} className="hover:bg-slate-50">
                            <td className="p-1 font-mono font-bold border-r border-slate-300 truncate">{d.id}</td>
                            <td className="p-1 border-r border-slate-300 truncate font-medium">{d.assetName}</td>
                            <td className="p-1 border-r border-slate-300 truncate">{d.defectType}</td>
                            <td className="p-1 border-r border-slate-300 whitespace-nowrap">
                              <span
                                className={`px-1 py-0.2 rounded font-bold text-[7px] ${
                                  d.severity === 'Critical'
                                    ? 'bg-rose-100 text-rose-800'
                                    : d.severity === 'Severe'
                                    ? 'bg-orange-100 text-orange-800'
                                    : d.severity === 'Moderate'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {d.severity}
                              </span>
                            </td>
                            <td className="p-1 border-r border-slate-300 font-semibold truncate">{d.status}</td>
                            <td className="p-1 font-mono border-r border-slate-300 text-slate-900 truncate">
                              PGK {d.estimatedCostKina.toLocaleString()}
                            </td>
                            <td className="p-1 truncate text-slate-600">{d.assignedTeam || 'Taskforce'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 6: Statutory Certification Block */}
                  <div className="pt-2 border-t-2 border-slate-900 space-y-2 avoid-break-inside">
                    <div className="p-2 rounded bg-slate-50 border border-slate-300 text-[8px] text-slate-700 leading-relaxed text-justify">
                      <b>Statutory Technical Certification Notice:</b> This dossier represents the official asset registers, spatial GIS coordinates, condition assessments, and multi-factor prioritisation schedules for <b>Abau District</b> under the Central Province Digital Infrastructure & Asset Management initiative. Recommendations are calibrated using transparent multi-criteria decision algorithms. Engineering procurement and civil works allocation must strictly adhere to the Papua New Guinea National Procurement Act (NPA) and Public Finances (Management) Act.
                    </div>

                    <div className="grid grid-cols-2 gap-6 text-[9.5px] pt-1">
                      {/* Left Signoff: District Engineer */}
                      <div className="p-2 rounded border border-slate-200 bg-white">
                        <p className="font-bold text-slate-900 uppercase text-[9px]">
                          Audited & Certified by District Directorate:
                        </p>
                        <div className="h-9 border-b border-dashed border-slate-400 my-1 flex items-end justify-between px-1 text-[8px] text-slate-400 font-mono">
                          <span>[Official Digital Stamp & Verification]</span>
                          <span>2026-10-21</span>
                        </div>
                        <p className="font-bold text-slate-900">Chief District Works Engineer</p>
                        <p className="text-[8.5px] text-slate-600">Registered Professional Engineer of Papua New Guinea (PEPNG)</p>
                        <p className="text-[8px] text-slate-500">Abau District Headquarters &bull; Kupiano Station</p>
                      </div>

                      {/* Right Signoff: Provincial Administrator */}
                      <div className="p-2 rounded border border-slate-200 bg-white">
                        <p className="font-bold text-slate-900 uppercase text-[9px]">
                          Executive Endorsement & Approval:
                        </p>
                        <div className="h-9 border-b border-dashed border-slate-400 my-1 flex items-end justify-between px-1 text-[8px] text-slate-400 font-mono">
                          <span>[Provincial Seal of Central Province]</span>
                          <span>Approved Q4</span>
                        </div>
                        <p className="font-bold text-slate-900">Provincial Works Administrator</p>
                        <p className="text-[8.5px] text-slate-600">Central Province Government Administration</p>
                        <p className="text-[8px] text-slate-500">Provincial Headquarters &bull; Konedobu, Central Province</p>
                      </div>
                    </div>
                  </div>
                </div>

                {renderRunningFooter(4)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
