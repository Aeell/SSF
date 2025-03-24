export { Ability } from './Ability';
export { SpeedBoost } from './SpeedBoost';
export { PowerKick } from './PowerKick';
export { Shield } from './Shield';

const abilityClasses = {
    'Speed Boost': SpeedBoost,
    'Power Kick': PowerKick,
    'Shield': Shield
};

export function createAbility(name, player) {
    const AbilityClass = abilityClasses[name];
    if (!AbilityClass) {
        throw new Error(`Unknown ability: ${name}`);
    }
    return new AbilityClass(player);
} 