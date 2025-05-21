document.addEventListener('DOMContentLoaded', function() {
    const orb = document.getElementById('data-stream-bloom-orb');
    const startBtn = document.getElementById('start-experience-btn');
    const pageContainer = document.getElementById('page-container');
    
    // Updated sectionIds array
    const sectionIds = ['hero', 'features', 'interactive-art-tesseract', 'about', 'community', 'token-network'];
    let currentSectionIndex = -1; 
    let isTransitioning = false; 

    let orbPulseTl;

    function startOrbPulsation() {
        if (orbPulseTl) orbPulseTl.kill(); 
        orbPulseTl = gsap.timeline({ repeat: -1, yoyo: true });
        orbPulseTl.to(orb, {
            scale: 1.15,
            duration: 1.5,
            ease: "power1.inOut",
            boxShadow: "0 0 25px 10px #FF00FF, 0 0 50px 20px #FF00FF, inset 0 0 15px #FFFFFFCC",
        });
    }
    startOrbPulsation();

    function triggerOrbTransitionPulse() {
        if (orbPulseTl) orbPulseTl.pause();
        gsap.to(orb, {
            scale: 1.3,
            duration: 0.4,
            ease: "power2.inOut",
            boxShadow: "0 0 35px 15px #00FFFF, 0 0 60px 25px #00FFFF, inset 0 0 20px #FFFFFFDD",
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                if (orbPulseTl) orbPulseTl.resume();
                else startOrbPulsation();
            }
        });
    }

    startBtn.addEventListener('click', function() {
        if (currentSectionIndex !== -1) return; 
        gsap.to(startBtn, { opacity: 0, duration: 0.3, onComplete: () => startBtn.style.display = 'none' });
        
        currentSectionIndex = 0;
        const heroSection = document.getElementById(sectionIds[currentSectionIndex]);
        
        createAndAnimateParticles(heroSection); 

        const heroTl = gsap.timeline({ delay: 0.3 });
        heroTl.to(heroSection, {
            opacity: 1,
            visibility: 'visible',
            translateY: gsap.getProperty(heroSection, "translateY") - 30, 
            duration: 0.8,
            ease: "power2.out"
        })
        .to(heroSection.querySelectorAll('h1, p, .section-nav-buttons'), {
            opacity: 1,
            translateY: 0,
            duration: 0.6,
            stagger: 0.15, 
            ease: "power2.out",
            onComplete: updateButtonVisibility 
        }, "-=0.5");
    });

    function createAndAnimateParticles(targetSectionElement) {
        const particleContainer = document.body; 
        const numParticles = 80;
        const orbRect = orb.getBoundingClientRect();
        const startX = orbRect.left + orbRect.width / 2;
        const startY = orbRect.top + orbRect.height / 2;

        let targetYBase = Math.random() * (window.innerHeight * 0.3); 
        let spreadFactor = window.innerHeight * 0.4; 

        if (targetSectionElement) {
            const targetRect = targetSectionElement.getBoundingClientRect();
            const currentSection = document.getElementById(sectionIds[currentSectionIndex]);
            const currentRect = currentSection ? currentSection.getBoundingClientRect() : orbRect;

            if (targetRect.top < currentRect.top) { 
                targetYBase = targetRect.top - Math.random() * spreadFactor;
            } else if (targetRect.top > currentRect.bottom) { 
                targetYBase = targetRect.bottom + Math.random() * spreadFactor;
            } else { 
                 targetYBase = targetRect.top + (targetRect.height / 2) + (Math.random() - 0.5) * targetRect.height;
            }
        }

        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            const type = Math.random();
            if (type < 0.4) particle.classList.add('pink-glow');
            else if (type < 0.8) particle.classList.add('cyan-glow');
            else particle.classList.add('aero-gloss');
            
            particle.style.width = particle.style.height = `${Math.random() * 5 + 2}px`;

            particleContainer.appendChild(particle);

            gsap.set(particle, { x: startX, y: startY, opacity: 1 });
            
            const targetX = startX + (Math.random() - 0.5) * (window.innerWidth * 1.2); 
            const finalTargetY = targetYBase + (Math.random() - 0.5) * spreadFactor;
            const duration = Math.random() * 1.8 + 1.2; 

            gsap.to(particle, {
                x: targetX,
                y: finalTargetY, 
                opacity: 0,
                duration: duration,
                ease: "power2.easeOut",
                delay: Math.random() * 0.4, 
                onComplete: () => particle.remove()
            });
        }
    }

    function animateSectionTransition(outgoingSectionId, incomingSectionId, isGoingForward) {
        if (isTransitioning) return;
        isTransitioning = true;

        const outgoingSection = document.getElementById(outgoingSectionId);
        const incomingSection = document.getElementById(incomingSectionId);

        if (!outgoingSection || !incomingSection) {
            console.error("Section not found for transition:", outgoingSectionId, incomingSectionId);
            isTransitioning = false;
            return;
        }

        // Stop tesseract if outgoing section is the tesseract section
        if (outgoingSectionId === 'interactive-art-tesseract' && typeof stopTesseractAnimation === 'function') {
            stopTesseractAnimation();
        }

        const tl = gsap.timeline({
            onComplete: () => {
                isTransitioning = false;
                updateButtonVisibility(); 
                // Initialize and start tesseract if incoming section is the tesseract section
                if (incomingSectionId === 'interactive-art-tesseract') {
                    if (typeof initTesseract === 'function') {
                        initTesseract(); // Ensures it's initialized
                        // startTesseractAnimation() is called within initTesseract if it's the first time
                        // or can be called separately if initTesseract only sets up.
                        // Assuming initTesseract also starts it or it's handled by its own logic.
                        // For safety, let's ensure it starts if already initialized:
                        if (typeof startTesseractAnimation === 'function' && window.isTesseractInitialized) {
                             startTesseractAnimation();
                        }
                    }
                }
            }
        });

        const outgoingChildrenQuery = 'h1, h2, p, .section-nav-buttons, #tesseract-canvas-container'; // Include canvas container
        const outgoingChildren = outgoingSection.querySelectorAll(outgoingChildrenQuery);
        tl.to(outgoingChildren, {
            opacity: 0,
            translateY: isGoingForward ? -20 : 20, 
            stagger: 0.05, 
            duration: 0.3,
            ease: "power1.in"
        });
        
        const currentOutgoingY = gsap.getProperty(outgoingSection, "translateY");
        tl.to(outgoingSection, {
            opacity: 0,
            translateY: currentOutgoingY + (isGoingForward ? -40 : 40), 
            duration: 0.4,
            ease: "power1.in",
            onComplete: () => {
                outgoingSection.style.visibility = 'hidden';
            }
        }, "-=0.15"); 

        tl.add(() => triggerOrbTransitionPulse());
        tl.add(() => createAndAnimateParticles(incomingSection), "-=0.3"); 

        const incomingChildrenQuery = 'h1, h2, p, .section-nav-buttons, #tesseract-canvas-container'; // Include canvas container
        const incomingChildren = incomingSection.querySelectorAll(incomingChildrenQuery);
        gsap.set(incomingChildren, { opacity: 0, translateY: isGoingForward ? 20 : -20 }); 

        gsap.set(incomingSection, { visibility: 'visible', opacity: 0, translateY: 30 }); 
        
        tl.to(incomingSection, {
            opacity: 1,
            translateY: 0, 
            duration: 0.8,
            ease: "power2.out"
        }, "+=0.2"); 

        tl.to(incomingChildren, {
            opacity: 1,
            translateY: 0,
            stagger: 0.1, 
            duration: 0.5,
            ease: "power2.out"
        }, "-=0.5");
    }

    function updateButtonVisibility() {
        sectionIds.forEach((id, index) => {
            const section = document.getElementById(id);
            if (!section) return;

            const prevBtn = section.querySelector('.prev-section-btn');
            const nextBtn = section.querySelector('.next-section-btn');

            if (index === currentSectionIndex) { 
                if (prevBtn) gsap.set(prevBtn, { display: currentSectionIndex > 0 ? 'inline-block' : 'none', opacity: 1, y:0 }); // Force visibility if active
                if (nextBtn) gsap.set(nextBtn, { display: currentSectionIndex < sectionIds.length - 1 ? 'inline-block' : 'none', opacity: 1, y:0 });
            } else { 
                if (prevBtn) gsap.set(prevBtn, { display: 'none' });
                if (nextBtn) gsap.set(nextBtn, { display: 'none' });
            }
        });
    }
    
    pageContainer.addEventListener('click', function(event) {
        if (isTransitioning) return;

        const target = event.target;
        const currentSectionId = sectionIds[currentSectionIndex];

        if (target.matches('.next-section-btn')) {
            if (currentSectionIndex < sectionIds.length - 1) {
                const nextSectionId = sectionIds[currentSectionIndex + 1];
                animateSectionTransition(currentSectionId, nextSectionId, true); 
                currentSectionIndex++;
            }
        } else if (target.matches('.prev-section-btn')) {
            if (currentSectionIndex > 0) {
                const prevSectionId = sectionIds[currentSectionIndex - 1];
                animateSectionTransition(currentSectionId, prevSectionId, false); 
                currentSectionIndex--;
            }
        }
    });

    sectionIds.forEach((id, index) => {
        const section = document.getElementById(id);
        if (section) {
            const childrenQuery = 'h1, h2, p, .section-nav-buttons, #tesseract-canvas-container';
            const children = section.querySelectorAll(childrenQuery);
            gsap.set(children, { opacity: 0, translateY: 15 }); 
        }
    });
    updateButtonVisibility(); 

});
