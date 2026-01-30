/**
 * OpenHamClock Server
 * 
 * Express server that:
 * 1. Serves the static web application
 * 2. Proxies API requests to avoid CORS issues
 * 3. Provides WebSocket support for future real-time features
 * 
 * Usage:
 *   node server.js
 *   PORT=8080 node server.js
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// API PROXY ENDPOINTS
// ============================================

// NOAA Space Weather - Solar Flux
app.get('/api/noaa/flux', async (req, res) => {
  try {
    const response = await fetch('https://services.swpc.noaa.gov/json/f107_cm_flux.json');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('NOAA Flux API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch solar flux data' });
  }
});

// NOAA Space Weather - K-Index
app.get('/api/noaa/kindex', async (req, res) => {
  try {
    const response = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('NOAA K-Index API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch K-index data' });
  }
});

// NOAA Space Weather - Sunspots
app.get('/api/noaa/sunspots', async (req, res) => {
  try {
    const response = await fetch('https://services.swpc.noaa.gov/json/solar-cycle/observed-solar-cycle-indices.json');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('NOAA Sunspots API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch sunspot data' });
  }
});

// NOAA Space Weather - X-Ray Flux
app.get('/api/noaa/xray', async (req, res) => {
  try {
    const response = await fetch('https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('NOAA X-Ray API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch X-ray data' });
  }
});

// POTA Spots
app.get('/api/pota/spots', async (req, res) => {
  try {
    const response = await fetch('https://api.pota.app/spot/activator');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('POTA API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch POTA spots' });
  }
});

// SOTA Spots
app.get('/api/sota/spots', async (req, res) => {
  try {
    const response = await fetch('https://api2.sota.org.uk/api/spots/50/all');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('SOTA API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch SOTA spots' });
  }
});

// HamQSL Band Conditions
app.get('/api/hamqsl/conditions', async (req, res) => {
  try {
    const response = await fetch('https://www.hamqsl.com/solarxml.php');
    const text = await response.text();
    res.set('Content-Type', 'application/xml');
    res.send(text);
  } catch (error) {
    console.error('HamQSL API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch band conditions' });
  }
});

// DX Cluster proxy - fetches from multiple sources
app.get('/api/dxcluster/spots', async (req, res) => {
  console.log('[DX Cluster] Fetching spots...');
  
  // Try DX Heat API first (most reliable)
  try {
    const response = await fetch('https://dxheat.com/dxc/data.php?include_modes=cw,ssb,ft8,ft4,rtty&include_bands=160,80,60,40,30,20,17,15,12,10,6&limit=30', {
      headers: { 
        'User-Agent': 'OpenHamClock/3.1',
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const text = await response.text();
      console.log('[DX Cluster] DXHeat response length:', text.length);
      try {
        const data = JSON.parse(text);
        if (data && data.spots && data.spots.length > 0) {
          const spots = data.spots.map(spot => ({
            freq: spot.f ? (parseFloat(spot.f)).toFixed(3) : '0.000',
            call: spot.c || 'UNKNOWN',
            comment: spot.i || '',
            time: spot.t ? spot.t.substring(11, 16) + 'z' : '',
            spotter: spot.s || ''
          })).slice(0, 20);
          console.log('[DX Cluster] DXHeat returned', spots.length, 'spots');
          return res.json(spots);
        }
      } catch (parseErr) {
        console.log('[DX Cluster] DXHeat parse error:', parseErr.message);
      }
    }
  } catch (error) {
    console.error('[DX Cluster] DXHeat error:', error.message);
  }

  // Try PSK Reporter as fallback (very reliable)
  try {
    const response = await fetch('https://pskreporter.info/cgi-bin/pskquery5.pl?encap=1&callback=0&statistics=0&noactive=1&nolocator=1&rronly=1&flowStartSeconds=-900&limit=30', {
      headers: { 
        'User-Agent': 'OpenHamClock/3.1'
      }
    });
    
    if (response.ok) {
      const text = await response.text();
      console.log('[DX Cluster] PSKReporter response length:', text.length);
      // PSK Reporter returns XML, parse it
      const callMatches = text.match(/senderCallsign="([^"]+)"/g) || [];
      const freqMatches = text.match(/frequency="([^"]+)"/g) || [];
      const modeMatches = text.match(/mode="([^"]+)"/g) || [];
      
      if (callMatches.length > 0) {
        const spots = callMatches.slice(0, 20).map((match, i) => {
          const call = match.replace('senderCallsign="', '').replace('"', '');
          const freq = freqMatches[i] ? (parseFloat(freqMatches[i].replace('frequency="', '').replace('"', '')) / 1000000).toFixed(3) : '0.000';
          const mode = modeMatches[i] ? modeMatches[i].replace('mode="', '').replace('"', '') : '';
          return {
            freq: freq,
            call: call,
            comment: mode,
            time: new Date().toISOString().substring(11, 16) + 'z',
            spotter: 'PSK'
          };
        });
        console.log('[DX Cluster] PSKReporter returned', spots.length, 'spots');
        return res.json(spots);
      }
    }
  } catch (error) {
    console.error('[DX Cluster] PSKReporter error:', error.message);
  }

  // Try HamQTH DX Cluster
  try {
    const response = await fetch('https://www.hamqth.com/dxc_csv.php?limit=30', {
      headers: { 'User-Agent': 'OpenHamClock/3.1' }
    });
    
    if (response.ok) {
      const text = await response.text();
      console.log('[DX Cluster] HamQTH response length:', text.length);
      const lines = text.trim().split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        const spots = lines.slice(0, 20).map(line => {
          const parts = line.split(',');
          return {
            freq: parts[1] ? (parseFloat(parts[1]) / 1000).toFixed(3) : '0.000',
            call: parts[2] || 'UNKNOWN',
            comment: parts[5] || '',
            time: parts[4] ? parts[4].substring(0, 5) + 'z' : '',
            spotter: parts[3] || ''
          };
        }).filter(s => s.call !== 'UNKNOWN' && s.freq !== '0.000');
        
        if (spots.length > 0) {
          console.log('[DX Cluster] HamQTH returned', spots.length, 'spots');
          return res.json(spots);
        }
      }
    }
  } catch (error) {
    console.error('[DX Cluster] HamQTH error:', error.message);
  }

  // Try DX Watch legacy endpoint
  try {
    const response = await fetch('https://dxwatch.com/dxsd1/s.php?s=0&r=30', {
      headers: { 
        'User-Agent': 'OpenHamClock/3.1',
        'Accept': '*/*'
      }
    });
    
    if (response.ok) {
      const text = await response.text();
      console.log('[DX Cluster] DXWatch response length:', text.length);
      try {
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) {
          const spots = data.map(spot => ({
            freq: spot.fr ? (parseFloat(spot.fr) / 1000).toFixed(3) : '0.000',
            call: spot.dx || 'UNKNOWN',
            comment: spot.cm || '',
            time: spot.t || '',
            spotter: spot.sp || ''
          })).slice(0, 20);
          console.log('[DX Cluster] DXWatch returned', spots.length, 'spots');
          return res.json(spots);
        }
      } catch (parseErr) {
        console.log('[DX Cluster] DXWatch parse error');
      }
    }
  } catch (error) {
    console.error('[DX Cluster] DXWatch error:', error.message);
  }

  console.log('[DX Cluster] All sources failed, returning empty');
  // Return empty array if all sources fail
  res.json([]);
});

// QRZ Callsign lookup (requires API key)
app.get('/api/qrz/lookup/:callsign', async (req, res) => {
  const { callsign } = req.params;
  // Note: QRZ requires an API key - this is a placeholder
  res.json({ 
    message: 'QRZ lookup requires API key configuration',
    callsign: callsign.toUpperCase()
  });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// CONFIGURATION ENDPOINT
// ============================================

app.get('/api/config', (req, res) => {
  res.json({
    version: '3.0.0',
    features: {
      spaceWeather: true,
      pota: true,
      sota: true,
      dxCluster: true,
      satellites: false, // Coming soon
      contests: false    // Coming soon
    },
    refreshIntervals: {
      spaceWeather: 300000,
      pota: 60000,
      sota: 60000,
      dxCluster: 30000
    }
  });
});

// ============================================
// CATCH-ALL FOR SPA
// ============================================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║   ██████╗ ██████╗ ███████╗███╗   ██╗                  ║');
  console.log('║  ██╔═══██╗██╔══██╗██╔════╝████╗  ██║                  ║');
  console.log('║  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║                  ║');
  console.log('║  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║                  ║');
  console.log('║  ╚██████╔╝██║     ███████╗██║ ╚████║                  ║');
  console.log('║   ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝                  ║');
  console.log('║                                                       ║');
  console.log('║  ██╗  ██╗ █████╗ ███╗   ███╗ ██████╗██╗      ██╗  ██╗ ║');
  console.log('║  ██║  ██║██╔══██╗████╗ ████║██╔════╝██║      ██║ ██╔╝ ║');
  console.log('║  ███████║███████║██╔████╔██║██║     ██║      █████╔╝  ║');
  console.log('║  ██╔══██║██╔══██║██║╚██╔╝██║██║     ██║      ██╔═██╗  ║');
  console.log('║  ██║  ██║██║  ██║██║ ╚═╝ ██║╚██████╗███████╗██║  ██╗ ║');
  console.log('║  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝╚══════╝╚═╝  ╚═╝ ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  🌐 Server running at http://localhost:${PORT}`);
  console.log('  📡 API proxy enabled for NOAA, POTA, SOTA, DX Cluster');
  console.log('  🖥️  Open your browser to start using OpenHamClock');
  console.log('');
  console.log('  In memory of Elwood Downey, WB0OEW');
  console.log('  73 de OpenHamClock contributors');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});
