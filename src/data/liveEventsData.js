/**
 * KRC Institute of Technology - Live Campus Events & Festival Data Engine
 * Coordinates: Ambegaon Budruk, Pune (18.4636° N, 73.8436° E)
 * Provides real-time schedules, multi-track itineraries, geo-tagged venue coordinates,
 * live statuses, and simulated live stream feeds.
 */

export const CAMPUS_CENTER = {
  name: 'KRC Institute of Technology Main Campus',
  lat: 18.4636,
  lng: 73.8436,
  zoom: 16
};

export const EVENT_VENUES = {
  AUDITORIUM: {
    id: 'venue_auditorium',
    name: 'Sir Visvesvaraya Grand Auditorium',
    shortName: 'Auditorium',
    zone: 'East Wing - Level 1',
    lat: 18.4641,
    lng: 73.8442,
    capacity: 1200,
    tag: 'Cultural & Keynotes',
    color: '#8b5cf6' // Purple
  },
  TURING_HALL: {
    id: 'venue_turing',
    name: 'Alan Turing Computing Hall & CS Labs',
    shortName: 'Turing CS',
    zone: 'CS Block - Level 2',
    lat: 18.4638,
    lng: 73.8432,
    capacity: 450,
    tag: 'Hackathons & AI',
    color: '#3b82f6' // Blue
  },
  TECH_QUAD: {
    id: 'venue_quad',
    name: 'Central Innovation Quadrangle',
    shortName: 'Central Quad',
    zone: 'Campus Central Courtyard',
    lat: 18.4633,
    lng: 73.8437,
    capacity: 2500,
    tag: 'Drone Arena & Exhibitions',
    color: '#10b981' // Emerald
  },
  RAMAN_HALL: {
    id: 'venue_raman',
    name: 'Sir CV Raman Seminar Theatre',
    shortName: 'Raman Hall',
    zone: 'Science & Research Tower',
    lat: 18.4645,
    lng: 73.8429,
    capacity: 300,
    tag: 'Workshops & Seminars',
    color: '#f59e0b' // Amber
  },
  SPORTS_COMPLEX: {
    id: 'venue_sports',
    name: 'KRC Olympic Arena & Sports Ground',
    shortName: 'Sports Arena',
    zone: 'West Campus Sports Pavilion',
    lat: 18.4627,
    lng: 73.8448,
    capacity: 3500,
    tag: 'Sports Tournaments',
    color: '#ef4444' // Rose/Red
  }
};

export const LIVE_CAMPUS_EVENTS = [
  {
    id: 'evt_hackathon_2026',
    title: 'KRC HackSprint 2026: National 24h AI & Cloud Hackathon',
    shortTitle: 'HackSprint 24h AI Hackathon',
    category: 'tech',
    categoryLabel: 'Tech & Hackathons',
    badge: 'Flagship Event',
    date: 'Today · Oct 6, 2026',
    startTime: '09:00',
    endTime: '21:00',
    timeDisplay: '09:00 AM – 09:00 PM',
    status: 'live', // live, upcoming, completed
    currentActivity: 'Sprint 2: Prototype Development & Mentor Review Round',
    venue: EVENT_VENUES.TURING_HALL,
    attendees: 380,
    capacity: 450,
    bannerImage: '/images/cs_lab.jpg',
    description: 'Premier inter-collegiate hackathon bringing together over 90 engineering squads from across India to develop generative AI, decentralized systems, and smart campus solutions.',
    speaker: 'Dr. Rajesh Sharma (Lead AI Scientist, MIT Pune)',
    itinerary: [
      { time: '08:30 AM', title: 'Team Check-in & Hardware Kit Distribution', status: 'completed' },
      { time: '09:30 AM', title: 'Opening Keynote & Problem Statements Reveal', status: 'completed' },
      { time: '11:00 AM', title: 'Sprint 1: Architecture Lock & Database Design', status: 'completed' },
      { time: '01:30 PM', title: 'Networking Lunch & Sponsor Tech Demos', status: 'completed' },
      { time: '03:00 PM', title: 'Sprint 2: Prototype Build & Mid-Evaluation', status: 'live' },
      { time: '06:00 PM', title: 'Mentor Round 2: Performance & Scalability Pitch', status: 'upcoming' },
      { time: '08:30 PM', title: 'Final Demo Showdown & Winner Announcement', status: 'upcoming' }
    ],
    tags: ['AI/ML', 'Cloud', 'Prizes ₹2.5L', 'Hackathon']
  },
  {
    id: 'evt_aura_cultural_2026',
    title: 'AURA 2026: Annual Inter-Collegiate Cultural Extravaganza',
    shortTitle: 'AURA 2026 Cultural Gala',
    category: 'cultural',
    categoryLabel: 'Cultural & Arts',
    badge: 'Grand Stage',
    date: 'Today · Oct 6, 2026',
    startTime: '16:00',
    endTime: '22:00',
    timeDisplay: '04:00 PM – 10:00 PM',
    status: 'upcoming',
    currentActivity: 'Soundcheck & Stage Lighting Rehearsals in progress',
    venue: EVENT_VENUES.AUDITORIUM,
    attendees: 1150,
    capacity: 1200,
    bannerImage: '/images/campus_main.jpg',
    description: 'Electrifying celebration of musical synergy, classical fusion, contemporary dance, and street play theatricals, featuring award-winning collegiate ensembles.',
    speaker: 'Prof. Ananya Kulkarni (Cultural Dean)',
    itinerary: [
      { time: '04:00 PM', title: 'Traditional Lamp Lighting & Welcome Dance', status: 'upcoming' },
      { time: '04:45 PM', title: 'Battle of the Bands: Inter-College Rock & Fusion', status: 'upcoming' },
      { time: '06:30 PM', title: 'Nrityangan: Classical & Contemporary Dance Showcase', status: 'upcoming' },
      { time: '08:00 PM', title: 'Celebrity Musical Performance & DJ Night', status: 'upcoming' },
      { time: '09:45 PM', title: 'Trophy Presentation & Closing Fireworks', status: 'upcoming' }
    ],
    tags: ['Music', 'Dance', 'Drama', 'Cultural Fest']
  },
  {
    id: 'evt_drone_roboclash',
    title: 'RoboClash 2026 & Autonomous Drone Arena',
    shortTitle: 'RoboClash & Drone Racing',
    category: 'tech',
    categoryLabel: 'Robotics & Hardware',
    badge: 'Arena Combat',
    date: 'Today · Oct 6, 2026',
    startTime: '10:00',
    endTime: '17:30',
    timeDisplay: '10:00 AM – 05:30 PM',
    status: 'live',
    currentActivity: 'Semi-Final Combat Round: 15kg Bot Category',
    venue: EVENT_VENUES.TECH_QUAD,
    attendees: 820,
    capacity: 2500,
    bannerImage: '/images/robotics_lab.jpg',
    description: 'High-octane robotic combat arena featuring pneumatic flippers, spinning blades, and obstacle-course drone agility trials engineered by collegiate robotics teams.',
    speaker: 'Dr. Vivek Deshmukh (Director, Robotics Research Center)',
    itinerary: [
      { time: '10:00 AM', title: 'Bot Weight Inspection & Arena Safety Clearence', status: 'completed' },
      { time: '11:00 AM', title: 'Round of 16: Lightweight Bot Arena Knockouts', status: 'completed' },
      { time: '01:00 PM', title: 'FPV Autonomous Drone Obstacle Trials', status: 'completed' },
      { time: '02:30 PM', title: 'Semi-Finals: Combat RoboClash 15kg Class', status: 'live' },
      { time: '04:30 PM', title: 'The Grand Deathmatch Final & Drone Relay', status: 'upcoming' }
    ],
    tags: ['Robotics', 'Drone Tech', 'Arena Combat', 'Hardware']
  },
  {
    id: 'evt_quantum_ai_summit',
    title: 'Future Tech Summit: Quantum Neural Networks & Spatial Computing',
    shortTitle: 'Quantum & Spatial Tech Summit',
    category: 'workshops',
    categoryLabel: 'Workshops & Seminars',
    badge: 'Global Tech Keynote',
    date: 'Today · Oct 6, 2026',
    startTime: '11:00',
    endTime: '15:30',
    timeDisplay: '11:00 AM – 03:30 PM',
    status: 'live',
    currentActivity: 'Hands-on Lab: Qiskit Quantum Simulator on IBM Q Network',
    venue: EVENT_VENUES.RAMAN_HALL,
    attendees: 290,
    capacity: 300,
    bannerImage: '/images/ai_lab.jpg',
    description: 'Deep-dive symposium exploring the convergence of Quantum Computing algorithms and deep neural networks, with interactive quantum cloud execution on IBM Cloud.',
    speaker: 'Dr. Sarah Jenkins (Visiting Quantum Fellow, Oxford)',
    itinerary: [
      { time: '11:00 AM', title: 'Keynote: Scalable Quantum Hardware Paradigms', status: 'completed' },
      { time: '12:30 PM', title: 'Panel: Commercialization of Spatial Computing & Vision', status: 'completed' },
      { time: '02:00 PM', title: 'Interactive Lab: Quantum Annealing on Real QPU', status: 'live' },
      { time: '03:15 PM', title: 'Research Networking & Collaborative Grants Q&A', status: 'upcoming' }
    ],
    tags: ['Quantum Computing', 'AI Research', 'Hands-on Lab', 'Keynote']
  },
  {
    id: 'evt_inter_sports_championship',
    title: 'All-Maharashtra Inter-University Sports Championship: Finals Day',
    shortTitle: 'Inter-University Sports Finals',
    category: 'sports',
    categoryLabel: 'Sports & Athletics',
    badge: 'Championship Final',
    date: 'Today · Oct 6, 2026',
    startTime: '08:00',
    endTime: '18:00',
    timeDisplay: '08:00 AM – 06:00 PM',
    status: 'live',
    currentActivity: 'Men’s Football Final: KRC Titans vs. COEP Pune',
    venue: EVENT_VENUES.SPORTS_COMPLEX,
    attendees: 2100,
    capacity: 3500,
    bannerImage: '/images/campus_grounds.jpg',
    description: 'Championship clashes featuring inter-college soccer, cricket, 4x100m athletic relays, and badminton finals with university scouts and dignitaries in attendance.',
    speaker: 'Coach Ravindra More (Chief Sports Director)',
    itinerary: [
      { time: '08:00 AM', title: 'Track & Field 100m, 400m & Relay Finals', status: 'completed' },
      { time: '10:30 AM', title: 'Badminton & Table Tennis Championship Doubles', status: 'completed' },
      { time: '01:00 PM', title: 'T20 Cricket Super Over Final: KRC vs. VJTI', status: 'completed' },
      { time: '03:30 PM', title: 'Football Grand Final: KRC Titans vs. COEP', status: 'live' },
      { time: '05:30 PM', title: 'Champion Medals & Trophy Presentation', status: 'upcoming' }
    ],
    tags: ['Football', 'Cricket', 'Athletics', 'Trophy Final']
  }
];

export const EVENT_CATEGORIES = [
  { id: 'all', label: 'All Live Events', count: LIVE_CAMPUS_EVENTS.length },
  { id: 'tech', label: 'Tech & Hackathons', count: 2 },
  { id: 'cultural', label: 'Cultural & Arts', count: 1 },
  { id: 'workshops', label: 'Workshops & Seminars', count: 1 },
  { id: 'sports', label: 'Sports & Athletics', count: 1 }
];

/**
 * Returns current simulated or real-time event status
 */
export function getEventLiveStatus(event, currentMinutes) {
  const [startH, startM] = event.startTime.split(':').map(Number);
  const [endH, endM] = event.endTime.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  if (currentMinutes < startTotal) {
    const diff = startTotal - currentMinutes;
    return {
      status: 'upcoming',
      label: `Starts in ${Math.floor(diff / 60)}h ${diff % 60}m`,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/30'
    };
  } else if (currentMinutes >= startTotal && currentMinutes <= endTotal) {
    return {
      status: 'live',
      label: '🔴 LIVE NOW',
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/30 animate-pulse'
    };
  } else {
    return {
      status: 'completed',
      label: 'Concluded Today',
      color: 'text-muted bg-muted/10 border-border'
    };
  }
}
