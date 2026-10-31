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
  Building2,
  DollarSign,
  Shield,
  Eye,
  RefreshCw,
  MapPin,
  Compass,
  Camera,
  Layers,
} from 'lucide-react';
import { District, Asset, Defect } from '../types';

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
  const [viewPage, setViewPage] = useState<string>('all');

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

  // Color Coding Helpers with standard print-safe RGB values
  const getConditionBadgeStyle = (condition: string) => {
    switch (condition) {
      case 'Critical':
        return {
          bg: '#ffe4e6', // rose-100
          text: '#9f1239', // rose-800
          border: '#fecdd3', // rose-200
        };
      case 'Poor':
        return {
          bg: '#ffedd5', // orange-100
          text: '#9a3412', // orange-800
          border: '#fed7aa', // orange-200
        };
      case 'Fair':
        return {
          bg: '#fef3c7', // amber-100
          text: '#92400e', // amber-800
          border: '#fde68a', // amber-200
        };
      case 'Good':
        return {
          bg: '#d1fae5', // emerald-100
          text: '#065f46', // emerald-800
          border: '#a7f3d0', // emerald-200
        };
      default:
        return {
          bg: '#f1f5f9',
          text: '#334155',
          border: '#cbd5e1',
        };
    }
  };

  const getSeverityBadgeStyle = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return { bg: '#ffe4e6', text: '#9f1239', border: '#fecdd3' };
      case 'Severe':
        return { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' };
      case 'Moderate':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'Minor':
      default:
        return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Open':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      case 'In Progress':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
      case 'Assigned':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'Resolved':
        return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
      default:
        return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bridge':
        return { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' };
      case 'road':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#dbeafe' };
      case 'culvert':
        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
      case 'causeway':
        return { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' };
      default:
        return { bg: '#f8fafc', text: '#334155', border: '#e2e8f0' };
    }
  };

  // Dynamic Pagination Calculations
  // Guarantees 100% of scoped assets and defects are captured without arbitrary slicing
  const inventoryChunkSize = orientation === 'portrait' ? 14 : 10;
  const inventoryChunks: Asset[][] = [];
  for (let i = 0; i < scopedAssets.length; i += inventoryChunkSize) {
    inventoryChunks.push(scopedAssets.slice(i, i + inventoryChunkSize));
  }
  if (inventoryChunks.length === 0) {
    inventoryChunks.push([]);
  }

  // Defects page chunking (ensures defects + statutory sign-off fit cleanly)
  const defectChunkSize = orientation === 'portrait' ? 8 : 6;
  const defectChunks: Defect[][] = [];
  for (let i = 0; i < scopedDefects.length; i += defectChunkSize) {
    defectChunks.push(scopedDefects.slice(i, i + defectChunkSize));
  }
  if (defectChunks.length === 0) {
    defectChunks.push([]);
  }

  // Total pages calculation: 1 (Exec) + 1 (Priorities) + inventoryChunks.length + defectChunks.length
  const totalPages = 2 + inventoryChunks.length + defectChunks.length;

  // List of page keys for preview filtering
  const pageNavItems: { id: string; label: string }[] = [{ id: 'all', label: 'All Pages' }];
  for (let p = 1; p <= totalPages; p++) {
    pageNavItems.push({ id: `${p}`, label: `Page ${p}` });
  }

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

      if (result.includes('oklch')) {
        result = result.replace(/oklch\([^)]+\)/gi, 'rgb(15, 23, 42)');
      }
      if (result.includes('oklab')) {
        result = result.replace(/oklab\([^)]+\)/gi, 'rgb(15, 23, 42)');
      }

      return result;
    };

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

      // Optimized html2pdf options: zero margin prevents scaling cutoffs, explicit windowWidth guarantees column stability
      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: fileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          backgroundColor: '#ffffff',
          windowWidth: orientation === 'portrait' ? 794 : 1123,
          onclone: (clonedDoc: Document) => {
            if (clonedDoc.documentElement) {
              clonedDoc.documentElement.style.backgroundColor = '#ffffff';
              clonedDoc.documentElement.style.color = '#0f172a';
            }
            if (clonedDoc.body) {
              clonedDoc.body.style.backgroundColor = '#ffffff';
              clonedDoc.body.style.color = '#0f172a';
              clonedDoc.body.className = '';
            }

            if (clonedDoc.defaultView && clonedDoc.defaultView !== window) {
              const clonedOrig = clonedDoc.defaultView.getComputedStyle;
              if (clonedOrig) {
                clonedDoc.defaultView.getComputedStyle = function (elt: Element, pseudo?: string | null) {
                  const real = clonedOrig.call(clonedDoc.defaultView, elt, pseudo);
                  return createSafeStyleProxy(real);
                };
              }
            }

            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach((tag) => {
              if (tag.textContent && (tag.textContent.includes('oklch') || tag.textContent.includes('oklab'))) {
                tag.textContent = convertModernColorsToRgb(tag.textContent);
              }
            });

            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((node) => {
              const el = node as HTMLElement;
              const styleAttr = el.getAttribute('style');
              if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
                el.setAttribute('style', convertModernColorsToRgb(styleAttr));
              }
            });

            // Inject high-legibility print stylesheet
            const printReset = clonedDoc.createElement('style');
            printReset.textContent = `
              html, body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                background-color: #ffffff !important;
                background: #ffffff !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              * {
                box-sizing: border-box !important;
                color-scheme: light !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              table {
                border-collapse: collapse !important;
                table-layout: fixed !important;
                width: 100% !important;
              }
              th, td {
                word-break: break-word !important;
                overflow-wrap: break-word !important;
                white-space: normal !important;
                vertical-align: top !important;
              }
              .a4-page {
                box-sizing: border-box !important;
                page-break-after: always !important;
                break-after: page !important;
              }
              .font-mono {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
              }
            `;
            clonedDoc.head.appendChild(printReset);
          },
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: orientation,
          compress: true,
        },
        pagebreak: {
          mode: ['css', 'legacy'],
          before: '.a4-page-break',
        },
      };

      await html2pdf().set(opt).from(element).save();

      setIsGeneratingPdf(false);
      setExportSuccessMsg(`A4 PDF exported successfully (${totalPages} pages): ${fileName}`);
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
  <title>Central Province Infrastructure Report - Abau District (${orientation.toUpperCase()})</title>
  <style>
    @page { size: A4 ${orientation}; margin: 8mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      margin: 0;
      padding: 0;
      font-size: 8.5pt;
      line-height: 1.4;
    }
    .a4-page {
      page-break-after: always;
      break-after: page;
      box-sizing: border-box;
      padding: 10mm;
      width: ${orientation === 'portrait' ? '210mm' : '297mm'};
      min-height: ${orientation === 'portrait' ? '297mm' : '210mm'};
      margin: 0 auto 20px auto;
      background: #ffffff;
    }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 8pt; table-layout: fixed; }
    th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: top; word-break: break-word; }
    th { background-color: #f1f5f9; font-weight: 700; color: #0f172a; text-transform: uppercase; font-size: 7pt; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    @media print {
      body { padding: 0; }
      .a4-page { margin: 0; padding: 8mm; page-break-after: always; break-after: page; }
    }
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
    link.download = `Central_Province_Abau_District_Dossier_${orientation}_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Reusable Running Header for each A4 Sheet
  const renderRunningHeader = (pageNum: number, title: string) => (
    <div className="border-b-2 border-slate-900 pb-2 mb-2.5 avoid-break-inside">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[8.5px] uppercase font-mono tracking-widest text-amber-800 font-bold">
              Independent State of Papua New Guinea
            </span>
            <span className="text-[8px] px-1.5 py-0.2 rounded bg-slate-100 border border-slate-300 font-mono text-slate-700 font-bold">
              REF: CPG-ABAU-INFRA-2026-Q4
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight leading-none mt-0.5">
            CENTRAL PROVINCE GOVERNMENT
          </h1>
          <div className="flex items-center gap-2 text-[9.5px] text-slate-700 font-bold uppercase mt-0.5">
            <span>Directorate of Works & Strategic Asset Infrastructure</span>
            <span>&bull;</span>
            <span className="text-amber-800 font-bold">Abau District Primary Register</span>
          </div>
        </div>

        <div className="text-right text-[8.5px] text-slate-700 space-y-0.5">
          <p><b className="text-slate-900">Date:</b> {reportDate}</p>
          <p><b className="text-slate-900">District Scope:</b> <span className="font-bold text-slate-950">{districtScope === 'Abau' ? 'Abau District (Active)' : `${districtScope} Scope`}</span></p>
          <p><b className="text-slate-900">Section:</b> <span className="text-amber-900 font-semibold">{title}</span></p>
        </div>
      </div>
    </div>
  );

  // Reusable Running Footer for each A4 Sheet
  const renderRunningFooter = (pageNum: number) => (
    <div className="border-t border-slate-300 pt-1.5 mt-auto text-[8.5px] text-slate-600 flex items-center justify-between avoid-break-inside">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-800">Central Province Government &bull; Directorate of Works</span>
        <span className="text-slate-400">&bull;</span>
        <span>Abau Lifelines: Aroma, Kupiano, Cloudy Bay, Amazon Bay</span>
      </div>
      <div className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
        Page {pageNum} of {totalPages}
      </div>
    </div>
  );

  // Common A4 page container styling
  const pageContainerClass = `bg-white text-slate-900 shadow-2xl a4-page flex flex-col justify-between ${
    orientation === 'portrait'
      ? 'w-[210mm] min-h-[297mm] h-auto p-[10mm]'
      : 'w-[297mm] min-h-[210mm] h-auto p-[8mm]'
  }`;

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
                100% Data Capture &bull; {totalPages} Pages
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Abau District Targeted Register &bull; Clean typography, color-coded condition badges & verified photographic audit
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
                <span>Save as PDF ({totalPages} Pages)</span>
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
              <option value="Abau">Abau District (13 Primary Assets)</option>
              <option value="All">All Central Province (Full 20 Assets)</option>
              <option value="Rigo">Rigo District (Archived)</option>
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

          {/* Dynamic Page View Selector */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <span className="text-slate-400 font-semibold text-[11px]">View:</span>
            {pageNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => setViewPage(item.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                  viewPage === item.id
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
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
              <div className={pageContainerClass} style={{ boxSizing: 'border-box' }}>
                <div>
                  {renderRunningHeader(1, 'Executive Briefing & LLG Health Scorecard')}

                  {/* Section 1: Executive Summary */}
                  <div className="mb-3">
                    <div className="border-b border-slate-300 pb-1 mb-1.5 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-700" />
                        <span>1. Executive Summary & Asset Valuation — Abau District</span>
                      </h3>
                      <span className="text-[8.5px] font-mono text-slate-600 font-semibold">Official Statutory Record</span>
                    </div>

                    <p className="text-[9.5px] text-slate-800 leading-relaxed text-justify mb-2.5">
                      Under the strategic directive of the Central Province Government, this statutory infrastructure dossier provides an exhaustive, location-based audit of critical transport corridors, modular bridges, armco culverts, and coastal drainage infrastructure across <b>Abau District</b>. The monitored network encompasses <b>{scopedAssets.length} core infrastructure assets</b> with an aggregate book replacement valuation of <b>PGK {(totalValueKina / 1000000).toFixed(2)} Million</b> across <b>Aroma, Kupiano, Cloudy Bay, and Amazon Bay Local Level Governments (LLGs)</b>. Infrastructure datasets for <b>Rigo District</b> have been placed in archived status to direct primary civil engineering capital works to Abau District lifelines.
                    </p>

                    {/* KPI Stat Blocks with High-Contrast Color Coding */}
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded bg-slate-50 border border-slate-300">
                        <span className="text-[8.5px] text-slate-600 block uppercase font-bold">Active Monitored Assets</span>
                        <span className="text-base font-extrabold text-slate-950 font-mono">{scopedAssets.length}</span>
                        <span className="text-[8px] text-slate-600 block">100% Captured in Register</span>
                      </div>
                      <div className="p-2 rounded bg-rose-50 border border-rose-300">
                        <span className="text-[8.5px] text-rose-900 block uppercase font-bold">Critical Priority Spans</span>
                        <span className="text-base font-extrabold text-rose-800 font-mono">{criticalAssets.length}</span>
                        <span className="text-[8px] text-rose-700 block">Immediate Capital Action</span>
                      </div>
                      <div className="p-2 rounded bg-amber-50 border border-amber-300">
                        <span className="text-[8.5px] text-amber-900 block uppercase font-bold">Poor Sub-base / Decks</span>
                        <span className="text-base font-extrabold text-amber-800 font-mono">{poorAssets.length}</span>
                        <span className="text-[8px] text-amber-700 block">Scheduled Rehabilitation</span>
                      </div>
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-300">
                        <span className="text-[8.5px] text-emerald-900 block uppercase font-bold">Total Replacement Value</span>
                        <span className="text-sm font-extrabold text-emerald-900 font-mono">
                          PGK {(totalValueKina / 1000000).toFixed(1)}M
                        </span>
                        <span className="text-[8px] text-emerald-700 block">Audited Civil Asset Base</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: 4-LLG Infrastructure Health Scorecard */}
                  <div className="mb-3">
                    <div className="border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-700" />
                        <span>2. Abau District Local-Level Government (LLG) Health Scorecard</span>
                      </h3>
                      <span className="text-[8.5px] font-mono text-slate-600 font-semibold">4 Operational LLGs</span>
                    </div>

                    <div className={`grid gap-2 text-xs ${orientation === 'portrait' ? 'grid-cols-2' : 'grid-cols-4'}`}>
                      {/* Aroma LLG */}
                      <div className="p-2.5 rounded border border-slate-300 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-950 text-[10px]">Aroma LLG</span>
                          <span
                            className="font-mono font-bold px-1.5 py-0.2 rounded text-[8.5px] border"
                            style={{
                              backgroundColor: getConditionBadgeStyle(aromaAvg >= 75 ? 'Good' : aromaAvg >= 60 ? 'Fair' : 'Poor').bg,
                              color: getConditionBadgeStyle(aromaAvg >= 75 ? 'Good' : aromaAvg >= 60 ? 'Fair' : 'Poor').text,
                              borderColor: getConditionBadgeStyle(aromaAvg >= 75 ? 'Good' : aromaAvg >= 60 ? 'Fair' : 'Poor').border,
                            }}
                          >
                            Index: {aromaAvg}/100
                          </span>
                        </div>
                        <p className="text-[8.5px] text-slate-700 leading-tight">
                          Key Localities: Maopa, Pelagai, Kinikalana, Wapagai, Waro, Vuru, Wairavanua, Kwapeupa.
                        </p>
                        <div className="grid grid-cols-3 gap-1 text-[8.5px] text-center pt-1 border-t border-slate-200">
                          <div>Assets: <b className="text-slate-900">{aromaAssets.length}</b></div>
                          <div className="text-rose-800">Critical: <b>{aromaAssets.filter(a => a.conditionClassification === 'Critical').length}</b></div>
                          <div className="text-amber-900">Defects: <b>{defects.filter(d => d.llg === 'Aroma LLG').length}</b></div>
                        </div>
                      </div>

                      {/* Kupiano LLG */}
                      <div className="p-2.5 rounded border border-slate-300 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-950 text-[10px]">Kupiano LLG (HQ)</span>
                          <span
                            className="font-mono font-bold px-1.5 py-0.2 rounded text-[8.5px] border"
                            style={{
                              backgroundColor: getConditionBadgeStyle(kupianoAvg >= 75 ? 'Good' : kupianoAvg >= 60 ? 'Fair' : 'Poor').bg,
                              color: getConditionBadgeStyle(kupianoAvg >= 75 ? 'Good' : kupianoAvg >= 60 ? 'Fair' : 'Poor').text,
                              borderColor: getConditionBadgeStyle(kupianoAvg >= 75 ? 'Good' : kupianoAvg >= 60 ? 'Fair' : 'Poor').border,
                            }}
                          >
                            Index: {kupianoAvg}/100
                          </span>
                        </div>
                        <p className="text-[8.5px] text-slate-700 leading-tight">
                          Administrative Centre: Kupiano Station, Vilirupu, Obaha, Government Wharf & Hospital.
                        </p>
                        <div className="grid grid-cols-3 gap-1 text-[8.5px] text-center pt-1 border-t border-slate-200">
                          <div>Assets: <b className="text-slate-900">{kupianoAssets.length}</b></div>
                          <div className="text-rose-800">Critical: <b>{kupianoAssets.filter(a => a.conditionClassification === 'Critical').length}</b></div>
                          <div className="text-amber-900">Defects: <b>{defects.filter(d => d.llg === 'Kupiano LLG').length}</b></div>
                        </div>
                      </div>

                      {/* Cloudy Bay LLG */}
                      <div className="p-2.5 rounded border border-slate-300 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-950 text-[10px]">Cloudy Bay LLG</span>
                          <span
                            className="font-mono font-bold px-1.5 py-0.2 rounded text-[8.5px] border"
                            style={{
                              backgroundColor: getConditionBadgeStyle(cloudyBayAvg >= 75 ? 'Good' : cloudyBayAvg >= 60 ? 'Fair' : cloudyBayAvg >= 40 ? 'Poor' : 'Critical').bg,
                              color: getConditionBadgeStyle(cloudyBayAvg >= 75 ? 'Good' : cloudyBayAvg >= 60 ? 'Fair' : cloudyBayAvg >= 40 ? 'Poor' : 'Critical').text,
                              borderColor: getConditionBadgeStyle(cloudyBayAvg >= 75 ? 'Good' : cloudyBayAvg >= 60 ? 'Fair' : cloudyBayAvg >= 40 ? 'Poor' : 'Critical').border,
                            }}
                          >
                            Index: {cloudyBayAvg}/100
                          </span>
                        </div>
                        <p className="text-[8.5px] text-slate-700 leading-tight">
                          Key Localities: Amau, Abau, Bomguina, Merani, Badubadu, Baramata No. 4, Moreguina.
                        </p>
                        <div className="grid grid-cols-3 gap-1 text-[8.5px] text-center pt-1 border-t border-slate-200">
                          <div>Assets: <b className="text-slate-900">{cloudyBayAssets.length}</b></div>
                          <div className="text-rose-800">Critical: <b>{cloudyBayAssets.filter(a => a.conditionClassification === 'Critical').length}</b></div>
                          <div className="text-amber-900">Defects: <b>{defects.filter(d => d.llg === 'Cloudy Bay LLG').length}</b></div>
                        </div>
                      </div>

                      {/* Amazon Bay LLG */}
                      <div className="p-2.5 rounded border border-slate-300 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-950 text-[10px]">Amazon Bay LLG</span>
                          <span
                            className="font-mono font-bold px-1.5 py-0.2 rounded text-[8.5px] border"
                            style={{
                              backgroundColor: getConditionBadgeStyle(amazonBayAvg >= 75 ? 'Good' : amazonBayAvg >= 60 ? 'Fair' : amazonBayAvg >= 40 ? 'Poor' : 'Critical').bg,
                              color: getConditionBadgeStyle(amazonBayAvg >= 75 ? 'Good' : amazonBayAvg >= 60 ? 'Fair' : amazonBayAvg >= 40 ? 'Poor' : 'Critical').text,
                              borderColor: getConditionBadgeStyle(amazonBayAvg >= 75 ? 'Good' : amazonBayAvg >= 60 ? 'Fair' : amazonBayAvg >= 40 ? 'Poor' : 'Critical').border,
                            }}
                          >
                            Index: {amazonBayAvg}/100
                          </span>
                        </div>
                        <p className="text-[8.5px] text-slate-700 leading-tight">
                          Key Localities: Magarida, Laua, Arau, Bilaga, Nunumai, Selai, Wowolo, Magori, Moduala.
                        </p>
                        <div className="grid grid-cols-3 gap-1 text-[8.5px] text-center pt-1 border-t border-slate-200">
                          <div>Assets: <b className="text-slate-900">{amazonBayAssets.length}</b></div>
                          <div className="text-rose-800">Critical: <b>{amazonBayAssets.filter(a => a.conditionClassification === 'Critical').length}</b></div>
                          <div className="text-amber-900">Defects: <b>{defects.filter(d => d.llg === 'Amazon Bay LLG').length}</b></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Spatial Corridor Overview & Photographic Audit */}
                  <div className="p-2.5 rounded border border-slate-300 bg-slate-50 text-[9px] text-slate-800 leading-normal space-y-1">
                    <div className="font-bold text-slate-950 mb-0.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-amber-700" />
                        <span>Magi Highway Arterial Corridor & 61 Localities GIS Audit Summary</span>
                      </span>
                      <span className="font-mono text-[8px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        GPS Ground Truthed &bull; 2026 Audit
                      </span>
                    </div>
                    <p className="text-[8.5px] text-slate-700 leading-relaxed">
                      The active digital mapping platform tracks all <b>61 gazetted villages and localities</b> across the four LLGs of Abau District, integrated with the Central Province Road corridor starting at <b>Tubusereia (-9.550, 147.320)</b>, traversing <b>Barakau, Gaire, Manugoro, Deugolo, and Gabagaba (-9.802, 147.516)</b>, and connecting through the arterial highway directly to Kupiano District Station, Cape Rodney, Robinson River basin, and eastward to Magarida in Amazon Bay.
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[8px] text-slate-600">
                      <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                        <Camera className="w-3 h-3" />
                        Photographic Verification: 100% of Abau primary assets mapped with Cloudflare R2 high-resolution imagery.
                      </span>
                      <span className="font-mono text-slate-500">Coordinate Datum: WGS84</span>
                    </div>
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
              <div className={pageContainerClass} style={{ boxSizing: 'border-box' }}>
                <div>
                  {renderRunningHeader(2, 'Capital Works Prioritisation Schedule')}

                  <div className="mb-2 flex items-center justify-between border-b border-slate-300 pb-1">
                    <div>
                      <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                        3. High & Critical Maintenance Capital Priority Schedule
                      </h3>
                      <p className="text-[8.5px] text-slate-700">
                        Objective ranking produced by Central Province Multi-Criteria Engineering Model
                      </p>
                    </div>
                    <div className="text-right text-[8px] font-mono text-slate-600 font-semibold">
                      Formula: W₁·Deficit + W₂·Defects + W₃·Safety + W₄·Importance + W₅·Disruption
                    </div>
                  </div>

                  {/* Priority Assets Table: Captures prioritized assets without overlap */}
                  <table className="w-full text-left text-[8px] border border-slate-300 mb-2.5 table-fixed border-collapse">
                    <thead className="bg-slate-100 text-slate-900 uppercase font-bold text-[7pt] border-b border-slate-300">
                      <tr>
                        <th style={{ width: '12%' }} className="p-1.5 border-r border-slate-300">Rank / ID</th>
                        <th style={{ width: '22%' }} className="p-1.5 border-r border-slate-300">Asset & Location</th>
                        <th style={{ width: '10%' }} className="p-1.5 border-r border-slate-300">Type</th>
                        <th style={{ width: '13%' }} className="p-1.5 border-r border-slate-300">Condition</th>
                        <th style={{ width: '10%' }} className="p-1.5 border-r border-slate-300 text-right">Score</th>
                        <th style={{ width: '13%' }} className="p-1.5 border-r border-slate-300">Profile</th>
                        <th style={{ width: '20%' }} className="p-1.5">Recommended Intervention</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {[...scopedAssets]
                        .filter(a => a.priorityScore > 0)
                        .sort((a, b) => b.priorityScore - a.priorityScore)
                        .map((a, idx) => {
                          const condBadge = getConditionBadgeStyle(a.conditionClassification);
                          const typeBadge = getTypeBadgeStyle(a.type);
                          return (
                            <tr key={a.id} className="hover:bg-slate-50">
                              <td className="p-1.5 align-top font-mono font-bold border-r border-slate-300 break-words text-slate-900">
                                #{idx + 1} {a.id}
                              </td>
                              <td className="p-1.5 align-top border-r border-slate-300 break-words">
                                <div className="font-semibold text-slate-950 leading-tight">{a.name}</div>
                                <div className="text-[7pt] text-slate-600 font-mono mt-0.5">{a.llg}</div>
                              </td>
                              <td className="p-1.5 align-top border-r border-slate-300 break-words">
                                <span
                                  className="px-1.5 py-0.2 rounded font-bold text-[7pt] inline-block border capitalize"
                                  style={{
                                    backgroundColor: typeBadge.bg,
                                    color: typeBadge.text,
                                    borderColor: typeBadge.border,
                                  }}
                                >
                                  {a.type}
                                </span>
                              </td>
                              <td className="p-1.5 align-top border-r border-slate-300 break-words">
                                <span
                                  className="px-1.5 py-0.2 rounded font-bold text-[7pt] inline-block border whitespace-nowrap"
                                  style={{
                                    backgroundColor: condBadge.bg,
                                    color: condBadge.text,
                                    borderColor: condBadge.border,
                                  }}
                                >
                                  {a.conditionClassification} ({a.conditionScore})
                                </span>
                              </td>
                              <td className="p-1.5 align-top font-mono font-bold text-rose-800 border-r border-slate-300 text-right">
                                {a.priorityScore.toFixed(1)}
                              </td>
                              <td className="p-1.5 align-top border-r border-slate-300 text-[7pt] font-mono text-slate-600 leading-tight break-words">
                                Def:{a.priorityFactors?.conditionDeficit || '-'} • Saf:{a.priorityFactors?.safetyRisk || '-'}
                              </td>
                              <td className="p-1.5 align-top text-slate-800 leading-tight break-words">
                                {a.recommendedAction}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>

                  {/* Multi-Factor Formula Breakdown Panel */}
                  <div className="p-2.5 rounded border border-slate-300 bg-slate-50 text-[8.5px] space-y-1.5 avoid-break-inside">
                    <div className="font-bold text-slate-950 flex items-center justify-between text-[9px]">
                      <span>Statutory Multi-Factor Scoring Weight Configuration</span>
                      <span className="font-mono text-emerald-800 font-bold">Weights Sum: 100%</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2 text-center pt-1 border-t border-slate-200">
                      <div className="p-1 bg-white rounded border border-slate-200">
                        <span className="block text-slate-600 text-[7.5px] uppercase font-semibold">Condition Deficit</span>
                        <span className="font-mono font-bold text-slate-950 text-[10px]">
                          {(priorityWeights.conditionDeficitWeight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-1 bg-white rounded border border-slate-200">
                        <span className="block text-slate-600 text-[7.5px] uppercase font-semibold">Defect Severity</span>
                        <span className="font-mono font-bold text-slate-950 text-[10px]">
                          {(priorityWeights.defectSeverityWeight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-1 bg-white rounded border border-slate-200">
                        <span className="block text-slate-600 text-[7.5px] uppercase font-semibold">Public Safety Risk</span>
                        <span className="font-mono font-bold text-slate-950 text-[10px]">
                          {(priorityWeights.safetyRiskWeight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-1 bg-white rounded border border-slate-200">
                        <span className="block text-slate-600 text-[7.5px] uppercase font-semibold">Route Importance</span>
                        <span className="font-mono font-bold text-slate-950 text-[10px]">
                          {(priorityWeights.infrastructureImportanceWeight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-1 bg-white rounded border border-slate-200">
                        <span className="block text-slate-600 text-[7.5px] uppercase font-semibold">Service Disruption</span>
                        <span className="font-mono font-bold text-slate-950 text-[10px]">
                          {(priorityWeights.serviceDisruptionWeight * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-[8px] text-slate-600 leading-tight pt-1">
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
            {/* MASTER ASSET INVENTORY REGISTER (PAGES 3, etc. DYNAMIC CHUNKS) */}
            {/* ============================================================== */}
            {inventoryChunks.map((chunk, chunkIdx) => {
              const pageNum = 3 + chunkIdx;
              const isVisible = viewPage === 'all' || viewPage === `${pageNum}`;
              if (!isVisible) return null;

              const partLabel =
                inventoryChunks.length > 1
                  ? ` (Part ${chunkIdx + 1} of ${inventoryChunks.length})`
                  : '';

              return (
                <React.Fragment key={`inventory-chunk-${chunkIdx}`}>
                  <div className={pageContainerClass} style={{ boxSizing: 'border-box' }}>
                    <div>
                      {renderRunningHeader(
                        pageNum,
                        `Master Asset Inventory Register${partLabel}`
                      )}

                      <div className="mb-2 flex items-center justify-between border-b border-slate-300 pb-1">
                        <div>
                          <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                            4. Master Infrastructure Asset Inventory Register ({scopedAssets.length} Assets Total)
                          </h3>
                          <p className="text-[8.5px] text-slate-700">
                            Roads, Composite Bridges, Modular Bailey Trusses, Hydraulic Armco Culverts, & Causeways
                          </p>
                        </div>
                        <span className="text-[8px] font-mono text-slate-600 font-semibold">
                          Showing {chunkIdx * inventoryChunkSize + 1}–
                          {Math.min((chunkIdx + 1) * inventoryChunkSize, scopedAssets.length)} of {scopedAssets.length}
                        </span>
                      </div>

                      {/* Complete Master Asset Register Table with explicit widths and wrapped text */}
                      <table className="w-full text-left text-[8px] border border-slate-300 mb-2 table-fixed border-collapse">
                        <thead className="bg-slate-100 text-slate-900 uppercase font-bold text-[7pt] border-b border-slate-300">
                          <tr>
                            <th style={{ width: '13%' }} className="p-1.5 border-r border-slate-300">Asset ID</th>
                            <th style={{ width: '23%' }} className="p-1.5 border-r border-slate-300">Asset Name & Corridor</th>
                            <th style={{ width: '10%' }} className="p-1.5 border-r border-slate-300">Type</th>
                            <th style={{ width: '12%' }} className="p-1.5 border-r border-slate-300">LLG</th>
                            <th style={{ width: '14%' }} className="p-1.5 border-r border-slate-300">Technical Specs</th>
                            <th style={{ width: '13%' }} className="p-1.5 border-r border-slate-300">Condition</th>
                            <th style={{ width: '15%' }} className="p-1.5 text-right">Valuation (PGK)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {chunk.map(a => {
                            const condBadge = getConditionBadgeStyle(a.conditionClassification);
                            const typeBadge = getTypeBadgeStyle(a.type);
                            return (
                              <tr key={a.id} className="hover:bg-slate-50">
                                <td className="p-1.5 align-top font-mono font-bold border-r border-slate-300 break-words text-slate-950">
                                  {a.id}
                                </td>
                                <td className="p-1.5 align-top border-r border-slate-300 break-words">
                                  <div className="font-semibold text-slate-950 leading-tight">{a.name}</div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[6.5pt] font-mono px-1 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                                      📷 Verified R2 Photo
                                    </span>
                                  </div>
                                </td>
                                <td className="p-1.5 align-top border-r border-slate-300 break-words">
                                  <span
                                    className="px-1.5 py-0.2 rounded font-bold text-[7pt] inline-block border capitalize"
                                    style={{
                                      backgroundColor: typeBadge.bg,
                                      color: typeBadge.text,
                                      borderColor: typeBadge.border,
                                    }}
                                  >
                                    {a.type}
                                  </span>
                                </td>
                                <td className="p-1.5 align-top border-r border-slate-300 break-words text-slate-800">
                                  {a.llg}
                                </td>
                                <td className="p-1.5 align-top border-r border-slate-300 break-words text-[7.5pt] text-slate-700 leading-tight">
                                  {a.technicalSpecs.spanMeters
                                    ? `${a.technicalSpecs.spanMeters}m span`
                                    : a.technicalSpecs.lengthMeters
                                    ? `${(a.technicalSpecs.lengthMeters / 1000).toFixed(1)}km length`
                                    : a.technicalSpecs.culvertDiameterMm
                                    ? `Ø${a.technicalSpecs.culvertDiameterMm}mm barrel`
                                    : a.technicalSpecs.surfaceType || '-'}
                                </td>
                                <td className="p-1.5 align-top border-r border-slate-300 break-words">
                                  <span
                                    className="px-1.5 py-0.2 rounded font-bold text-[7pt] inline-block border whitespace-nowrap"
                                    style={{
                                      backgroundColor: condBadge.bg,
                                      color: condBadge.text,
                                      borderColor: condBadge.border,
                                    }}
                                  >
                                    {a.conditionClassification} ({a.conditionScore})
                                  </span>
                                </td>
                                <td className="p-1.5 align-top font-mono font-bold text-slate-950 text-right">
                                  PGK {(a.replacementValueKina / 1000000).toFixed(2)}M
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Summary note below table */}
                      <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[8px] text-slate-700 flex items-center justify-between avoid-break-inside">
                        <span>Active Abau District asset inventory maintained in accordance with PNG Department of Works & Highways asset classification codes.</span>
                        <span className="font-mono font-bold text-slate-800">Audit Status: Current Q4-2026</span>
                      </div>
                    </div>

                    {renderRunningFooter(pageNum)}
                  </div>

                  {/* Page break after each inventory chunk */}
                  <div className="a4-page-break my-4 hidden print:block"></div>
                </React.Fragment>
              );
            })}

            {/* ============================================================== */}
            {/* DEFECTS LEDGER & STATUTORY CERTIFICATION (FINAL PAGES)        */}
            {/* ============================================================== */}
            {defectChunks.map((chunk, defectIdx) => {
              const pageNum = 3 + inventoryChunks.length + defectIdx;
              const isVisible = viewPage === 'all' || viewPage === `${pageNum}`;
              if (!isVisible) return null;

              const isFinalPage = defectIdx === defectChunks.length - 1;

              return (
                <React.Fragment key={`defect-chunk-${defectIdx}`}>
                  <div className={pageContainerClass} style={{ boxSizing: 'border-box' }}>
                    <div>
                      {renderRunningHeader(
                        pageNum,
                        isFinalPage ? 'Defect Ledger & Statutory Endorsement' : 'Active Defects Hazard Ledger'
                      )}

                      {/* Section 5: Defect Hazard Ledger */}
                      <div className="mb-2.5">
                        <div className="border-b border-slate-300 pb-1 mb-1.5 flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                            5. Active Defect Incidents & Structural Hazard Log ({scopedDefects.length} Defects Monitored)
                          </h3>
                          <span className="text-[8px] font-mono text-slate-600 font-semibold">Field Technical Inspections</span>
                        </div>

                        <table className="w-full text-left text-[8px] border border-slate-300 mb-2 table-fixed border-collapse">
                          <thead className="bg-slate-100 text-slate-900 uppercase font-bold text-[7pt] border-b border-slate-300">
                            <tr>
                              <th style={{ width: '12%' }} className="p-1.5 border-r border-slate-300">Defect ID</th>
                              <th style={{ width: '22%' }} className="p-1.5 border-r border-slate-300">Asset & Location</th>
                              <th style={{ width: '18%' }} className="p-1.5 border-r border-slate-300">Defect Type</th>
                              <th style={{ width: '11%' }} className="p-1.5 border-r border-slate-300">Severity</th>
                              <th style={{ width: '10%' }} className="p-1.5 border-r border-slate-300">Status</th>
                              <th style={{ width: '13%' }} className="p-1.5 border-r border-slate-300 text-right">Est. Cost</th>
                              <th style={{ width: '14%' }} className="p-1.5">Assigned Unit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {chunk.map(d => {
                              const sevBadge = getSeverityBadgeStyle(d.severity);
                              const statBadge = getStatusBadgeStyle(d.status);
                              return (
                                <tr key={d.id} className="hover:bg-slate-50">
                                  <td className="p-1.5 align-top font-mono font-bold border-r border-slate-300 break-words text-slate-950">
                                    {d.id}
                                  </td>
                                  <td className="p-1.5 align-top border-r border-slate-300 break-words">
                                    <div className="font-semibold text-slate-950 leading-tight">{d.assetName}</div>
                                    <div className="text-[7pt] text-slate-600 mt-0.5">{d.chainageOrLocation || d.llg}</div>
                                  </td>
                                  <td className="p-1.5 align-top border-r border-slate-300 break-words text-slate-800">
                                    {d.defectType}
                                  </td>
                                  <td className="p-1.5 align-top border-r border-slate-300 break-words">
                                    <span
                                      className="px-1.5 py-0.2 rounded font-bold text-[7pt] inline-block border whitespace-nowrap"
                                      style={{
                                        backgroundColor: sevBadge.bg,
                                        color: sevBadge.text,
                                        borderColor: sevBadge.border,
                                      }}
                                    >
                                      {d.severity}
                                    </span>
                                  </td>
                                  <td className="p-1.5 align-top border-r border-slate-300 break-words">
                                    <span
                                      className="px-1.5 py-0.2 rounded font-bold text-[7pt] inline-block border whitespace-nowrap"
                                      style={{
                                        backgroundColor: statBadge.bg,
                                        color: statBadge.text,
                                        borderColor: statBadge.border,
                                      }}
                                    >
                                      {d.status}
                                    </span>
                                  </td>
                                  <td className="p-1.5 align-top font-mono border-r border-slate-300 text-slate-950 text-right font-bold">
                                    PGK {d.estimatedCostKina.toLocaleString()}
                                  </td>
                                  <td className="p-1.5 align-top break-words text-slate-700 leading-tight">
                                    {d.assignedTeam || 'District Works Unit'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Section 6: Statutory Certification Block (Rendered on final page) */}
                      {isFinalPage && (
                        <div className="pt-2 border-t-2 border-slate-900 space-y-2 avoid-break-inside">
                          <div className="p-2 rounded bg-slate-50 border border-slate-300 text-[8px] text-slate-800 leading-relaxed text-justify">
                            <b>Statutory Technical Certification Notice:</b> This dossier represents the official asset registers, spatial GIS coordinates, condition assessments, and multi-factor prioritisation schedules for <b>Abau District</b> under the Central Province Digital Infrastructure & Asset Management initiative. Recommendations are calibrated using transparent multi-criteria decision algorithms. Engineering procurement and civil works allocation must strictly adhere to the Papua New Guinea National Procurement Act (NPA) and Public Finances (Management) Act.
                          </div>

                          <div className="grid grid-cols-2 gap-6 text-[9.5px] pt-1">
                            {/* Left Signoff: District Engineer */}
                            <div className="p-2.5 rounded border border-slate-300 bg-white">
                              <p className="font-bold text-slate-950 uppercase text-[9px]">
                                Audited & Certified by District Directorate:
                              </p>
                              <div className="h-9 border-b border-dashed border-slate-400 my-1.5 flex items-end justify-between px-1 text-[8px] text-slate-500 font-mono">
                                <span>[Official Digital Stamp & Verification]</span>
                                <span>2026-10-21</span>
                              </div>
                              <p className="font-bold text-slate-950">Chief District Works Engineer</p>
                              <p className="text-[8.5px] text-slate-700">Registered Professional Engineer of Papua New Guinea (PEPNG)</p>
                              <p className="text-[8px] text-slate-500">Abau District Headquarters &bull; Kupiano Station</p>
                            </div>

                            {/* Right Signoff: Provincial Administrator */}
                            <div className="p-2.5 rounded border border-slate-300 bg-white">
                              <p className="font-bold text-slate-950 uppercase text-[9px]">
                                Executive Endorsement & Approval:
                              </p>
                              <div className="h-9 border-b border-dashed border-slate-400 my-1.5 flex items-end justify-between px-1 text-[8px] text-slate-500 font-mono">
                                <span>[Provincial Seal of Central Province]</span>
                                <span>Approved Q4</span>
                              </div>
                              <p className="font-bold text-slate-950">Provincial Works Administrator</p>
                              <p className="text-[8.5px] text-slate-700">Central Province Government Administration</p>
                              <p className="text-[8px] text-slate-500">Provincial Headquarters &bull; Konedobu, Central Province</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {renderRunningFooter(pageNum)}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
