/**
 * KRC Institute of Technology - Campus Proximity & Geofencing Service
 * Campus Coordinates: Ambegaon Budruk, Pune (18.4636° N, 73.8436° E)
 * Manages proximity detection, 100m geofence evaluation, and single-fire 15-minute / lecture-start alerts.
 */

export const CAMPUS_COORDINATES = {
  name: 'KRC Institute of Technology, Ambegaon BK, Pune',
  latitude: 18.4636,
  longitude: 73.8436,
  perimeterRadiusMeters: 100 // 100 meters threshold as requested
};

// Preset testing locations for easy audit in headless environments or indoors
export const LOCATION_PRESETS = [
  {
    id: 'OUTSIDE_CAMPUS_350M',
    label: 'Outside Campus - Katraj Chowk (~350m away)',
    latitude: 18.4605,
    longitude: 73.8458,
    isOutside: true
  },
  {
    id: 'OUTSIDE_CAMPUS_1200M',
    label: 'Outside Campus - Pune Satara Road (~1.2 km away)',
    latitude: 18.4530,
    longitude: 73.8500,
    isOutside: true
  },
  {
    id: 'INSIDE_CLASSROOM',
    label: 'Inside Classroom - Turing Hall A (15m from center)',
    latitude: 18.4637,
    longitude: 73.8437,
    isOutside: false
  },
  {
    id: 'CAMPUS_GROUND',
    label: 'Inside Campus - Central Quadrangle (50m from center)',
    latitude: 18.4634,
    longitude: 73.8439,
    isOutside: false
  }
];

/**
 * Calculates Great-Circle distance between two coordinates in meters using the Haversine formula
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

class LocationService {
  constructor() {
    this.currentLocation = {
      latitude: LOCATION_PRESETS[0].latitude,
      longitude: LOCATION_PRESETS[0].longitude,
      presetId: LOCATION_PRESETS[0].id,
      label: LOCATION_PRESETS[0].label,
      accuracy: 10,
      timestamp: Date.now()
    };
    this.listeners = new Set();
    this.watchId = null;
    this.useSimulatedLocation = true; // Default to true so headless audits and browsers without GPS trigger properly
  }

  // Get current active location
  getCurrentLocation() {
    return { ...this.currentLocation };
  }

  // Calculate distance from current location to KRC campus center
  getDistanceFromCampus(coords = this.currentLocation) {
    if (!coords || !coords.latitude || !coords.longitude) return 0;
    return calculateDistanceMeters(
      coords.latitude,
      coords.longitude,
      CAMPUS_COORDINATES.latitude,
      CAMPUS_COORDINATES.longitude
    );
  }

  // Check if student is at least 100 meters away from campus / classroom
  isOutsideGeofence(coords = this.currentLocation) {
    const dist = this.getDistanceFromCampus(coords);
    return dist >= CAMPUS_COORDINATES.perimeterRadiusMeters;
  }

  // Set location from one of the presets (or custom coords)
  setLocation(presetIdOrCoords) {
    if (typeof presetIdOrCoords === 'string') {
      const preset = LOCATION_PRESETS.find(p => p.id === presetIdOrCoords);
      if (preset) {
        this.currentLocation = {
          latitude: preset.latitude,
          longitude: preset.longitude,
          presetId: preset.id,
          label: preset.label,
          accuracy: 10,
          timestamp: Date.now()
        };
        this.useSimulatedLocation = true;
      }
    } else if (presetIdOrCoords && presetIdOrCoords.latitude) {
      this.currentLocation = {
        ...presetIdOrCoords,
        presetId: 'CUSTOM',
        label: 'Device GPS Location',
        timestamp: Date.now()
      };
    }
    this.notifyListeners();
    return this.currentLocation;
  }

  // Enable real GPS tracking from browser navigator.geolocation
  enableDeviceGPS() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            presetId: 'DEVICE_GPS',
            label: 'Real Device GPS',
            timestamp: position.timestamp
          };
          this.useSimulatedLocation = false;
          this.notifyListeners();
          resolve(this.currentLocation);
        },
        (error) => {
          // If denied, remain on preset
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  /**
   * Evaluates lecture status vs student geofence.
   * Dispatches alerts strictly ONCE per lecture per day.
   * 
   * Alert 1: 15 minutes before lecture starts (student >= 100m outside)
   * Alert 2: When lecture actually starts (student >= 100m outside)
   */
  checkAndTriggerProximityAlerts(lecture, refDate = new Date()) {
    if (!lecture) return null;

    const isOutside = this.isOutsideGeofence();
    const distance = this.getDistanceFromCampus();

    // Calculate time until start in minutes
    const now = refDate;
    const [startH, startM] = (lecture.start || '09:00').split(':').map(Number);
    const [endH, endM] = (lecture.end || '10:15').split(':').map(Number);

    const startTime = new Date(now);
    startTime.setHours(startH, startM, 0, 0);

    const endTime = new Date(now);
    endTime.setHours(endH, endM, 0, 0);

    const diffMs = startTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    const isLive = now >= startTime && now <= endTime;
    const isCompleted = now > endTime;

    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const lectureId = lecture.id || lecture.courseCode || 'LEC';

    const alertKey15m = `krc_alert_15m_${lectureId}_${dateKey}`;
    const alertKeyStarted = `krc_alert_started_${lectureId}_${dateKey}`;

    // Only fire alerts if student is outside geofence (>= 100 meters away)
    if (!isOutside) {
      return {
        isOutside: false,
        distanceMeters: distance,
        activeAlert: null
      };
    }

    // Condition 1: Lecture Started Alert (lecture is currently live)
    const isLectureLive = lecture.isLive || lecture.status === 'LIVE_NOW' || (now >= startTime && now <= endTime);
    if (isLectureLive) {
      const alreadyFired = localStorage.getItem(alertKeyStarted);
      const isNew = !alreadyFired;
      if (isNew) {
        localStorage.setItem(alertKeyStarted, new Date().toISOString());
      }

      return {
        isOutside: true,
        distanceMeters: distance,
        activeAlert: {
          type: 'LECTURE_STARTED_WARNING',
          isNewNotification: isNew,
          title: '🚨 Lecture Has Started!',
          message: `You are ${distance}m outside campus. "${lecture.courseName || lecture.courseCode}" is currently underway (${lecture.playbackFormatted || 'in session'}) in ${lecture.room || 'Classroom'}. Geo-fenced attendance is actively open.`,
          lecture,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          severity: 'danger'
        }
      };
    }

    // Condition 2: 15-Minute Warning Alert (starts in <= 15 mins)
    const startsIn = lecture.startsInMinutes !== undefined ? lecture.startsInMinutes : diffMinutes;
    const isStartingIn15 = lecture.isUpcoming || (startsIn <= 15 && startsIn > 0) || (diffMinutes <= 15 && diffMinutes > 0);

    if (isStartingIn15) {
      const alertKey15m = `krc_alert_15m_${lectureId}_${dateKey}`;
      const alreadyFired = localStorage.getItem(alertKey15m);
      const isNew = !alreadyFired;
      if (isNew) {
        localStorage.setItem(alertKey15m, new Date().toISOString());
      }

      return {
        isOutside: true,
        distanceMeters: distance,
        activeAlert: {
          type: '15_MIN_WARNING',
          isNewNotification: isNew,
          title: '⚠️ Lecture Starting in 15 Minutes!',
          message: `You are currently ${distance}m outside KRC Campus. "${lecture.courseName || lecture.courseCode}" begins in ${startsIn || 15} min at ${lecture.room || 'Turing Hall'}. Please proceed to campus immediately.`,
          lecture,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          severity: 'warning'
        }
      };
    }

    return {
      isOutside: true,
      distanceMeters: distance,
      activeAlert: null
    };
  }

  // Subscribe to location updates
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(l => {
      try {
        l(this.getCurrentLocation());
      } catch (err) {
        console.error('Location listener error:', err);
      }
    });
  }
}

export const locationService = new LocationService();
