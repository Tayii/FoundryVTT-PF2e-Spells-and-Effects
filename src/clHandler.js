import TayiWPConst from "./const.js";

export default class TayiWPHandlerClass {
    static HANDLER_TYPE = '';
    static HANDLER_NAME = '';
    static MACRO_ACTION = '';
    static DIALOG_LEVEL_NAME = '';
    static DIALOG_LEVEL_MIN = 1;
    static ROLL_ITEM = null;
    DIALOG_LEVEL_MAX = 1;
    dialogLevels = {};

    static getHandlerName() {
        return this.HANDLER_TYPE + '_' + this.HANDLER_NAME.toUpperCase();
    }

    static getMacroName() {
        return this.MACRO_ACTION + ' ' + this.HANDLER_NAME;
    }

    getFullName(level) {
        return this.getClass().getHandlerName() + ' (lvl ' + level + ')'
    }

    static getCallbackMessage() {
    }

    static handleMessage(message, html, data, chat_card, effect_data) {
    }

    static create() {

    }

    getClass() {
        return this.constructor;
    }

    static findActorItem(name) {
        const item = TayiWPConst.findActorItem(name, this.HANDLER_TYPE.toLowerCase());
        if (item) {
            return item;
        }
        ui.notifications.error("You must have " + name + " " + this.HANDLER_TYPE.toLowerCase() + ".");
        return false;
    }

    static getDialogLevels(level_max) {
        const attrs = {};
        for (let i = this.DIALOG_LEVEL_MIN; i <= level_max; i++) {
            const a = this.getDialogLevelsPerLevel(i);
            if (a !== null) {
                attrs[i] = a;
            }
        }
        return attrs
    }

    static getDialogLevelsPerLevel(level) {

    }

    static getDialogLevel(level) {
        const levels = this.getDialogLevels(level);
        while (level >= this.DIALOG_LEVEL_MIN && !levels.hasOwnProperty(level)) {
            level--;
        }
        if (levels.hasOwnProperty(level)) {
            return levels[level];
        }
        return null;
    }

    renderDialog(dialogLevel) {
        if (!dialogLevel) {
            dialogLevel = this.DIALOG_LEVEL_MAX;
        }
        let dialogLevelOptions = ``;
        for (let i = 1; i <= this.DIALOG_LEVEL_MAX; i += 1) {
            if (!this.dialogLevels.hasOwnProperty(i)) {
                continue;
            }
            dialogLevelOptions += `<option `;
            if (i === dialogLevel) {
                dialogLevelOptions += `selected `;
            }
            dialogLevelOptions += `value="` + i +`">` + this.getClass().DIALOG_LEVEL_NAME + ' ' + i + `</option>`;
        }
        const dialogParams = this.dialogLevels[dialogLevel].createParams();
        const arr = [];
        if (this.getClass().ROLL_ITEM === false) arr.push(['no', 'No']);
        if (this.getClass().ROLL_ITEM === true) arr.push(['yes', 'Yes']);
        dialogParams.push(TayiWPConst.createOptionParam('show-info',
            'Show ' + this.getClass().HANDLER_TYPE.toLowerCase() + ' info in chat?', arr));
        let paramsContent = '';
        for (let i in dialogParams) {
            if (!dialogParams.hasOwnProperty(i)) {
                continue;
            }
            paramsContent += dialogParams[i].text;
        }
        let applyChanges = false;
        let recalculateDialog = false;
        new Dialog({
            title: this.getClass().getMacroName(),
            content: `
        <div>If you change ` + this.getClass().HANDLER_TYPE.toLowerCase() + ` ` + this.getClass().DIALOG_LEVEL_NAME
            + `, click on "Recalculate" button to update other values.<div>
        <hr/>
        <form>
          <div class="form-group">
            <label>` + this.getClass().DIALOG_LEVEL_NAME + `:</label>
            <select id="dialogLevel" name="dialogLevel">
              ` + dialogLevelOptions + `
            </select>
          </div>
          ` + paramsContent + `
        </form>
        `,
            buttons: {
                recalc: {
                    icon: "<i class='fas fa-check'></i>",
                    label: `Recalculate`,
                    callback: () => recalculateDialog = true
                },
                yes: {
                    icon: "<i class='fas fa-check'></i>",
                    label: this.getClass().MACRO_ACTION + ` ` + this.getClass().HANDLER_TYPE.toLowerCase(),
                    callback: () => applyChanges = true
                },
                no: {
                    icon: "<i class='fas fa-times'></i>",
                    label: `Cancel`
                },
            },
            default: "yes",
            close: async (html) => {
                if (recalculateDialog) {
                    this.renderDialog(parseInt(html.find('[name="dialogLevel"]')[0].value) || dialogLevel);
                    return;
                }
                if (applyChanges) {
                    const dialogParamsAfter = this.getClass().getDialogLevel(dialogLevel);
                    for (let i in dialogParams) {
                        if (!dialogParams.hasOwnProperty(i)) {
                            continue;
                        }
                        dialogParamsAfter[dialogParams[i].name] = html.find('[name="' + dialogParams[i].name + '"]')[0].value;
                    }
                    if (dialogParamsAfter['show-info'] === 'yes') {
                        await this.getClass().findActorItem(this.getClass().HANDLER_NAME).roll(event);
                    }
                    dialogParamsAfter.HANDLER_NAME = this.getClass().getHandlerName();
                    dialogParamsAfter.MACRO_NAME = this.getClass().getMacroName();
                    await this.dialogCallback(dialogParamsAfter);
                }
            }
        }).render(true);
    }

    async dialogCallback(dialogParamsAfter) {

    }

    static alertCreate(args) {

    }

    constructor() {

    }

    static init(args) {
        if (args.length === 0) {
            return this.create();
        }
        else {
            return this.alertCreate(args);
        }
    }
}
