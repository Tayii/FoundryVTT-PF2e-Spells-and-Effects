import TayiWPHandlerClass from "../src/clHandler.js";
import TayiWPConst from "../src/const.js";

export default class TayiWPSpell extends TayiWPHandlerClass {
    static HANDLER_TYPE = 'ACTION';
    static MACRO_ACTION = 'Use';
    static DIALOG_LEVEL_NAME = 'rank';
    static DIALOG_LEVEL_VALUE = (level) => TayiWPConst.RANK_NAMES[level];
}
