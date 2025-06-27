import { Orc } from './utils/orc.js';
import { applyBerserkerFeatures } from './subcategories/berserker.js';
import { applyPhysicsMethods } from './utils/physics.js';
import { applyCoverFirerFeatures } from './subcategories/coverfirer.js';
import { applyRusherFeatures } from './subcategories/rusher.js';

// Apply modular features
applyBerserkerFeatures(Orc);
applyCoverFirerFeatures(Orc);
applyRusherFeatures(Orc);
applyPhysicsMethods(Orc);

export { Orc };
