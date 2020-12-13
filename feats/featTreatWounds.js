import TayiWP from "../src/base.js";
import TayiWPFeat from "../src/featsClass.js";
import { TayiWPFeatAttributes, TayiWPGradeAttributes, TayiWPProfAttributes } from "../src/featsAttrs.js";
import TayiWPRoll from "../src/baseRoll.js";
import TayiWPConst from "../src/const.js";

const name = 'Treat Wounds';

class GradeAttributes extends TayiWPGradeAttributes {
    constructor(formula, meaning) {
        super();
        this.formula = formula;
        this.meaning = meaning;
    }
}

class ProfAttributes extends TayiWPProfAttributes {
    constructor(dc, healing_add) {
        super();
        this.dc = dc;
        this.healing_add = healing_add;
    }
}

class FeatAttributes extends TayiWPFeatAttributes {
    static CALLBACK_NAME = name;
    skillName = 'medicine';

    constructor(dc, grades) {
        super();
        this.dc = dc;
        this.grades = grades;
    }

    setGrade(gradeLevel) {
        if (!super.setGrade(gradeLevel)) {
            return false;
        }
        this.formula = this["formula_" + gradeLevel];
        this.meaning = this.grades[gradeLevel].meaning;
        return true;
    }

    createParams() {
        const x = [
            TayiWP.createParam('dc', 'DC', 'number', this.dc),
        ];
        for (let gradeLevel in this.grades) {
            if (!this.grades.hasOwnProperty(gradeLevel)) {
                continue;
            }
            const grade = this.grades[gradeLevel];
            let propName = 'formula';
            let propParam = propName  + '_' + gradeLevel;
            this[propParam] = grade[propName];
            x.push(TayiWP.createParam(propParam, TayiWPConst.GRADE_SH_NAMES[gradeLevel] + ': '
                + grade.meaning, 'text', grade[propName]));
        }
        return x;
    }

    copy() {
        return super.copy(new FeatAttributes(this.dc, this.grades));
    }
}

export default class TayiWPFeatTreatWounds {
    static featName = name;

    static profLevels = {
        1: new ProfAttributes(15, 0),
        2: new ProfAttributes(20, 10),
        3: new ProfAttributes(30, 30),
        4: new ProfAttributes(40, 50),
    };

    static gradeLevels = {
        0: new GradeAttributes("1d8", "damage"),
        1: new GradeAttributes("0", ""),
        2: new GradeAttributes("2d8", "healing"),
        3: new GradeAttributes("4d8", "healing"),
    };

    static constructFeatAttrs() {
        const x = {};
        for (let profLevel in this.profLevels) {
            if (!this.profLevels.hasOwnProperty(profLevel)) {
                continue;
            }
            const prof = this.profLevels[profLevel];
            const grades = {};
            for (let gradeLevel in this.gradeLevels) {
                if (!this.gradeLevels.hasOwnProperty(gradeLevel)) {
                    continue;
                }
                const grade = this.gradeLevels[gradeLevel];
                let formula = grade.formula;
                const meaning = grade.meaning;
                if (meaning === "") {
                    continue;
                }
                if (meaning === 'healing') {
                    formula += "+" + prof.healing_add
                }
                grades[gradeLevel] = new GradeAttributes(formula, meaning);
            }
            x[profLevel] = new FeatAttributes(prof.dc, grades);
        }
        return x;
    }

    static async useFunc(featParams) {
        const actor = TayiWP.ifActor();
        const actionDC = parseInt(featParams.dc);
        const roll = new TayiWPRoll("d20 + @total").roll({total: featParams.skill.totalModifier}).vsDC(actionDC);
        const messageContent = 'proficiency level <b>' + featParams.level + '</b>, DC <b>' + actionDC + '</b>: '
            + roll.toString();
        await TayiWP.saySomething(actor, featParams.fullName + ': ' + messageContent);
        if (!featParams.setGrade(roll.grade)) {
            return;
        }
        const roll2 = new TayiWPRoll(featParams.formula).roll({});
        await TayiWP.forEachTargetedToken(async (owner_actor, target_actor, target_token, featParams) => {
            const messageContent = 'target <b>' + target_token.data.name + '</b> got <b>' + featParams.formula
                + '</b> ' + featParams.meaning;
            await TayiWP.saySomething(owner_actor, featParams.macroName + ': ' + messageContent);
        }, featParams);
        await roll2.result.toMessage();

        // const by = game.i18n.localize("PF2E.UI.applyDamage.by");
        // const messageSender = actor.name;
        // const hitpoints = game.i18n.localize("PF2E.HitPointsHeader").toLowerCase();

        // const iterator = game.user.targets.values();
        // for (let target = iterator.next().value; target; target = iterator.next().value, messageContent = ': ') {
        //     const roll = new TayiWPRoll("d20 + @total").rollDC({total: featParams.skill.totalModifier}, actionDC);
        //     messageContent += ' target <b>' + target.data.name + '</b>, ' + roll.toString();
        //     let rollAfter;
        //     let rollMeaning;
        //     switch (roll.grade) {
        //         case 3:
        //             rollAfter = featParams.healing_crit;
        //             break;
        //         case 2:
        //             rollAfter = featParams.healing_roll;
        //             break;
        //         case 0:
        //             rollAfter = featParams.damage_cfail;
        //             break;
        //         case 1:
        //         default:
        //             rollAfter = featParams.damage_fail;
        //             break;
        //     }
        //     if (rollAfter === '0') {
        //         await TayiWP.saySomething(actor, featParams.fullName + messageContent);
        //         continue;
        //     }
        //     rollAfter = new Roll(rollAfter).roll();
        //     messageContent += '; target got <b>' + rollAfter.formula + '</b> ' + grade.rollMeaning;
        //     if (skillParams['auto-apply'] === 'no' || skillParams['auto-apply'] === 'heal' && grade.rollCoef < 0) {
        //         await saySomething(messageContent);
        //         await rollAfter.toMessage();
        //         continue;
        //     }
        //     messageContent += ' = <b>' + rollAfter.total + '</b>';
        //     await saySomething(messageContent);
          //   const appliedResult = (grade.rollCoef < 0)
          //       ? game.i18n.localize("PF2E.UI.applyDamage.damaged") + rollAfter.total
          //       : game.i18n.localize("PF2E.UI.applyDamage.healed") + rollAfter.total;
          //   const message = `
          // <div class="dice-roll">
          // <div class="dice-result">
          //   <div class="dice-tooltip dmg-tooltip" style="display: none;">
          //     <div class="dice-formula" style="background: 0;">
          //       <span>, ${by} ${messageSender}</span>
          //       <span></span>
          //     </div>
          //   </div>
          //   <div class="dice-total" style="padding: 0 10px; word-break: normal;">
          //     <span style="font-size: 12px; font-style:oblique; font-weight: 400; line-height: 15px;">
          //       ${target.actor.name} ${appliedResult} ${hitpoints}.
          //     </span>
          //   </div>
          // </div>
          // </div>
          // `;
          //   await target.actor.modifyTokenAttribute('attributes.hp', rollAfter.total * grade.rollCoef, true, true).then(() => {
          //       ChatMessage.create({
          //           user: game.user._id,
          //           speaker: { alias: actor.name },
          //           content: message,
          //           type: CONST.CHAT_MESSAGE_TYPES.OTHER
          //       });
          //   });
        // }
    }

    static init(args) {
        const skill = TayiWP.ifActor().data.data.skills.med;
        const featAttrs = this.constructFeatAttrs();
        TayiWPFeat.create(this.featName, skill, featAttrs, this.useFunc).renderDialog();
    }
}
