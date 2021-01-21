import TayiWPSpellLayOnHands from "./spells/layOnHands.js";
import TayiWPSpellShield from "./spells/shield.js";
import TayiWPSpellKiRush from "./spells/kiRush.js";

const l = [
    TayiWPSpellShield,

    TayiWPSpellLayOnHands,
    TayiWPSpellKiRush,
];
const TAYIWP_SPELLS = {};
for (const _class of l) {
    TAYIWP_SPELLS[_class.SUBCLASS_NAME] = _class;
}
export default TAYIWP_SPELLS;
