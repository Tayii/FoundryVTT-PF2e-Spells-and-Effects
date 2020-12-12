import TayiWP from "../src/base.js";
import TayiWPSpell from "../src/spellsClass.js";
import TayiWPSpellAttributes from "../src/spellsAttrs.js";
import TayiWPConst from "../src/const.js";

const name = 'Shield';

class SpellAttributes extends TayiWPSpellAttributes {
    static CALLBACK_NAME = name;
    level = 1;
    shieldNameBefore = 'Buckler';
    shieldName = 'Magical Shield of Force';

    constructor(ac, hardness) {
        super();
        this.ac_bonus = ac;
        this.hardness = hardness;
    }

    createParams() {
        return [
            TayiWP.createParam('ac_bonus', 'AC Bonus', 'number', this.ac_bonus),
            TayiWP.createParam('hardness', 'Hardness', 'number', this.hardness)
        ]
    }

    copy() {
        return new SpellAttributes(this.ac_bonus, this.hardness);
    }
}

export default class TayiWPSpellShield {
    static spellName = name;

    static spellLevels = {
        1: new SpellAttributes(1, 5),
        3: new SpellAttributes(1, 10),
        5: new SpellAttributes(1, 15),
        7: new SpellAttributes(1, 20),
        9: new SpellAttributes(1, 25)
    };

    static async castFunc(spellParams) {
        const actor = TayiWP.ifActor();
        if (!actor) {
            return;
        }
        spellParams.ac_bonus = parseInt(spellParams.ac_bonus);
        spellParams.hardness = parseInt(spellParams.hardness);
        await this.applyFunc(spellParams);
        await TayiWP.whenNextTurn(TayiWPConst.COMBAT_TRIGGERS.TURN_START, actor.data, 1, spellParams.macroName,
            [spellParams]);
    }

    static async applyFunc(spellParams) {
        const actor = TayiWP.ifActor();
        if (!actor) {
            return;
        }
        const token = TayiWP.ifToken();

        let shield;
        for (const p of game.folders.filter(p => p.type === 'Item')) {
            const action = p.content.find(a => a.data.name === spellParams.shieldNameBefore);
            if (!action) {
                continue;
            }
            shield = await actor.createOwnedItem(action.data);
            actor.updateEmbeddedEntity("OwnedItem", [{
                "_id": shield._id,
                "data.armor.value": spellParams.ac_bonus,
                "data.hardness.value": spellParams.hardness,
                "name": spellParams.shieldName + " (lvl " + spellParams.spellLevel + ")"
            }]);
            break;
        }
        actor.updateEmbeddedEntity("OwnedItem", [{
            "_id": shield._id,
            "data.equipped.value": true,
            "data.hp.value": shield.data.maxHp.value,
        }]);
        actor.addCustomModifier('ac', 'Raise Shield (' + spellParams.shieldName + ')', spellParams.ac_bonus, 'circumstance');
        token.toggleEffect("systems/pf2e/icons/conditions-2/status_acup.png", {
            "active": true
        });
        const messageContent = 'creates shield with AC <b>' + spellParams.ac_bonus
            + '</b> and Hardness <b>' + spellParams.hardness + '</b>';
        await TayiWP.saySomething(actor, spellParams.macroName + ': ' + messageContent);
    }

    static async removeFunc(spellParams) {
        const actor = TayiWP.ifActor();
        if (!actor) {
            return;
        }
        const token = TayiWP.ifToken();

        let shield = actor.data.items.filter(item => item.type === 'armor')
            .filter(armor => armor.data.armorType.value === 'shield')
            .find(shield => shield.name.startsWith(spellParams.shieldName));

        actor.removeCustomModifier('ac', 'Raise Shield (' + spellParams.shieldName + ')');
        token.toggleEffect("systems/pf2e/icons/conditions-2/status_acup.png", {
            "active": false
        });
        let messageContent = 'dismisses ' + spellParams.CALLBACK_NAME + ' cantrip';
        if (shield.data.hp.value < shield.data.maxHp.value) {
            messageContent += "; " + spellParams.CALLBACK_NAME + " can't be used for 10 minutes"
        }
        actor.deleteEmbeddedEntity('OwnedItem', shield._id);
        await TayiWP.saySomething(actor, spellParams.macroName + ': ' + messageContent);
    }

    static init(args) {
        if (args.length === 0) {
            TayiWPSpell.create(this.spellName, this.spellLevels, this.castFunc).renderDialog();
        }
        else {
            this.removeFunc(args[0]);
        }
    }
}

