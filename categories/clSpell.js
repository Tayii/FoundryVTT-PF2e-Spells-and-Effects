import TayiWPConst from "../src/const.js";
import TayiWPHandlerClass from "../src/clHandler.js";

export default class TayiWPSpell extends TayiWPHandlerClass {
    static HANDLER_TYPE = 'SPELL';
    static MACRO_ACTION = 'Cast';
    static DIALOG_LEVEL_NAME = 'level';

    static create() {
        const actor = TayiWPConst.ifActor();
        const actorSpellLevel = TayiWPConst.getSPELL_LEVEL(actor.level);
        if (this.getDialogOption(actorSpellLevel) === null)
            return null;
        const instance = new this();
        instance.DIALOG_LEVEL_MAX = actorSpellLevel;
        instance.dialogLevels = {};
        for (const l of this.getDialogLevels(instance.DIALOG_LEVEL_MAX)) {
            instance.dialogLevels[l] = this.getDialogOptionPerLevel(l);
        }
        return instance;
    }
}
