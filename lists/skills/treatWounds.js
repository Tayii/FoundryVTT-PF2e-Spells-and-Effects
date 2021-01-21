import TayiWPConst from "../../src/const.js";
import TayiWPSkill from "../../categories/clSkill.js";
import TayiWPSkillGrade from "../../categories/clSkillGrade.js";
import TayiWPSkillRank from "../../categories/clSkillRank.js";
import TayiWPReq from "../../src/clReq.js";
import TayiWPRoll from "../../src/clRoll.js";
import TayiWPDialogParam from "../../src/clDialogParam.js";

class TayiWPSkillGradeTreatWounds extends TayiWPSkillGrade {
    BASIC_FORMULA = {
        0: '1d8',
        1: '',
        2: '2d8',
        3: '4d8'
    };
    BASIC_MEANING = {
        0: 'damage',
        1: '',
        2: 'healing',
        3: 'healing'
    };

    constructor(level) {
        super(level);
        this.addParam(new TayiWPDialogParam('formula', "Dice roll", "text", this.BASIC_FORMULA[level]));
        const meaning = new TayiWPDialogParam('meaning', "", "options");
        for (const m of ['damage', 'healing']) {
            meaning.addOptionValue(m, m, m === this.BASIC_MEANING[level]);
        }
        this.addParam(meaning);
        this.spliceParams();
    }
}

class TayiWPSkillRankTreatWounds extends TayiWPSkillRank {
    constructor(level) {
        super(level);
        this.addParam(new TayiWPDialogParam('dc', "DC", "number", (level > 1) ? 10 * level : 15));
        const healing_add = (level > 1) ? 20 * level - 30 : 0;
        for (let i = 3; i >= 0; i--) {
            const grade = new TayiWPSkillGradeTreatWounds(i).spliceParams();
            if (grade.meaning === 'healing' && healing_add > 0)
                grade.setParam("formula", grade.formula + `+${healing_add}`);
            this.grades[i] = grade;
        }
    }
}

export default class TayiWPSkillTreatWounds extends TayiWPSkill {
    static HANDLER_TYPE = 'ACTION';
    static SUBCLASS_NAME = 'Treat Wounds';
    static USE_REQUIREMENTS = [
        new TayiWPReq("SKILL", "medicine", 1),
        new TayiWPReq("SKILL", "nature", 1).update({
            "subreqs": [
                new TayiWPReq("FEAT", "Natural Medicine").update({
                    "patches": {
                        "mods": (req, mods) => {
                            mods.push(new PF2Modifier(req.name, 2, "circumstance"));
                            return mods;
                        }
                    }
                })
            ]
        })
    ];
    static USE_ADDITIONS = [
        new TayiWPReq("FEAT", "Risky Surgery").update({
            "subreqs": [
                new TayiWPReq("SKILL", "medicine", 1)
            ],
            "patches": {
                "rank": (req, rank) => {
                    rank.params = [
                        new TayiWPDialogParam(req.getHandlerName(), "Slashing damage", "text", "1d8")
                    ].concat(rank.params);
                    return rank;
                },
                "mods": (req, mods) => {
                    mods.push(new PF2Modifier(req.name, 2, "circumstance"));
                    return mods;
                }
            }
        })
    ];

    static getDialogOptionPerLevel(level) {
        return new TayiWPSkillRankTreatWounds(level);
    }

    async dialogCallback(req, dialogParams) {
        const actor = TayiWPConst.ifActor();
        let modifiers = req.apply_patch("mods", []);
        new TayiWPRoll().skillRoll(actor, req.code, modifiers, async (roll) => {
            roll.vsDC(dialogParams.dc);
            if (req.find_add("Risky Surgery") && roll.grade === 2) {
                const a = req.find_add("Risky Surgery");
                a.roll = new TayiWPRoll(dialogParams[a.getHandlerName()]).roll({});
                await a.roll.result.toMessage();
                roll.grade = 3;
            }
            const prof = TayiWPConst.RANK_NAMES[dialogParams.level];
            const messageContent = `proficiency level <b>${prof}</b>, ${roll.toString()}`;
            await TayiWPConst.saySomething(actor, `${dialogParams.MACRO_NAME}: ${messageContent}`);
            if (!dialogParams.setGrade(roll.grade) || dialogParams.formula.length === 0) {
                return;
            }
            const roll2 = new TayiWPRoll(dialogParams.formula).roll({});
            await roll2.result.toMessage();
            await TayiWPConst.forEachTargetedToken(async (owner_actor, target_actor, target_token, dialogParams) => {
                let messageContent = `target <b>${target_token.data.name}</b> receives `;
                if (req.find_add("Risky Surgery")) {
                    const a = req.find_add("Risky Surgery");
                    messageContent += `<b>${a.roll.result.total}</b> slashing damage, then `;
                }
                messageContent += `<b>${roll2.result.total}</b> ${dialogParams.meaning}`;
                await TayiWPConst.saySomething(owner_actor, `${dialogParams.MACRO_NAME}: ${messageContent}`);
            }, dialogParams);
        });
    }
}
