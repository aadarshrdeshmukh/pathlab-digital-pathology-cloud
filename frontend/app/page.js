'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Lens } from '../components/magicui/lens';
import './landing.css';

/* ─────────────── SVG Icon Components ─────────────── */

const PathLabLogo = () => (
  <img
    src="/images/pathlab-logo.png"
    alt="PathLab Logo"
    width={28}
    height={28}
    draggable="false"
    style={{ objectFit: 'contain' }}
  />
);

const CheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="10" fill="#1e3a8a"/>
    <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2M8 2v9M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ScrollIcon = () => (
  <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
    <rect x="1" y="1" width="18" height="26" rx="9" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
    <circle cx="10" cy="8" r="2" fill="rgba(255,255,255,0.6)">
      <animate attributeName="cy" values="8;14;8" dur="2s" repeatCount="indefinite"/>
    </circle>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


/* ─────────────── Tissue images for grid cells ─────────────── */
const tissueImages = [
  '/images/tissue-new.png',
  '/images/tissue-1.png',
  '/images/tissue-2.png',
  '/images/tissue-3.png',
];

// 15 cards total for a 5x3 grid layout
const gridCells = Array.from({ length: 15 }, (_, i) => {
  const id = i + 1;
  const img = id % 4; // rotate tissue images
  return { id, img };
});

const testimonials = [
  {
    quote: "PathLab reduced our specialist onboarding time to just minutes. We can now confidently handle overflow cases without delay.",
    name: "Dr. Rachel Kim",
    role: "Chief Pathologist, Mercy Regional Lab",
  },
  {
    quote: "The cloud-based reporting system has cut our turnaround time by 40%. Our clinicians get results faster than ever before.",
    name: "Dr. Anil Mehta",
    role: "Lab Director, HealthFirst Diagnostics",
  },
  {
    quote: "Seamless integration with our existing LIMS made the transition effortless. PathLab is now the backbone of our digital pathology workflow.",
    name: "Dr. Sarah Chen",
    role: "Head of Digital Pathology, Metro Health",
  },
  {
    quote: "HIPAA-compliant from day one — that was non-negotiable for us. PathLab delivered security without sacrificing usability.",
    name: "James Rodriguez",
    role: "CTO, ClearView Laboratories",
  },
];


/* ─────────────── Landing Page Component ─────────────── */

export default function LandingPage() {
  const [activeNav, setActiveNav] = useState('hero');
  const [scrolled, setScrolled] = useState(false);
  const [hideNavbar, setHideNavbar] = useState(false);
  const [facilitySlide, setFacilitySlide] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [exitingCard, setExitingCard] = useState(null);
  const navItems = [
    { label: 'Home', id: 'hero' },
    { label: 'About', id: 'about' },
    { label: 'Features', id: 'features' },
    { label: 'Solutions', id: 'solutions' },
    { label: 'Testimonials', id: 'testimonials' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
      setHideNavbar(window.scrollY > window.innerHeight - 80);

      // Scroll spy: update active nav based on visible section
      const sectionIds = ['hero', 'about', 'features', 'solutions', 'testimonials'];
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveNav(sectionIds[i]);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll Reveal hook using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.reveal-element');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const aboutContainerRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (aboutContainerRef.current) {
            const rect = aboutContainerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const start = viewportHeight * 0.85;
            const end = viewportHeight * 0.35;
            const current = rect.top;
            let progress = (start - current) / (start - end);
            progress = Math.max(0, Math.min(1, progress));
            aboutContainerRef.current.style.setProperty('--reveal-progress', `${progress * 100}%`);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const facilityCards = [
    {
      num: '01',
      title: 'Patient Registration & Management',
      points: ['Instant patient onboarding', 'Searchable patient records', 'Complete medical history'],
      image: '/images/patient-registration.png',
      statNum: '10K+',
      statText: 'Patients Registered',
    },
    {
      num: '02',
      title: 'Test Ordering & Tracking',
      points: ['Blood, Urine, Biopsy & more', 'Real-time status updates', 'Priority flagging'],
      image: '/images/test-ordering.png',
      statNum: '50+',
      statText: 'Test Types Supported',
    },
    {
      num: '03',
      title: 'Automated Report Generation',
      points: ['One-click PDF reports', 'Digital signatures', 'Instant delivery to patients'],
      image: '/images/report-generation.png',
      statNum: '99.9%',
      statText: 'Accuracy Guaranteed',
    },
    {
      num: '04',
      title: 'Analytics & Compliance',
      points: ['Real-time dashboards', 'Regulatory compliance', 'Audit trail logging'],
      image: '/images/analytics-compliance.png',
      statNum: '24/7',
      statText: 'Uptime Monitoring',
    },
  ];

  const totalFacilityCards = facilityCards.length;
  const nextSlide = () => {
    setFacilitySlide((prev) => (prev + 1) % totalFacilityCards);
  };
  const prevSlide = () => {
    setFacilitySlide((prev) => (prev - 1 + totalFacilityCards) % totalFacilityCards);
  };

  return (
    <div className="landing-page">

      {/* ─── NAVBAR (Glassmorphism) ─── */}
      <nav className={`landing-nav ${scrolled ? 'nav-scrolled' : ''} ${hideNavbar ? 'nav-hidden' : ''}`} aria-label="Main Navigation">
        <div className="nav-inner">
          {/* Logo with glass pill */}
          <div className="nav-logo glass-logo-pill" role="img" aria-label="PathLab Brand Logo">
            <PathLabLogo />
            <span className="logo-text">PathLab</span>
          </div>

          {/* Navigation links in glass pill */}
          <div className="nav-links-pill">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-link ${activeNav === item.id ? 'nav-link-active' : ''}`}
                onClick={() => {
                  setActiveNav(item.id);
                  const section = document.getElementById(item.id);
                  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                aria-label={`Go to ${item.label} section`}
              >
                {item.label}
                {activeNav === item.id && <span className="nav-dot" aria-hidden="true" />}
              </button>
            ))}
          </div>

          {/* Auth buttons with glassmorphism */}
          <div className="nav-auth glass-auth-pill">
            <Link href="/login" className="nav-login" aria-label="Log in to your pathology portal">Log in</Link>
            <Link href="/login" className="nav-register" aria-label="Register a new pathology account">Register</Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION with Grid + Circular Tissue Reveal ─── */}
      <section className="hero-section" id="hero" aria-label="Hero Overview">
        {/* Magic UI Lens wrapper */}
        <div className="hero-lens-wrapper">
          <Lens
            zoomFactor={1}
            lensSize={240}
            ariaLabel="Pathology Tissue Scanner Zoom Lens"
            zoomChildren={
              <div className="hero-tissue-layer">
                {gridCells.map((cell) => (
                  <div
                    key={cell.id}
                    className="hero-grid-cell-tissue"
                  >
                    <img
                      src={tissueImages[cell.img]}
                      alt="Enlarged cell tissue structure"
                      draggable="false"
                      fetchPriority={cell.id <= 4 ? "high" : undefined}
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            }
          >
            {/* Base layer: Blue cells and borders */}
            <div className="hero-grid-borders-base">
              {gridCells.map((cell) => (
                <div
                  key={cell.id}
                  className="hero-grid-cell-border"
                />
              ))}
            </div>
          </Lens>
        </div>

        {/* Layer 5: Content */}
        <div className="hero-content">
          <h1 className="hero-title">
            Your Lab,<br />Digitally Elevated
          </h1>
          <p className="hero-subtitle">
            Manage patients, track tests, and generate reports — all from one powerful cloud platform.
          </p>
          <div className="hero-buttons">
            <Link href="/login" className="btn-get-started" aria-label="Get started with PathLab portal">Get started</Link>
            <button className="btn-learn-more" aria-label="Learn more about pathology component solutions">Learn more</button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll" aria-hidden="true">
          <ScrollIcon />
          <span>Scroll</span>
        </div>
      </section>

      {/* ─── ABOUT SECTION ─── */}
      <section className="about-section" id="about" aria-label="About PathLab">
        {/* Background concentric semi-circles covering the entire section */}
        <div className="arc-lines" aria-hidden="true">
          <svg viewBox="0 0 1200 900" fill="none" xmlns="http://www.w3.org/2000/svg" className="arc-svg">
            <defs>
              <linearGradient id="outer-fade" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#18181b" stopOpacity="0.32" />
                <stop offset="70%" stopColor="#18181b" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="inner-fade" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#18181b" stopOpacity="0.22" />
                <stop offset="70%" stopColor="#18181b" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 20,10 A 580,530 0 0,0 1180,10" stroke="url(#outer-fade)" strokeWidth="2" fill="none" />
            <path d="M 80,10 A 520,460 0 0,0 1120,10" stroke="url(#inner-fade)" strokeWidth="1.5" fill="none" />
          </svg>
        </div>

        <div className="section-badge-container reveal-element reveal-blur">
          <span className="section-badge">About</span>
          <div className="badge-line" />
        </div>

        <p className="about-description reveal-element reveal-fade-up reveal-delay-1" ref={aboutContainerRef}>
          Maximize your lab's potential with PathLab –<br className="desktop-br" />
          a HIPAA-compliant, cloud-based platform and ecosystem<br className="desktop-br" />
          that streamlines diagnostic workflows, automates test reporting,<br className="desktop-br" />
          and increases daily case volume.
        </p>

        {/* Arc layout with 3 images in a grid */}
        <div className="about-images-arc">
          <div className="about-images-grid">
            <div className="about-row-top">
              <div className="arc-image arc-image-left reveal-element reveal-fade-left reveal-delay-1">
                <div className="arc-image-bg" style={{ backgroundImage: "url('/images/typing.png')" }} role="img" aria-label="Pathologist typing case details on laptop" />
              </div>
              <div className="arc-image arc-image-right reveal-element reveal-fade-right reveal-delay-3">
                <div className="arc-image-bg" style={{ backgroundImage: "url('/images/doctor-screen.png')" }} role="img" aria-label="Doctor reviewing pathology results on display" />
              </div>
            </div>
            <div className="about-row-bottom">
              <div className="arc-image arc-image-center reveal-element reveal-scale reveal-delay-2">
                <div className="arc-image-bg" style={{ backgroundImage: "url('/images/lab-scanner.png')" }} role="img" aria-label="Laboratory scanner operating diagnostic slide" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOR PATHOLOGIST SECTION ─── */}
      <section className="pathologist-section" id="features" aria-label="Solutions for Providers">
        <div className="section-badge-container reveal-element reveal-blur">
          <span className="section-badge">Features</span>
          <div className="badge-line" />
        </div>

        <h2 className="section-title reveal-element reveal-fade-up">Built for Modern Labs</h2>

        <div className="features-container">
          {/* Feature 1 */}
          <div className="feature-row reveal-element reveal-fade-left">
            <div className="feature-left">
              <h3 className="feature-title">Expand Your Service</h3>
            </div>
            <div className="feature-right">
              <p className="feature-desc">
                If you have your own practice or a CLIA-certified lab and are looking for additional work, we can support your needs as well.
              </p>
              <div className="mockup-card">
                <div className="browser-mockup">
                  <div className="mockup-header">
                    <div className="mockup-window-controls">
                      <span className="control-dot dot-red" />
                      <span className="control-dot dot-yellow" />
                      <span className="control-dot dot-green" />
                    </div>
                    <div className="mockup-logo-pill">
                      <span className="mockup-logo-dot" />
                      <span className="mockup-logo-text">PathLab</span>
                    </div>
                    <div className="mockup-nav">
                      <span>Dashboard</span>
                      <span className="active">Create</span>
                      <span>My Cases</span>
                      <span>Available Cases</span>
                      <span>Tasks</span>
                      <span>Send-Out Cases</span>
                      <span>Billing</span>
                    </div>
                    <div className="mockup-profile" />
                  </div>
                  <div className="mockup-body">
                    <div className="mockup-sidebar">
                      <div className="sidebar-icon active" />
                      <div className="sidebar-icon" />
                      <div className="sidebar-icon" />
                    </div>
                    <div className="mockup-content">
                      <div className="mockup-workspace-title">Case</div>
                      <div className="mockup-grid">
                        <div className="mockup-tile">
                          <div className="mockup-tile-icon icon-diag" />
                          <div className="mockup-tile-title">Primary Diagnosis</div>
                          <div className="mockup-tile-desc">Recording the primary diagnosis history on cases and examinations.</div>
                        </div>
                        <div className="mockup-tile">
                          <div className="mockup-tile-icon icon-consult" />
                          <div className="mockup-tile-title">Expert Consultation</div>
                          <div className="mockup-tile-desc">Specialist review for diagnostic confirmation or treatment planning.</div>
                        </div>
                        <div className="mockup-tile">
                          <div className="mockup-tile-icon icon-scan" />
                          <div className="mockup-tile-title">Scanning Only</div>
                          <div className="mockup-tile-desc">Storing scanned medical documents without additional data entry.</div>
                        </div>
                        <div className="mockup-tile">
                          <div className="mockup-tile-icon icon-qa" />
                          <div className="mockup-tile-title">Quality Assurance (QA)</div>
                          <div className="mockup-tile-desc">Verification of data accuracy and medical record validation.</div>
                        </div>
                        <div className="mockup-tile">
                          <div className="mockup-tile-icon icon-val" />
                          <div className="mockup-tile-title">Validation</div>
                          <div className="mockup-tile-desc">Checks and verifies patient data for accuracy.</div>
                        </div>
                        <div className="mockup-tile">
                          <div className="mockup-tile-icon icon-ann" />
                          <div className="mockup-tile-title">Annotation</div>
                          <div className="mockup-tile-desc">Adding important updates or clarifications to an existing case.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="feature-row reveal-element reveal-fade-right reveal-delay-1">
            <div className="feature-left">
              <h3 className="feature-title">Flexible Scheduling</h3>
            </div>
            <div className="feature-right">
              <p className="feature-desc">
                Enjoy complete flexibility with no minimum hours or shift schedules. You can work evenings, weekends, or whenever your schedule permits.
              </p>
              <div className="mockup-card relative-parent">
                <div className="browser-mockup">
                  <div className="mockup-header">
                    <div className="mockup-window-controls">
                      <span className="control-dot dot-red" />
                      <span className="control-dot dot-yellow" />
                      <span className="control-dot dot-green" />
                    </div>
                    <div className="mockup-logo-pill">
                      <span className="mockup-logo-dot" />
                      <span className="mockup-logo-text">PathLab</span>
                    </div>
                    <div className="mockup-nav">
                      <span>Dashboard</span>
                      <span>Create</span>
                      <span className="active">My Cases</span>
                      <span>Available Cases</span>
                      <span>Tasks</span>
                      <span>Send-Out Cases</span>
                      <span>Billing</span>
                    </div>
                    <div className="mockup-profile" />
                  </div>
                  <div className="mockup-body">
                    <div className="mockup-sidebar">
                      <div className="sidebar-icon" />
                      <div className="sidebar-icon active" />
                      <div className="sidebar-icon" />
                    </div>
                    <div className="mockup-content">
                      <div className="mockup-workspace-title-row">
                        <span className="mockup-workspace-title">My Cases</span>
                        <div className="mockup-search-placeholder" />
                      </div>
                      <table className="mockup-table">
                        <thead>
                          <tr>
                            <th>Case ID</th>
                            <th>Slides</th>
                            <th>Date</th>
                            <th>State</th>
                            <th>Subspecialty</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><span className="mockup-link">CS431120721</span></td>
                            <td>2</td>
                            <td>27 Mar 2026</td>
                            <td>Rajasthan</td>
                            <td>Bone & Soft Tissue</td>
                            <td><span className="status-tag status-tag-orange">Ordered</span></td>
                          </tr>
                          <tr>
                            <td><span className="mockup-link">CS231120442</span></td>
                            <td>1</td>
                            <td>26 Mar 2026</td>
                            <td>Delhi</td>
                            <td>Gastrointestinal</td>
                            <td><span className="status-tag status-tag-green">Sign-Out Complete</span></td>
                          </tr>
                          <tr>
                            <td><span className="mockup-link">CS982231922</span></td>
                            <td>4</td>
                            <td>25 Mar 2026</td>
                            <td>Mumbai</td>
                            <td>Dermatopathology</td>
                            <td><span className="status-tag status-tag-red">Cancelled</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Overlap Case Detail overlay */}
                <div className="mockup-overlay-card">
                  <div className="overlay-header">
                    <span className="overlay-badge" />
                    <span className="overlay-case-id">CS431120721</span>
                  </div>
                  <div className="overlay-field">
                    <span className="overlay-label">Number of slides</span>
                    <span className="overlay-val">2</span>
                  </div>
                  <div className="overlay-field">
                    <span className="overlay-label">Specimen type</span>
                    <span className="overlay-val">Blood Sample</span>
                  </div>
                  <div className="overlay-field">
                    <span className="overlay-label">Limit Slide</span>
                    <span className="overlay-val">Non-reimbursable</span>
                  </div>
                  <button className="overlay-btn">Pick Up</button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="feature-row reveal-element reveal-fade-left reveal-delay-2">
            <div className="feature-left">
              <h3 className="feature-title">Streamlined Credentialing</h3>
            </div>
            <div className="feature-right">
              <p className="feature-desc">
                One-Time Credentialing. One Platform. One Login.
              </p>
              <div className="mockup-card relative-parent">
                <div className="browser-mockup">
                  <div className="mockup-header">
                    <div className="mockup-window-controls">
                      <span className="control-dot dot-red" />
                      <span className="control-dot dot-yellow" />
                      <span className="control-dot dot-green" />
                    </div>
                    <div className="mockup-logo-pill">
                      <span className="mockup-logo-dot" />
                      <span className="mockup-logo-text">PathLab</span>
                    </div>
                    <div className="mockup-nav">
                      <span>Dashboard</span>
                      <span>Create</span>
                      <span>My Cases</span>
                      <span>Available Cases</span>
                      <span>Tasks</span>
                      <span>Send-Out Cases</span>
                      <span>Billing</span>
                    </div>
                    <div className="mockup-profile" />
                  </div>
                  <div className="mockup-body">
                    <div className="mockup-sidebar">
                      <div className="sidebar-icon" />
                      <div className="sidebar-icon" />
                      <div className="sidebar-icon active" />
                    </div>
                    <div className="mockup-content justify-center-content">
                      <div className="mockup-workspace-title text-center-text">Register as a pathologist</div>
                      <div className="mockup-form">
                        <div className="mockup-form-header">About Information</div>
                        <div className="mockup-form-grid">
                          <div className="mockup-form-field">
                            <span className="mockup-form-label">First Name</span>
                            <div className="mockup-form-input" />
                          </div>
                          <div className="mockup-form-field">
                            <span className="mockup-form-label">Last Name</span>
                            <div className="mockup-form-input" />
                          </div>
                          <div className="mockup-form-field">
                            <span className="mockup-form-label">National Provider Identifier</span>
                            <div className="mockup-form-input" />
                          </div>
                          <div className="mockup-form-field">
                            <span className="mockup-form-label">Phone</span>
                            <div className="mockup-form-input" />
                          </div>
                          <div className="mockup-form-field">
                            <span className="mockup-form-label">Email</span>
                            <div className="mockup-form-input" />
                          </div>
                          <div className="mockup-form-field">
                            <span className="mockup-form-label">Country of Residence</span>
                            <div className="mockup-form-input" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating check mark overlay */}
                <div className="mockup-badge-overlay">
                  <div className="mockup-badge-circle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#3b82f6" />
                      <path d="M8 12l3 3 5-5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Fluid wave transition: lavender → white ─── */}
      <div className="section-wave-transition">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <rect width="1440" height="120" fill="#e6e0f0"/>
          <path d="M0 40C360 120 720 120 1080 80C1260 60 1380 30 1440 20V120H0V40Z" fill="#ffffff"/>
        </svg>
      </div>

      {/* ─── SOLUTIONS FOR FACILITIES SECTION ─── */}
      <section className="facilities-section" id="solutions" aria-label="Solutions for Medical Facilities">
          {/* Top pill badge — same style as About section */}
          <div className="section-badge-container reveal-element reveal-blur">
            <span className="section-badge">For Facilities</span>
            <div className="badge-line" />
          </div>
          <h2 className="section-title section-title-dark reveal-element reveal-fade-up">
            Solutions for Medical Facilities
          </h2>

          {/* Card Carousel — horizontal sliding track */}
          <div className="facilities-carousel reveal-element reveal-scale">
            <div
              className="facilities-track"
              style={{ transform: `translateX(calc(-${facilitySlide} * (75% + 24px)))` }}
            >
              {facilityCards.map((card, idx) => (
                <div className="fcard" key={idx}>
                  {/* Left: text content */}
                  <div className="fcard-content">
                    <span className="fcard-num">{card.num}</span>
                    <h3 className="fcard-title">{card.title}</h3>
                    <ul className="fcard-points">
                      {card.points.map((point, pIdx) => (
                        <li key={pIdx}>
                          <CheckCircle />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    <button className="btn-download" aria-label={`Download brochure for ${card.title}`}>
                      <DownloadIcon />
                      Download Brochure
                    </button>
                  </div>

                  {/* Center: image card */}
                  <div className="fcard-image-wrap">
                    <div className="fcard-image-card">
                      <img src={card.image} alt={card.title} loading="lazy" decoding="async" />
                      <div className="fcard-badge-glass">
                        <div className="fcard-badge-inner">
                          <span className="badge-number">{card.statNum}</span>
                          <span className="badge-text">{card.statText}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar and arrows */}
          <div className="facilities-controls reveal-element reveal-fade-up">
            <div className="progress-bar" aria-hidden="true">
              <div
                className="progress-fill"
                style={{ width: `${((facilitySlide + 1) / totalFacilityCards) * 100}%` }}
              />
            </div>
            <div className="slider-arrows">
              <button className="slider-arrow arrow-prev" onClick={prevSlide} aria-label="Previous slide">
                <ArrowLeftIcon />
              </button>
              <button className="slider-arrow arrow-next" onClick={nextSlide} aria-label="Next slide">
                <ArrowRightIcon />
              </button>
            </div>
          </div>

          {/* ─── Register Cards (inside facilities) ─── */}
          <div className="register-cards reveal-element reveal-scale">
            {/* Card 1: Provider */}
            <div className="register-card">
              <div className="register-lens-wrap">
                <Lens
                  zoomFactor={1}
                  lensSize={160}
                  ariaLabel="Provider card zoom lens"
                  zoomChildren={
                    <div className="register-tissue-layer">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="register-tissue-cell">
                          <img
                            src={tissueImages[i % 4]}
                            alt="tissue"
                            draggable="false"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      ))}
                    </div>
                  }
                >
                  <div className="register-grid">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="register-grid-cell" />
                    ))}
                  </div>
                </Lens>
              </div>
              <div className="register-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <path d="M8 7V5a4 4 0 0 1 8 0v2" />
                  <line x1="12" y1="12" x2="12" y2="16" />
                  <line x1="10" y1="14" x2="14" y2="14" />
                </svg>
              </div>
              <h3 className="register-card-title">Register as a Provider</h3>
              <div className="register-card-expand">
                <p className="register-card-desc">
                  Start reading slides, consulting, and contributing — faster than ever.
                </p>
                <a href="/login" className="register-card-btn">Register now</a>
              </div>
            </div>

            {/* Card 2: Facility — bacteria/molecular SVG art */}
            <div className="register-card register-card-darker">
              <div className="register-bio-art">
                {/* Bacteria / molecular decorative SVG */}
                <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Large bacterium */}
                  <ellipse cx="280" cy="160" rx="70" ry="32" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" transform="rotate(-25 280 160)"/>
                  <ellipse cx="280" cy="160" rx="55" ry="22" stroke="rgba(255,255,255,0.08)" strokeWidth="1" transform="rotate(-25 280 160)"/>
                  {/* Flagella */}
                  <path d="M220 180 Q190 200 170 190 Q150 180 130 200 Q110 220 90 210" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none"/>
                  <path d="M225 188 Q200 210 180 205 Q160 195 140 215" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none"/>

                  {/* Small bacteria cluster */}
                  <ellipse cx="140" cy="100" rx="35" ry="16" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" transform="rotate(15 140 100)"/>
                  <ellipse cx="100" cy="130" rx="28" ry="13" stroke="rgba(255,255,255,0.10)" strokeWidth="1" transform="rotate(-10 100 130)"/>

                  {/* Cell division bacterium */}
                  <path d="M300 280 Q320 260 340 280 Q360 300 340 320 Q320 340 300 320 Q280 300 300 280Z" stroke="rgba(255,255,255,0.13)" strokeWidth="1.5" fill="rgba(255,255,255,0.03)"/>
                  <line x1="320" y1="265" x2="320" y2="335" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>

                  {/* Floating circles (cocci bacteria) */}
                  <circle cx="80" cy="280" r="18" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" fill="rgba(255,255,255,0.02)"/>
                  <circle cx="110" cy="300" r="14" stroke="rgba(255,255,255,0.10)" strokeWidth="1" fill="rgba(255,255,255,0.02)"/>
                  <circle cx="65" cy="310" r="10" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"/>

                  {/* Molecular dots */}
                  <circle cx="200" cy="60" r="5" fill="rgba(255,255,255,0.08)"/>
                  <circle cx="350" cy="100" r="4" fill="rgba(255,255,255,0.06)"/>
                  <circle cx="60" cy="200" r="6" fill="rgba(255,255,255,0.07)"/>
                  <circle cx="340" cy="350" r="3" fill="rgba(255,255,255,0.05)"/>
                  <circle cx="180" cy="340" r="5" fill="rgba(255,255,255,0.06)"/>

                  {/* Connection lines */}
                  <line x1="200" y1="60" x2="140" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8"/>
                  <line x1="350" y1="100" x2="280" y2="160" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8"/>
                  <line x1="80" y1="280" x2="60" y2="200" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8"/>
                </svg>
              </div>
              <div className="register-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l7-4 7 4v14" />
                  <path d="M9 21v-6h6v6" />
                  <line x1="9" y1="10" x2="9" y2="10.01" />
                  <line x1="15" y1="10" x2="15" y2="10.01" />
                  <line x1="12" y1="10" x2="12" y2="10.01" />
                </svg>
              </div>
              <h3 className="register-card-title">Register as a Facility</h3>
              <div className="register-card-expand">
                <p className="register-card-desc">
                  Manage samples, track results, and streamline your lab operations seamlessly.
                </p>
                <a href="/login" className="register-card-btn">Register now</a>
              </div>
            </div>
          </div>
      </section>

      {/* ─── TESTIMONIALS SECTION ─── */}
      <section className="testimonials-section" id="testimonials" aria-label="Testimonials">
        <div className="testimonials-header reveal-element reveal-blur">
          <div className="section-pill-alt">Testimonials</div>
          <div className="section-divider-line" />
          <h2 className="testimonials-title">
            Trusted By Pathologists And<br />Healthcare Providers
          </h2>
        </div>

        <div className="testimonial-stack-wrap reveal-element reveal-scale">
          {/* Stacked cards */}
          <div className="testimonial-stack">
            {testimonials.map((t, i) => {
              const pos = (i - activeTestimonial + testimonials.length) % testimonials.length;
              const isLast = pos === testimonials.length - 1;
              const isExiting = exitingCard === i;
              const rotDir = pos % 2 === 0 ? -1 : 1;
              return (
                <div
                  key={i}
                  className={`testimonial-card ${pos === 0 ? 'tcard-front' : ''} ${isLast ? 'tcard-back' : ''} ${isExiting ? 'tcard-exit' : ''}`}
                  role="button"
                  tabIndex={pos === 0 ? 0 : -1}
                  aria-label={`Read next testimonial by ${t.name}`}
                  style={{
                    '--stack-index': pos,
                    zIndex: testimonials.length - pos,
                    transform: isExiting
                      ? 'translateX(-130%) rotate(-12deg)'
                      : `translateX(${-pos * 22}px) translateY(${pos * 10}px) scale(${1 - pos * 0.035}) rotate(${rotDir * pos * 2.5}deg)`,
                    opacity: pos > 3 ? 0 : 1,
                    pointerEvents: pos === 0 ? 'auto' : 'none',
                  }}
                  onClick={() => {
                    if (pos === 0 && exitingCard === null) {
                      setExitingCard(i);
                      setTimeout(() => {
                        setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
                        setExitingCard(null);
                      }, 400);
                    }
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && pos === 0 && exitingCard === null) {
                      e.preventDefault();
                      setExitingCard(i);
                      setTimeout(() => {
                        setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
                        setExitingCard(null);
                      }, 400);
                    }
                  }}
                >
                  <div className="tcard-quote-icon">
                    <svg width="32" height="24" viewBox="0 0 32 24" fill="none" aria-hidden="true">
                      <path d="M0 24V14.4C0 6.13 4.48 1.49 13.44 0.48L14.4 3.36C9.41 4.61 6.72 7.68 6.34 12.58H12V24H0ZM18 24V14.4C18 6.13 22.48 1.49 31.44 0.48L32 3.36C27.41 4.61 24.72 7.68 24.34 12.58H30V24H18Z" fill="#4a5a91"/>
                    </svg>
                  </div>
                  <p className="tcard-text">&ldquo;{t.quote}&rdquo;</p>
                  <div className="tcard-play">
                    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
                      <path d="M0 0L12 7L0 14V0Z" fill="#2d3561"/>
                    </svg>
                  </div>
                  <div className="tcard-author">
                    <strong className="tcard-name">{t.name}</strong>
                    <span className="tcard-role">{t.role}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dot indicators */}
          <div className="testimonial-dots">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`tdot ${i === activeTestimonial ? 'tdot-active' : ''}`}
                onClick={() => {
                  setExitingCard(null);
                  setActiveTestimonial(i);
                }}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer reveal-element reveal-slide-up">
        {/* Top tagline */}
        <div className="footer-top">
          <h3 className="footer-tagline">
            Maximize Your Lab&apos;s Revenue With Access to<br />
            Additional Case Volume and Hundreds of Pathologists
          </h3>
        </div>

        {/* Links grid + newsletter */}
        <div className="footer-grid">
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <a href="#" className="footer-link">About</a>
            <a href="#" className="footer-link">Contact us</a>
            <a href="#" className="footer-link">Blog</a>
            <a href="#" className="footer-link">FAQ</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">General</h4>
            <a href="#" className="footer-link">For Pathologist</a>
            <a href="#" className="footer-link">For Facilities</a>
            <a href="#" className="footer-link">Features</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Social</h4>
            <a href="#" className="footer-link">Instagram</a>
            <a href="#" className="footer-link">Facebook</a>
            <a href="#" className="footer-link">LinkedIn</a>
            <a href="#" className="footer-link">X</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Legal Info</h4>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Cookie Policy</a>
          </div>
          <div className="footer-col footer-newsletter">
            <h4 className="footer-col-title">Subscribe to our news and updates</h4>
            <div className="footer-subscribe">
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input type="email" id="footer-email" placeholder="Enter Email" className="footer-email-input" />
              <button className="footer-subscribe-btn">Subscribe</button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="footer-brand" role="img" aria-label="PathLab Brand Logo Footer">
            <PathLabLogo />
            <span className="logo-text">PathLab</span>
          </div>
          <p className="footer-copy">&copy; 2026 PathLab. All rights reserved.</p>
          <button className="footer-back-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to top
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 14V6M10 6L7 9M10 6L13 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
