/**
 * Comprehensive Weekly Timetable Service
 * Pre-defines complete semester schedules across all branches and days (Monday to Saturday)
 * Provides real-time lecture tracking, elapsed playback calculation, and faculty ongoing class resolution.
 */

export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Time slots used throughout the semester
export const TIME_SLOTS = [
  { id: 'S1', label: '09:00 AM - 10:15 AM', start: '09:00', end: '10:15', durationMinutes: 75 },
  { id: 'S2', label: '10:30 AM - 11:45 AM', start: '10:30', end: '11:45', durationMinutes: 75 },
  { id: 'S3', label: '12:30 PM - 02:00 PM', start: '12:30', end: '14:00', durationMinutes: 90, isLab: true },
  { id: 'S4', label: '02:15 PM - 03:30 PM', start: '14:15', end: '15:30', durationMinutes: 75 },
  { id: 'S5', label: '03:45 PM - 05:00 PM', start: '15:45', end: '17:00', durationMinutes: 75 },
];

// Pre-defined full weekly timetable for Semester V (Computer Science & Engineering)
// and faculty assignments across departments.
export const SEMESTER_TIMETABLE = [
  // --- MONDAY ---
  {
    id: 'MON-S1-CS501',
    day: 'Monday',
    slotId: 'S1',
    time: '09:00 - 10:15',
    start: '09:00',
    end: '10:15',
    durationMinutes: 75,
    courseCode: 'CS-501',
    courseName: 'Operating Systems & Distributed Architecture',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Arvind Joshi',
    facultyEmail: 'arvind.j@faculty.krc.edu',
    room: 'Turing Hall A (LH-201)',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Theory'
  },
  {
    id: 'MON-S2-CS502',
    day: 'Monday',
    slotId: 'S2',
    time: '10:30 - 11:45',
    start: '10:30',
    end: '11:45',
    durationMinutes: 75,
    courseCode: 'CS-502',
    courseName: 'Database Management Systems',
    facultyId: 'FAC-102',
    facultyName: 'Dr. Sneha Kulkarni',
    facultyEmail: 'sneha.k@faculty.krc.edu',
    room: 'Turing Hall B (LH-204)',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Theory'
  },
  {
    id: 'MON-S3-CS501L',
    day: 'Monday',
    slotId: 'S3',
    time: '12:30 - 14:00',
    start: '12:30',
    end: '14:00',
    durationMinutes: 90,
    courseCode: 'CS-501',
    courseName: 'OS Kernel & Virtualization Lab (Batch A)',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Arvind Joshi',
    facultyEmail: 'arvind.j@faculty.krc.edu',
    room: 'Turing Computing Lab 2',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Practical Lab'
  },
  {
    id: 'MON-S4-CS503',
    day: 'Monday',
    slotId: 'S4',
    time: '14:15 - 15:30',
    start: '14:15',
    end: '15:30',
    durationMinutes: 75,
    courseCode: 'CS-503',
    courseName: 'Computer Networks & Security Protocols',
    facultyId: 'FAC-102',
    facultyName: 'Dr. Sneha Kulkarni',
    facultyEmail: 'sneha.k@faculty.krc.edu',
    room: 'LH-202',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Theory'
  },
  {
    id: 'MON-S5-AI504',
    day: 'Monday',
    slotId: 'S5',
    time: '15:45 - 17:00',
    start: '15:45',
    end: '17:00',
    durationMinutes: 75,
    courseCode: 'AI-504',
    courseName: 'Machine Learning & Neural Networks',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Arvind Joshi',
    facultyEmail: 'arvind.j@faculty.krc.edu',
    room: 'Ramanujan AI Lab',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Elective'
  },

  // --- TUESDAY ---
  {
    id: 'TUE-S1-CS503',
    day: 'Tuesday',
    slotId: 'S1',
    time: '09:00 - 10:15',
    start: '09:00',
    end: '10:15',
    durationMinutes: 75,
    courseCode: 'CS-503',
    courseName: 'Computer Networks & Security Protocols',
    facultyId: 'FAC-102',
    facultyName: 'Dr. Sneha Kulkarni',
    facultyEmail: 'sneha.k@faculty.krc.edu',
    room: 'LH-202',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Theory'
  },
  {
    id: 'TUE-S2-EC301',
    day: 'Tuesday',
    slotId: 'S2',
    time: '10:30 - 11:45',
    start: '10:30',
    end: '11:45',
    durationMinutes: 75,
    courseCode: 'EC-301',
    courseName: 'Digital Signal Processing & Microcontrollers',
    facultyId: 'FAC-103',
    facultyName: 'Prof. Ramesh Rao',
    facultyEmail: 'ramesh.r@faculty.krc.edu',
    room: 'Faraday Wing 105',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Theory'
  },
  {
    id: 'TUE-S3-CS502L',
    day: 'Tuesday',
    slotId: 'S3',
    time: '12:30 - 14:00',
    start: '12:30',
    end: '14:00',
    durationMinutes: 90,
    courseCode: 'CS-502',
    courseName: 'Database Indexing & Query Optimization Lab',
    facultyId: 'FAC-102',
    facultyName: 'Dr. Sneha Kulkarni',
    facultyEmail: 'sneha.k@faculty.krc.edu',
    room: 'Turing Computing Lab 4',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Practical Lab'
  },
  {
    id: 'TUE-S4-CS501',
    day: 'Tuesday',
    slotId: 'S4',
    time: '14:15 - 15:30',
    start: '14:15',
    end: '15:30',
    durationMinutes: 75,
    courseCode: 'CS-501',
    courseName: 'Operating Systems & Distributed Architecture',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Arvind Joshi',
    facultyEmail: 'arvind.j@faculty.krc.edu',
    room: 'Turing Hall A (LH-201)',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Theory'
  },
  {
    id: 'TUE-S5-AI504',
    day: 'Tuesday',
    slotId: 'S5',
    time: '15:45 - 17:00',
    start: '15:45',
    end: '17:00',
    durationMinutes: 75,
    courseCode: 'AI-504',
    courseName: 'Machine Learning & Neural Networks',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Arvind Joshi',
    facultyEmail: 'arvind.j@faculty.krc.edu',
    room: 'Ramanujan AI Lab',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Elective'
  },

  // --- WEDNESDAY ---
  {
    id: 'WED-S1-CS501',
    day: 'Wednesday',
    slotId: 'S1',
    time: '09:00 - 10:15',
    start: '09:00',
    end: '10:15',
    durationMinutes: 75,
    courseCode: 'CS-501',
    courseName: 'Operating Systems & Distributed Architecture',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Arvind Joshi',
    facultyEmail: 'arvind.j@faculty.krc.edu',
    room: 'Turing Hall A (LH-201)',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Theory'
  },
  {
    id: 'WED-S2-CS502',
    day: 'Wednesday',
    slotId: 'S2',
    time: '10:30 - 11:45',
    start: '10:30',
    end: '11:45',
    durationMinutes: 75,
    courseCode: 'CS-502',
    courseName: 'Database Management Systems',
    facultyId: 'FAC-102',
    facultyName: 'Dr. Sneha Kulkarni',
    facultyEmail: 'sneha.k@faculty.krc.edu',
    room: 'Turing Hall B (LH-204)',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Theory'
  },
  {
    id: 'WED-S3-EC301L',
    day: 'Wednesday',
    slotId: 'S3',
    time: '12:30 - 14:00',
    start: '12:30',
    end: '14:00',
    durationMinutes: 90,
    courseCode: 'EC-301',
    courseName: 'DSP Filter Design Lab (MATLAB & ESP32)',
    facultyId: 'FAC-103',
    facultyName: 'Prof. Ramesh Rao',
    facultyEmail: 'ramesh.r@faculty.krc.edu',
    room: 'Faraday DSP Lab',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Practical Lab'
  },
  {
    id: 'WED-S4-CS503',
    day: 'Wednesday',
    slotId: 'S4',
    time: '14:15 - 15:30',
    start: '14:15',
    end: '15:30',
    durationMinutes: 75,
    courseCode: 'CS-503',
    courseName: 'Computer Networks & Security Protocols',
    facultyId: 'FAC-102',
    facultyName: 'Dr. Sneha Kulkarni',
    facultyEmail: 'sneha.k@faculty.krc.edu',
    room: 'LH-202',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Theory'
  },
  {
    id: 'WED-S5-SEMINAR',
    day: 'Wednesday',
    slotId: 'S5',
    time: '15:45 - 17:00',
    start: '15:45',
    end: '17:00',
    durationMinutes: 75,
    courseCode: 'CS-599',
    courseName: 'Technical Seminar & Capstone Pitching',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Arvind Joshi',
    facultyEmail: 'arvind.j@faculty.krc.edu',
    room: 'Seminar Auditorium 1',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Seminar'
  },

  // --- THURSDAY ---
  {
    id: 'THU-S1-CS502',
    day: 'Thursday',
    slotId: 'S1',
    time: '09:00 - 10:15',
    start: '09:00',
    end: '10:15',
    durationMinutes: 75,
    courseCode: 'CS-502',
    courseName: 'Database Management Systems',
    facultyId: 'FAC-102',
    facultyName: 'Dr. Sneha Kulkarni',
    facultyEmail: 'sneha.k@faculty.krc.edu',
    room: 'Turing Hall B (LH-204)',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Theory'
  },
  {
    id: 'THU-S2-CS503',
    day: 'Thursday',
    slotId: 'S2',
    time: '10:30 - 11:45',
    start: '10:30',
    end: '11:45',
    durationMinutes: 75,
    courseCode: 'CS-503',
    courseName: 'Computer Networks & Security Protocols',
    facultyId: 'FAC-102',
    facultyName: 'Dr. Sneha Kulkarni',
    facultyEmail: 'sneha.k@faculty.krc.edu',
    room: 'LH-202',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Theory'
  },
  {
    id: 'THU-S3-AI504L',
    day: 'Thursday',
    slotId: 'S3',
    time: '12:30 - 14:00',
    start: '12:30',
    end: '14:00',
    durationMinutes: 90,
    courseCode: 'AI-504',
    courseName: 'Deep Learning Model Training & PyTorch Lab',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Arvind Joshi',
    facultyEmail: 'arvind.j@faculty.krc.edu',
    room: 'Ramanujan AI Lab',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Practical Lab'
  },
  {
    id: 'THU-S4-EC301',
    day: 'Thursday',
    slotId: 'S4',
    time: '14:15 - 15:30',
    start: '14:15',
    end: '15:30',
    durationMinutes: 75,
    courseCode: 'EC-301',
    courseName: 'Digital Signal Processing & Microcontrollers',
    facultyId: 'FAC-103',
    facultyName: 'Prof. Ramesh Rao',
    facultyEmail: 'ramesh.r@faculty.krc.edu',
    room: 'Faraday Wing 105',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Theory'
  },
  {
    id: 'THU-S5-TUTORIAL',
    day: 'Thursday',
    slotId: 'S5',
    time: '15:45 - 17:00',
    start: '15:45',
    end: '17:00',
    durationMinutes: 75,
    courseCode: 'CS-501T',
    courseName: 'Operating Systems Problem Solving Tutorial',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Arvind Joshi',
    facultyEmail: 'arvind.j@faculty.krc.edu',
    room: 'LH-201',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Tutorial'
  },

  // --- FRIDAY ---
  {
    id: 'FRI-S1-CS501',
    day: 'Friday',
    slotId: 'S1',
    time: '09:00 - 10:15',
    start: '09:00',
    end: '10:15',
    durationMinutes: 75,
    courseCode: 'CS-501',
    courseName: 'Operating Systems & Distributed Architecture',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Arvind Joshi',
    facultyEmail: 'arvind.j@faculty.krc.edu',
    room: 'Turing Hall A (LH-201)',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Theory'
  },
  {
    id: 'FRI-S2-EC301',
    day: 'Friday',
    slotId: 'S2',
    time: '10:30 - 11:45',
    start: '10:30',
    end: '11:45',
    durationMinutes: 75,
    courseCode: 'EC-301',
    courseName: 'Digital Signal Processing & Microcontrollers',
    facultyId: 'FAC-103',
    facultyName: 'Prof. Ramesh Rao',
    facultyEmail: 'ramesh.r@faculty.krc.edu',
    room: 'Faraday Wing 105',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Theory'
  },
  {
    id: 'FRI-S3-PROJECT',
    day: 'Friday',
    slotId: 'S3',
    time: '12:30 - 14:00',
    start: '12:30',
    end: '14:00',
    durationMinutes: 90,
    courseCode: 'CS-580',
    courseName: 'Minor Project - Systems & Cloud Prototyping',
    facultyId: 'FAC-102',
    facultyName: 'Dr. Sneha Kulkarni',
    facultyEmail: 'sneha.k@faculty.krc.edu',
    room: 'Open Source Lab',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Project'
  },
  {
    id: 'FRI-S4-AI504',
    day: 'Friday',
    slotId: 'S4',
    time: '14:15 - 15:30',
    start: '14:15',
    end: '15:30',
    durationMinutes: 75,
    courseCode: 'AI-504',
    courseName: 'Machine Learning & Neural Networks',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Arvind Joshi',
    facultyEmail: 'arvind.j@faculty.krc.edu',
    room: 'Ramanujan AI Lab',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Elective'
  },
  {
    id: 'FRI-S5-MENTOR',
    day: 'Friday',
    slotId: 'S5',
    time: '15:45 - 17:00',
    start: '15:45',
    end: '17:00',
    durationMinutes: 75,
    courseCode: 'MENTOR-01',
    courseName: 'Faculty Mentorship & Career Guidance Session',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Arvind Joshi',
    facultyEmail: 'arvind.j@faculty.krc.edu',
    room: 'Turing Block 301',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Mentorship'
  },

  // --- SATURDAY ---
  {
    id: 'SAT-S1-COLLOQUIUM',
    day: 'Saturday',
    slotId: 'S1',
    time: '10:00 - 12:00',
    start: '10:00',
    end: '12:00',
    durationMinutes: 120,
    courseCode: 'IND-501',
    courseName: 'Industry Colloquium: Distributed AI in Production',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Arvind Joshi & Guest Speaker',
    facultyEmail: 'arvind.j@faculty.krc.edu',
    room: 'Main Auditorium',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Colloquium'
  },
  {
    id: 'SAT-S2-HACKATHON',
    day: 'Saturday',
    slotId: 'S2',
    time: '13:00 - 16:00',
    start: '13:00',
    end: '16:00',
    durationMinutes: 180,
    courseCode: 'HACK-502',
    courseName: 'KRC Hackathon & Open Source Sprint',
    facultyId: 'FAC-102',
    facultyName: 'Dr. Sneha Kulkarni',
    facultyEmail: 'sneha.k@faculty.krc.edu',
    room: 'Innovation Makerspace',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Practical Lab'
  },

  // --- SUNDAY ---
  {
    id: 'SUN-S1-ROBOTICS',
    day: 'Sunday',
    slotId: 'S1',
    time: '10:00 - 12:30',
    start: '10:00',
    end: '12:30',
    durationMinutes: 150,
    courseCode: 'ROBOT-01',
    courseName: 'Autonomous Robotics & Drone Trials Workshop',
    facultyId: 'FAC-103',
    facultyName: 'Prof. Ramesh Rao & Student Leads',
    facultyEmail: 'ramesh.r@faculty.krc.edu',
    room: 'Robotics & Drone Arena (Ground Floor)',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Practical Lab'
  },
  {
    id: 'SUN-S2-STUDY',
    day: 'Sunday',
    slotId: 'S2',
    time: '14:00 - 17:00',
    start: '14:00',
    end: '17:00',
    durationMinutes: 180,
    courseCode: 'LIB-501',
    courseName: 'Central Library Extended Research & Peer Study Hours',
    facultyId: 'FAC-101',
    facultyName: 'Dr. Arvind Joshi',
    facultyEmail: 'arvind.j@faculty.krc.edu',
    room: 'Central Library Reading Hall 2',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Tutorial'
  },
  {
    id: 'SUN-S3-AI-DEV',
    day: 'Sunday',
    slotId: 'S3',
    time: '15:30 - 17:30',
    start: '15:30',
    end: '17:30',
    durationMinutes: 120,
    courseCode: 'AI-503',
    courseName: 'Applied AI & Neural Studio Mentorship',
    facultyId: 'FAC-102',
    facultyName: 'Prof. Sneha Deshmukh',
    facultyEmail: 'sneha.d@faculty.krc.edu',
    room: 'AI & GPU Compute Lab 1 (Lab 302)',
    dept: 'CSE',
    sem: 'Sem V',
    type: 'Practical Lab'
  }
];

// Helper: Convert "HH:MM" to minutes from midnight
export function timeStringToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

// Universal day index mapping (0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun)
export function getCurrentDayIndex(date = new Date()) {
  const d = date instanceof Date ? date : new Date();
  return (d.getDay() + 6) % 7;
}

// Universal current day name safely resolving all 7 days of the week including Sunday
export function getCurrentDayName(date = new Date()) {
  const dayIndex = getCurrentDayIndex(date);
  return WEEK_DAYS[dayIndex] || 'Monday';
}

export function isSameDay(dayName, date = new Date()) {
  return dayName === getCurrentDayName(date);
}

// Global active simulated clock offset to guarantee active lecture demonstration at any hour
let simulatedTimeOffsetMinutes = 0; // 0 means use real client clock

export function setSimulatedTimeOffset(minutes) {
  simulatedTimeOffsetMinutes = minutes;
}

export function getSimulatedTimeOffset() {
  return simulatedTimeOffsetMinutes;
}

// Compute live state for a single lecture
export function computeLectureLiveState(lecture, refDate = new Date()) {
  const dayName = getCurrentDayName(refDate);
  
  // Real or offset time in minutes from midnight
  const realMinutes = refDate.getHours() * 60 + refDate.getMinutes();
  const currentMinutes = (realMinutes + simulatedTimeOffsetMinutes) % 1440;
  
  const startMinutes = timeStringToMinutes(lecture.start);
  const endMinutes = timeStringToMinutes(lecture.end);
  const totalMinutes = endMinutes - startMinutes;

  const isToday = lecture.day === dayName;

  if (!isToday) {
    return {
      status: 'OTHER_DAY',
      isLive: false,
      isUpcoming: false,
      isCompleted: false,
      progressPercent: 0,
      elapsedMinutes: 0,
      remainingMinutes: totalMinutes,
      playbackFormatted: `0m / ${totalMinutes}m`,
      statusLabel: lecture.day
    };
  }

  // Start-inclusive, end-exclusive schedule bounds apply at every hour.
  if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
    const elapsedMinutes = currentMinutes - startMinutes;
    const remainingMinutes = endMinutes - currentMinutes;
    const progressPercent = Math.min(100, Math.max(0, (elapsedMinutes / totalMinutes) * 100));
    const seconds = refDate.getSeconds();
    
    return {
      status: 'LIVE_NOW',
      isLive: true,
      isUpcoming: false,
      isCompleted: false,
      progressPercent,
      elapsedMinutes,
      remainingMinutes,
      playbackFormatted: `${elapsedMinutes}m ${String(seconds).padStart(2, '0')}s / ${totalMinutes}m elapsed`,
      statusLabel: 'LIVE NOW'
    };
  }

  // Upcoming lecture later today
  if (currentMinutes < startMinutes) {
    const startsInMinutes = startMinutes - currentMinutes;
    return {
      status: 'UPCOMING',
      isLive: false,
      isUpcoming: true,
      isCompleted: false,
      progressPercent: 0,
      elapsedMinutes: 0,
      remainingMinutes: totalMinutes,
      startsInMinutes,
      playbackFormatted: `Starts in ${startsInMinutes} mins`,
      statusLabel: `Starts in ${startsInMinutes}m`
    };
  }

  // Completed lecture earlier today
  return {
    status: 'COMPLETED',
    isLive: false,
    isUpcoming: false,
    isCompleted: true,
    progressPercent: 100,
    elapsedMinutes: totalMinutes,
    remainingMinutes: 0,
    playbackFormatted: 'Lecture Concluded',
    statusLabel: 'Completed'
  };
}

/**
 * Service API for Timetables and Live Lecture Tracking
 */
export const timetableService = {
  getFacultyLectures(facultyId, dayName) {
    if (!facultyId) return [];
    return SEMESTER_TIMETABLE.filter(l =>
      (l.facultyId === facultyId || l.facultyUid === facultyId) && (!dayName || l.day === dayName)
    );
  },

  getStudentLectures(dept, sem, dayName) {
    if (!dept || !sem) return [];
    return SEMESTER_TIMETABLE.filter(l => l.dept === dept && l.sem === sem && (!dayName || l.day === dayName));
  },
  // Get all scheduled lectures for the entire semester
  getFullSemesterTimetable() {
    return SEMESTER_TIMETABLE;
  },

  // Get timetable filtered by day
  getTimetableForDay(dayName) {
    return SEMESTER_TIMETABLE.filter(l => l.day === dayName);
  },

  getLecturesForDay(dayName) {
    return SEMESTER_TIMETABLE.filter(l => l.day === dayName);
  },

  // Helper methods to safely resolve days across all consumers
  getCurrentDayName(date = new Date()) {
    return getCurrentDayName(date);
  },
  getCurrentDayIndex(date = new Date()) {
    return getCurrentDayIndex(date);
  },
  isToday(dayName, date = new Date()) {
    return isSameDay(dayName, date);
  },
  getWeekDays() {
    return WEEK_DAYS;
  },

  // Get today's schedule with live status for student
  getStudentTodaySchedule(dept = 'CSE', sem = 'Sem V', refDate = new Date()) {
    const date = dept instanceof Date ? dept : refDate;
    const d = dept instanceof Date ? 'CSE' : dept;
    const s = dept instanceof Date ? 'Sem V' : sem;
    const dayName = getCurrentDayName(date);
    const todayLectures = SEMESTER_TIMETABLE.filter(l => l.day === dayName && l.dept === d && l.sem === s);
    
    return todayLectures.map(lecture => {
      const liveState = computeLectureLiveState(lecture, date);
      return {
        ...lecture,
        ...liveState
      };
    });
  },

  // Get active or upcoming lecture for a student right now
  getStudentActiveOrNextLecture(dept = 'CSE', sem = 'Sem V', refDate = new Date()) {
    let date = refDate;
    let d = dept;
    let s = sem;
    if (dept instanceof Date) {
      date = dept;
      d = 'CSE';
      s = 'Sem V';
    }
    const dayName = getCurrentDayName(date);
    const todayLectures = SEMESTER_TIMETABLE
      .filter(l => l.day === dayName && l.dept === d && l.sem === s)
      .sort((a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start));
    
    // Check if any is currently LIVE_NOW
    for (const lec of todayLectures) {
      const state = computeLectureLiveState(lec, date);
      if (state.isLive) {
        const enriched = { ...lec, ...state };
        return { 
          lecture: enriched, 
          activeLecture: enriched,
          nextUpcomingLecture: null,
          todayLectures,
          isLive: true 
        };
      }
    }

    // Check for next upcoming
    for (const lec of todayLectures) {
      const state = computeLectureLiveState(lec, date);
      if (state.isUpcoming) {
        const enriched = { ...lec, ...state };
        return { 
          lecture: enriched, 
          activeLecture: null,
          nextUpcomingLecture: enriched,
          todayLectures,
          isLive: false, 
          isUpcoming: true 
        };
      }
    }

    // An empty or finished schedule cannot supply an active lecture.
    return {
      lecture: null,
      activeLecture: null,
      nextUpcomingLecture: null,
      todayLectures,
      isLive: false,
      isUpcoming: false
    };
  },

  // Get ongoing active lecture specifically for a Faculty member
  getFacultyOngoingLecture(facultyEmailOrName, refDate = new Date()) {
    const dayName = getCurrentDayName(refDate);
    
    // Filter lectures taught by this faculty member today
    const facultyToday = SEMESTER_TIMETABLE.filter(l => {
      if (l.day !== dayName) return false;
      if (!facultyEmailOrName) return false;
      const target = String(facultyEmailOrName).toLowerCase().trim();
      return (
        l.facultyId === facultyEmailOrName ||
        String(l.facultyEmail || '').toLowerCase().trim() === target ||
        String(l.facultyName || '').toLowerCase().trim() === target
      );
    }).sort((a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start));

    // 1. Look for an ongoing lecture LIVE RIGHT NOW
    for (const lec of facultyToday) {
      const state = computeLectureLiveState(lec, refDate);
      if (state.isLive) {
        return {
          ongoingLecture: { ...lec, ...state },
          isLiveNow: true,
          allFacultyLecturesToday: facultyToday
        };
      }
    }

    // 2. Look for the next upcoming lecture today
    for (const lec of facultyToday) {
      const state = computeLectureLiveState(lec, refDate);
      if (state.isUpcoming) {
        return {
          ongoingLecture: { ...lec, ...state },
          isLiveNow: false,
          isNextUpcoming: true,
          allFacultyLecturesToday: facultyToday
        };
      }
    }

    return {
      ongoingLecture: null,
      isLiveNow: false,
      isNextUpcoming: false,
      allFacultyLecturesToday: facultyToday
    };
  },

  // Get all ongoing lectures across campus for Admin Dashboard live monitor
  getAllCampusOngoingLectures(refDate = new Date()) {
    const dayName = getCurrentDayName(refDate);
    const todayLectures = SEMESTER_TIMETABLE.filter(l => l.day === dayName);

    const liveLectures = [];
    const upcomingLectures = [];

    todayLectures.forEach(lec => {
      const state = computeLectureLiveState(lec, refDate);
      if (state.isLive) {
        liveLectures.push({ ...lec, ...state });
      } else if (state.isUpcoming) {
        upcomingLectures.push({ ...lec, ...state });
      }
    });

    return { liveLectures, upcomingLectures };
  }
};
