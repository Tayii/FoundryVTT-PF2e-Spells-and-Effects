import TayiWPConst from "../../src/const.js";
import TayiWPSpell from "../../categories/clSpell.js";
import TayiWPSpellLevel from "../../categories/clSpellLevel.js";
import TayiWP from "../../src/base.js";
import TayiWPFlagsClass from "../../src/clFlags.js";

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

    static getDialogOptionPerLevel(level) {
        const attr = new TayiWPSpellAttributesLayOnHands(level);
        return attr;
    }

    static create() {
        const instance = super.create();
        if (instance) {
            return instance.renderDialog(instance.DIALOG_LEVEL_MAX);
        }
    }

    static alertCreate(args) {
        const instance = super.create();
        if (instance) {
            // return instance.createEffectButton(args[0]);
            const self = instance.getClass();
            TayiWPConst.forEachAffectedToken(async (current_actor, actor, token, spellParams) => {
                self.removeEffectPerToken(actor, token, spellParams);
            }, args[0]);
        }
    }

    async dialogCallback(spellParams) {
        let name = spellParams.SUBCLASS_NAME;
        if (spellParams.spell_target === 'ally')
            name += ' (' + spellParams.spell_target + ')';
        await TayiWPSpell.findActorItem(name).roll();
        switch (spellParams.spell_target) {
            case 'ally':
                spellParams.ac_bonus = parseInt(spellParams.ac_bonus);
                break;
            case 'undead':
                spellParams.ac_penalty = parseInt(spellParams.ac_penalty);
        }
        await this.createEffectButton(spellParams);
    }

    async createEffectButton(spellParams) {
        let effectDesc = 'status AC, 1 round';
        switch (spellParams.spell_target) {
            case 'ally':
                effectDesc = `+${spellParams.ac_bonus} ${effectDesc}`;
                break;
            case 'undead':
                effectDesc = `-${spellParams.ac_penalty} ${effectDesc}`;
        }
        await TayiWP.postChatButtonEffect(this.getFullName(spellParams.level), effectDesc, spellParams);
    }

    static getCallbackMessage() {
        return this;
    }

    static handleMessage(message, html, data, chat_card, effect_data) {
        const self = this;
        TayiWPConst.createButton(chat_card, "Apply effect", this.buttonClickApplyEffect, effect_data);
        TayiWPConst.createButton(chat_card, "Remove effect", async (spellParams) => {
            await TayiWPConst.forEachControlledToken(async (actor, token, spellParams) => {
                self.removeEffectPerToken(actor, token, spellParams);
            }, spellParams);
        }, effect_data);
    }

    static async buttonClickApplyEffect(spellParams) {
        const modName = `${spellParams.SUBCLASS_NAME} (${spellParams.spell_target})`;
        await TayiWPConst.forEachControlledToken(async (actor, token, spellParams) => {
            let messageContent = 'status AC';
            switch (spellParams.spell_target) {
                case 'ally':
                    token.toggleEffect("systems/pf2e/icons/spells/lay-on-hands.jpg", {
                        "active": true
                    });
                    actor.addCustomModifier('ac', modName, spellParams.ac_bonus, 'status');
                    messageContent = `gains +${spellParams.ac_bonus} ${messageContent}`;
                    break;
                case 'undead':
                    token.toggleEffect("systems/pf2e/icons/spells/lay-on-hands.jpg", {
                        "active": true
                    });
                    actor.addCustomModifier('ac', modName, -spellParams.ac_penalty, 'status');
                    messageContent = `takes -${spellParams.ac_penalty} ${messageContent}`;
            }
            TayiWPFlagsClass.affect(spellParams, actor, token);
            await TayiWPConst.saySomething(actor, `${spellParams.MACRO_NAME}: ${messageContent}`);
            spellParams['EXPIRED'] = true;
            await TayiWP.whenNextTurn(TayiWPConst.COMBAT_TRIGGERS.TURN_START, spellParams.source_actor_id, 1,
                spellParams.MACRO_NAME, [spellParams]);
        }, spellParams);
    }

    static async removeEffectPerToken(actor, token, spellParams) {
        const modName = `${spellParams.SUBCLASS_NAME} (${spellParams.spell_target})`;
        if (!(actor.data.data.customModifiers.hasOwnProperty('ac')
            && actor.data.data.customModifiers['ac'].find(cm => cm.name === modName)))
            return;
        actor.removeCustomModifier('ac', modName);
        let messageContent = 'status AC';
        token.toggleEffect("systems/pf2e/icons/spells/lay-on-hands.jpg", {
            "active": false
        });
        switch (spellParams.spell_target) {
            case 'ally':
                messageContent = `loses +${spellParams.ac_bonus} ${messageContent}`;
                break;
            case 'undead':
                messageContent = `loses -${spellParams.ac_penalty} ${messageContent}`;
        }
        // TayiWPFlagsClass.remove(spellParams, actor, token);
        await TayiWPConst.saySomething(actor, `${spellParams.MACRO_NAME}: ${messageContent}`);
    }
}
