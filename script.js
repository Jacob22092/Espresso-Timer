class EspressoTimer {
    constructor() {
        this.initializeElements();
        this.initializeState();
        this.setupEventListeners();
        this.updateDisplay();
        console.log('Espresso Timer Pro with fixed crema initialized!');
    }

    initializeElements() {
        // Timer elements
        this.timeValue = document.getElementById('timeValue');
        this.phaseName = document.getElementById('phaseName');
        this.progressBar = document.getElementById('progressBar');
        this.weightValue = document.getElementById('weightValue');
        
        // Settings
        this.timeInput = document.getElementById('timeInput');
        this.doseInput = document.getElementById('doseInput');
        this.targetDisplay = document.getElementById('targetDisplay');
        this.flowRate = document.getElementById('flowRate');
        this.ratio = document.getElementById('ratio');
        
        // Controls
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Animation elements
        this.cup = document.getElementById('cup');
        this.coffeeLevel = document.getElementById('coffeeLevel');
        this.cremaLevel = document.getElementById('cremaLevel');
        this.coffeeStream = document.getElementById('coffeeStream');
        this.steam = document.getElementById('steam');
        
        // Phases
        this.phases = [
            document.getElementById('phase1'),
            document.getElementById('phase2'),
            document.getElementById('phase3')
        ];
    }

    initializeState() {
        this.totalTime = 25;
        this.currentTime = 25;
        this.isRunning = false;
        this.isPaused = false;
        this.intervalId = null;
        this.startTime = null;
        
        this.settings = {
            brewTime: 25,
            dose: 18,
            target: 36,
            ratio: 2.0
        };
        
        this.extraction = {
            weight: 0,
            flowRate: 0,
            phase: 0,
            phaseNames: ['Pre-infusion', 'Main Extraction', 'Finish']
        };
        
        // GSAP timeline for animations
        this.tl = gsap.timeline({ paused: true });
        this.setupAnimations();
    }

    setupAnimations() {
        // Reset timeline
        this.tl.clear();
        
        // Coffee level animation - napełnianie od dołu
        this.tl.to(this.coffeeLevel, {
            height: '65%',
            duration: 18,
            ease: 'power2.out'
        }, 0);
        
        // Crema animation - pojawia się NA GÓRZE kawy
        this.tl.to(this.cremaLevel, {
            height: '15%',
            duration: 6,
            ease: 'power1.out',
            onUpdate: () => {
                // Dynamicznie pozycjonuj cremę na górze kawy
                const coffeeHeight = parseFloat(this.coffeeLevel.style.height) || 0;
                this.cremaLevel.style.bottom = `${coffeeHeight}%`;
            }
        }, 15);
        
        // Final coffee adjustment
        this.tl.to(this.coffeeLevel, {
            height: '68%',
            duration: 2,
            ease: 'power1.out'
        }, 21);
        
        // Final crema adjustment
        this.tl.to(this.cremaLevel, {
            height: '15%',
            duration: 2,
            ease: 'power1.out',
            onUpdate: () => {
                const coffeeHeight = parseFloat(this.coffeeLevel.style.height) || 0;
                this.cremaLevel.style.bottom = `${coffeeHeight}%`;
            }
        }, 21);
        
        // Steam animation
        this.tl.to(this.steam, {
            opacity: 1,
            duration: 1,
            ease: 'power2.out'
        }, 22);
    }

    setupEventListeners() {
        // Button events
        this.startBtn?.addEventListener('click', () => this.toggleTimer());
        this.pauseBtn?.addEventListener('click', () => this.pauseTimer());
        this.resetBtn?.addEventListener('click', () => this.resetTimer());
        
        // Settings events
        this.timeInput?.addEventListener('input', () => this.updateSettings());
        this.doseInput?.addEventListener('input', () => this.updateSettings());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.matches('input')) {
                e.preventDefault();
                this.toggleTimer();
            } else if (e.code === 'KeyR' && e.ctrlKey) {
                e.preventDefault();
                this.resetTimer();
            }
        });
        
        this.updateSettings();
    }

    updateSettings() {
        this.settings.brewTime = parseFloat(this.timeInput?.value) || 25;
        this.settings.dose = parseFloat(this.doseInput?.value) || 18;
        this.settings.target = this.settings.dose * 2;
        this.settings.ratio = this.settings.target / this.settings.dose;
        
        // Update displays
        if (this.targetDisplay) {
            this.targetDisplay.textContent = `${this.settings.target} ml`;
        }
        if (this.ratio) {
            this.ratio.textContent = `1:${this.settings.ratio.toFixed(1)}`;
        }
        
        // Update timer if not running
        if (!this.isRunning) {
            this.totalTime = this.settings.brewTime;
            this.currentTime = this.totalTime;
            this.updateDisplay();
        }
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        console.log('Starting brewing...');
        
        if (this.isPaused) {
            // Resume
            this.isRunning = true;
            this.isPaused = false;
            this.startTime = Date.now() - (this.totalTime - this.currentTime) * 1000;
            this.tl.resume();
        } else {
            // Fresh start
            this.isRunning = true;
            this.isPaused = false;
            this.currentTime = this.totalTime;
            this.startTime = Date.now();
            this.extraction = { weight: 0, flowRate: 0, phase: 0, phaseNames: ['Pre-infusion', 'Main Extraction', 'Finish'] };
            
            // Reset and start animations
            this.tl.restart();
            this.cup?.classList.add('brewing');
        }
        
        this.updateButtons();
        this.startEffects();
        
        this.intervalId = setInterval(() => {
            this.updateTimer();
        }, 50);
    }

    pauseTimer() {
        console.log('Pausing brewing...');
        this.isRunning = false;
        this.isPaused = true;
        
        clearInterval(this.intervalId);
        this.tl.pause();
        this.stopEffects();
        this.updateButtons();
    }

    resetTimer() {
        console.log('Resetting timer...');
        this.isRunning = false;
        this.isPaused = false;
        
        clearInterval(this.intervalId);
        this.tl.pause();
        this.tl.progress(0);
        
        this.currentTime = this.totalTime;
        this.extraction = { weight: 0, flowRate: 0, phase: 0, phaseNames: ['Pre-infusion', 'Main Extraction', 'Finish'] };
        
        this.resetEffects();
        this.updateButtons();
        this.updateDisplay();
        this.updatePhaseDisplay();
        this.updateStats();
    }

    updateTimer() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.currentTime = Math.max(0, this.totalTime - elapsed);
        
        this.updatePhase(elapsed);
        this.updateExtraction(elapsed);
        this.updateCupAnimation(elapsed);
        this.updateDisplay();
        this.updateStats();
        
        if (this.currentTime <= 0) {
            this.completeTimer();
        }
    }

    updatePhase(elapsed) {
        let newPhase = 0;
        
        if (elapsed <= 5) {
            newPhase = 0; // Pre-infusion
        } else if (elapsed <= this.totalTime - 5) {
            newPhase = 1; // Main extraction
        } else {
            newPhase = 2; // Finish
        }
        
        if (newPhase !== this.extraction.phase) {
            this.extraction.phase = newPhase;
            this.updatePhaseDisplay();
        }
    }

    updateExtraction(elapsed) {
        // Simulate realistic extraction
        const progress = elapsed / this.totalTime;
        
        if (this.extraction.phase === 0) {
            this.extraction.flowRate = 0.3 + Math.random() * 0.2;
        } else if (this.extraction.phase === 1) {
            this.extraction.flowRate = 1.8 + Math.random() * 0.6;
        } else {
            this.extraction.flowRate = 1.0 + Math.random() * 0.4;
        }
        
        this.extraction.weight += this.extraction.flowRate * 0.05;
        this.extraction.weight = Math.min(this.extraction.weight, this.settings.target);
    }

    // NAPRAWIONA FUNKCJA ANIMACJI KUBKA
    updateCupAnimation(elapsed) {
        const progress = elapsed / this.totalTime;
        
        // Coffee level filling
        const coffeeHeight = Math.min(progress * 65, 65);
        if (this.coffeeLevel) {
            gsap.to(this.coffeeLevel, {
                height: `${coffeeHeight}%`,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
        
        // Crema appears after 60% and sits ON TOP of coffee
        if (progress > 0.6) {
            const cremaProgress = (progress - 0.6) / 0.4;
            const cremaHeight = Math.min(cremaProgress * 15, 15);
            
            if (this.cremaLevel) {
                gsap.to(this.cremaLevel, {
                    height: `${cremaHeight}%`,
                    bottom: `${coffeeHeight}%`, // Pozycjonowanie na górze kawy
                    duration: 0.3,
                    ease: 'power1.out'
                });
            }
        } else {
            // Reset cremy jeśli jeszcze nie czas
            if (this.cremaLevel) {
                gsap.set(this.cremaLevel, {
                    height: '0%',
                    bottom: '0%'
                });
            }
        }
        
        // Visual states
        if (progress > 0.3) {
            this.cup?.classList.add('brewing');
        }
        
        if (progress >= 1) {
            this.cup?.classList.add('complete');
        }
    }

    updateDisplay() {
        // Timer display
        if (this.timeValue) {
            this.timeValue.textContent = this.currentTime.toFixed(1);
        }
        
        // Phase name
        if (this.phaseName) {
            const phaseName = this.isRunning ? 
                this.extraction.phaseNames[this.extraction.phase] : 'Ready';
            this.phaseName.textContent = phaseName;
        }
        
        // Progress ring using Anime.js
        if (this.progressBar) {
            const progress = (this.totalTime - this.currentTime) / this.totalTime;
            const circumference = 2 * Math.PI * 90;
            const offset = circumference * (1 - progress);
            
            anime({
                targets: this.progressBar,
                strokeDashoffset: offset,
                duration: 300,
                easing: 'easeOutQuart'
            });
            
            // Color changes
            let color = '#3b82f6'; // primary
            if (this.currentTime <= 5 && this.isRunning) {
                color = '#ef4444'; // danger
            } else if (this.currentTime <= 10) {
                color = '#f59e0b'; // warning
            }
            
            anime({
                targets: this.progressBar,
                stroke: color,
                duration: 300
            });
        }
    }

    updateStats() {
        if (this.weightValue) {
            this.weightValue.textContent = `${this.extraction.weight.toFixed(1)}g`;
        }
        if (this.flowRate) {
            this.flowRate.textContent = `${this.extraction.flowRate.toFixed(1)} ml/s`;
        }
    }

    updatePhaseDisplay() {
        // Reset all phases
        this.phases.forEach((phase, index) => {
            if (phase) {
                if (index === this.extraction.phase && this.isRunning) {
                    phase.classList.add('active');
                } else {
                    phase.classList.remove('active');
                }
            }
        });
    }

    updateButtons() {
        if (!this.startBtn) return;
        
        if (this.isRunning) {
            this.startBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
                Pause Brewing
            `;
            this.pauseBtn.disabled = false;
        } else if (this.isPaused) {
            this.startBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                Resume Brewing
            `;
            this.pauseBtn.disabled = true;
        } else {
            this.startBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                Start Brewing
            `;
            this.pauseBtn.disabled = true;
        }
    }

    startEffects() {
        // Coffee stream animation
        this.coffeeStream?.classList.add('active');
    }

    stopEffects() {
        this.coffeeStream?.classList.remove('active');
        this.steam?.classList.remove('active');
    }

    // Poprawiona funkcja resetEffects
    resetEffects() {
        this.stopEffects();
        this.cup?.classList.remove('brewing', 'complete');
        
        // Reset using GSAP
        gsap.set([this.coffeeLevel, this.cremaLevel], { 
            height: '0%',
            clearProps: 'all' 
        });
        gsap.set(this.cremaLevel, { 
            bottom: '0%',
            clearProps: 'all' 
        });
        gsap.set(this.steam, { 
            opacity: 0,
            clearProps: 'all' 
        });
    }

    completeTimer() {
        console.log('Brewing complete!');
        this.isRunning = false;
        clearInterval(this.intervalId);
        
        this.cup?.classList.remove('brewing');
        this.cup?.classList.add('complete');
        this.steam?.classList.add('active');
        
        this.updateButtons();
        
        // Celebration animation
        anime({
            targets: this.timeValue,
            scale: [1, 1.1, 1],
            duration: 600,
            easing: 'easeOutElastic(1, .8)'
        });
        
        // Auto-reset after 6 seconds
        setTimeout(() => {
            this.resetTimer();
        }, 6000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new EspressoTimer();
    } catch (error) {
        console.error('Failed to initialize Espresso Timer:', error);
    }
});
