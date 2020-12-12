import TayiWPSpell from "./spellsClass.js";
import TayiWPAttributes from "./baseAttrs.js";

export default class TayiWPSpellAttributes extends TayiWPAttributes {
    static CALLBACK_TYPE = 'SPELL';
    level = 1;

    getMacroName() {
        return TayiWPSpell.MACRO_ACTION + ' ' + this.getClass().CALLBACK_NAME;
    }

    getFullName() {
        return this.getMacroName() + ' (lvl ' + this.level + ')'
    }
}
