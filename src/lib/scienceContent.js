// Science landing page content — rich SEO content for each science field
// Used by [science]/index.astro to render landing panels

export const scienceContent = {
  physics: {
    history: "Physics emerged from natural philosophy in the 17th century when Galileo Galilei pioneered the experimental method and Isaac Newton formulated the laws of motion and universal gravitation. The 20th century brought two revolutions: Einstein's theories of relativity (1905-1915) reshaped our understanding of space, time, and gravity, while quantum mechanics (developed by Planck, Bohr, Heisenberg, and Schrödinger) revealed the probabilistic nature of the subatomic world. The Standard Model, completed in the 1970s, unified three of the four fundamental forces. Today, physicists hunt for dark matter, dark energy, and quantum gravity at facilities like CERN's Large Hadron Collider.",
    tools: "Particle accelerators (LHC, Fermilab), gravitational wave detectors (LIGO/Virgo), quantum simulators, cryogenic systems, vacuum chambers, mass spectrometers, supercomputing clusters for lattice QCD, and Python/C++ frameworks like ROOT and Geant4 for data analysis.",
    funFact: "If the Sun were suddenly removed, Earth would still orbit the now-empty point for about 8 minutes and 20 seconds — the time it takes light (and gravitational changes) to travel from the Sun to Earth at the speed of light.",
    searchPlaceholder: "Search physics resources...",
  },
  chemistry: {
    history: "Chemistry traces its roots to alchemy, but emerged as a modern science in the 18th century when Antoine Lavoisier established the law of conservation of mass. Dmitri Mendeleev's periodic table (1869) organized elements by properties and predicted undiscovered ones. The 20th century brought quantum chemistry — Linus Pauling applied quantum mechanics to chemical bonding, while computational chemistry emerged with the rise of digital computers. Today, chemists design molecules atom-by-atom for drug discovery, materials engineering, and clean energy.",
    tools: "NMR spectrometers, mass spectrometers, X-ray crystallography, chromatography systems (HPLC, GC), fume hoods, rotary evaporators, computational chemistry suites (Gaussian, VASP, ORCA), and molecular visualization tools like PyMOL and Avogadro.",
    funFact: "A single drop of water contains more molecules than there are stars in the observable universe — roughly 1.5 sextillion (1.5 × 10²¹) molecules per drop.",
    searchPlaceholder: "Search chemistry resources...",
  },
  astronomy: {
    history: "Astronomy is humanity's oldest science. Babylonians tracked planetary motions by 1000 BCE, while the ancient Greeks measured Earth's circumference. Galileo's telescope (1609) revealed Jupiter's moons and lunar craters, shattering the geocentric model. The 20th century expanded astronomy across the full electromagnetic spectrum — radio, infrared, X-ray, and gamma-ray observatories opened windows invisible to the eye. The Hubble Space Telescope (1990) and James Webb Space Telescope (2022) have peered back to galaxies forming 13 billion years ago. LIGO's 2015 detection of gravitational waves opened a new era of multi-messenger astronomy.",
    tools: "Optical and radio telescopes, space observatories (Hubble, JWST, Chandra), interferometers (ALMA, VLBI), CCD cameras, spectrographs, planetarium software (Stellarium, SkyView), and data archives like the Virtual Observatory and ADS.",
    funFact: "When you look at the night sky, you see stars as they were years or millennia ago — the light from the nearest star (Proxima Centauri) takes 4.2 years to reach Earth. Telescopes are effectively time machines.",
    searchPlaceholder: "Search astronomy resources...",
  },
  'earth-sciences': {
    history: "Earth sciences began with geological observations by ancient scholars, but modern geology was born when James Hutton proposed uniformitarianism in 1788 — the idea that geological processes operate slowly over deep time. The 20th century's plate tectonics revolution (1960s) explained continental drift, earthquakes, and mountain building. Weather satellites (1960s onward) transformed meteorology, while oceanographic vessels mapped the seafloor. Today, Earth scientists use satellite remote sensing, climate models, and deep-sea drilling to study our planet's interconnected systems.",
    tools: "Seismographs, GPS/GNSS receivers for crustal motion, weather satellites, oceanographic research vessels, sediment corers, mass spectrometers for isotope dating, GIS software, and climate modeling supercomputers running CMIP6.",
    funFact: "Earth's inner core is a solid ball of iron-nickel alloy roughly the size of the Moon, at a temperature of about 5,400°C — nearly as hot as the Sun's surface. It is solid because of the immense pressure, not lack of heat.",
    searchPlaceholder: "Search earth science resources...",
  },
  biophysics: {
    history: "Biophysics applies the principles and methods of physics to understand biological systems. The field crystallized in the mid-20th century when Rosalind Franklin's X-ray diffraction images of DNA (1952) revealed its double-helix structure. The invention of the electron microscope, patch-clamp technique, and later cryo-EM (cryo-electron microscopy, 2010s revolution) allowed visualization of proteins and molecular machines at near-atomic resolution. Today, biophysicists use everything from optical tweezers to molecular dynamics simulations to study how life works at the molecular level.",
    tools: "Cryo-electron microscopes, X-ray crystallography, NMR spectrometers, optical tweezers, atomic force microscopes (AFM), patch-clamp amplifiers, molecular dynamics software (GROMACS, AMBER, NAMD), and structural databases like the PDB.",
    funFact: "The bacterial flagellar motor — a tiny rotary engine that spins a bacterium's tail — rotates at up to 100,000 RPM and is powered by a flow of protons, making it one of the few true rotary motors in biology.",
    searchPlaceholder: "Search biophysics resources...",
  },
  'materials-science': {
    history: "Materials science is arguably the oldest engineering discipline — the Stone Age, Bronze Age, and Iron Age are defined by materials. Modern materials science emerged in the 20th century as physics, chemistry, and engineering converged. The discovery of X-ray diffraction (1912) allowed crystal structures to be determined, while the development of semiconductors (1947 transistor) launched the silicon age. Recent breakthroughs include high-temperature superconductors (1986), graphene (2004), and perovskite solar cells (2009), each opening entirely new technological frontiers.",
    tools: "X-ray diffractometers (XRD), scanning electron microscopes (SEM), transmission electron microscopes (TEM), atomic force microscopes (AFM), nanoindenters, differential scanning calorimeters (DSC), and computational packages like VASP, Quantum ESPRESSO, and Materials Project databases.",
    funFact: "Graphene — a single layer of carbon atoms arranged in a hexagonal lattice — is 200 times stronger than steel, transparent, flexible, and the best conductor of electricity at room temperature. Its discoverers won the 2010 Nobel Prize in Physics.",
    searchPlaceholder: "Search materials science resources...",
  },
  'mathematical-physics': {
    history: "Mathematical physics is the bridge between abstract mathematics and physical reality. Newton invented calculus to describe motion. In the 19th century, Fourier analysis, vector calculus, and differential geometry became essential tools. The 20th century saw Emmy Noether's theorem connecting symmetries to conservation laws, while tensor calculus enabled general relativity. Today, topology, group theory, and information theory underpin everything from quantum field theory to condensed matter physics, with string theory pushing mathematical physics into 11 dimensions.",
    tools: "Computer algebra systems (Mathematica, Maple, SageMath), numerical libraries (NumPy, SciPy, BLAS/LAPACK), high-performance computing clusters, LaTeX for typesetting, and specialized software like MATLAB and Julia for differential equations and simulations.",
    funFact: "Noether's theorem — proved by mathematician Emmy Noether in 1915 — shows that every continuous symmetry of a physical system corresponds to a conservation law. The symmetry of time gives energy conservation; the symmetry of space gives momentum conservation. It is arguably the most beautiful result in mathematical physics.",
    searchPlaceholder: "Search mathematical physics resources...",
  },
};
