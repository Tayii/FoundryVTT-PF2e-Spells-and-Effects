import TayiWPConst from "../../src/const.js";
import TayiWPSpell from "../../categories/clSpell.js";
import TayiWPSpellLevel from "../../categories/clSpellLevel.js";
import TayiWP from "../../src/base.js";
import TayiWPFlagsClass from "../../src/clFlags.js";
import TayiWPReq from "../../src/clReq.js";

class TayiWPSpellAttributesLayOnHands extends TayiWPSpellLevel {
    spell_target = 'ally';
    ac_bonus = 2;
    ac_penalty = 2;

    createParams() {
        return [
            TayiWPConst.createOptionParam('spell_target', 'Spell target?', [
                ['ally', 'Willing Ally (living)'],
                ['undead', 'Undead']
            ]),
            TayiWPConst.createParam('ac_bonus', 'AC Bonus', 'number', this.ac_bonus),
            TayiWPConst.createParam('ac_penalty', 'AC Penalty', 'number', this.ac_penalty),
        ]
    }
}

export default class TayiWPSpellLayOnHands extends TayiWPSpell {
    static SUBCLASS_NAME = 'Lay on Hands';
    static ROLL_ITEM = false;
    static USE_REQUIREMENTS = [
        new TayiWPReq("SPELL", "Lay on Hands", 1).add_subreq(
            new TayiWPReq("SPELL", "Lay on Hands (ally)", 1)
        )
    ];

    static getCallbackMessage() {
        return this;
    }

    static getDialogOptionPerLevel(level) {
        return new TayiWPSpellAttributesLayOnHands(level);
    }

    static alertCreate(args) {
        const instance = super.create();
        if (instance) {
            const self = instance.getClass();
            TayiWPConst.forEachAffectedToken(async (current_actor, actor, token, spellParams) => {
                self.removeEffectPerToken(actor, token, spellParams);
            }, args[0]);
        }
    }

    async dialogCallback(req, dialogParams) {
        let name = dialogParams.SUBCLASS_NAME;
        if (dialogParams.spell_target === 'ally')
            name += ' (' + dialogParams.spell_target + ')';
        await TayiWPSpell.findActorItem(name).roll();
        switch (dialogParams.spell_target) {
            case 'ally':
                dialogParams.ac_bonus = parseInt(dialogParams.ac_bonus);
                break;
            case 'undead':
                dialogParams.ac_penalty = parseInt(dialogParams.ac_penalty);
        }
        await this.createEffectButton(dialogParams);
    }

    async createEffectButton(dialogParams) {
        let effectDesc = 'status AC, 1 round';
        switch (dialogParams.spell_target) {
            case 'ally':
                effectDesc = `+${dialogParams.ac_bonus} ${effectDesc}`;
                break;
            case 'undead':
                effectDesc = `-${dialogParams.ac_penalty} ${effectDesc}`;
        }
        await TayiWP.postChatButtonEffect(this.getFullName(dialogParams.level), effectDesc, dialogParams);
    }

    static handleMessage(message, html, data, chat_card, effect_data) {
        const self = this;
        TayiWPConst.createButton(chat_card, "Apply effect", this.buttonClickApplyEffect, effect_data);
        TayiWPConst.createButton(chat_card, "Remove effect", async (dialogParams) => {
            await TayiWPConst.forEachControlledToken(async (actor, token, dialogParams) => {
                self.removeEffectPerToken(actor, token, dialogParams);
            }, dialogParams);
        }, effect_data);
    }

    static async buttonClickApplyEffect(dialogParams) {
        const modName = `${dialogParams.SUBCLASS_NAME} (${dialogParams.spell_target})`;
        await TayiWPConst.forEachControlledToken(async (actor, token, dialogParams) => {
            if (TayiWPConst.ifActorHasModifier(actor, 'ac', modName))
                return;
            let messageContent = 'status AC';
            switch (dialogParams.spell_target) {
                case 'ally':
                    token.toggleEffect("systems/pf2e/icons/spells/lay-on-hands.jpg", {
                        "active": true
                    });
                    actor.addCustomModifier('ac', modName, dialogParams.ac_bonus, 'status');
                    messageContent = `gains +${dialogParams.ac_bonus} ${messageContent}`;
                    break;
                case 'undead':
                    token.toggleEffect("systems/pf2e/icons/spells/lay-on-hands.jpg", {
                        "active": true
                    });
                    actor.addCustomModifier('ac', modName, -dialogParams.ac_penalty, 'status');
                    messageContent = `takes -${dialogParams.ac_penalty} ${messageContent}`;
            }
            TayiWPFlagsClass.affect(dialogParams, actor, token);
            await TayiWPConst.saySomething(actor, `${dialogParams.MACRO_NAME}: ${messageContent}`);
            dialogParams['EXPIRED'] = true;
            await TayiWP.whenNextTurn(TayiWPConst.COMBAT_TRIGGERS.TURN_START, dialogParams.source_actor_id, 1,
                dialogParams.MACRO_NAME, [dialogParams]);
        }, dialogParams);
    }

    static async removeEffectPerToken(actor, token, dialogParams) {
        const modName = `${dialogParams.SUBCLASS_NAME} (${dialogParams.spell_target})`;
        if (!TayiWPConst.ifActorHasModifier(actor, 'ac', modName))
            return;
        actor.removeCustomModifier('ac', modName);
        let messageContent = 'status AC';
        token.toggleEffect("systems/pf2e/icons/spells/lay-on-hands.jpg", {
            "active": false
        });
        switch (dialogParams.spell_target) {
            case 'ally':
                messageContent = `loses +${dialogParams.ac_bonus} ${messageContent}`;
                break;
            case 'undead':
                messageContent = `loses -${dialogParams.ac_penalty} ${messageContent}`;
        }
        await TayiWPConst.saySomething(actor, `${dialogParams.MACRO_NAME}: ${messageContent}`);
    }
}
