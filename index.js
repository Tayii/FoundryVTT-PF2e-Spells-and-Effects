import TAYIWP_SPELLS from './lists/spells.js';
import TAYIWP_SKILLS from './lists/skills.js';
import TAYIWP_FEATS from './lists/feats.js';

import TayiWP from "./src/base.js";

Hooks.on("ready", function() {
    console.log("This code runs once core initialization is ready and game data is available.");
    TayiWP.init();
    for (const name in TAYIWP_SPELLS) {
        if (!TAYIWP_SPELLS.hasOwnProperty(name))
            continue;
        TayiWP.registerCallback(TAYIWP_SPELLS[name]);
    }
    for (const name in TAYIWP_SKILLS) {
        if (!TAYIWP_SKILLS.hasOwnProperty(name))
            continue;
        TayiWP.registerCallback(TAYIWP_SKILLS[name]);
    }
    for (const name in TAYIWP_FEATS) {
        if (!TAYIWP_FEATS.hasOwnProperty(name))
            continue;
        TayiWP.registerCallback(TAYIWP_FEATS[name]);
    }
    globalThis.TayiWP = TayiWP;
    globalThis.TAYIWP_SPELLS = TAYIWP_SPELLS;
    globalThis.TAYIWP_SKILLS = TAYIWP_SKILLS;
    globalThis.TAYIWP_FEATS = TAYIWP_FEATS;
});
