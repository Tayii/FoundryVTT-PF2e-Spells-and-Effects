import TayiWPHandlerClass from "../src/clHandler.js";

export default class TayiWPSpell extends TayiWPHandlerClass {
    static HANDLER_TYPE = 'SPELL';
    static MACRO_ACTION = 'Cast';
    static DIALOG_LEVEL_NAME = 'level';
    static DIALOG_LEVEL_VALUE = (level) => `${this.DIALOG_LEVEL_NAME} ${level}`;
}
