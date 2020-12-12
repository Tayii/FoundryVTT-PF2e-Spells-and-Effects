export default class TayiWPAttributes {
    static CALLBACK_TYPE = '';
    static CALLBACK_NAME = '';
    level = 0;

    constructor() {
        this.CALLBACK_NAME = this.getClass().CALLBACK_NAME;
    }

    createParams() {
        return [];
    }

    setDialogLevel(level) {
        this.level = level;
    }

    getMacroName() {
        return '';
    }

    getFullName() {
        return this.getMacroName();
    }

    setNames() {
        this.macroName = this.getMacroName();
        this.fullName = this.getFullName();
    }

    copy() {
        return new TayiWPAttributes();
    }

    getClass() {
        return this.constructor;
    }
}
