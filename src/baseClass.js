import TayiWP from "./base.js";

export default class TayiWPBaseClass {
    static ITEM_TYPE = "";
    static MACRO_ACTION = "";
    static DIALOG_LEVEL_NAME = '';
    name = "";
    callbackFunc = null;
    dialogLevels = {};
    dialogLevelMax = 0;

    static create(name, levels, callbackFunc) {
        if (!this.findActorItem(name)) {
            return false;
        }
        return new TayiWPBaseClass(name, levels, callbackFunc);
    }

    constructor(name, levels, callbackFunc) {
        this.name = name;
        this.dialogLevels = levels;
        this.callbackFunc = callbackFunc;
    }

    static findActorItem(name) {
        const item = TayiWP.findActorItem(name, this.ITEM_TYPE);
        if (item) {
            return item;
        }
        ui.notifications.error("You must have " + name + " " + this.ITEM_TYPE + ".");
        return false;
    }

    findActorItem() {
        return this.getClass().findActorItem(this.name);
    }

    getClass() {
        return this.constructor;
    }

    renderDialog(dialogLevel) {
        if (!dialogLevel) {
            dialogLevel = this.dialogLevelMax;
        }
        let dialogLevelOptions = ``;
        for (let i = 1; i <= this.dialogLevelMax; i += 1) {
            if (!this.dialogLevels.hasOwnProperty(i)) {
                continue;
            }
            dialogLevelOptions += `<option `;
            if (i === dialogLevel) {
                dialogLevelOptions += `selected `;
            }
            dialogLevelOptions += `value="` + i +`">` + this.getClass().DIALOG_LEVEL_NAME + i + `</option>`;
        }
        const dialogParams = this.dialogLevels[dialogLevel].createParams();
        dialogParams.push(TayiWP.createOptionParam('show-info', 'Show ' + this.getClass().ITEM_TYPE + ' info in chat?', [
            ['no', 'No'],
            ['yes', 'Yes']
        ]));
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
            title: this.getClass().MACRO_ACTION + `: ` + this.name,
            content: `
        <div>If you change ` + this.getClass().ITEM_TYPE + ` ` + this.getClass().DIALOG_LEVEL_NAME
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
                    label: this.getClass().MACRO_ACTION + ` ` + this.getClass().ITEM_TYPE,
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
                    const dialogParamsAfter = this.dialogLevels[dialogLevel].copy();
                    dialogParamsAfter.setDialogLevel(dialogLevel);
                    for (let i in dialogParams) {
                        if (!dialogParams.hasOwnProperty(i)) {
                            continue;
                        }
                        dialogParamsAfter[dialogParams[i].name] = html.find('[name="' + dialogParams[i].name + '"]')[0].value;
                    }
                    if (dialogParams['show-info'] === 'yes') {
                        await this.findActorItem().roll(event);
                    }
                    dialogParamsAfter.setNames();
                    await this.callbackFunc(dialogParamsAfter);
                }
            }
        }).render(true);
    }
}
