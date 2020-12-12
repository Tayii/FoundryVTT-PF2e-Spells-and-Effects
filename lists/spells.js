import TayiWPSpellShield from '../spells/castShield.js';
import TayiWPSpellLayOnHands from '../spells/castLayOnHands.js';

const TAYIWP_SPELL_CALLBACKS = {};
TAYIWP_SPELL_CALLBACKS[TayiWPSpellShield.spellName] = TayiWPSpellShield;
TAYIWP_SPELL_CALLBACKS[TayiWPSpellLayOnHands.spellName] = TayiWPSpellLayOnHands;
export default TAYIWP_SPELL_CALLBACKS;
