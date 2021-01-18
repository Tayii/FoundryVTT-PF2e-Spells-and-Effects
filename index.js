import TAYIWP_SPELLS from './lists/spells.js';

import TayiWP from "./src/base.js";

Hooks.on("ready", function() {
    console.log("This code runs once core initialization is ready and game data is available.");
    TayiWP.init();
    for (const spell_name in TAYIWP_SPELLS) {
        if (!TAYIWP_SPELLS.hasOwnProperty(spell_name))
            continue;
        const spell_class = TAYIWP_SPELLS[spell_name];
        TayiWP.registerCallback(spell_class);
    }
    globalThis.TayiWP = TayiWP;
    globalThis.TAYIWP_SPELLS = TAYIWP_SPELLS;
});
