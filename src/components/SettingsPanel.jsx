/**
 * SettingsPanel Component
 * Full settings modal matching production version
 */
import React, { useState, useEffect } from 'react';
import { calculateGridSquare } from '../utils/geo.js';
import { useTranslation, Trans } from 'react-i18next';

export const SettingsPanel = ({ isOpen, onClose, config, onSave }) => {
  const [callsign, setCallsign] = useState(config?.callsign || '');
  const [gridSquare, setGridSquare] = useState('');
  const [lat, setLat] = useState(config?.location?.lat || 0);
  const [lon, setLon] = useState(config?.location?.lon || 0);
  const [theme, setTheme] = useState(config?.theme || 'dark');
  const [layout, setLayout] = useState(config?.layout || 'modern');
  const [dxClusterSource, setDxClusterSource] = useState(config?.dxClusterSource || 'dxspider-proxy');
  const { t } = useTranslation();

  useEffect(() => {
    if (config) {
      setCallsign(config.callsign || '');
      setLat(config.location?.lat || 0);
      setLon(config.location?.lon || 0);
      setTheme(config.theme || 'dark');
      setLayout(config.layout || 'modern');
      setDxClusterSource(config.dxClusterSource || 'dxspider-proxy');
      // Use locator from config, or calculate from coordinates
      if (config.locator) {
        setGridSquare(config.locator);
      } else if (config.location?.lat && config.location?.lon) {
        setGridSquare(calculateGridSquare(config.location.lat, config.location.lon));
      }
    }
  }, [config, isOpen]);

  // Update lat/lon when grid square changes
  const handleGridChange = (grid) => {
    setGridSquare(grid.toUpperCase());
    // Parse grid square to lat/lon if valid (6 char)
    if (grid.length >= 4) {
      const parsed = parseGridSquare(grid);
      if (parsed) {
        setLat(parsed.lat);
        setLon(parsed.lon);
      }
    }
  };

  // Parse grid square to coordinates
  const parseGridSquare = (grid) => {
    grid = grid.toUpperCase();
    if (grid.length < 4) return null;
    
    const lon1 = (grid.charCodeAt(0) - 65) * 20 - 180;
    const lat1 = (grid.charCodeAt(1) - 65) * 10 - 90;
    const lon2 = parseInt(grid[2]) * 2;
    const lat2 = parseInt(grid[3]) * 1;
    
    let lon = lon1 + lon2 + 1;
    let lat = lat1 + lat2 + 0.5;
    
    if (grid.length >= 6) {
      const lon3 = (grid.charCodeAt(4) - 65) * (2/24);
      const lat3 = (grid.charCodeAt(5) - 65) * (1/24);
      lon = lon1 + lon2 + lon3 + (1/24);
      lat = lat1 + lat2 + lat3 + (1/48);
    }
    
    return { lat, lon };
  };

  // Update grid when lat/lon changes
  useEffect(() => {
    if (lat && lon) {
      setGridSquare(calculateGridSquare(lat, lon));
    }
  }, [lat, lon]);

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLon(position.coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert(t('station.settings.useLocation.error1'));
        }
      );
    } else {
      alert(t('station.settings.useLocation.error2'));
    }
  };

  const handleSave = () => {
    onSave({
      ...config,
      callsign: callsign.toUpperCase(),
      locator: gridSquare.toUpperCase(),
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      theme,
      layout,
      dxClusterSource
    });
    onClose();
  };

  if (!isOpen) return null;

  const Code = ({ children }) => (
    <code style={{ background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: '3px' }}>
      {children}
    </code>
  );

  const themeDescriptions = {
    dark: t('station.settings.theme.dark.describe'),
    light: t('station.settings.theme.light.describe'),
    legacy: t('station.settings.theme.legacy.describe'),
    retro: t('station.settings.theme.retro.describe')
  };

  const layoutDescriptions = {
    modern: t('station.settings.layout.modern.describe'),
    classic: t('station.settings.layout.classic.describe')
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '2px solid var(--accent-amber)',
        borderRadius: '12px',
        padding: '24px',
        width: '480px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ 
          color: 'var(--accent-cyan)', 
          marginTop: 0,
          marginBottom: '16px',
          textAlign: 'center',
          fontFamily: 'Orbitron, monospace',
          fontSize: '20px'
        }}>
          {t('station.settings.title')}
        </h2>

        {/* First-time setup banner */}
        {(config?.configIncomplete || config?.callsign === 'N0CALL' || !config?.locator) && (
          <div style={{
            background: 'rgba(255, 193, 7, 0.15)',
            border: '1px solid var(--accent-amber)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13px'
          }}>
            <div style={{ color: 'var(--accent-amber)', fontWeight: '700', marginBottom: '6px' }}>
              {t("station.settings.welcome")}
            </div>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t("station.settings.describe")}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '8px' }}>
              <Trans i18nKey="station.settings.tip.env" components={{ envExample: <Code />, env: <Code /> }} />
            </div>
          </div>
        )}

        {/* Callsign */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {t('station.settings.callsign')}
          </label>
          <input
            type="text"
            value={callsign}
            onChange={(e) => setCallsign(e.target.value.toUpperCase())}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--accent-amber)',
              fontSize: '18px',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: '700',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Grid Square */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {t('station.settings.locator')}
          </label>
          <input
            type="text"
            value={gridSquare}
            onChange={(e) => handleGridChange(e.target.value)}
            placeholder="FN20nc"
            maxLength={6}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--accent-amber)',
              fontSize: '18px',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: '700',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Lat/Lon */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
              {t('station.settings.latitude')}
            </label>
            <input
              type="number"
              step="0.000001"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'JetBrains Mono, monospace',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
              {t('station.settings.longitude')}
            </label>
            <input
              type="number"
              step="0.000001"
              value={lon}
              onChange={(e) => setLon(parseFloat(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'JetBrains Mono, monospace',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Use My Location button */}
        <button
          onClick={handleUseLocation}
          style={{
            width: '100%',
            padding: '10px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          {t('station.settings.useLocation')}
        </button>

        {/* Theme */}
        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {t('station.settings.theme')}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {['dark', 'light', 'legacy', 'retro'].map((theme) => (
              <button
                key={theme}
                onClick={() => setTheme(theme)}
                style={{
                  padding: '10px',
                  background: theme === theme ? 'var(--accent-amber)' : 'var(--bg-tertiary)',
                  border: `1px solid ${theme === theme ? 'var(--accent-amber)' : 'var(--border-color)'}`,
                  borderRadius: '6px',
                  color: theme === theme ? '#000' : 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: theme === theme ? '600' : '400'
                }}
              >
                {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : theme === 'legacy' ? '💻' : '🪟'} {t('station.settings.theme.' + theme)}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {themeDescriptions[theme]}
          </div>
        </div>

        {/* Layout */}
        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {t('station.settings.layout')}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {['modern', 'classic'].map((l) => (
              <button
                key={l}
                onClick={() => setLayout(l)}
                style={{
                  padding: '10px',
                  background: layout === l ? 'var(--accent-amber)' : 'var(--bg-tertiary)',
                  border: `1px solid ${layout === l ? 'var(--accent-amber)' : 'var(--border-color)'}`,
                  borderRadius: '6px',
                  color: layout === l ? '#000' : 'var(--text-secondary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: layout === l ? '600' : '400'
                }}
              >
                {l === 'modern' ? '🖥️' : '📺'} {t('station.settings.layout.' + l)}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {layoutDescriptions[layout]}
          </div>
        </div>

        {/* DX Cluster Source */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {t('station.settings.dx.title')}
          </label>
          <select
            value={dxClusterSource}
            onChange={(e) => setDxClusterSource(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--accent-green)',
              fontSize: '14px',
              fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer'
            }}
          >
            <option value="dxspider-proxy">{t('station.settings.dx.option1')}</option>
            <option value="hamqth">{t('station.settings.dx.option2')}</option>
            <option value="dxwatch">{t('station.settings.dx.option3')}</option>
            <option value="auto">{t('station.settings.dx.option4')}</option>
          </select>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {t('station.settings.dx.describe')}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '14px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '14px',
              background: 'linear-gradient(135deg, #00ff88 0%, #00ddff 100%)',
              border: 'none',
              borderRadius: '6px',
              color: '#000',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {t('station.settings.button.save')}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
          {t('station.settings.button.save.confirm')}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
