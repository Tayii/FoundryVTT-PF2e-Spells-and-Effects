import TayiWP from "../src/base.js";
import TayiWPSpell from "../src/spellsClass.js";
import TayiWPSpellAttributes from "../src/spellsAttrs.js";
import TayiWPConst from "../src/const.js";

const name = 'Lay on Hands';

class SpellAttributes extends TayiWPSpellAttributes {
    static CALLBACK_NAME = name;
    level = 1;

    constructor(healing, ac_bonus, damage_roll, ac_penalty) {
        super();
        this.spell_target = 'ally';
        this.healing = healing;
        this.ac_bonus = ac_bonus;
        this.damage_roll = damage_roll;
        this.ac_penalty = ac_penalty;
    }

    createParams() {
        return [
            TayiWP.createOptionParam('spell_target', 'Spell target?', [
                ['ally', 'Willing Ally (living)'],
                ['undead', 'Undead']
            ]),
            // TayiWP.createParam('healing', 'Healing', 'number', this.healing),
            TayiWP.createParam('ac_bonus', 'AC Bonus', 'number', this.ac_bonus),
            // TayiWP.createParam('damage_roll', 'Damage', 'text', this.damage_roll),
            TayiWP.createParam('ac_penalty', 'AC Penalty', 'number', this.ac_penalty),
        ]
    }

    copy() {
        return new SpellAttributes(this.healing, this.ac_bonus, this.damage_roll, this.ac_penalty);
    }
}

export default class TayiWPSpellLayOnHands {
    static spellName = name;

    static spellLevels = {
        1: new SpellAttributes(6, 2, "1d6", 2),
        2: new SpellAttributes(12, 2, "2d6", 2),
        3: new SpellAttributes(18, 2, "3d6", 2),
        4: new SpellAttributes(24, 2, "4d6", 2),
        5: new SpellAttributes(30, 2, "5d6", 2),
        6: new SpellAttributes(36, 2, "6d6", 2),
        7: new SpellAttributes(42, 2, "7d6", 2),
        8: new SpellAttributes(48, 2, "8d6", 2),
        9: new SpellAttributes(54, 2, "9d6", 2),
        10: new SpellAttributes(60, 2, "10d6", 2)
    };

    static async castFunc(spellParams) {
        // нельзя использовать this, т.к. вызывается из класса TayiWPSpell
        const actor = TayiWP.ifActor();
        // let messageContent = '';
        await TayiWPSpell.findActorItem(spellParams.CALLBACK_NAME + ' (' + spellParams.spell_target + ')').roll();
        switch (spellParams.spell_target) {
            case 'ally':
                // spellParams.healing = parseInt(spellParams.healing);
                spellParams.ac_bonus = parseInt(spellParams.ac_bonus);
                // messageContent = "healing = <b>[[" + spellParams.healing + "]]</b>";
                break;
            case 'undead':
                spellParams.ac_penalty = parseInt(spellParams.ac_penalty);
            // const roll = TayiWP.rollSomething("@damage_roll", {damage_roll: spellParams.damage_roll}, 0);
            // messageContent = "damage = <b>[[" + roll.roll.result + "]]</b>";
        }
        // await TayiWP.saySomething(spellParams.getSpellName() + ': ' + messageContent);
        await TayiWPSpellLayOnHands.createEffectButton(spellParams);
        spellParams['EXPIRED'] = true;
        await TayiWP.whenNextTurn(TayiWPConst.COMBAT_TRIGGERS.TURN_START, actor.data, 1, spellParams.macroName,
            [spellParams]);
    }

    static async createEffectButton(spellParams) {
        let effectDesc = ' status AC, 1 round';
        switch (spellParams.spell_target) {
            case 'ally':
                effectDesc = "+" + spellParams.ac_bonus + effectDesc;
                break;
            case 'undead':
                effectDesc = "-" + spellParams.ac_penalty + effectDesc;
        }
        await TayiWP.postChatButton(spellParams.fullName, effectDesc, spellParams);
    }

    static async applyFunc(spellParams) {
        await TayiWP.forEachControlledToken(async (actor, token, spellParams) => {
            let messageContent = ' status AC';
            switch (spellParams.spell_target) {
                case 'ally':
                    token.toggleEffect("systems/pf2e/icons/conditions-2/status_acup.png", {
                        "active": true
                    });
                    actor.addCustomModifier('ac', spellParams.CALLBACK_NAME + ' (' + spellParams.spell_target + ')',
                        spellParams.ac_bonus, 'status');
                    messageContent = 'gains +' + spellParams.ac_bonus + messageContent;
                    break;
                case 'undead':
                    actor.addCustomModifier('ac', spellParams.CALLBACK_NAME + ' (' + spellParams.spell_target + ')',
                        -spellParams.ac_penalty, 'status');
                    messageContent = 'takes -' + spellParams.ac_bonus + messageContent;
            }
            await TayiWP.saySomething(actor, spellParams.macroName + ': ' + messageContent);
        }, spellParams);
    }

    static async removeFunc(spellParams) {
        await TayiWP.forEachControlledToken(async (actor, token, spellParams) => {
            actor.removeCustomModifier('ac', spellParams.CALLBACK_NAME + ' (' + spellParams.spell_target + ')');
            let messageContent = ' status AC';
            switch (spellParams.spell_target) {
                case 'ally':
                    token.toggleEffect("systems/pf2e/icons/conditions-2/status_acup.png", {
                        "active": false
                    });
                    messageContent = 'loses +' + spellParams.ac_bonus + messageContent;
                    break;
                case 'undead':
                    messageContent = 'loses -' + spellParams.ac_bonus + messageContent;
            }
            await TayiWP.saySomething(actor, spellParams.macroName + ': ' + messageContent);
        }, spellParams);
    }

    static init(args) {
        if (args.length === 0) {
            TayiWPSpell.create(this.spellName, this.spellLevels, this.castFunc).renderDialog();
        }
        else {
            this.createEffectButton(args[0]);
        }
    }

    static getCallback(funcArgs) {
        return {
            callback: TayiWP.callbackSpellEffect,
            callbackArgs: {
                applyFunc: this.applyFunc,
                removeFunc: this.removeFunc,
                funcArgs: funcArgs
            }
        }
    }
}
