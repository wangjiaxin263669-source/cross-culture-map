import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import './GlobeScene.css';
import {
  GLOBE_RENDER_STYLE,
  buildGlobeMaterial,
  setupGlobeSceneEffects,
} from './globePremiumSetup.js';

const SKY_BG = '/globe/night-sky.png';
const PLACEHOLDER_SURFACE = '/globe/earth-blue-marble.jpg';
const PLACEHOLDER_BUMP = '/globe/earth-topology.png';

const isLuxury = GLOBE_RENDER_STYLE === 'luxury';

function pickVisibleMarkers(all, selectedMarket, povAltitude) {
  const countries = all.filter((d) => d.marketType === 'country');
  if (povAltitude >= 1.68) return countries;

  const focusId =
    selectedMarket?.marketType === 'region'
      ? selectedMarket.parentId
      : selectedMarket?.marketType === 'country'
        ? selectedMarket.id
        : null;

  if (!focusId) return countries;

  const country = all.find((d) => d.id === focusId);
  const regions = all.filter((d) => d.parentId === focusId);
  if (!country) return countries;

  if (regions.length > 5 && povAltitude >= 1.48) return [country];

  return [country, ...regions];
}

function displayName(d) {
  return d.title || d.label;
}

const markerCache = new WeakMap();

function buildMarkerEl(d, onPick) {
  if (markerCache.has(d)) return markerCache.get(d);

  const root = document.createElement('button');
  root.type = 'button';
  root.className = `globe-pin globe-pin--${d.marketType === 'country' ? 'country' : 'region'}`;
  root.setAttribute('aria-label', displayName(d));

  const dot = document.createElement('span');
  dot.className = 'globe-pin-dot';

  const text = document.createElement('span');
  text.className = 'globe-pin-text';
  text.textContent = displayName(d);

  root.appendChild(dot);
  root.appendChild(text);
  root.addEventListener('click', (e) => {
    e.stopPropagation();
    onPick?.(d);
  });

  markerCache.set(d, root);
  return root;
}

const GlobeScene = forwardRef(function GlobeScene(
  { labelsData, selectedMarket, onGlobeReady, onLabelClick },
  ref,
) {
  const innerRef = useRef(null);
  const povAltitudeRef = useRef(1.75);
  const [povTick, setPovTick] = useState(0);
  const [globeMaterial, setGlobeMaterial] = useState(null);
  const [materialError, setMaterialError] = useState(null);
  const rafRef = useRef(0);
  const sceneReadyRef = useRef(false);

  const setRefs = useCallback(
    (node) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useEffect(() => {
    let alive = true;
    buildGlobeMaterial()
      .then((mat) => {
        if (alive) {
          setGlobeMaterial(mat);
          setMaterialError(null);
        }
      })
      .catch((err) => {
        if (alive) {
          setMaterialError(err);
          if (import.meta.env.DEV) {
            console.error('[GlobeScene] 地球材质加载失败:', err);
          }
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      const globe = innerRef.current;
      if (globe?.pointOfView) {
        const pov = globe.pointOfView();
        if (pov?.altitude != null && Math.abs(povAltitudeRef.current - pov.altitude) > 0.02) {
          povAltitudeRef.current = pov.altitude;
          setPovTick((n) => n + 1);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const visibleMarkers = useMemo(
    () => pickVisibleMarkers(labelsData || [], selectedMarket, povAltitudeRef.current),
    [labelsData, selectedMarket, povTick],
  );

  const ringData = useMemo(() => {
    if (!selectedMarket?.lat) return [];
    return [selectedMarket];
  }, [selectedMarket]);

  const finishGlobeReady = useCallback(() => {
    sceneReadyRef.current = true;
    onGlobeReady?.();
  }, [onGlobeReady]);

  const handleGlobeReady = useCallback(() => {
    setupGlobeSceneEffects(innerRef.current)
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.error('[GlobeScene] 地球场景效果设置失败:', err);
        }
      })
      .finally(finishGlobeReady);
  }, [finishGlobeReady]);

  const htmlElement = useCallback(
    (d) => buildMarkerEl(d, onLabelClick),
    [onLabelClick],
  );

  if (!globeMaterial && !materialError) {
    return (
      <div className={`globe-scene-root globe-scene-root--${GLOBE_RENDER_STYLE} globe-scene-root--loading`}>
        <div className="globe-loading-hint" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={`globe-scene-root globe-scene-root--${GLOBE_RENDER_STYLE}`}>
      {materialError && import.meta.env.DEV && (
        <div className="globe-dev-error" role="status">
          地球贴图加载失败，请运行 npm run globe:textures
        </div>
      )}
      <Globe
        ref={setRefs}
        onGlobeReady={handleGlobeReady}
        globeMaterial={globeMaterial || undefined}
        globeImageUrl={globeMaterial ? undefined : PLACEHOLDER_SURFACE}
        bumpImageUrl={globeMaterial ? undefined : PLACEHOLDER_BUMP}
        backgroundImageUrl={SKY_BG}
        showAtmosphere
        atmosphereColor={isLuxury ? '#9a9088' : '#7a7268'}
        atmosphereAltitude={isLuxury ? 0.125 : 0.14}
        htmlElementsData={visibleMarkers}
        htmlLat={(d) => d.lat}
        htmlLng={(d) => d.lng}
        htmlAltitude={(d) => (d.marketType === 'country' ? 0.025 : 0.015)}
        htmlElement={htmlElement}
        ringsData={ringData}
        ringLat={(d) => d.lat}
        ringLng={(d) => d.lng}
        ringColor={() => 'rgba(201, 184, 150, 0.32)'}
        ringMaxRadius={2.6}
        ringPropagationSpeed={2.2}
        ringRepeatPeriod={1500}
        ringAltitude={0.006}
      />
    </div>
  );
});

export default GlobeScene;
