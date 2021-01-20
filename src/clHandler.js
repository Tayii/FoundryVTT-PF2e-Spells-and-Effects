import TayiWPConst from "./const.js";

export default class TayiWPHandlerClass {
    // для разделения между категориями подклассов (заклинания, навыки, черты, и т.д.)
    static HANDLER_TYPE = '';
    // наименование каждого подкласса-обработчика
    static SUBCLASS_NAME = '';
    // действие, которое делается с категорией ("использовать", "колдовать", и т.д.)
    static MACRO_ACTION = '';
    // название каждого уровня скалирования (уровень, мастерство, и т.д.)
    static DIALOG_LEVEL_NAME = '';
    static DIALOG_LEVEL_VALUE = (level) => `${level}`;
    static DIALOG_LEVEL_MIN = 1;
    static DIALOG_LEVEL_SCALING = 1;
    static DIALOG_LEVELS_STATIC = null;
    static ROLL_ITEM = null;
    static USE_REQUIREMENTS = [];
    metReqs = [];

    // внутреннее название, для идентификации
    static getHandlerName() {
        return `${this.HANDLER_TYPE}_${this.SUBCLASS_NAME}`.toUpperCase().replace(' ', '_');
    }

    // общее название, для визуального отображения
    static getMacroName() {
        return this.MACRO_ACTION + ' ' + this.SUBCLASS_NAME;
    }

    getFullName(level) {
        return `${this.getClass().SUBCLASS_NAME} (lvl ${level})`
    }

    getClass() {
        return this.constructor;
    }

    static getCallbackMessage() {
    }

    static handleMessage(message, html, data, chat_card, effect_data) {
    }

    async dialogCallback(req, dialogParams) {
    }

    static alertCreate(args) {
    }

    static getDialogOptionPerLevel(level) {
    }

    static init(args) {
        if (args.length === 0) {
            return this.create().renderReqs();
        }
        else {
            return this.alertCreate(args);
        }
    }

    static create() {
        const actor = TayiWPConst.ifActor();
        const actorReqs = [];
        for (const req of this.USE_REQUIREMENTS) {
            const answer = req.ifCheck(actor);
            if (!answer)
                continue;
            actorReqs.push(answer);
        }
        if (actorReqs.length === 0)
            return null;
        return new this(actorReqs);
    }

    constructor(metReqs) {
        this.metReqs = metReqs;
    }

    static findActorItem(name) {
        const item = TayiWPConst.ifActorItem(name, this.HANDLER_TYPE.toLowerCase());
        return (item) ? item : null;
    }

    static getDialogLevels(level_max) {
        const levels = [];
        if (this.DIALOG_LEVELS_STATIC === null) {
            for (let i = this.DIALOG_LEVEL_MIN; i <= level_max; i += this.DIALOG_LEVEL_SCALING)
                levels.push(i);
        }
        else {
            for (let i of this.DIALOG_LEVELS_STATIC) {
                if (i > level_max)
                    break;
                levels.push(i);
            }
        }
        return levels;
    }

    static getDialogOption(level_wanted) {
        const levels_found = this.getDialogLevels(level_wanted);
        if (levels_found.length > 0)
            return this.getDialogOptionPerLevel(levels_found[levels_found.length - 1]);
        return null;
    }

    renderReqs(req_num = null, back = false) {
        if (req_num === null)
            req_num = 0;
        if (this.metReqs.length === 1 && !back) {
            this.renderDialog(0);
            return;
        }
    }

    renderDialog(req_num, dialogLevel = null) {
        const req = this.metReqs[req_num];
        let dialogOptionSelected = 0;
        let paramsContent = [];
        for (const i of this.getClass().getDialogLevels(req.level)) {
            if (dialogLevel === i)
                dialogOptionSelected = paramsContent.length;
            paramsContent.push([i, this.getClass().DIALOG_LEVEL_VALUE(i)]);
        }
        if (dialogLevel === null) {
            dialogOptionSelected = paramsContent.length - 1;
            dialogLevel = paramsContent[dialogOptionSelected][0];
        }
        paramsContent = TayiWPConst.createOptionParam("dialogLevel", this.getClass().DIALOG_LEVEL_NAME,
            paramsContent, dialogOptionSelected).text;
        const showInfoParams = [];
        if (this.getClass().ROLL_ITEM !== true) showInfoParams.push(['no', 'No']);
        if (this.getClass().ROLL_ITEM !== false) showInfoParams.push(['yes', 'Yes']);
        const dialogParams = this.getClass().getDialogOption(dialogLevel).createParams();
        dialogParams.push(TayiWPConst.createOptionParam('show-info',
            `Show ${this.getClass().HANDLER_TYPE.toLowerCase()} info in chat?`, showInfoParams));
        for (const i of dialogParams) {
            paramsContent += i.text;
        }
        let applyChanges = false;
        let recalculateDialog = false;
        let cancelDialog = false;
        new Dialog({
            title: this.getClass().getMacroName(),
            content: `
        <div>If you change ${this.getClass().HANDLER_TYPE.toLowerCase()} ${this.getClass().DIALOG_LEVEL_NAME}, `
            + `click on "Recalculate" button to update other values.<div>
        <hr/>
        <form>
          ${paramsContent}
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
                    label: `${this.getClass().MACRO_ACTION} ${this.getClass().HANDLER_TYPE.toLowerCase()}`,
                    callback: () => applyChanges = true
                },
                no: {
                    icon: "<i class='fas fa-times'></i>",
                    label: `Cancel`,
                    callback: () => cancelDialog = true
                },
            },
            default: "yes",
            close: async (html) => {
                if (cancelDialog) {
                    this.renderReqs(req_num, true);
                    return;
                }
                if (recalculateDialog) {
                    this.renderDialog(req_num, parseInt(html.find('[name="dialogLevel"]')[0].value) || dialogLevel);
                    return;
                }
                if (applyChanges) {
                    const dialogParamsAfter = this.getClass().getDialogOption(dialogLevel);
                    for (let i of dialogParams) {
                        dialogParamsAfter[i.name] = html.find(`[name="${i.name}"]`)[0].value;
                    }
                    if (dialogParamsAfter['show-info'] === 'yes')
                        await this.getClass().findActorItem(this.getClass().SUBCLASS_NAME).roll();
                    dialogParamsAfter.source_actor_id = TayiWPConst.ifActor()._id;
                    dialogParamsAfter.SUBCLASS_NAME = this.getClass().SUBCLASS_NAME;
                    dialogParamsAfter.HANDLER_NAME = this.getClass().getHandlerName();
                    dialogParamsAfter.MACRO_NAME = this.getClass().getMacroName();
                    await this.dialogCallback(req, dialogParamsAfter);
                }
            }
        }).render(true);
    }
}
