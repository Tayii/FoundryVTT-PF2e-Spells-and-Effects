import TayiWPConst from "./const.js";
import TayiWPDialogParam from "./clDialogParam.js";

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
    static USE_ADDITIONS = [];
    metReqs = [];
    metAdds = [];

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

    async dialogCallback(req, additions, dialogParams) {
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
        const instance = new this(actorReqs);
        for (const add of this.USE_ADDITIONS) {
            const answer = add.ifCheck(actor);
            if (!answer)
                continue;
            instance.metAdds.push(answer);
        }
        return instance;
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

    static getDialogLevel(level_wanted) {
        const levels_found = this.getDialogLevels(level_wanted);
        if (levels_found.length > 0)
            return this.getDialogOptionPerLevel(levels_found[levels_found.length - 1]);
        return null;
    }

    renderReqs(req_num = null, back = false) {
        if (this.metReqs.length === 1) {
            if (!back)
                this.renderDialog(0);
            return;
        }
        if (req_num === null)
            req_num = 0;
        const paramReqNum = new TayiWPDialogParam("reqNum", "method", "options");
        for (const i in this.metReqs) {
            if (!this.metReqs.hasOwnProperty(i))
                continue;
            paramReqNum.addOptionValue(i, this.metReqs[i].name, i === req_num);
        }
        let paramsContent = paramReqNum.createTextInput();
        const paramsAdditions = {};
        for (const addition of this.metAdds) {
            const additionParam = new TayiWPDialogParam(addition.getHandlerName(), addition.name + "?", "checkbox");
            paramsAdditions[addition.getHandlerName()] = additionParam;
            paramsContent += additionParam.createTextInput();
        }
        let applyChanges = false;
        new Dialog({
            title: this.getClass().getMacroName(),
            content: `<form>${paramsContent}</form>`,
            buttons: {
                yes: {
                    icon: "<i class='fas fa-check'></i>",
                    label: `Continue`,
                    callback: () => applyChanges = true
                },
                no: {
                    icon: "<i class='fas fa-times'></i>",
                    label: `Cancel`
                },
            },
            default: "yes",
            close: async (html) => {
                if (!applyChanges)
                    return;
                req_num = paramReqNum.findInputParam(html);
                const actualAdditions = [];
                for (const addition of this.metAdds) {
                    if (paramsAdditions[addition.getHandlerName()].findInputParam(html))
                        actualAdditions.push(addition);
                }
                (async (self) => self.renderDialog(req_num, actualAdditions))(this);
            }
        }).render(true);
    }

    renderDialog(req_num, additions, dialogLevel = null) {
        const req = this.metReqs[req_num];
        req.additions = additions;
        let levels = this.getClass().getDialogLevels(req.level);
        if (dialogLevel === null)
            dialogLevel = levels[levels.length - 1];
        const paramDialogLevels = new TayiWPDialogParam("dialogLevel", this.getClass().DIALOG_LEVEL_NAME,
            "options");
        for (const i of levels) {
            paramDialogLevels.addOptionValue(i, this.getClass().DIALOG_LEVEL_VALUE(i), i === dialogLevel);
        }
        const paramShowInfo = new TayiWPDialogParam('show-info',
            `Show ${this.getClass().HANDLER_TYPE.toLowerCase()} info in chat?`, "options");
        if (this.getClass().ROLL_ITEM !== true) paramShowInfo.addOptionValue('no', 'No');
        if (this.getClass().ROLL_ITEM !== false) paramShowInfo.addOptionValue('yes', 'Yes');
        const dialogParams = req.apply_patch("rank", this.getClass().getDialogLevel(dialogLevel));
        const contentParams = paramDialogLevels.createTextInput()
            + dialogParams.createTextInputs() + paramShowInfo.createTextInput();
        let applyChanges = false;
        let recalculateDialog = false;
        let cancelDialog = false;
        let title = this.getClass().getMacroName();
        if (this.getClass().USE_REQUIREMENTS.length > 1)
            title += `: ${req.name.toUpperCase()}`;
        new Dialog({
            title: title,
            content: `<div>If you change ${this.getClass().HANDLER_TYPE.toLowerCase()} `
            + `${this.getClass().DIALOG_LEVEL_NAME}, click on "Recalculate" button to update other values.<div>
        <hr/>
        <form>
          ${contentParams}
        </form>`,
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
                    (async (self) => self.renderReqs(req_num, true))(this);
                    return;
                }
                if (recalculateDialog) {
                    (async (self) => self.renderDialog(req_num, additions,
                        parseInt(paramDialogLevels.findInputParam(html))))(this);
                    return;
                }
                if (applyChanges) {
                    dialogParams.findInputParams(html).spliceParams();
                    if (paramShowInfo.findInputParam(html) === 'yes')
                        await this.getClass().findActorItem(this.getClass().SUBCLASS_NAME).roll();
                    dialogParams.source_actor_id = TayiWPConst.ifActor()._id;
                    dialogParams.SUBCLASS_NAME = this.getClass().SUBCLASS_NAME;
                    dialogParams.HANDLER_NAME = this.getClass().getHandlerName();
                    dialogParams.MACRO_NAME = this.getClass().getMacroName();
                    await this.dialogCallback(req, dialogParams);
                }
            }
        }).render(true);
    }
}
