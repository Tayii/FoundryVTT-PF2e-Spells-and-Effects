import TAYIWP_SPELL_CALLBACKS from './lists/spells.js';
import TAYIWP_FEAT_CALLBACKS from './lists/feats.js';
import TayiWP from "./src/base.js";

// Hooks.on("init", function() {
//     console.log("This code runs once the Foundry VTT software begins it's initialization workflow.");
// });

Hooks.on("ready", function() {
    console.log("This code runs once core initialization is ready and game data is available.");
    TayiWP.SPELL_CALLBACKS = TAYIWP_SPELL_CALLBACKS;
    TayiWP.FEAT_CALLBACKS = TAYIWP_FEAT_CALLBACKS;
    TayiWP.init();
    globalThis.TayiWP = TayiWP;
});
