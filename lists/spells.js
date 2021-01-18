import TayiWPSpellLayOnHands from "./spells/layOnHands.js";
import TayiWPSpellShield from "./spells/shield.js";

const l = [
    TayiWPSpellLayOnHands,
    TayiWPSpellShield,
];
const TAYIWP_SPELLS = {};
for (const spell_class of l) {
    TAYIWP_SPELLS[spell_class.SUBCLASS_NAME] = spell_class;
}
export default TAYIWP_SPELLS;
