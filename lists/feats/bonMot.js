import TayiWPConst from "../../src/const.js";
import TayiWPSkill from "../../categories/clSkill.js";
import TayiWPSkillGrade from "../../categories/clSkillGrade.js";
import TayiWPSkillRank from "../../categories/clSkillRank.js";
import TayiWPReq from "../../src/clReq.js";
import TayiWPRoll from "../../src/clRoll.js";
import TayiWPDialogParam from "../../src/clDialogParam.js";
import TayiWPFlagsClass from "../../src/clFlags.js";
import TayiWP from "../../src/base.js";

class TayiWPSkillGradeBonMot extends TayiWPSkillGrade {
    BASIC_PENALTY = {
        0: 2,
        1: 0,
        2: 2,
        3: 3
    };
    BASIC_TARGET = {
        0: 'self',
        1: '',
        2: 'target',
        3: 'target'
    };

    constructor(level) {
        super(level);
        this.addParam(new TayiWPDialogParam('penalty', "Will Penalty", "number", this.BASIC_PENALTY[level]));
        const target = new TayiWPDialogParam('target', "", "options");
        for (const m of ['target', 'self']) {
            target.addOptionValue(m, m, m === this.BASIC_TARGET[level]);
        }
        this.addParam(target);
        this.spliceParams();
    }
}

class TayiWPSkillRankBonMot extends TayiWPSkillRank {
    constructor(level) {
        super(level);
        // this.addParam(new TayiWPDialogParam('dc', "DC", "number", (level > 1) ? 10 * level : 15));
        // const healing_add = (level > 1) ? 20 * level - 30 : 0;
        for (let i = 3; i >= 0; i--) {
            const grade = new TayiWPSkillGradeBonMot(i).spliceParams();
            // if (grade.meaning === 'healing' && healing_add > 0)
            //     grade.setParam("formula", grade.formula + `+${healing_add}`);
            this.grades[i] = grade;
        }
    }
}

export default class TayiWPSkillBonMot extends TayiWPSkill {
    static HANDLER_TYPE = 'FEAT';
    static SUBCLASS_NAME = 'Bon Mot';
    static USE_REQUIREMENTS = [
        new TayiWPReq("SKILL", "diplomacy", 1)
    ];

    static getDialogOptionPerLevel(level) {
        return new TayiWPSkillRankBonMot(level);
    }

    static alertCreate(args) {
        const instance = new this([]);
        if (instance) {
            const self = instance.getClass();
            TayiWPConst.forEachAffectedToken(async (current_actor, actor, token, spellParams) => {
                self.removeEffectPerToken(actor, token, spellParams);
            }, args[0]);
        }
    }

    static getCallbackMessage() {
        return this;
    }

    async dialogCallback(req, dialogParams) {
        if (!TayiWPConst.ifTarget())
            return null;
        const actor = TayiWPConst.ifActor();
        new TayiWPRoll().skillRoll(actor, req.code, [], async (roll) => {
            await TayiWPConst.forEachTargetedToken(async (owner_actor, target_actor, target_token, dialogParams) => {
                roll.vsDC(target_actor.data.data.saves.will.totalModifier + 10);
                let messageContent = `target <b>${target_token.data.name}</b>, ${roll.toString(false)}`;
                dialogParams.setGrade(roll.grade);
                if (dialogParams.penalty !== 0) {
                    messageContent += `; <b>${dialogParams.target}</b> receives -<b>${dialogParams.penalty}</b>`
                        + ` to Will and Perception`;
                }
                await TayiWPConst.saySomething(owner_actor, `${dialogParams.MACRO_NAME}: ${messageContent}`);
            }, dialogParams);
            await this.createEffectButton(dialogParams);
        });
    }

    async createEffectButton(dialogParams) {
        let effectDesc = `-${dialogParams.penalty} status Will and Perception, 1 minute`;
        await TayiWP.postChatButtonEffect(this.getFullName(dialogParams.level), effectDesc, dialogParams);
    }

    static handleMessage(message, html, data, chat_card, effect_data) {
        const self = this;
        for (let grade = 3; grade >= 0; grade--) {
            if (!effect_data.grades.hasOwnProperty(grade))
                continue;
            const dialogParams = TayiWPSkillRankBonMot.setGrade(effect_data, grade);
            if (dialogParams.penalty === 0)
                continue;
            TayiWPConst.createButton(chat_card, `${TayiWPConst.GRADE_SH_NAMES[grade]} ${dialogParams.target}`,
                async (dialogParams) => {
                    await TayiWPConst.forEachControlledToken(async (actor, token, dialogParams) => {
                        self.applyEffectPerToken(actor, token, dialogParams);
                    }, dialogParams);
                }, dialogParams);
        }
        TayiWPConst.createButton(chat_card, "Remove effect", async (dialogParams) => {
            await TayiWPConst.forEachControlledToken(async (actor, token, dialogParams) => {
                self.removeEffectPerToken(actor, token, dialogParams);
            }, dialogParams);
        }, effect_data);
    }

    static async applyEffectPerToken(actor, token, dialogParams) {
        const modName = `${dialogParams.SUBCLASS_NAME} (${dialogParams.target})`;
        const modifier = TayiWPConst.ifActorHasModifier(actor, 'will', modName);
        if (modifier)
            return;
        await actor.addCustomModifier('will', modName, -dialogParams.penalty,
            'status');
        await actor.addCustomModifier('perception', modName, -dialogParams.penalty,
            'status');
        await token.toggleEffect("systems/pf2e/icons/features/classes/wit-style.jpg", {
            "active": true
        });
        TayiWPFlagsClass.affect(dialogParams, actor, token);
        const messageContent = `takes -${dialogParams.penalty} status Will and Perception`;
        await TayiWPConst.saySomething(actor, `${dialogParams.MACRO_NAME}: ${messageContent}`);
        dialogParams['EXPIRED'] = true;
        await TayiWP.whenNextTurn(TayiWPConst.COMBAT_TRIGGERS.TURN_START, dialogParams.source_actor_id, 1,
            dialogParams.MACRO_NAME, [dialogParams]);
    }

    static async removeEffectPerToken(actor, token, dialogParams) {
        const modName = `${dialogParams.SUBCLASS_NAME} (${dialogParams.target})`;
        const modifier = TayiWPConst.ifActorHasModifier(actor, 'will', modName);
        if (!modifier)
            return;
        await actor.removeCustomModifier('will', modName);
        await actor.removeCustomModifier('perception', modName);
        await token.toggleEffect("systems/pf2e/icons/features/classes/wit-style.jpg", {
            "active": false
        });
        const messageContent = `loses ${modifier.modifier} status Will and Perception`;
        await TayiWPConst.saySomething(actor, `${dialogParams.MACRO_NAME}: ${messageContent}`);
    }
}
