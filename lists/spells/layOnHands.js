import TayiWPConst from "../../src/const.js";
import TayiWPSpell from "../../categories/clSpell.js";
import TayiWPSpellLevel from "../../categories/clSpellLevel.js";
import TayiWP from "../../src/base.js";

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
    static HANDLER_NAME = 'Lay on Hands';
    static DIALOG_LEVEL_MIN = 1;
    static ROLL_ITEM = false;

    static getDialogLevelsPerLevel(level) {
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
            return instance.createEffectButton(args[0]);
        }
    }

    async dialogCallback(spellParams) {
        const actor = TayiWPConst.ifActor();
        // let messageContent = '';
        let name = this.getClass().HANDLER_NAME;
        if (spellParams.spell_target === 'ally')
            name += ' (' + spellParams.spell_target + ')';
        await TayiWPSpell.findActorItem(name).roll();
        switch (spellParams.spell_target) {
            case 'ally':
                // spellParams.healing = parseInt(spellParams.healing);
                spellParams.ac_bonus = parseInt(spellParams.ac_bonus);
                // messageContent = "healing = <b>[[" + spellParams.healing + "]]</b>";
                break;
            case 'undead':
                spellParams.ac_penalty = parseInt(spellParams.ac_penalty);
            // const roll = TayiWP.rollSomething("@damage_roll", {damage_roll: spellParaTayiWPSpellLayOnHandsms.damage_roll}, 0);
            // messageContent = "damage = <b>[[" + roll.roll.result + "]]</b>";
        }
        // await TayiWP.saySomething(spellParams.getSpellName() + ': ' + messageContent);
        await this.createEffectButton(spellParams);
        spellParams['EXPIRED'] = true;
        await TayiWP.whenNextTurn(TayiWPConst.COMBAT_TRIGGERS.TURN_START, actor.data, 1, this.getClass().getMacroName(),
            [spellParams]);
    }

    async createEffectButton(spellParams) {
        let effectDesc = ' status AC, 1 round';
        switch (spellParams.spell_target) {
            case 'ally':
                effectDesc = "+" + spellParams.ac_bonus + effectDesc;
                break;
            case 'undead':
                effectDesc = "-" + spellParams.ac_penalty + effectDesc;
        }
        await TayiWP.postChatButtonEffect(this.getFullName(spellParams.level), effectDesc, spellParams);
    }

    static getCallbackMessage() {
        return this;
    }

    static handleMessage(message, html, data, chat_card, effect_data) {
        TayiWPConst.createButton(chat_card, "Apply effect", this.buttonClickApplyEffect, effect_data);
        TayiWPConst.createButton(chat_card, "Remove effect", this.buttonClickRemoveEffect, effect_data);
    }

    static async buttonClickApplyEffect(spellParams) {
        const name = spellParams.HANDLER_NAME + ' (' + spellParams.spell_target + ')';
        await TayiWPConst.forEachControlledToken(async (actor, token, spellParams) => {
            let messageContent = ' status AC';
            switch (spellParams.spell_target) {
                case 'ally':
                    token.toggleEffect("systems/pf2e/icons/conditions-2/status_acup.png", {
                        "active": true
                    });
                    actor.addCustomModifier('ac', name, spellParams.ac_bonus, 'status');
                    messageContent = 'gains +' + spellParams.ac_bonus + messageContent;
                    break;
                case 'undead':
                    token.toggleEffect("systems/pf2e/icons/conditions-2/broken.png", {
                        "active": true
                    });
                    actor.addCustomModifier('ac', name, -spellParams.ac_penalty, 'status');
                    messageContent = 'takes -' + spellParams.ac_penalty + messageContent;
            }
            await TayiWPConst.saySomething(actor, spellParams.MACRO_NAME + ': ' + messageContent);
        }, spellParams);
    }

    static async buttonClickRemoveEffect(spellParams) {
        await TayiWPConst.forEachControlledToken(async (actor, token, spellParams) => {
            actor.removeCustomModifier('ac', spellParams.HANDLER_NAME + ' (' + spellParams.spell_target + ')');
            let messageContent = ' status AC';
            switch (spellParams.spell_target) {
                case 'ally':
                    token.toggleEffect("systems/pf2e/icons/conditions-2/status_acup.png", {
                        "active": false
                    });
                    messageContent = 'loses +' + spellParams.ac_bonus + messageContent;
                    break;
                case 'undead':
                    token.toggleEffect("systems/pf2e/icons/conditions-2/broken.png", {
                        "active": false
                    });
                    messageContent = 'loses -' + spellParams.ac_penalty + messageContent;
            }
            await TayiWPConst.saySomething(actor, spellParams.MACRO_NAME + ': ' + messageContent);
        }, spellParams);
    }
}
