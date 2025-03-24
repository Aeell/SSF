export class AbilityUI {
    constructor(container) {
        this.container = container;
        this.abilityElements = new Map();
        this.sounds = new Map();
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.loadSounds();
        this.createUI();
    }
    
    loadSounds() {
        // Load ability sound effects
        const soundFiles = {
            'Speed Boost': '/sounds/speed_boost.mp3',
            'Power Kick': '/sounds/power_kick.mp3',
            'Shield': '/sounds/shield.mp3'
        };
        
        Object.entries(soundFiles).forEach(([name, url]) => {
            const audio = new Audio(url);
            audio.volume = 0.5;
            this.sounds.set(name, audio);
        });
    }
    
    createUI() {
        // Create ability container
        this.abilityContainer = document.createElement('div');
        this.abilityContainer.className = 'ability-container';
        this.abilityContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            z-index: 1000;
        `;
        
        // Create mobile controls container if on mobile
        if (this.isMobile) {
            this.mobileControls = document.createElement('div');
            this.mobileControls.className = 'mobile-controls';
            this.mobileControls.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 1000;
            `;
            
            // Create kick button
            this.kickButton = this.createMobileButton('⚽', 'Kick');
            this.mobileControls.appendChild(this.kickButton);
            
            // Create ability button
            this.abilityButton = this.createMobileButton('🎯', 'Ability');
            this.mobileControls.appendChild(this.abilityButton);
        }
        
        this.container.appendChild(this.abilityContainer);
        if (this.isMobile) {
            this.container.appendChild(this.mobileControls);
        }
    }
    
    createMobileButton(icon, label) {
        const button = document.createElement('div');
        button.className = 'mobile-button';
        button.style.cssText = `
            width: 60px;
            height: 60px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        `;
        
        button.innerHTML = `
            <div class="button-icon">${icon}</div>
            <div class="button-label">${label}</div>
        `;
        
        // Add styles for button label
        const labelStyle = document.createElement('style');
        labelStyle.textContent = `
            .button-label {
                position: absolute;
                bottom: -20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                padding: 2px 6px;
                border-radius: 4px;
                color: white;
                font-size: 12px;
                white-space: nowrap;
            }
        `;
        document.head.appendChild(labelStyle);
        
        return button;
    }
    
    addAbility(ability) {
        const abilityElement = document.createElement('div');
        abilityElement.className = 'ability-slot';
        abilityElement.style.cssText = `
            width: 60px;
            height: 60px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #444;
            border-radius: 8px;
            position: relative;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        
        // Create ability icon
        const icon = document.createElement('div');
        icon.className = 'ability-icon';
        icon.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
        `;
        icon.textContent = this.getAbilityIcon(ability.name);
        abilityElement.appendChild(icon);
        
        // Create cooldown overlay
        const cooldown = document.createElement('div');
        cooldown.className = 'ability-cooldown';
        cooldown.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        abilityElement.appendChild(cooldown);
        
        // Create key binding
        const keyBinding = document.createElement('div');
        keyBinding.className = 'ability-key';
        keyBinding.style.cssText = `
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            padding: 2px 6px;
            border-radius: 4px;
            color: white;
            font-size: 12px;
        `;
        keyBinding.textContent = this.getKeyBinding(ability.name);
        abilityElement.appendChild(keyBinding);
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'ability-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 8px 12px;
            border-radius: 4px;
            color: white;
            font-size: 14px;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: all 0.2s ease;
            pointer-events: none;
            z-index: 1001;
        `;
        tooltip.textContent = ability.description;
        abilityElement.appendChild(tooltip);
        
        // Add hover effect
        abilityElement.addEventListener('mouseenter', () => {
            abilityElement.style.borderColor = '#666';
            abilityElement.style.transform = 'scale(1.1)';
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
            tooltip.style.transform = 'translateX(-50%) translateY(-10px)';
        });
        
        abilityElement.addEventListener('mouseleave', () => {
            abilityElement.style.borderColor = '#444';
            abilityElement.style.transform = 'scale(1)';
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
            tooltip.style.transform = 'translateX(-50%) translateY(0)';
        });
        
        // Add click/touch handler
        abilityElement.addEventListener(this.isMobile ? 'touchstart' : 'click', (e) => {
            if (e) e.preventDefault();
            if (ability.isReady()) {
                this.playAbilitySound(ability.name);
                this.showActivationEffect(abilityElement);
                ability.activate();
            }
        });
        
        // Store reference to elements
        this.abilityElements.set(ability.name, {
            element: abilityElement,
            cooldown,
            icon,
            tooltip
        });
        
        this.abilityContainer.appendChild(abilityElement);
    }
    
    playAbilitySound(abilityName) {
        const sound = this.sounds.get(abilityName);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => console.warn('Error playing sound:', error));
        }
    }
    
    showActivationEffect(element) {
        // Create activation effect
        const effect = document.createElement('div');
        effect.className = 'ability-activation-effect';
        effect.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            border-radius: 8px;
            background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
            animation: abilityActivation 0.5s ease-out forwards;
            pointer-events: none;
        `;
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes abilityActivation {
                0% {
                    transform: translate(-50%, -50%) scale(0.5);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        element.appendChild(effect);
        
        // Remove effect after animation
        setTimeout(() => {
            effect.remove();
            style.remove();
        }, 500);
    }
    
    updateAbility(ability) {
        const elements = this.abilityElements.get(ability.name);
        if (!elements) return;
        
        const { cooldown, element } = elements;
        
        // Update cooldown
        if (ability.cooldownRemaining > 0) {
            cooldown.style.opacity = '1';
            cooldown.textContent = Math.ceil(ability.cooldownRemaining);
        } else {
            cooldown.style.opacity = '0';
        }
        
        // Update active state
        if (ability.isActive) {
            element.style.borderColor = '#00ff00';
            element.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.5)';
        } else {
            element.style.borderColor = '#444';
            element.style.boxShadow = 'none';
        }
    }
    
    getAbilityIcon(name) {
        const icons = {
            'Speed Boost': '⚡',
            'Power Kick': '⚽',
            'Shield': '🛡️'
        };
        return icons[name] || '?';
    }
    
    getKeyBinding(name) {
        const bindings = {
            'Speed Boost': 'Shift',
            'Power Kick': 'Space',
            'Shield': 'E'
        };
        return bindings[name] || '';
    }
    
    cleanup() {
        this.abilityContainer.remove();
        if (this.isMobile) {
            this.mobileControls.remove();
        }
        this.abilityElements.clear();
        this.sounds.clear();
    }
} 