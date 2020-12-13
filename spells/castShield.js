import TayiWP from "../src/base.js";
import TayiWPSpell from "../src/spellsClass.js";
import TayiWPSpellAttributes from "../src/spellsAttrs.js";
import TayiWPConst from "../src/const.js";

const name = 'Shield';

class SpellAttributes extends TayiWPSpellAttributes {
    static CALLBACK_NAME = name;
    level = 1;
    compendiumName = 'pf2e.equipment-srd';
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
        await TayiWPSpellShield.applyFunc(spellParams);
        await TayiWP.whenNextTurn(TayiWPConst.COMBAT_TRIGGERS.TURN_START, actor.data, 1, spellParams.macroName,
            [spellParams]);
    }

    static async applyFunc(spellParams) {
        const actor = TayiWP.ifActor();
        if (!actor) {
            return;
        }
        const token = TayiWP.ifToken();
        const pack = game.packs.get(spellParams.compendiumName);
        const index = await pack.getIndex();
        const entry = index.find(e => e.name === spellParams.shieldNameBefore);
        const item = await pack.getEntity(entry._id);
        const shield = await actor.createOwnedItem(item.data);
        actor.updateEmbeddedEntity("OwnedItem", [{
            "_id": shield._id,
            "data.hp.value": 1,
            "data.maxHp.value": 1,
            "data.armor.value": spellParams.ac_bonus,
            "data.hardness.value": spellParams.hardness,
            "name": spellParams.shieldName + " (lvl " + spellParams.level + ")",
            "data.equipped.value": true,
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
