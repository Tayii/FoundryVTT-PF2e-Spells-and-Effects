import TayiWPConst from "../src/const.js";
import TayiWPHandlerClass from "../src/clHandler.js";

export default class TayiWPSpell extends TayiWPHandlerClass {
    static HANDLER_TYPE = 'SPELL';
    static MACRO_ACTION = 'Cast';
    static DIALOG_LEVEL_NAME = 'level';

    static create() {
        const actor = TayiWPConst.ifActor();
        const actorSpellLevel = TayiWPConst.getSPELL_LEVEL(actor.level);
        if (actorSpellLevel < this.DIALOG_LEVEL_MIN)
            return null;
        const instance = new this();
        instance.DIALOG_LEVEL_MAX = TayiWPConst.getSPELL_LEVEL(actor.level);
        instance.dialogLevels = this.getDialogLevels(instance.DIALOG_LEVEL_MAX);
        return instance;
    }
}
