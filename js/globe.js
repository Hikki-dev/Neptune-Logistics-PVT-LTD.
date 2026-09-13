/* ==========================================================================
   NEPTUNE LOGISTICS | INTERACTIVE 3D SPINNING GLOBE WITH FLOATING BADGES
   UI/UX Pro Max Custom Canvas 3D Implementation with Smooth Auto-Rotation
   ========================================================================== */

(function() {
  'use strict';

  // 1. COUNTRY DATA & COORDINATES (Latitude, Longitude)
  const countries = [
    { name: 'Sri Lanka', region: 'South Asia Hub (Head Office)', lat: 7.8731, lon: 80.7718, isHub: true },
    { name: 'India', region: 'South Asia', lat: 20.5937, lon: 78.9629 },
    { name: 'China', region: 'East Asia', lat: 35.8617, lon: 104.1954 },
    { name: 'Singapore', region: 'Southeast Asia', lat: 1.3521, lon: 103.8198 },
    { name: 'Malaysia', region: 'Southeast Asia', lat: 4.2105, lon: 101.9758 },
    { name: 'Dubai (UAE)', region: 'Middle East', lat: 25.2048, lon: 55.2708 },
    { name: 'Qatar', region: 'Middle East', lat: 25.3548, lon: 51.1839 },
    { name: 'Switzerland', region: 'Europe', lat: 46.8182, lon: 8.2275 },
    { name: 'Bulgaria', region: 'Europe', lat: 42.7339, lon: 25.4858 },
    { name: 'USA', region: 'Americas', lat: 37.0902, lon: -95.7129 },
    { name: 'Australia', region: 'Australia & Pacific', lat: -25.2744, lon: 133.7751 },
    { name: 'New Zealand', region: 'Australia & Pacific', lat: -40.9006, lon: 174.8860 },
    { name: 'Bangladesh', region: 'South Asia', lat: 23.6850, lon: 90.3563 },
    { name: 'Vietnam', region: 'Southeast Asia', lat: 14.0583, lon: 108.2772 },
    { name: 'Myanmar', region: 'Southeast Asia', lat: 21.9162, lon: 95.9560 },
    { name: 'Kenya', region: 'East Africa', lat: -1.2921, lon: 36.8219 },
    { name: 'Ukraine', region: 'Europe', lat: 48.3794, lon: 31.1186 },
    { name: 'Germany', region: 'Europe', lat: 51.1657, lon: 10.4515 },
    { name: 'UK', region: 'Europe', lat: 55.3781, lon: -3.4360 },
    { name: 'Japan', region: 'East Asia', lat: 36.2048, lon: 138.2529 },
    { name: 'South Korea', region: 'East Asia', lat: 35.9078, lon: 127.7669 },
    { name: 'Saudi Arabia', region: 'Middle East', lat: 23.8859, lon: 45.0792 },
    { name: 'South Africa', region: 'Southern Africa', lat: -30.5595, lon: 22.9375 },
    { name: 'Netherlands', region: 'Europe', lat: 52.1326, lon: 5.2913 },
    { name: 'Maldives', region: 'South Asia', lat: 3.2028, lon: 73.2207 },
    { name: 'Pakistan', region: 'South Asia', lat: 30.3753, lon: 69.3451 }
  ];

  // 2. GEOGRAPHIC COUNTRY OUTLINES — Natural Earth 110m data (js/world-geo.js).
  //    Stored as [lat, lon] rings; mapped to {lat, lon} so the renderer is unchanged.
  const continents = (window.NEPTUNE_WORLD && window.NEPTUNE_WORLD.length)
    ? window.NEPTUNE_WORLD.map(ring => ring.map(p => ({ lat: p[0], lon: p[1] })))
    : [];

  // Helper: robust rounded rectangle path
  function drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Find country pill matching name string
  function findCountryPill(name) {
    const pills = document.querySelectorAll('.globe-countries .country-pill');
    let cleanestName = name.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
    for (let pill of pills) {
      if (pill.textContent.toLowerCase().includes(cleanestName)) {
        return pill;
      }
    }
    return null;
  }

  // 3. INITIALIZE CANVAS & CONTEXT
  const canvas = document.getElementById('globe-canvas-3d');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const tooltip = document.getElementById('globe-tooltip');
  const tooltipName = document.getElementById('tooltip-name');
  const tooltipRegion = document.getElementById('tooltip-region');
  const wrap = canvas.parentElement;

  let width = 0;
  let height = 0;
  let radius = 0;
  let centerX = 0;
  let centerY = 0;
  let fov = 500;
  let resizeFrame = null;

  function resize() {
    const nextWidth = wrap.clientWidth;
    const nextHeight = wrap.clientHeight;
    if (!nextWidth || !nextHeight) return;

    width = nextWidth;
    height = nextHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    centerX = width / 2;
    centerY = height / 2;
    radius = Math.min(width, height) * 0.35;
  }

  function scheduleResize() {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resize);
  }
  
  window.addEventListener('resize', scheduleResize);
  window.addEventListener('load', scheduleResize);
  if ('ResizeObserver' in window) {
    new ResizeObserver(scheduleResize).observe(wrap);
  }
  resize();
  scheduleResize();

  // 4. 3D ROTATION STATE
  // Starts centered on Sri Lanka Hub
  let rx = 7.87 * Math.PI / 180; 
  let ry = (-80.77 * Math.PI / 180) - Math.PI; 
  let targetRx = rx;
  let targetRy = ry;
  
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let dragSpeed = 0.005;
  let autoRotateSpeed = 0.0022; // Hypnotic and continuous spinning
  let activeHoverIndex = -1;
  let externalHoverIndex = -1;

  // Fly-To State Lock: holds target focus briefly, then releases back to spin
  let isFlyToActive = false;
  let flyToStartTime = 0;

  // Convert lat/lon to spherical coordinate
  function getSphericalCoords(lat, lon, R) {
    const latRad = lat * Math.PI / 180;
    const lonRad = -lon * Math.PI / 180;
    
    const x = R * Math.cos(latRad) * Math.sin(lonRad);
    const y = -R * Math.sin(latRad);
    const z = R * Math.cos(latRad) * Math.cos(lonRad);
    return { x, y, z };
  }

  // Rotate a 3D coordinate around Y and X axes
  function rotate3D(pt, rotX, rotY) {
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    let x1 = pt.x * cosY - pt.z * sinY;
    let z1 = pt.x * sinY + pt.z * cosY;
    let y1 = pt.y;

    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    let x2 = x1;
    let y2 = y1 * cosX - z1 * sinX;
    let z2 = y1 * sinX + z1 * cosX;

    return { x: x2, y: y2, z: z2 };
  }

  // Project 3D rotated point onto 2D screen coordinate
  function project(pt) {
    const scale = fov / (fov + pt.z);
    return {
      x: centerX + pt.x * scale,
      y: centerY + pt.y * scale,
      z: pt.z,
      scale: scale
    };
  }

  // 5. GENERATE DECORATIVE GLOBE PARTICLES (GRID RINGS)
  const sphereGrid = [];
  const numLatitudeLines = 9;
  const numLongitudeLines = 12;
  const dotsPerLine = 32;

  for (let i = 0; i < numLongitudeLines; i++) {
    const lon = (i / numLongitudeLines) * 360;
    const ring = [];
    for (let j = 0; j < dotsPerLine; j++) {
      const lat = -90 + (j / (dotsPerLine - 1)) * 180;
      ring.push(getSphericalCoords(lat, lon, 1));
    }
    sphereGrid.push(ring);
  }

  for (let i = 1; i < numLatitudeLines; i++) {
    const lat = -90 + (i / numLatitudeLines) * 180;
    const ring = [];
    for (let j = 0; j < dotsPerLine; j++) {
      const lon = (j / dotsPerLine) * 360;
      ring.push(getSphericalCoords(lat, lon, 1));
    }
    sphereGrid.push(ring);
  }

  // 6. INTERACTIVE DRAG & INPUT HANDLERS
  function onPointerDown(e) {
    isDragging = true;
    isFlyToActive = false; // Cancel active fly-to on drag
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastMouseX = clientX;
    lastMouseY = clientY;
    
    activeHoverIndex = -1;
    externalHoverIndex = -1;
    tooltip.classList.remove('visible');
    pills.forEach(p => p.classList.remove('highlight'));
  }

  function onPointerMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (isDragging) {
      const dx = clientX - lastMouseX;
      const dy = clientY - lastMouseY;
      
      targetRy += dx * dragSpeed;
      targetRx += dy * dragSpeed;
      targetRx = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, targetRx));
      
      lastMouseX = clientX;
      lastMouseY = clientY;
    } else {
      const rect = canvas.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;
      checkHover(mouseX, mouseY);
    }
  }

  function onPointerUp() {
    isDragging = false;
  }

  wrap.addEventListener('mousedown', onPointerDown);
  wrap.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  wrap.addEventListener('touchstart', onPointerDown, { passive: true });
  wrap.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  // 7. COUNTRY PILLS CLICK INTERACTION (FLY-TO & HOLD)
  const pills = document.querySelectorAll('.globe-countries .country-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      
      const countryName = pill.textContent.replace(/[^\w\s\(\)-]/g, '').trim();
      const countryIdx = countries.findIndex(c => 
        c.name.toLowerCase().includes(countryName.toLowerCase()) || 
        countryName.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (countryIdx !== -1) {
        // Lock selections
        activeHoverIndex = countryIdx;
        externalHoverIndex = countryIdx;
        isFlyToActive = true;
        flyToStartTime = Date.now();

        const country = countries[countryIdx];
        
        // Target rotations for precise centering
        const lonRad = -country.lon * Math.PI / 180;
        const latRad = country.lat * Math.PI / 180;
        
        targetRy = lonRad - Math.PI;
        targetRx = latRad * 0.85;
        
        // Highlight active pill
        pills.forEach(p => p.classList.remove('highlight'));
        pill.classList.add('highlight');
        
        // Update tooltip content immediately
        updateTooltip(countryIdx);
      }
    });
  });

  // Check pin hover on screen
  let projectedPins = [];
  function checkHover(mouseX, mouseY) {
    let hoveredIdx = -1;
    let minDistance = 20;

    projectedPins.forEach((pin, idx) => {
      if (pin.z < 0) { 
        const dx = mouseX - pin.screenX;
        const dy = mouseY - pin.screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          hoveredIdx = idx;
        }
      }
    });

    if (hoveredIdx !== -1 && hoveredIdx !== activeHoverIndex) {
      pills.forEach(p => p.classList.remove('highlight'));
      
      activeHoverIndex = hoveredIdx;
      externalHoverIndex = hoveredIdx;

      const country = countries[hoveredIdx];
      updateTooltip(hoveredIdx);

      const pill = findCountryPill(country.name);
      if (pill) {
        pill.classList.add('highlight');
        pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    } else if (hoveredIdx === -1 && externalHoverIndex === -1) {
      tooltip.classList.remove('visible');
    }
  }

  // Update popup HTML details
  function updateTooltip(idx) {
    if (idx === -1 || !projectedPins[idx]) {
      tooltip.classList.remove('visible');
      return;
    }
    const country = countries[idx];
    const pin = projectedPins[idx];
    
    tooltipName.textContent = country.name;
    tooltipRegion.textContent = country.region;
    tooltip.style.left = pin.screenX + 'px';
    tooltip.style.top = pin.screenY + 'px';
    tooltip.classList.add('visible');
  }

  // 8. ANIMATION RENDER LOOP
  function render(time) {
    // Easing interpolation for transitions
    if (isFlyToActive) {
      rx += (targetRx - rx) * 0.12;
      ry += (targetRy - ry) * 0.12;
      
      // Pause for 3.5 seconds on target, then release lock and continue spinning
      if (Date.now() - flyToStartTime > 3500) {
        isFlyToActive = false;
        targetRy = ry;
        targetRx = rx;
      }
    } else if (!isDragging) {
      // Gentle and continuous spinning!
      targetRy += autoRotateSpeed;
      ry += (targetRy - ry) * 0.15;
      rx += (targetRx - rx) * 0.15;
    } else {
      // Manual drag easing
      rx += (targetRx - rx) * 0.15;
      ry += (targetRy - ry) * 0.15;
    }

    ctx.clearRect(0, 0, width, height);

    // DRAW BASE SPHERE SHADOW & INNER GLOW
    const sphereGrad = ctx.createRadialGradient(
      centerX - radius * 0.2, centerY - radius * 0.2, radius * 0.1,
      centerX, centerY, radius
    );
    sphereGrad.addColorStop(0, '#0a56ff');
    sphereGrad.addColorStop(0.15, '#0842c9');
    sphereGrad.addColorStop(0.4, '#0f172a');
    sphereGrad.addColorStop(0.8, '#090d16');
    sphereGrad.addColorStop(1, '#02040a');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.shadowColor = 'rgba(10, 86, 255, 0.1)';
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.shadowBlur = 0;

    // DRAW GLOBE OUTLINE BOUNDARY
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(10, 86, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // DRAW 3D GRID RINGS (LATITUDE & LONGITUDE PARTICLE DOTS)
    sphereGrid.forEach(ring => {
      ctx.beginPath();
      ring.forEach(pt => {
        const physicalPt = { x: pt.x * radius, y: pt.y * radius, z: pt.z * radius };
        const rotated = rotate3D(physicalPt, rx, ry);
        const proj = project(rotated);

        const isFront = rotated.z < 0;
        const opacity = isFront 
          ? (0.22 * (1 - Math.abs(rotated.z) / radius * 0.35))
          : (0.05 * (1 - Math.abs(rotated.z) / radius * 0.7));

        if (isFront) {
          ctx.fillStyle = `rgba(244, 191, 79, ${opacity * 1.5})`;
          ctx.fillRect(proj.x, proj.y, 1.2, 1.2);
        } else {
          ctx.fillStyle = `rgba(71, 85, 105, ${opacity})`;
          ctx.fillRect(proj.x, proj.y, 0.8, 0.8);
        }
      });
    });

    // DRAW GEOGRAPHIC CONTINENT OUTLINES (Visual Geography Blueprint)
    continents.forEach(polygon => {
      for (let i = 0; i < polygon.length - 1; i++) {
        const ptA = getSphericalCoords(polygon[i].lat, polygon[i].lon, radius);
        const ptB = getSphericalCoords(polygon[i+1].lat, polygon[i+1].lon, radius);
        
        const rotA = rotate3D(ptA, rx, ry);
        const rotB = rotate3D(ptB, rx, ry);
        
        if (rotA.z < radius * 0.15 && rotB.z < radius * 0.15) {
          const projA = project(rotA);
          const projB = project(rotB);
          
          ctx.beginPath();
          ctx.moveTo(projA.x, projA.y);
          ctx.lineTo(projB.x, projB.y);
          
          const avgZ = (rotA.z + rotB.z) / 2;
          const horizonFade = 1 - Math.max(0, avgZ / (radius * 0.3));
          const opacity = 0.38 * horizonFade;
          
          ctx.strokeStyle = `rgba(249, 217, 153, ${opacity * 2.2})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    });

    // COMPUTE Rotated position for all Country Pins
    projectedPins = countries.map(country => {
      const coords = getSphericalCoords(country.lat, country.lon, radius);
      const rotated = rotate3D(coords, rx, ry);
      const proj = project(rotated);
      return {
        name: country.name,
        isHub: country.isHub,
        screenX: proj.x,
        screenY: proj.y,
        z: rotated.z,
        scale: proj.scale,
        original3D: coords,
        rotated3D: rotated
      };
    });

    const rotatedHub = projectedPins.find(p => p.isHub);

    // DRAW CONNECTION ARCS FROM HUB TO COUNTRIES
    projectedPins.forEach((pin, idx) => {
      if (pin.isHub) return;

      const ptHub = rotatedHub.rotated3D;
      const ptCountry = pin.rotated3D;

      if (ptHub.z > radius * 0.85 && ptCountry.z > radius * 0.85) return; 

      ctx.beginPath();
      const segments = 32;
      const pulseSpeed = 0.0012;
      const pulseProgress = (time * pulseSpeed) % 1;

      for (let s = 0; s <= segments; s++) {
        const t = s / segments;

        let x = ptHub.x + (ptCountry.x - ptHub.x) * t;
        let y = ptHub.y + (ptCountry.y - ptHub.y) * t;
        let z = ptHub.z + (ptCountry.z - ptHub.z) * t;

        const len = Math.sqrt(x*x + y*y + z*z);
        const arcHeight = Math.sin(t * Math.PI) * (radius * 0.12);
        const R_arc = radius + arcHeight;

        const arcPt = {
          x: (x / len) * R_arc,
          y: (y / len) * R_arc,
          z: (z / len) * R_arc
        };

        const proj = project(arcPt);

        if (s === 0) {
          ctx.moveTo(proj.x, proj.y);
        } else {
          ctx.lineTo(proj.x, proj.y);
        }
      }

      ctx.strokeStyle = `rgba(10, 86, 255, 0.25)`;
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // FLOWING LIGHT ENERGY PULSES
      const pulseT = pulseProgress;
      let px = ptHub.x + (ptCountry.x - ptHub.x) * pulseT;
      let py = ptHub.y + (ptCountry.y - ptHub.y) * pulseT;
      let pz = ptHub.z + (ptCountry.z - ptHub.z) * pulseT;
      const plen = Math.sqrt(px*px + py*py + pz*pz);
      const parcHeight = Math.sin(pulseT * Math.PI) * (radius * 0.12);
      const pR_arc = radius + parcHeight;
      const pulsePt = {
        x: (px / plen) * pR_arc,
        y: (py / plen) * pR_arc,
        z: (pz / plen) * pR_arc
      };

      if (pulsePt.z < radius * 0.15) {
        const pulseProj = project(pulsePt);
        const pSize = 2 * pulseProj.scale;
        
        const pulseGrad = ctx.createRadialGradient(
          pulseProj.x, pulseProj.y, 0,
          pulseProj.x, pulseProj.y, pSize * 2
        );
        pulseGrad.addColorStop(0, '#ffffff');
        pulseGrad.addColorStop(0.3, '#38bdf8');
        pulseGrad.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(pulseProj.x, pulseProj.y, pSize * 2, 0, Math.PI * 2);
        ctx.fillStyle = pulseGrad;
        ctx.fill();
      }
    });

    // DRAW COUNTRY PINS & FLOATING BADGES SIMULTANEOUSLY (Matches User Attached Design!)
    projectedPins.forEach((pin, idx) => {
      const isHovered = (idx === activeHoverIndex || idx === externalHoverIndex);
      const isFront = pin.z < 0;

      if (!isFront) {
        // Back-side faint dots to preserve sphere look
        ctx.beginPath();
        ctx.arc(pin.screenX, pin.screenY, 2 * pin.scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(30, 41, 59, 0.1)';
        ctx.fill();
        return;
      }

      const pulseSize = (1 + Math.sin(time * 0.005)) * 3;

      // 1. Glowing outer pulsating ring
      if (pin.isHub || isHovered) {
        ctx.beginPath();
        ctx.arc(pin.screenX, pin.screenY, (4 + pulseSize) * pin.scale, 0, Math.PI * 2);
        ctx.strokeStyle = pin.isHub 
          ? `rgba(10, 86, 255, ${(1 - pulseSize/6) * 0.4})`
          : `rgba(10, 86, 255, ${(1 - pulseSize/6) * 0.55})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // 2. Solid Pin Core
      ctx.beginPath();
      const pinRadius = (pin.isHub ? 6 : (isHovered ? 5 : 3.5)) * pin.scale;
      ctx.arc(pin.screenX, pin.screenY, pinRadius, 0, Math.PI * 2);

      if (pin.isHub) {
        const hubGrad = ctx.createRadialGradient(
          pin.screenX - pinRadius*0.2, pin.screenY - pinRadius*0.2, 0,
          pin.screenX, pin.screenY, pinRadius
        );
        hubGrad.addColorStop(0, '#ffffff');
        hubGrad.addColorStop(0.3, '#38bdf8');
        hubGrad.addColorStop(1, '#0b1222');
        ctx.fillStyle = hubGrad;
      } else {
        const pinGrad = ctx.createRadialGradient(
          pin.screenX - pinRadius*0.2, pin.screenY - pinRadius*0.2, 0,
          pin.screenX, pin.screenY, pinRadius
        );
        pinGrad.addColorStop(0, '#ffffff');
        pinGrad.addColorStop(0.3, isHovered ? '#38bdf8' : '#9dd3fb');
        pinGrad.addColorStop(1, isHovered ? '#0a56ff' : '#38bdf8');
        ctx.fillStyle = pinGrad;
      }

      ctx.shadowColor = 'rgba(10, 86, 255, 0.35)';
      ctx.shadowBlur = isHovered ? 10 : 5;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(pin.screenX, pin.screenY, pinRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 0.7;
      ctx.stroke();

      // 3. Floating Premium Glassmorphic Badge with Leader Line (ALL serve nodes simultaneously)
      const labelText = pin.name.toUpperCase();
      ctx.font = `bold ${Math.round((pin.isHub ? 8.5 : 7.8) * pin.scale)}px 'DM Sans', sans-serif`;
      const textWidth = ctx.measureText(labelText).width;

      // Smart offset alternating distribution based on index to prevent overlap clustering
      let offsetX = 22;
      let offsetY = -24;

      if (idx % 4 === 1) {
        offsetX = -22 - textWidth / pin.scale;
        offsetY = -24;
      } else if (idx % 4 === 2) {
        offsetX = 22;
        offsetY = 16;
      } else if (idx % 4 === 3) {
        offsetX = -22 - textWidth / pin.scale;
        offsetY = 16;
      }

      const labelX = pin.screenX + offsetX * pin.scale;
      const labelY = pin.screenY + offsetY * pin.scale;
      
      const padX = 6 * pin.scale;
      const padY = 3 * pin.scale;
      const rectW = textWidth + padX * 2;
      const rectH = 14 * pin.scale;

      // Draw elegant leader line
      ctx.beginPath();
      ctx.moveTo(pin.screenX, pin.screenY);
      const targetX = offsetX > 0 ? labelX : labelX + rectW;
      const targetY = offsetY > 0 ? labelY : labelY + rectH;
      ctx.lineTo(targetX, targetY);
      ctx.strokeStyle = isHovered 
        ? 'rgba(10, 86, 255, 0.65)' 
        : (pin.isHub ? 'rgba(10, 86, 255, 0.45)' : 'rgba(10, 86, 255, 0.25)');
      ctx.lineWidth = isHovered ? 1.2 : 0.8;
      ctx.stroke();

      // Draw premium rounded glassmorphism tag background
      drawRoundRect(ctx, labelX, labelY, rectW, rectH, 4 * pin.scale);
      ctx.fillStyle = isHovered 
        ? 'rgba(209, 50, 5, 0.95)' 
        : (pin.isHub ? 'rgba(15, 32, 66, 0.9)' : 'rgba(15, 23, 42, 0.85)');
      ctx.fill();

      // Glowing tag border
      ctx.strokeStyle = isHovered 
        ? '#38bdf8' 
        : (pin.isHub ? 'rgba(10, 86, 255, 0.5)' : 'rgba(10, 86, 255, 0.3)');
      ctx.lineWidth = isHovered ? 1.4 : 0.9;
      ctx.stroke();

      // Draw tag text
      ctx.fillStyle = isHovered 
        ? '#ffffff' 
        : (pin.isHub ? '#38bdf8' : 'rgba(255, 255, 255, 0.85)');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, labelX + padX, labelY + rectH / 2 + 0.5);
    });

    // 9. RE-ALIGN PERSISTENT POPUP IN 3D SPACE
    if (activeHoverIndex !== -1 && projectedPins[activeHoverIndex]) {
      const activePin = projectedPins[activeHoverIndex];
      if (activePin.z >= 0) {
        tooltip.classList.remove('visible');
      } else {
        const activeCountry = countries[activeHoverIndex];
        if (activeCountry) {
          tooltipName.textContent = activeCountry.name;
          tooltipRegion.textContent = activeCountry.region;
        }
        tooltip.style.left = activePin.screenX + 'px';
        tooltip.style.top = activePin.screenY + 'px';
        tooltip.classList.add('visible');
      }
    }

    if (globeVisible) {
      requestAnimationFrame(render);
    } else {
      renderRequested = false;
    }
  }

  // Optimize Performance: Only render when visible
  let globeVisible = false;
  let renderRequested = false;
  const sectionReach = document.getElementById('reach');
  if (sectionReach) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        globeVisible = entry.isIntersecting;
        if (globeVisible && !renderRequested) {
          renderRequested = true;
          requestAnimationFrame(render);
        }
      });
    }, { rootMargin: '200px 0px' });
    observer.observe(sectionReach);
  } else {
    // Fallback if section isn't found
    globeVisible = true;
    requestAnimationFrame(render);
  }

  // 10. INITIAL STATE: Center on Sri Lanka Hub at Startup
  setTimeout(() => {
    const slIdx = countries.findIndex(c => c.isHub);
    if (slIdx !== -1) {
      activeHoverIndex = slIdx;
      externalHoverIndex = slIdx;
      
      const country = countries[slIdx];
      const lonRad = -country.lon * Math.PI / 180;
      const latRad = country.lat * Math.PI / 180;
      
      rx = latRad * 0.85;
      ry = lonRad - Math.PI;
      targetRx = rx;
      targetRy = ry;
      
      const slPill = findCountryPill(country.name);
      if (slPill) {
        slPill.classList.add('highlight');
      }
      updateTooltip(slIdx);
    }
  }, 100);

})();
