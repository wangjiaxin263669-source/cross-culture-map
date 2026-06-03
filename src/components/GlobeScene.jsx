import React, { forwardRef } from 'react';
import Globe from 'react-globe.gl';

/** 地球 3D（单独 chunk，加快首屏） */
const GlobeScene = forwardRef(function GlobeScene(
  { labelsData, onGlobeReady, onLabelClick },
  ref,
) {
  return (
    <Globe
      ref={ref}
      onGlobeReady={onGlobeReady}
      globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
      backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
      labelsData={labelsData}
      labelLat={(d) => d.lat}
      labelLng={(d) => d.lng}
      labelText={(d) => d.label}
      labelSize={(d) => (d.marketType === 'region' ? 1.35 : d.hasRegions ? 2 : 1.8)}
      labelDotRadius={(d) => (d.marketType === 'region' ? 0.45 : d.hasRegions ? 0.75 : 0.6)}
      labelColor={(d) =>
        d.marketType === 'region' ? '#b8c5d6' : d.hasRegions ? '#c9b896' : '#f5f3ef'
      }
      labelResolution={2}
      onLabelClick={onLabelClick}
    />
  );
});

export default GlobeScene;
