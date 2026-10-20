export const isDemo = false;

export const demoStudents = [];

export const demoFaculty = [
  { id: "FAC-101", name: "Dr. Arvind Joshi", role: "Professor & Head of Dept", dept: "CSE", exp: "18 Yrs Exp", email: "arvind.j@faculty.krc.edu", room: "Turing Block 301", subjects: "Operating Systems, Distributed AI", status: "Office Hours" },
  { id: "FAC-102", name: "Dr. Sneha Kulkarni", role: "Associate Professor", dept: "CSE", exp: "12 Yrs Exp", email: "sneha.k@faculty.krc.edu", room: "Turing Block 304", subjects: "DBMS, Cloud Computing", status: "Office Hours" },
  { id: "FAC-103", name: "Prof. Ramesh Rao", role: "Professor & Academic Dean", dept: "ECE", exp: "22 Yrs Exp", email: "ramesh.r@faculty.krc.edu", room: "Faraday Wing 102", subjects: "Digital Signal Processing", status: "Research Advisory" },
  { id: "FAC-104", name: "Dr. Rajesh Sharma", role: "Associate Professor & Hostel Warden", dept: "MECH", exp: "14 Yrs Exp", email: "rajesh.s@faculty.krc.edu", room: "Newton Hall 204", subjects: "Thermodynamics, Robotics", status: "On Campus" },
  { id: "FAC-105", name: "Dr. Sunita Deshmukh", role: "Professor & Chair of Management", dept: "MBA", exp: "16 Yrs Exp", email: "sunita.d@faculty.krc.edu", room: "Management Wing 401", subjects: "Financial Analytics, Leadership", status: "In Lecture" },
  { id: "FAC-106", name: "Dr. Sandeep Patil", role: "Assistant Professor", dept: "CIVIL", exp: "9 Yrs Exp", email: "sandeep.p@faculty.krc.edu", room: "Visvesvaraya Lab 102", subjects: "Structural Mechanics, CAD", status: "Lab Session" }
];

export const demoCourses = [
  { code: "CS-501", name: "Operating Systems & Distributed Architecture", dept: "CSE", credits: 4, faculty: "Dr. Arvind Joshi", studentsCount: 68, room: "LH-201" },
  { code: "CS-502", name: "Advanced Database Management Systems", dept: "CSE", credits: 4, faculty: "Dr. Sneha Kulkarni", studentsCount: 64, room: "LH-204" },
  { code: "CS-503", name: "Computer Networks & Security Protocols", dept: "CSE", credits: 3, faculty: "Dr. Arvind Joshi", studentsCount: 72, room: "LH-202" },
  { code: "EC-301", name: "Digital Signal Processing & Architectures", dept: "ECE", credits: 4, faculty: "Prof. Ramesh Rao", studentsCount: 58, room: "FW-105" },
  { code: "ME-401", name: "Applied Thermodynamics & Fluid Dynamics", dept: "MECH", credits: 4, faculty: "Dr. Rajesh Sharma", studentsCount: 52, room: "NH-101" },
  { code: "MB-201", name: "Corporate Financial Analysis & Models", dept: "MBA", credits: 3, faculty: "Dr. Sunita Deshmukh", studentsCount: 45, room: "MW-302" }
];

export const demoSchedule = [
  { day: "Monday", time: "09:00 - 10:30", course: "CS-501: Operating Systems", room: "LH-201", faculty: "Dr. Arvind Joshi" },
  { day: "Monday", time: "11:00 - 12:30", course: "CS-502: Advanced DBMS", room: "LH-204", faculty: "Dr. Sneha Kulkarni" },
  { day: "Monday", time: "14:00 - 16:00", course: "CS-501 Lab: OS Virtualization", room: "Lab Turing 2", faculty: "Dr. Arvind Joshi" },
  { day: "Tuesday", time: "09:30 - 11:00", course: "CS-503: Networks & Security", room: "LH-202", faculty: "Dr. Arvind Joshi" },
  { day: "Tuesday", time: "11:30 - 13:00", course: "EC-301: DSP & Architectures", room: "FW-105", faculty: "Prof. Ramesh Rao" },
  { day: "Wednesday", time: "09:00 - 10:30", course: "CS-501: Operating Systems", room: "LH-201", faculty: "Dr. Arvind Joshi" },
  { day: "Wednesday", time: "11:00 - 12:30", course: "CS-502: Advanced DBMS", room: "LH-204", faculty: "Dr. Sneha Kulkarni" },
  { day: "Thursday", time: "10:00 - 11:30", course: "CS-503: Networks & Security", room: "LH-202", faculty: "Dr. Arvind Joshi" },
  { day: "Thursday", time: "14:00 - 16:00", course: "CS-502 Lab: Query Optimization", room: "Lab Turing 4", faculty: "Dr. Sneha Kulkarni" },
  { day: "Friday", time: "09:00 - 10:30", course: "ME-401: Thermodynamics", room: "NH-101", faculty: "Dr. Rajesh Sharma" },
  { day: "Friday", time: "11:00 - 12:30", course: "MB-201: Financial Analytics", room: "MW-302", faculty: "Dr. Sunita Deshmukh" },
  { day: "Saturday", time: "10:00 - 12:00", course: "Colloquium: Industry AI Applications", room: "Auditorium 1", faculty: "Dean Guest Lecture" }
];

export const demoFees = [];

export const demoExams = [
  { code: "CS-501", name: "Operating Systems Final", date: "2026-11-12", time: "10:00 - 13:00", hall: "Exam Hall A", totalMarks: 100 },
  { code: "CS-502", name: "Advanced DBMS Theory", date: "2026-11-15", time: "10:00 - 13:00", hall: "Exam Hall B", totalMarks: 100 },
  { code: "CS-503", name: "Networks & Security Mid-Term", date: "2026-11-18", time: "14:00 - 17:00", hall: "Exam Hall A", totalMarks: 100 },
  { code: "EC-301", name: "DSP Practical & Viva", date: "2026-11-21", time: "09:00 - 12:00", hall: "Digital Lab", totalMarks: 50 }
];

export const demoLibrary = [
  { id: "LIB-001", title: "Modern Operating Systems (4th Ed)", author: "Andrew S. Tanenbaum", isbn: "978-0133591620", category: "Computer Science", available: 8, total: 12 },
  { id: "LIB-002", title: "Database System Concepts (7th Ed)", author: "Silberschatz, Korth, Sudarshan", isbn: "978-0078022159", category: "Computer Science", available: 5, total: 10 },
  { id: "LIB-003", title: "Computer Networking: A Top-Down Approach", author: "Kurose & Ross", isbn: "978-0133827439", category: "Networking", available: 12, total: 15 },
  { id: "LIB-004", title: "Introduction to Algorithms (CLRS 3rd)", author: "Cormen, Leiserson, Rivest, Stein", isbn: "978-0262033848", category: "Algorithms", available: 3, total: 8 },
  { id: "LIB-005", title: "Fundamentals of Fluid Mechanics", author: "Munson, Rothmayer, Okiishi", isbn: "978-1118116135", category: "Mechanical", available: 7, total: 10 }
];

export const demoHostel = [
  { id: "HST-A", name: "Shree Chhatrapati Shivaji Hostel (Boys)", capacity: 420, occupied: 398, warden: "Dr. Rajesh Sharma", phone: "+91 20 2544 1120", fee: "₹75,000 / Sem", amenities: ["Wi-Fi 1Gbps", "Mess Dining Hall", "Gymnasium", "24/7 Security"] },
  { id: "HST-B", name: "Savitribai Phule Bhavan (Girls)", capacity: 380, occupied: 365, warden: "Prof. Meenakshi Joshi", phone: "+91 20 2544 1125", fee: "₹75,000 / Sem", amenities: ["High-speed LAN", "In-house Clinic", "Study Lounge", "Biometric Access"] },
  { id: "HST-C", name: "International Student Quarters", capacity: 150, occupied: 122, warden: "Dr. Arvind Joshi", phone: "+91 20 2544 1130", fee: "₹1,20,000 / Sem", amenities: ["Air-Conditioned", "Kitchenette", "Shuttle Service", "Recreation Room"] }
];
