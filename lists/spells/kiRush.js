import TayiWPConst from "../../src/const.js";
import TayiWPSpell from "../../categories/clSpell.js";
import TayiWPSpellLevel from "../../categories/clSpellLevel.js";
import TayiWP from "../../src/base.js";
import TayiWPFlagsClass from "../../src/clFlags.js";
import TayiWPReq from "../../src/clReq.js";
import TayiWPDialogParam from "../../src/clDialogParam.js";

class TayiWPSpellAttributesKiRush extends TayiWPSpellLevel {
    compendiumName = 'pf2e.conditionitems';
    conditionName = 'Concealed';
    params = [
        new TayiWPDialogParam('turns', 'Concealed rounds', 'number', 1),
    ];
}

export default class TayiWPSpellKiRush extends TayiWPSpell {
    static SUBCLASS_NAME = 'Ki Rush';
    static DIALOG_LEVELS_STATIC = [1];
    static DIALOG_SKIP = true;
    static USE_REQUIREMENTS = [
        new TayiWPReq("SPELL", "Ki Rush", 1)
    ];

    static getDialogOptionPerLevel(level) {
        return new TayiWPSpellAttributesKiRush(level);
    }

    static alertCreate(args) {
        const instance = new this([]);
        if (instance) {
            instance.removeEffect(args[0]);
        }
    }

    async dialogCallback(req, dialogParams) {
        await TayiWPConst.forEachControlledToken(this.applyEffectPerToken, dialogParams);
    }

    async applyEffectPerToken(actor, token, dialogParams) {
        await token.toggleEffect("systems/pf2e/icons/spells/ki-rush.jpg", {
            "active": true
        });
        dialogParams['cond_id'] = (await PF2eConditionManager.addConditionToToken("concealed", token))._id;
        TayiWPFlagsClass.affect(dialogParams, actor, token);
        const messageContent = `becomes <b>${dialogParams.conditionName}`
            + `</b> for <b>${dialogParams.turns}</b> turns`;
        await TayiWPConst.saySomething(actor, `${dialogParams.MACRO_NAME}: ${messageContent}`);
        dialogParams['EXPIRED'] = true;
        await TayiWP.whenNextTurn(TayiWPConst.COMBAT_TRIGGERS.TURN_START, actor.data._id, 1, dialogParams.MACRO_NAME,
            [dialogParams]);
    }

    async removeEffect(dialogParams) {
        await TayiWPConst.forEachAffectedToken(async (current_actor, actor, token, dialogParams) => {
            await token.toggleEffect("systems/pf2e/icons/spells/ki-rush.jpg", {
                "active": false
            });
            await PF2eConditionManager.removeConditionFromToken(dialogParams['cond_id'], token);
            let messageContent = `${dialogParams.SUBCLASS_NAME} ends`;
            await TayiWPConst.saySomething(actor, `${dialogParams.MACRO_NAME}: ${messageContent}`);
        }, dialogParams);
    }
}
