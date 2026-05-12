export const NAVIGATION_LINKS = [
  { label: "Gallery", href: "/simulations" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Login", href: "/login" },
];

export const SIMULATIONS = [
  {
    title: "Projectile Motion",
    description: "Analyze the physics of trajectories, drag, and impact mechanics in a vacuum or atmosphere.",
    image: "/images/simulations/projectile-motion.png",
    difficulty: "Beginner",
    href: "/simulations/projectile-motion"
  },
  {
    title: "Pendulum Dynamics",
    description: "Explore simple harmonic motion, damping, and energy conservation in gravitational fields.",
    image: "/images/simulations/pendulum.png",
    difficulty: "Beginner",
    href: "/simulations/pendulum"
  },
  {
    title: "Quantum Tunneling",
    description: "Visualize wave functions and the probability of particles bypassing potential barriers.",
    image: "/images/simulations/quantum-effects.png",
    difficulty: "Advanced",
    href: "/simulations/quantum"
  },
  {
    title: "Electric Circuits",
    description: "Build and test complex DC circuits with real-time current and voltage measurements.",
    image: "/images/simulations/circuits-lab.png",
    difficulty: "Intermediate",
    href: "/simulations/circuits"
  },
  {
    title: "Wave Interference",
    description: "Superimpose light and sound waves to observe diffraction and interference patterns.",
    image: "/images/simulations/wave-interferenc.png",
    difficulty: "Intermediate",
    href: "/simulations/waves"
  },
  {
    title: "Orbital Mechanics",
    description: "Simulate multi-body gravitational systems and calculate escape velocities for planetary travel.",
    image: "/images/simulations/gravitation.png",
    difficulty: "Advanced",
    href: "/simulations/orbit"
  },
];

export const CATEGORIES = [
  { name: "Mechanics", icon: "activity", count: "42 Simulations" },
  { name: "Waves", icon: "waves", count: "18 Simulations" },
  { name: "Electricity", icon: "zap", count: "25 Simulations" },
  { name: "Optics", icon: "eye", count: "12 Simulations" },
  { name: "Thermodynamics", icon: "thermometer", count: "15 Simulations" },
];

export const STATS = [
  { label: "Simulations", value: 120, suffix: "+" },
  { label: "Active Concepts", value: 450, suffix: "" },
  { label: "Experiments Run", value: 85, suffix: "k" },
  { label: "Learning Hours", value: 12, suffix: "M" },
];

export const FEATURES = [
  {
    title: "Physics Intuition",
    description: "Move beyond formulas. Manipulate variables in real-time and see immediate physical consequences.",
    icon: "play"
  },
  {
    title: "Visual Data",
    description: "High-precision graphing and vectors visualization help you 'see' the invisible forces at work.",
    icon: "eye"
  },
  {
    title: "Advanced Scenarios",
    description: "From simple pendulums to relativistic speeds, our engine handles complex physical edge cases.",
    icon: "brain"
  },
  {
    title: "Tactile Learning",
    description: "Drag-and-drop interfaces and responsive controls make experimentation feel physical and real.",
    icon: "mouse-pointer"
  },
  {
    title: "Curriculum Aligned",
    description: "Designed alongside educators to support AP, IB, and University physics standards.",
    icon: "smile"
  }
];

export const FOOTER_LINKS = [
  {
    title: "Platform",
    links: [
      { label: "Simulations", href: "#" },
      { label: "Lesson Plans", href: "#" },
      { label: "Assessment", href: "#" },
      { label: "Accessibility", href: "#" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Research", href: "#" },
      { label: "For Educators", href: "#" },
      { label: "Workshops", href: "#" },
      { label: "Source Code", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];
