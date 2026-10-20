/**
 * @fileoverview PUBLIC AcademicsPage Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Code2, Cpu, Bot, Network, Layers, 
  CheckCircle2, ArrowRight, Award, FileText, Users, Clock 
} from 'lucide-react';

const PROGRAMS = [
  {
    code: 'CSE',
    dteCode: '628524510',
    name: 'B.Tech in Computer Science & Engineering',
    intake: 180,
    duration: '4 Years (8 Semesters)',
    icon: Code2,
    desc: 'Core computer science curriculum covering data structures, algorithm analysis, operating systems, compiler design, cloud architectures, and full-stack software development.',
    coreSubjects: ['Data Structures & Algorithms', 'Operating Systems', 'Database Management Systems', 'Computer Networks', 'Cloud Computing', 'Web Frameworks'],
    labs: 'Software Engineering Lab, Database Systems Lab, Linux Programming Station',
    eligibility: '10+2 with PCM (Min 45% General, 40% Reserved) + Valid JEE Main / MHT-CET score'
  },
  {
    code: 'AI&DS',
    dteCode: '628526310',
    name: 'B.Tech in Artificial Intelligence & Data Science',
    intake: 120,
    duration: '4 Years (8 Semesters)',
    icon: Cpu,
    desc: 'Specialized program blending statistical mathematics, machine learning theory, data engineering pipelines, neural networks, and applied computer vision.',
    coreSubjects: ['Statistical Foundations for ML', 'Deep Learning & Neural Nets', 'Natural Language Processing', 'Data Warehousing & Big Data', 'Computer Vision'],
    labs: 'Applied AI & ML Lab (RTX 4070 Workstations), Python Analytics Studio',
    eligibility: '10+2 with PCM (Min 45% General, 40% Reserved) + Valid JEE Main / MHT-CET score'
  },
  {
    code: 'E&TC',
    dteCode: '628537210',
    name: 'B.Tech in Electronics & Telecommunication',
    intake: 120,
    duration: '4 Years (8 Semesters)',
    icon: Network,
    desc: 'Rigorous engineering training in modern digital signal processing, RF communication systems, embedded VLSI design, and optical networking.',
    coreSubjects: ['Signals & Systems', 'Digital Signal Processing', 'Microcontrollers & Embedded Systems', 'VLSI Design', 'RF & Microwave Engineering'],
    labs: 'Digital Electronics Lab, Microwave & Antenna Lab, VLSI Simulation Suite',
    eligibility: '10+2 with PCM (Min 45% General, 40% Reserved) + Valid JEE Main / MHT-CET score'
  },
  {
    code: 'IT',
    dteCode: '628524610',
    name: 'B.Tech in Information Technology',
    intake: 60,
    duration: '4 Years (8 Semesters)',
    icon: Layers,
    desc: 'Focus on enterprise software architectures, network administration, cybersecurity frameworks, DevOps automation, and scalable distributed storage systems.',
    coreSubjects: ['Object-Oriented Programming', 'Cyber Defense & Security', 'DevOps & CI/CD Pipelines', 'Mobile App Development', 'Enterprise Systems'],
    labs: 'Network Security Lab, Cloud Computing & Virtualization Sandbox',
    eligibility: '10+2 with PCM (Min 45% General, 40% Reserved) + Valid JEE Main / MHT-CET score'
  },
  {
    code: 'ROBO',
    dteCode: '628561210',
    name: 'B.Tech in Robotics & Automation Engineering',
    intake: 60,
    duration: '4 Years (8 Semesters)',
    icon: Bot,
    desc: 'Interdisciplinary program combining mechanical design, sensor integration, robotic kinematics, industrial PLC automation, and autonomous navigation.',
    coreSubjects: ['Robotic Kinematics & Dynamics', 'Sensors & Actuators', 'Industrial Automation & PLC', 'ROS2 Robotics Simulation', 'Mechatronic Systems Design'],
    labs: 'Hardware Makerspace, 3D Prototyping Workshop, Robotic Arm Testbed',
    eligibility: '10+2 with PCM (Min 45% General, 40% Reserved) + Valid JEE Main / MHT-CET score'
  }
];

export default function AcademicsPage() {
  const [selectedProgram, setSelectedProgram] = useState(PROGRAMS[0]);

  return (
    <div className="w-full">

      {/* Header Banner */}
      <section className="border-b border-border bg-surface py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-bg text-xs font-semibold text-muted">
              <BookOpen className="w-3.5 h-3.5 text-text" /> SPPU Affiliated Curriculum · CBCS Pattern
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text leading-tight">
              Academic Programs &amp; Engineering Disciplines
            </h1>
            <p className="text-base sm:text-lg text-muted leading-relaxed">
              KRC Institute of Technology offers 5 accredited undergraduate B.Tech engineering programs and 
              postgraduate research options designed in alignment with Savitribai Phule Pune University (SPPU) 
              standards and contemporary engineering demands.
            </p>
          </div>
        </div>
      </section>

      {/* Lab Highlights Preview */}
      <section className="border-b border-border py-10 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Hands-On Pedagogy</span>
              <h2 className="text-2xl font-bold text-text">Project-Based Learning from Semester 1</h2>
              <p className="text-sm text-muted leading-relaxed">
                Rather than treating laboratory practicals as simple cookbook exercises, our curriculum embeds mini-projects 
                into every core engineering subject. Students work in paired squads on dedicated workstations, learning version 
                control, software debugging, and hardware fabrication.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-lg border border-border bg-surface">
                  <div className="text-xl font-bold text-text">1:1</div>
                  <div className="text-xs text-muted">Student-to-PC Ratio in Labs</div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-surface">
                  <div className="text-xl font-bold text-text">1:15</div>
                  <div className="text-xs text-muted">Faculty to Student Ratio</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-border">
              <img 
                src="/images/cs_lab.jpg" 
                alt="Computer Science Laboratory" 
                className="w-full h-72 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Program Selector & Deep Dive */}
      <section className="border-b border-border py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Undergraduate Engineering Degrees (B.Tech)</h2>
            <p className="text-xs sm:text-sm text-muted">Select an engineering department to view intake, curriculum, and core laboratory infrastructure.</p>
          </div>

          {/* Department Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {PROGRAMS.map((prog) => {
              const isSelected = selectedProgram.code === prog.code;
              return (
                <button
                  key={prog.code}
                  onClick={() => setSelectedProgram(prog)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    isSelected 
                      ? 'bg-text text-bg shadow-sm' 
                      : 'border border-border bg-bg text-muted hover:text-text hover:bg-surface'
                  }`}
                >
                  {prog.code} ({prog.intake} Seats)
                </button>
              );
            })}
          </div>

          {/* Selected Program Card */}
          <div className="p-4 sm:p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-border bg-bg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
              <div>
                <span className="text-[11px] font-mono text-muted uppercase">DTE Choice Code: {selectedProgram.dteCode}</span>
                <h3 className="text-xl sm:text-2xl font-bold text-text mt-1">{selectedProgram.name}</h3>
                <p className="text-xs text-muted mt-0.5">{selectedProgram.duration} · Annual Approved Intake: {selectedProgram.intake} Students</p>
              </div>
              <Link 
                to="/admissions" 
                className="px-4 py-2 rounded-lg bg-text text-bg text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 flex items-center justify-center gap-1.5 touch-manipulation"
              >
                Apply for {selectedProgram.code} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <p className="text-sm text-muted leading-relaxed">
              {selectedProgram.desc}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted" /> Core Curriculum Highlights
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedProgram.coreSubjects.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-muted p-2 rounded bg-surface border border-border">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-muted" /> Dedicated Practical Labs
                  </h4>
                  <p className="text-xs text-muted p-3 rounded bg-surface border border-border">
                    {selectedProgram.labs}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-2">
                    <Award className="w-4 h-4 text-muted" /> Eligibility Criteria
                  </h4>
                  <p className="text-xs text-muted p-3 rounded bg-surface border border-border leading-relaxed">
                    {selectedProgram.eligibility}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Intake & Summary Table */}
      <section className="py-12 sm:py-16 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">Seat Matrix (Academic Year 2025–26)</h2>
            <p className="text-xs text-muted">All seats are allocated via Maharashtra State CET Cell Centralized Admission Process (CAP).</p>
          </div>

          <div className="overflow-x-auto table-responsive border border-border rounded-xl bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg border-b border-border text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 whitespace-nowrap">Department</th>
                  <th className="p-3.5 whitespace-nowrap">Degree</th>
                  <th className="p-3.5 whitespace-nowrap">DTE Choice Code</th>
                  <th className="p-3.5 whitespace-nowrap">Sanctioned Intake</th>
                  <th className="p-3.5 whitespace-nowrap">Affiliation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted">
                {PROGRAMS.map((prog) => (
                  <tr key={prog.code} className="hover:bg-bg/40 transition-colors">
                    <td className="p-3.5 font-bold text-text whitespace-nowrap">{prog.name}</td>
                    <td className="p-3.5 whitespace-nowrap">B.Tech (4 Yrs)</td>
                    <td className="p-3.5 font-mono whitespace-nowrap">{prog.dteCode}</td>
                    <td className="p-3.5 font-bold text-text whitespace-nowrap">{prog.intake}</td>
                    <td className="p-3.5 whitespace-nowrap">SPPU Pune</td>
                  </tr>
                ))}
                <tr className="hover:bg-bg/40 transition-colors bg-surface/50">
                  <td className="p-3.5 font-bold text-text">M.Tech in Computer Engineering</td>
                  <td className="p-3.5">M.Tech (2 Yrs)</td>
                  <td className="p-3.5 font-mono">628524520</td>
                  <td className="p-3.5 font-bold text-text">24</td>
                  <td className="p-3.5">SPPU Pune</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>


      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}
