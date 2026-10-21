import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { Asset, ConditionRating, District } from '../types';
import { ABAU_VILLAGES } from '../data/abauVillages';
import {
  CENTRAL_PROVINCE_ROAD_LINKS,
  HIGHWAY_STATION_WAYPOINTS,
  TOTAL_ROAD_NETWORK_KM,
  CentralProvinceRoadLink,
} from '../data/centralProvinceRoads';
import {
  Layers,
  MapPin,
  Compass,
  Eye,
  AlertTriangle,
  Info,
  Maximize2,
  ChevronRight,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Satellite,
  CheckCircle2,
  Home,
  FileText,
  Route,
  Navigation,
  Check,
} from 'lucide-react';

// Tile provider presets - including Google Maps Roadmap and Satellite Hybrid
const BASEMAP_TILES = {
  googleRoads: {
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Road Network &bull; Central Province',
    name: 'Google Maps Roadmap',
  },
  googleHybrid: {
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satellite + Road Vectors',
    name: 'Google Maps Hybrid',
  },
  cartoDark: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'Topographic Voyager',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; High-Res Satellite Imagery',
    name: 'Satellite Terrain',
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    name: 'Standard OpenStreetMap',
  },
};

const CONDITION_COLORS: Record<ConditionRating, { border: string; bg: string; text: string; hex: string }> = {
  Good: { border: 'border-emerald-500', bg: 'bg-emerald-500', text: 'text-emerald-400', hex: '#10b981' },
  Fair: { border: 'border-amber-500', bg: 'bg-amber-500', text: 'text-amber-400', hex: '#f59e0b' },
  Poor: { border: 'border-orange-500', bg: 'bg-orange-500', text: 'text-orange-400', hex: '#f97316' },
  Critical: { border: 'border-rose-600', bg: 'bg-rose-600', text: 'text-rose-400', hex: '#e11d48' },
};

const DISTRICT_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  All: { lat: -10.15, lng: 148.60, zoom: 10 },
  Abau: { lat: -10.15, lng: 148.60, zoom: 10 },
  Rigo: { lat: -9.83, lng: 147.62, zoom: 10 },
};

const ABAU_LLG_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  All: { lat: -10.15, lng: 148.60, zoom: 10 },
  'Aroma LLG': { lat: -10.14, lng: 148.04, zoom: 12 },
  'Kupiano LLG': { lat: -10.075, lng: 148.18, zoom: 13 },
  'Cloudy Bay LLG': { lat: -10.16, lng: 148.55, zoom: 11 },
  'Amazon Bay LLG': { lat: -10.28, lng: 149.36, zoom: 11 },
};

export const GisMap: React.FC = () => {
  const {
    filteredAssets,
    defects,
    selectedAssetId,
    setSelectedAssetId,
    districtFilter,
    setDistrictFilter,
    assetTypeFilter,
    setAssetTypeFilter,
    conditionFilter,
    setConditionFilter,
    priorityFilter,
    setPriorityFilter,
    searchQuery,
    setSearchQuery,
    setActiveTab,
    setIsQuickCaptureOpen,
    setIsPdfStudioOpen,
    showFrozenRigo,
    setShowFrozenRigo,
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const roadLinesLayerRef = useRef<L.LayerGroup | null>(null);
  const defectsLayerRef = useRef<L.LayerGroup | null>(null);
  const villagesLayerRef = useRef<L.LayerGroup | null>(null);
  const corridorLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer Visibility states
  const [showRoads, setShowRoads] = useState(true);
  const [showBridges, setShowBridges] = useState(true);
  const [showCulverts, setShowCulverts] = useState(true);
  const [showDrainage, setShowDrainage] = useState(true);
  const [showDefects, setShowDefects] = useState(true);
  const [showVillages, setShowVillages] = useState(true);
  const [showCorridor, setShowCorridor] = useState(true);
  const [selectedCorridorId, setSelectedCorridorId] = useState<string | null>(null);
  const [activeAbauLlg, setActiveAbauLlg] = useState<string>('All');
  const [currentBaseMap, setCurrentBaseMap] = useState<keyof typeof BASEMAP_TILES>('googleRoads');

  // UI Drawer states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTabPanel, setActiveTabPanel] = useState<'info' | 'corridors' | 'layers' | 'visibleList' | 'villages'>('corridors');
  const [googleMapsKeyInput, setGoogleMapsKeyInput] = useState('');
  const [showGmapsModal, setShowGmapsModal] = useState(false);

  // Selected asset object
  const activeAsset = useMemo(() => {
    return filteredAssets.find(a => a.id === selectedAssetId) || filteredAssets[0] || null;
  }, [filteredAssets, selectedAssetId]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Leaflet icon default fix
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const initialCenter = ABAU_LLG_CENTERS.All;
    const map = L.map(mapContainerRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: initialCenter.zoom,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileCfg = BASEMAP_TILES[currentBaseMap];
    const tiles = L.tileLayer(tileCfg.url, {
      attribution: tileCfg.attribution,
      maxZoom: 18,
    }).addTo(map);

    tileLayerRef.current = tiles;
    corridorLayerRef.current = L.layerGroup().addTo(map);
    roadLinesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    defectsLayerRef.current = L.layerGroup().addTo(map);
    villagesLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileCfg = BASEMAP_TILES[currentBaseMap];
    tileLayerRef.current.setUrl(tileCfg.url);
  }, [currentBaseMap]);

  // Fly to district when districtFilter changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const target = DISTRICT_CENTERS[districtFilter as keyof typeof DISTRICT_CENTERS] || DISTRICT_CENTERS.All;
    mapInstanceRef.current.flyTo([target.lat, target.lng], target.zoom, { duration: 1.2 });
  }, [districtFilter]);

  // Render Markers & Road alignments
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !roadLinesLayerRef.current || !defectsLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    roadLinesLayerRef.current.clearLayers();
    defectsLayerRef.current.clearLayers();

    filteredAssets.forEach(asset => {
      const isSelected = asset.id === selectedAssetId;
      const conditionColor = CONDITION_COLORS[asset.conditionClassification];

      // Road polylines
      if (asset.type === 'road' && asset.alignmentPolyline && showRoads) {
        const polyline = L.polyline(asset.alignmentPolyline, {
          color: conditionColor.hex,
          weight: isSelected ? 8 : 5,
          opacity: isSelected ? 0.95 : 0.8,
          dashArray: asset.conditionClassification === 'Critical' ? '8, 8' : undefined,
        });

        polyline.bindTooltip(
          `<div class="p-1 text-xs font-semibold">
            <span class="text-slate-800">${asset.name}</span><br/>
            <span style="color: ${conditionColor.hex}">Condition: ${asset.conditionClassification} (${asset.conditionScore}/100)</span>
          </div>`,
          { sticky: true }
        );

        polyline.on('click', () => {
          setSelectedAssetId(asset.id);
        });

        polyline.addTo(roadLinesLayerRef.current!);
      }

      // Check asset visibility by type toggle
      let isTypeVisible = true;
      if (asset.type === 'road' && !showRoads) isTypeVisible = false;
      if (asset.type === 'bridge' && !showBridges) isTypeVisible = false;
      if (asset.type === 'culvert' && !showCulverts) isTypeVisible = false;
      if (asset.type === 'drainage' && !showDrainage) isTypeVisible = false;
      if (asset.type === 'causeway' && !showBridges) isTypeVisible = false;

      if (!isTypeVisible) return;

      // Custom HTML Marker
      const typeIcons: Record<string, string> = {
        bridge: '🌉',
        road: '🛣️',
        culvert: '⭕',
        drainage: '💧',
        causeway: '🌊',
      };

      const iconEmoji = typeIcons[asset.type] || '📍';
      const pulseHtml = asset.conditionClassification === 'Critical' ? `<span class="animate-ping absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-500 opacity-75"></span>` : '';

      const markerHtml = `
        <div class="relative group cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
          ${pulseHtml}
          <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 ${isSelected ? 'border-amber-400 bg-slate-900 ring-2 ring-amber-400' : `${conditionColor.border} bg-slate-900`}">
            <span class="text-sm select-none">${iconEmoji}</span>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900 border-r border-b ${conditionColor.border}"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-gis-marker',
        html: markerHtml,
        iconSize: [32, 36],
        iconAnchor: [16, 36],
      });

      const marker = L.marker([asset.coordinates[0], asset.coordinates[1]], { icon: customIcon });

      marker.bindTooltip(
        `<div class="p-1 font-sans text-xs">
          <p class="font-bold text-slate-900">${asset.name}</p>
          <p class="text-slate-600">${asset.id} &bull; ${asset.llg}</p>
          <div class="mt-1 flex items-center gap-1 font-medium" style="color: ${conditionColor.hex}">
            <span>${asset.conditionClassification} Condition</span>
            <span>(${asset.conditionScore}/100)</span>
          </div>
        </div>`,
        { direction: 'top', offset: [0, -32] }
      );

      marker.on('click', () => {
        setSelectedAssetId(asset.id);
      });

      marker.addTo(markersLayerRef.current!);
    });

    // Render Defects markers if enabled
    if (showDefects) {
      defects.forEach(defect => {
        if (!defect.coordinates) return;
        if (defect.status === 'Resolved' || defect.status === 'Verified') return;

        const defectHtml = `
          <div class="relative cursor-pointer transition-transform hover:scale-125">
            <span class="animate-ping absolute -top-1 -left-1 h-4 w-4 rounded-full bg-rose-600 opacity-80"></span>
            <div class="w-7 h-7 rounded-md bg-rose-700 border-2 border-white text-white flex items-center justify-center shadow-md">
              <span class="text-xs font-black">!</span>
            </div>
          </div>
        `;

        const defectIcon = L.divIcon({
          className: 'defect-gis-marker',
          html: defectHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const defectMarker = L.marker(defect.coordinates, { icon: defectIcon });
        defectMarker.bindTooltip(
          `<div class="p-1 text-xs">
            <p class="font-bold text-rose-700">[DEFECT] ${defect.defectType}</p>
            <p class="text-slate-800">${defect.assetName}</p>
            <p class="text-slate-600">Severity: <b>${defect.severity}</b> &bull; ${defect.status}</p>
          </div>`
        );

        defectMarker.on('click', () => {
          setSelectedAssetId(defect.assetId);
        });

        defectMarker.addTo(defectsLayerRef.current!);
      });
    }

    // Render Central Province Road Corridors & Actual Surveyed Highway Links
    if (corridorLayerRef.current) {
      corridorLayerRef.current.clearLayers();
      if (showCorridor) {
        CENTRAL_PROVINCE_ROAD_LINKS.forEach(link => {
          if (selectedCorridorId && selectedCorridorId !== link.id) return;
          const isSelected = selectedCorridorId === link.id;

          // Road polyline casing for crisp visibility on Google Maps and satellite tiles
          const casing = L.polyline(link.coordinates, {
            color: '#020617',
            weight: isSelected ? 8 : 6,
            opacity: 0.9,
          });
          casing.addTo(corridorLayerRef.current!);

          // Actual Highway Polyline (snapped to real surveyed roads on Google Maps)
          const polyline = L.polyline(link.coordinates, {
            color: link.color,
            weight: isSelected ? 6 : 4,
            opacity: 0.95,
            dashArray: link.dashArray,
          });

          polyline.bindTooltip(
            `<div class="p-2.5 font-sans text-xs bg-slate-950 text-slate-100 rounded-lg shadow-2xl border border-slate-700 min-w-[240px]">
              <div class="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-800">
                <span class="px-2 py-0.5 rounded font-black text-[10px] font-mono text-slate-950" style="background-color: ${link.color}">
                  ${link.routeNumber}
                </span>
                <span class="text-[11px] font-mono text-emerald-400 font-bold">${link.lengthKm} km</span>
              </div>
              <p class="font-bold text-white text-xs mb-0.5">${link.name}</p>
              <p class="text-slate-400 text-[10px] mb-1.5">${link.corridorType} &bull; ${link.surfaceType}</p>
              <div class="space-y-0.5 text-[10px] text-slate-300 bg-slate-900/90 p-1.5 rounded border border-slate-800">
                <p><span class="text-slate-500">From:</span> ${link.startTown}</p>
                <p><span class="text-slate-500">To:</span> ${link.endTown}</p>
              </div>
              <div class="flex items-center justify-between text-[10px] mt-1.5 pt-1 border-t border-slate-800/80">
                <span class="text-slate-400">Status: <b class="text-slate-200">${link.status}</b></span>
                <span class="font-bold uppercase" style="color: ${link.color}">${link.conditionClassification}</span>
              </div>
            </div>`,
            { sticky: true }
          );

          polyline.on('click', () => {
            setSelectedCorridorId(link.id);
            setActiveTabPanel('corridors');
            setIsSidebarOpen(true);
            if (mapInstanceRef.current) {
              mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
            }
          });

          polyline.addTo(corridorLayerRef.current!);
        });

        // Key Highway Transit Stations & Junctions
        HIGHWAY_STATION_WAYPOINTS.forEach((wp, idx) => {
          const wpIcon = L.divIcon({
            className: 'highway-station-marker',
            html: `
              <div class="relative group cursor-pointer hover:scale-125 transition-transform">
                <div class="w-6 h-6 rounded-full bg-slate-950 border-2 border-amber-400 text-amber-400 flex items-center justify-center font-black text-[10px] shadow-2xl">
                  ${idx + 1}
                </div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const wpMarker = L.marker([wp.lat, wp.lng], { icon: wpIcon });
          wpMarker.bindTooltip(
            `<div class="p-2 font-sans text-xs bg-slate-950 text-slate-100 rounded-lg shadow-2xl border border-slate-700 max-w-xs">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-[9px] font-mono">
                  ${idx + 1}
                </span>
                <p class="font-bold text-white text-xs">${wp.name}</p>
              </div>
              <p class="text-slate-400 text-[11px] mb-1.5">${wp.role}</p>
              <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                <span>${wp.district} &bull; ${wp.llg}</span>
                <span class="text-amber-400 font-bold">${wp.mileageKmFromPom} km from POM</span>
              </div>
            </div>`
          );

          wpMarker.on('click', () => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([wp.lat, wp.lng], 13, { duration: 1.0 });
            }
          });

          wpMarker.addTo(corridorLayerRef.current!);
        });
      }
    }

    // Render 61 Abau District Villages
    if (villagesLayerRef.current) {
      villagesLayerRef.current.clearLayers();
      if (showVillages) {
        ABAU_VILLAGES.forEach(village => {
          if (activeAbauLlg !== 'All' && village.llg !== activeAbauLlg) return;

          const vIcon = L.divIcon({
            className: 'village-gis-marker',
            html: `
              <div class="relative group cursor-pointer hover:scale-125 transition-transform">
                <div class="w-4 h-4 rounded-full bg-emerald-600 border border-white text-white flex items-center justify-center shadow text-[8px]">
                  🏘️
                </div>
              </div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          const vMarker = L.marker([village.lat, village.lng], { icon: vIcon });
          vMarker.bindTooltip(
            `<div class="p-1 text-xs">
              <p class="font-bold text-emerald-800">${village.name} (Village #${village.id})</p>
              <p class="text-slate-700 font-semibold">${village.llg}</p>
              <p class="text-slate-500 font-mono text-[9px]">Coord: ${village.lat.toFixed(5)}°, ${village.lng.toFixed(5)}°</p>
            </div>`
          );
          vMarker.addTo(villagesLayerRef.current!);
        });
      }
    }
  }, [
    filteredAssets,
    defects,
    selectedAssetId,
    showRoads,
    showBridges,
    showCulverts,
    showDrainage,
    showDefects,
    showVillages,
    showCorridor,
    selectedCorridorId,
    activeAbauLlg,
  ]);

  // Pan to selected asset when it changes
  const handleSelectAsset = (asset: Asset) => {
    setSelectedAssetId(asset.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([asset.coordinates[0], asset.coordinates[1]], 13, { duration: 0.8 });
    }
  };

  const handleFlyToLlg = (llgName: string) => {
    setActiveAbauLlg(llgName);
    if (mapInstanceRef.current) {
      const target = ABAU_LLG_CENTERS[llgName] || ABAU_LLG_CENTERS.All;
      mapInstanceRef.current.flyTo([target.lat, target.lng], target.zoom, { duration: 1.0 });
    }
  };

  const handleFlyToVillage = (village: typeof ABAU_VILLAGES[0]) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([village.lat, village.lng], 14, { duration: 1.0 });
    }
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full flex overflow-hidden bg-slate-950">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 z-[500] flex flex-wrap items-center gap-2 max-w-[calc(100vw-2rem)] md:max-w-none">
        {/* Abau Focus & LLG Jump Buttons */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center shadow-2xl">
          <span className="px-2 text-[10px] uppercase font-bold text-emerald-400 font-mono hidden sm:inline">
            Abau Focus:
          </span>
          {(['All', 'Aroma LLG', 'Kupiano LLG', 'Cloudy Bay LLG', 'Amazon Bay LLG'] as const).map(llg => (
            <button
              key={llg}
              onClick={() => handleFlyToLlg(llg)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeAbauLlg === llg
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {llg === 'All' ? 'Whole Abau' : llg.replace(' LLG', '')}
            </button>
          ))}
        </div>

        {/* Frozen Rigo Badge */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-blue-500/30 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 shadow-2xl text-xs text-blue-300">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span className="font-semibold text-[11px]">Rigo Frozen (Directive)</span>
        </div>

        {/* Quick Review & Save as PDF from GIS */}
        <button
          onClick={() => setIsPdfStudioOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xl transition-all cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Save as PDF</span>
        </button>

        {/* Base Map Switcher */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center shadow-2xl">
          <button
            onClick={() => setCurrentBaseMap('googleRoads')}
            className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
              currentBaseMap === 'googleRoads'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Google Maps Roadmap (Shows native Google surveyed roads & labels)"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Google Roads</span>
          </button>
          <button
            onClick={() => setCurrentBaseMap('googleHybrid')}
            className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
              currentBaseMap === 'googleHybrid'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Google Maps Satellite Hybrid (Satellite imagery with Google road labels)"
          >
            <Satellite className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Google Hybrid</span>
          </button>
          <button
            onClick={() => setCurrentBaseMap('cartoDark')}
            className={`px-2 py-1.5 rounded-lg text-xs flex items-center gap-1 font-medium transition-all cursor-pointer ${
              currentBaseMap === 'cartoDark'
                ? 'bg-slate-800 text-amber-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Topographic Voyager Map"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Topo</span>
          </button>
          <button
            onClick={() => setCurrentBaseMap('satellite')}
            className={`px-2 py-1.5 rounded-lg text-xs flex items-center gap-1 font-medium transition-all cursor-pointer ${
              currentBaseMap === 'satellite'
                ? 'bg-slate-800 text-amber-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="ESRI World Satellite Imagery"
          >
            <span className="hidden md:inline">ESRI Sat</span>
          </button>
        </div>

        {/* Road Corridors Quick Toggle */}
        <button
          onClick={() => {
            setShowCorridor(prev => !prev);
            setActiveTabPanel('corridors');
            setIsSidebarOpen(true);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all border cursor-pointer ${
            showCorridor
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Central Province Road Links & Alignments"
        >
          <Route className="w-3.5 h-3.5 text-amber-400" />
          <span>Magi Highway Links ({TOTAL_ROAD_NETWORK_KM.toFixed(0)} km)</span>
          {showCorridor && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
        </button>

        {/* Quick Field Capture Action */}
        <button
          onClick={() => setIsQuickCaptureOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xl transition-all"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>GPS Field Log</span>
        </button>
      </div>

      {/* Main Map Canvas */}
      <div className="flex-1 h-full w-full relative">
        <div ref={mapContainerRef} className="h-full w-full z-0 bg-slate-950" />

        {/* Bottom Floating Legend */}
        <div className="absolute bottom-6 left-4 z-[500] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl text-xs text-slate-300 max-w-xs hidden sm:block">
          <div className="flex items-center justify-between font-semibold text-slate-200 mb-2 pb-1 border-b border-slate-800">
            <span>Condition Classifications</span>
            <span className="text-[10px] text-amber-400 uppercase tracking-wider">CP Works</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Good (70-100)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Fair (50-69)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>Poor (35-49)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
              <span>Critical (&lt;35)</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>🔴 Active Defect Alert</span>
            <span>🛣️ Road Polyline</span>
          </div>
        </div>

        {/* Demonstration Disclaimer Tag */}
        <div className="absolute bottom-2 right-16 z-[400] bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 px-2 py-0.5 rounded text-[10px] text-slate-400 pointer-events-none">
          Demo coordinates for illustrative planning &bull; Central Province Government
        </div>
      </div>

      {/* Right Collapsible Inspector & Filter Sidebar */}
      <div
        className={`relative z-[500] h-full bg-slate-900 border-l border-slate-800 flex flex-col transition-all duration-300 shadow-2xl ${
          isSidebarOpen ? 'w-full sm:w-96 md:w-[420px]' : 'w-12'
        }`}
      >
        {/* Toggle Collapse Bar */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -left-3 top-6 z-50 bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950 border border-slate-700 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-colors"
          title={isSidebarOpen ? 'Collapse GIS Panel' : 'Expand GIS Panel'}
        >
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`} />
        </button>

        {isSidebarOpen ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Tabs */}
            <div className="px-4 pt-4 pb-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
              <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold w-full">
                <button
                  onClick={() => setActiveTabPanel('corridors')}
                  className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTabPanel === 'corridors'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Route className="w-3.5 h-3.5" />
                  <span>Road Links (5)</span>
                </button>
                <button
                  onClick={() => setActiveTabPanel('info')}
                  className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTabPanel === 'info'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Asset Details
                </button>
                <button
                  onClick={() => setActiveTabPanel('villages')}
                  className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTabPanel === 'villages'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Villages (61)
                </button>
                <button
                  onClick={() => setActiveTabPanel('layers')}
                  className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTabPanel === 'layers'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  GIS Layers
                </button>
                <button
                  onClick={() => setActiveTabPanel('visibleList')}
                  className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTabPanel === 'visibleList'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Assets ({filteredAssets.length})
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: ASSET DETAILS */}
            {activeTabPanel === 'info' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeAsset ? (
                  <>
                    {/* Header Card */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                            {activeAsset.id}
                          </span>
                          <h2 className="text-base font-bold text-white mt-1.5 leading-snug">
                            {activeAsset.name}
                          </h2>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-amber-500" />
                            {activeAsset.district} District &bull; {activeAsset.llg}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                              activeAsset.conditionClassification === 'Good'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : activeAsset.conditionClassification === 'Fair'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : activeAsset.conditionClassification === 'Poor'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                            }`}
                          >
                            {activeAsset.conditionClassification} ({activeAsset.conditionScore}/100)
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        {activeAsset.description}
                      </p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400">GPS Coordinates:</span>
                        <span className="font-mono text-slate-200">
                          {activeAsset.coordinates[0].toFixed(4)}°, {activeAsset.coordinates[1].toFixed(4)}°
                        </span>
                      </div>
                    </div>

                    {/* Photos Preview */}
                    {activeAsset.photos && activeAsset.photos.length > 0 && (
                      <div className="rounded-xl overflow-hidden border border-slate-800 relative group">
                        <img
                          src={activeAsset.photos[0]}
                          alt={activeAsset.name}
                          className="w-full h-44 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end p-3">
                          <span className="text-[11px] text-slate-300 font-medium">
                            Field Photographic Evidence &bull; Last verified {activeAsset.lastInspectionDate}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Technical Characteristics */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-500" />
                        Technical Characteristics
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Asset Type</span>
                          <span className="font-semibold text-slate-200 capitalize">{activeAsset.type}</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Surface / Construction</span>
                          <span className="font-semibold text-slate-200 truncate block">
                            {activeAsset.technicalSpecs.surfaceType || 'Standard'}
                          </span>
                        </div>
                        {activeAsset.technicalSpecs.spanMeters && (
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Bridge Span</span>
                            <span className="font-semibold text-slate-200">{activeAsset.technicalSpecs.spanMeters} meters</span>
                          </div>
                        )}
                        {activeAsset.technicalSpecs.lengthMeters && (
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Route Length</span>
                            <span className="font-semibold text-slate-200">{(activeAsset.technicalSpecs.lengthMeters / 1000).toFixed(1)} km</span>
                          </div>
                        )}
                        {activeAsset.technicalSpecs.designTonnage && (
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Design Load</span>
                            <span className="font-semibold text-slate-200">{activeAsset.technicalSpecs.designTonnage} Tonnes</span>
                          </div>
                        )}
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Est. Replacement Value</span>
                          <span className="font-semibold text-amber-400 font-mono">
                            PGK {(activeAsset.replacementValueKina / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Priority & Defect Status */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                          Maintenance Priority Model
                        </h3>
                        <span className="text-xs font-bold text-amber-400 font-mono">
                          Score: {activeAsset.priorityScore}/100
                        </span>
                      </div>

                      {/* Factor contributions */}
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between text-slate-400">
                          <span>Condition Deficit Factor:</span>
                          <span className="text-slate-200">{activeAsset.priorityFactors.conditionDeficit}/100</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-full rounded-full" style={{ width: `${activeAsset.priorityFactors.conditionDeficit}%` }} />
                        </div>

                        <div className="flex justify-between text-slate-400 pt-1">
                          <span>Infrastructure Importance:</span>
                          <span className="text-slate-200">{activeAsset.priorityFactors.infrastructureImportance}/100</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${activeAsset.priorityFactors.infrastructureImportance}%` }} />
                        </div>

                        <div className="flex justify-between text-slate-400 pt-1">
                          <span>Service Disruption / Isolation:</span>
                          <span className="text-slate-200">{activeAsset.priorityFactors.serviceDisruption}/100</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: `${activeAsset.priorityFactors.serviceDisruption}%` }} />
                        </div>
                      </div>

                      {activeAsset.priorityOverride && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                          <div className="font-bold flex items-center gap-1">
                            <span>⚠️ Engineering Override Active</span>
                          </div>
                          <p className="text-[11px] text-amber-200">
                            Reason: {activeAsset.priorityOverride.overrideReason}
                          </p>
                          <p className="text-[10px] text-amber-400/80">
                            By {activeAsset.priorityOverride.overriddenBy} &bull; {new Date(activeAsset.priorityOverride.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                        <span className="text-slate-400 block text-[10px]">Recommended Action</span>
                        <p className="text-slate-200 font-medium mt-0.5">
                          {activeAsset.recommendedAction}
                        </p>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => {
                          setSelectedAssetId(activeAsset.id);
                          setActiveTab('inspections');
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>New Inspection</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAssetId(activeAsset.id);
                          setActiveTab('defects');
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Log Defect</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <MapPin className="w-10 h-10 text-slate-600 mb-2 stroke-1" />
                    <p className="text-sm font-medium">Select an asset from the map or list</p>
                    <p className="text-xs text-slate-500 mt-1">Click any marker or road segment to inspect its condition.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CENTRAL PROVINCE ROAD CORRIDORS & REAL ALIGNMENTS */}
            {activeTabPanel === 'corridors' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Header Overview Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      National & Provincial Trunk
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Google Maps Road Verified
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Central Province Road Links
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Actual highway corridors and alignments surveyed across Central Province and Abau District, following real road tracks shown on Google Maps.
                    </p>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Total Monitored Length</span>
                      <span className="text-base font-black text-amber-400 font-mono">{TOTAL_ROAD_NETWORK_KM.toFixed(1)} km</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Core Highway Links</span>
                      <span className="text-base font-black text-white font-mono">5 Arterials</span>
                    </div>
                  </div>

                  {/* Selected Corridor Filter Clear */}
                  {selectedCorridorId && (
                    <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-xs">
                      <span className="text-amber-300 font-medium text-[11px] truncate max-w-[200px]">
                        Filtered: {CENTRAL_PROVINCE_ROAD_LINKS.find(l => l.id === selectedCorridorId)?.name}
                      </span>
                      <button
                        onClick={() => setSelectedCorridorId(null)}
                        className="text-[10px] text-amber-400 font-bold underline cursor-pointer shrink-0"
                      >
                        Show All Links
                      </button>
                    </div>
                  )}
                </div>

                {/* Corridor Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    <span>Arterial Corridors ({CENTRAL_PROVINCE_ROAD_LINKS.length})</span>
                    <span>Length</span>
                  </div>

                  {CENTRAL_PROVINCE_ROAD_LINKS.map(link => {
                    const isSelected = selectedCorridorId === link.id;
                    return (
                      <div
                        key={link.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-slate-950 border-amber-500 ring-1 ring-amber-500/40 shadow-xl'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-black font-mono text-slate-950"
                              style={{ backgroundColor: link.color }}
                            >
                              {link.routeNumber}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {link.status}
                            </span>
                          </div>
                          <span className="text-xs font-black font-mono text-emerald-400">
                            {link.lengthKm} km
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-white mb-1">
                          {link.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                          {link.description}
                        </p>

                        <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800/80 text-[10px] space-y-1 mb-3">
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Surface Type:</span>
                            <span className="text-slate-200 font-medium truncate max-w-[180px]">{link.surfaceType}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Condition:</span>
                            <span className="font-bold uppercase" style={{ color: link.color }}>{link.conditionClassification}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400 pt-0.5 border-t border-slate-800">
                            <span>Coverage:</span>
                            <span className="text-slate-300 truncate max-w-[180px]">{link.district}</span>
                          </div>
                        </div>

                        {/* Key Towns Pills */}
                        <div className="mb-3">
                          <span className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Key Stations & Townships:</span>
                          <div className="flex flex-wrap gap-1">
                            {link.keyTowns.slice(0, 6).map((t, idx) => (
                              <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                                {t}
                              </span>
                            ))}
                            {link.keyTowns.length > 6 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                +{link.keyTowns.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCorridorId(isSelected ? null : link.id);
                              if (mapInstanceRef.current) {
                                const poly = L.polyline(link.coordinates);
                                mapInstanceRef.current.fitBounds(poly.getBounds(), { padding: [40, 40] });
                              }
                            }}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 shadow'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>{isSelected ? 'Corridor Selected (Click to Reset)' : 'Focus Road Link'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Highway Station Transit List */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Highway Stations & Junctions</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">14 Key Nodes</span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {HIGHWAY_STATION_WAYPOINTS.map((wp, idx) => (
                      <div
                        key={wp.id}
                        onClick={() => {
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.flyTo([wp.lat, wp.lng], 13, { duration: 1.0 });
                          }
                        }}
                        className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between text-xs group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-[9px] font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-white group-hover:text-amber-400 transition-colors block text-[11px]">{wp.name}</span>
                            <span className="text-[10px] text-slate-400 block">{wp.llg}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          {wp.mileageKmFromPom} km
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 61 ABAU DISTRICT VILLAGES */}
            {activeTabPanel === 'villages' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                      Gazetted Rural Register
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{ABAU_VILLAGES.length} Settlements</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">Abau District Villages</h3>
                  <p className="text-[11px] text-slate-400">
                    All 61 monitored village settlements across Aroma, Kupiano, Cloudy Bay, and Amazon Bay LLGs.
                  </p>
                </div>

                <div className="space-y-1.5">
                  {ABAU_VILLAGES.filter(v => activeAbauLlg === 'All' || v.llg === activeAbauLlg).map(village => (
                    <div
                      key={village.id}
                      onClick={() => handleFlyToVillage(village)}
                      className="p-2.5 rounded-lg bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-emerald-500/40 cursor-pointer transition-all flex items-center justify-between text-xs group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏡</span>
                        <div>
                          <span className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors block">{village.name}</span>
                          <span className="text-[10px] text-slate-500">{village.llg}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">#{village.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: GIS LAYERS */}
            {activeTabPanel === 'layers' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-500" />
                    Infrastructure Vector Layers
                  </h3>
                  <div className="space-y-2.5">
                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🛣️</span>
                        <div>
                          <span className="font-semibold text-slate-200 block">Road Corridors & Alignments</span>
                          <span className="text-[10px] text-slate-400">Magi Highway & feeder arteries</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showRoads}
                        onChange={e => setShowRoads(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🌉</span>
                        <div>
                          <span className="font-semibold text-slate-200 block">Bridges & Major River Spans</span>
                          <span className="text-[10px] text-slate-400">Kemp Welch, Robinson, Ormand</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showBridges}
                        onChange={e => setShowBridges(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⭕</span>
                        <div>
                          <span className="font-semibold text-slate-200 block">Culverts & Water Inlets</span>
                          <span className="text-[10px] text-slate-400">Box, Armco & pipe culverts</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showCulverts}
                        onChange={e => setShowCulverts(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-base">💧</span>
                        <div>
                          <span className="font-semibold text-slate-200 block">Drainage & Stormwater Outlets</span>
                          <span className="text-[10px] text-slate-400">Masonry lined & catchwater drains</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showDrainage}
                        onChange={e => setShowDrainage(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-rose-900/50 cursor-pointer hover:border-rose-700">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⚠️</span>
                        <div>
                          <span className="font-semibold text-rose-300 block">Open Defect Hotspots</span>
                          <span className="text-[10px] text-slate-400">Critical scour, washouts & blockages</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showDefects}
                        onChange={e => setShowDefects(e.target.checked)}
                        className="rounded border-rose-700 text-rose-500 focus:ring-rose-500 h-4 w-4"
                      />
                    </label>
                  </div>
                </div>

                {/* Spatial Extents */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Spatial Jump Extents
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDistrictFilter('Rigo')}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left"
                    >
                      <span className="font-bold text-amber-400 block">Rigo District</span>
                      <span className="text-[10px] text-slate-400">Kwikila &bull; Km 0 - 95</span>
                    </button>
                    <button
                      onClick={() => setDistrictFilter('Abau')}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left"
                    >
                      <span className="font-bold text-amber-400 block">Abau District</span>
                      <span className="text-[10px] text-slate-400">Kupiano &bull; Moreguina</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: VISIBLE ASSETS LIST */}
            {activeTabPanel === 'visibleList' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="mb-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search visible assets..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {filteredAssets.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No assets match current map filters.
                  </div>
                ) : (
                  filteredAssets.map(asset => {
                    const isSelected = asset.id === selectedAssetId;
                    return (
                      <div
                        key={asset.id}
                        onClick={() => handleSelectAsset(asset)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-mono text-amber-400">{asset.id}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              asset.conditionClassification === 'Good'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : asset.conditionClassification === 'Fair'
                                ? 'bg-amber-500/20 text-amber-400'
                                : asset.conditionClassification === 'Poor'
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {asset.conditionClassification} ({asset.conditionScore})
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 mt-1">{asset.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{asset.locationDescription}</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                          <span className="capitalize">{asset.type} &bull; {asset.district}</span>
                          <span className="font-mono text-amber-400/80 font-medium">Priority: {asset.maintenancePriority}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 py-4 flex flex-col items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-800 text-amber-500"
              title="Open Inspector"
            >
              <Info className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setIsSidebarOpen(true);
                setActiveTabPanel('layers');
              }}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
              title="GIS Layers"
            >
              <Layers className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Google Maps Configuration & Fallback Information Modal */}
      {showGmapsModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">GIS Mapping Engine Architecture</h3>
                  <p className="text-xs text-slate-400">Central Province Infrastructure Platform</p>
                </div>
              </div>
              <button
                onClick={() => setShowGmapsModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                This GIS platform is architected with a <b>provider-independent spatial layer</b>:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>
                  <b className="text-slate-200">Active High-Fidelity Engine:</b> Open GIS Leaflet engine with Topographic Voyager and high-resolution Esri Satellite base maps.
                </li>
                <li>
                  <b className="text-slate-200">Offline Resilience:</b> Works seamlessly in remote Rigo and Abau valleys without external API key quotas.
                </li>
                <li>
                  <b className="text-slate-200">Google Maps Bridge:</b> Ready for production Google Maps API key via <code className="text-amber-400">VITE_GOOGLE_MAPS_API_KEY</code>.
                </li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Optional: Custom Google Maps API Key for session test
              </label>
              <input
                type="text"
                placeholder="AIzaSy..."
                value={googleMapsKeyInput}
                onChange={e => setGoogleMapsKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-400">
                If omitted, the platform automatically maintains full interactive mapping with the high-performance local GIS provider.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowGmapsModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Continue with Current Engine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
