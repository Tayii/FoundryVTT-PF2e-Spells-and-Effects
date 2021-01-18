import TayiWPSpellLayOnHands from "./spells/layOnHands.js";

const l = [
    TayiWPSpellLayOnHands
];
const TAYIWP_SPELLS = {};
for (const spell_class of l) {
    TAYIWP_SPELLS[spell_class.HANDLER_NAME] = spell_class;
}
export default TAYIWP_SPELLS;
