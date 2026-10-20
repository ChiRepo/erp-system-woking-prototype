/**
 * @fileoverview PUBLIC ResearchPage Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cpu, Bot, ShieldCheck, Zap, HardDrive, 
  Terminal, Award, Layers, CheckCircle2, ArrowRight 
} from 'lucide-react';

const LABS = [
  {
    id: 'ai-lab',
    name: 'Applied AI & Machine Learning Lab',
    badge: 'Computing Facility',
    lead: 'Prof. Arvind Joshi (Ph.D., IIT Bombay)',
    image: '/images/cs_lab.jpg',
    summary: 'Configured for undergraduate machine learning experimentation, computer vision model training, and beginner-level NLP inference.',
    hardware: [
      '60x Dell Precision 3660 Workstations',
      'Intel Core i7-13700 (16 Cores, 24 Threads, up to 5.2 GHz)',
      '32 GB DDR5 4800MHz Dual-Channel RAM',
      '1 TB NVMe M.2 PCIe Gen4 Solid State Drive',
      'NVIDIA GeForce RTX 4070 (12 GB GDDR6X VRAM) for CUDA acceleration',
      '27-inch 144Hz IPS color-calibrated dual displays'
    ],
    software: [
      'Ubuntu 24.04 LTS / Windows 11 Pro Dual-Boot',
      'CUDA Toolkit 12.4 & cuDNN acceleration drivers',
      'PyTorch, TensorFlow, Scikit-learn, OpenCV',
      'Ollama local inference runtime (quantized 7B/8B models for experimentation)',
      'JupyterLab Server & VS Code IDE integration'
    ],
    studentProjects: 'Pothole detection with YOLOv8, Marathi speech-to-text transcriber, crop disease image classification.'
  },
  {
    id: 'embedded-lab',
    name: 'Embedded Systems & IoT Makerspace',
    badge: 'Hardware Makerspace',
    lead: 'Dr. Rajesh Sharma (Ph.D., IISc Bangalore)',
    image: '/images/robotics_lab.jpg',
    summary: 'Equipped with microcontroller developer boards, oscilloscopes, and testing benches for sensor telemetry and smart edge devices.',
    hardware: [
      '40x Dedicated Hardware Testing Workbenches',
      'Raspberry Pi 5 (8GB) & ESP32-WROOM Development Boards',
      'Arduino Mega 2560 & STM32 ARM Cortex-M4 Microcontrollers',
      'Rigol DS1054Z 50MHz 4-Channel Digital Storage Oscilloscopes',
      'Digital Multi-meters, DC Regulated Power Supplies (0-30V 5A)',
      'Temperature-Controlled ESD-Safe Soldering Stations & Desoldering Guns'
    ],
    software: [
      'Arduino IDE 2.x, PlatformIO & ESP-IDF',
      'KiCAD PCB Layout & Schematics Design Suite',
      'MQTT Mosquitto Broker & Node-RED Telemetry Dashboard',
      'Saleae Logic Analyzer Protocol Analyzers'
    ],
    studentProjects: 'Smart solar irrigation controller, LoRaWAN environmental telemetry node, smart campus energy monitor.'
  },
  {
    id: 'robotics-lab',
    name: 'Robotics & Rapid Prototyping Workshop',
    badge: 'Prototyping Arena',
    lead: 'Prof. Aniket Patil (M.Tech, COEP Pune)',
    image: '/images/ai_lab.jpg',
    summary: 'Comprehensive mechanical prototyping workshop with 3D printers, CNC PCB milling, and autonomous rover testbeds.',
    hardware: [
      'Bambu Lab P1S & Creality Ender-3 V3 High-Speed 3D Printers',
      'CNC Desktop PCB Milling & Isolation Router',
      '6-Axis Robotic Arm Trainer Units with Gripper Actuators',
      'Rock-Bogie Rover Chassis Testbed with Mecanum Wheels',
      'LiDAR 2D/3D Sensors & Ultrasonic Distance Arrays',
      'Precision Mechanical Hand Tools, Dremel Sets & Safety Enclosures'
    ],
    software: [
      'ROS2 (Robot Operating System - Humble Hawksbill)',
      'Gazebo & RViz Physics Simulation Suite',
      'Autodesk Fusion 360 & SolidWorks CAD Educational Licenses',
      'PrusaSlicer & Bambu Studio Slicing Engines'
    ],
    studentProjects: 'Autonomous warehouse AGV prototype, search-and-rescue tracked rover, quadcopter aerial delivery gimbal.'
  },
  {
    id: 'systems-lab',
    name: 'Systems, Cloud & Open Source Lab',
    badge: 'Software Lab',
    lead: 'Prof. Sneha Kulkarni (M.Tech, SPPU)',
    image: '/images/cs_lab.jpg',
    summary: 'Focused on Linux kernel fundamentals, container orchestration, network routing protocols, and full-stack software development.',
    hardware: [
      '60x HP ProDesk Workstations with Intel Core i5-13500 & 16GB RAM',
      'Gigabit Managed Cisco Switches with VLAN Segmentation',
      'On-Premise Synology NAS Storage (16TB RAID-6) for Student Code Archives',
      'Dedicated Local GitLab & CI/CD Pipeline Runner Server'
    ],
    software: [
      'Ubuntu Server & Debian Enterprise GNU/Linux',
      'Docker Engine & Minikube Local Kubernetes Clusters',
      'PostgreSQL 16, Redis, and MongoDB databases',
      'Git, Postman, Wireshark Network Packet Analyzer'
    ],
    studentProjects: 'Campus intranet student collaboration portal, automated CI/CD grader for programming lab tests, local DNS service.'
  }
];

export default function ResearchPage() {
  const [activeLab, setActiveLab] = useState(LABS[0]);

  return (
    <div className="w-full">

      {/* Header Banner */}
      <section className="border-b border-border bg-surface py-10 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-bg text-xs font-semibold text-muted">
              <Cpu className="w-3.5 h-3.5 text-text" /> High-Performance Workstations &amp; Hardware Labs
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text leading-tight">
              Computing Infrastructure &amp; Engineering Labs
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted leading-relaxed">
              Equipped with modern developer workstations, RTX-series dedicated graphics, digital testbenches, 
              and 3D prototyping tools. Built to give every student hands-on technical competence from beginner 
              algorithms to capstone hardware engineering.
            </p>
          </div>
        </div>
      </section>

      {/* Lab Switcher Section */}
      <section className="border-b border-border py-10 sm:py-14 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-8 sm:mb-10 pb-2 border-b border-border">
            {LABS.map((lab) => {
              const isActive = activeLab.id === lab.id;
              return (
                <button
                  key={lab.id}
                  onClick={() => setActiveLab(lab)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all touch-manipulation ${
                    isActive 
                      ? 'bg-text text-bg shadow-sm' 
                      : 'border border-border bg-surface text-muted hover:text-text'
                  }`}
                >
                  {lab.name}
                </button>
              );
            })}
          </div>

          {/* Active Lab Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">{activeLab.badge} · Faculty Lead: {activeLab.lead}</span>
                <h2 className="text-2xl font-bold text-text mt-1">{activeLab.name}</h2>
                <p className="text-sm text-muted mt-2 leading-relaxed">{activeLab.summary}</p>
              </div>

              {/* Hardware Specifications */}
              <div className="p-5 rounded-xl border border-border bg-surface space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-muted" /> Realistic Hardware Specifications
                </h3>
                <ul className="space-y-1.5 text-xs text-muted">
                  {activeLab.hardware.map((spec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Software Toolchain */}
              <div className="p-5 rounded-xl border border-border bg-surface space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-muted" /> Software &amp; Developer Toolchain
                </h3>
                <ul className="space-y-1.5 text-xs text-muted">
                  {activeLab.software.map((tool, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{tool}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sample Student Projects */}
              <div className="p-4 rounded-xl border border-border bg-bg text-xs">
                <span className="font-bold text-text">Recent Student Work in this Lab: </span>
                <span className="text-muted">{activeLab.studentProjects}</span>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                <img 
                  src={activeLab.image} 
                  alt={activeLab.name} 
                  className="w-full h-80 object-cover"
                />
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface text-xs text-muted leading-relaxed">
                <p className="font-bold text-text mb-1">Open Access Policy</p>
                All registered B.Tech students have supervised lab access outside lecture hours (8:00 AM to 8:00 PM) 
                to build capstone engineering projects, participate in hackathons, and experiment with hardware kits.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Practical AI Benchmarks Callout */}
      <section className="py-14 bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-text">Accessible, Practical AI for Every Engineering Student</h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Instead of relying exclusively on costly remote cloud APIs, our laboratories emphasize running local, 
              quantized models directly on desktop GPUs. Students gain foundational intuition about memory bandwidth, 
              quantization formats (GGUF/AWQ), batch sizes, and inference latency on standard commercial hardware.
            </p>
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
