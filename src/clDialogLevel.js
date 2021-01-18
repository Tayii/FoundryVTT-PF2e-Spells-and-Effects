import TayiWPFlagsClass from "./clFlags.js";

export default class TayiWPDialogLevel extends TayiWPFlagsClass {
    level = 1;

    constructor(level) {
        super();
        this.level = level;
    }

    createParams() {
        return [];
    }
}
