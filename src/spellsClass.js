import TayiWP from "./base.js";
import TayiWPBaseClass from "./baseClass.js";

export default class TayiWPSpell extends TayiWPBaseClass {
    static ITEM_TYPE = "spell";
    static MACRO_ACTION = "Cast";
    static DIALOG_LEVEL_NAME = "level";

    static create(name, levels, callbackFunc) {
        if (!this.findActorItem(name)) {
            return false;
        }
        return new TayiWPSpell(name, levels, callbackFunc);
    }

    constructor(name, levels, callbackFunc) {
        super(name, levels, callbackFunc);
        const charLevel = TayiWP.ifActor().data.data.details.level.value;
        for (let i = 1; i <= Math.ceil(charLevel / 2); i += 1) {
            if (!spellLevels.hasOwnProperty(i)) {
                continue;
            }
            this.dialogLevelMax = i;
        }
    }
}
