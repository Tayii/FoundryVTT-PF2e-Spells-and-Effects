import TayiWP from "./base.js";
import TayiWPBaseClass from "./baseClass.js";

export default class TayiWPFeat extends TayiWPBaseClass {
    static ITEM_TYPE = "feat";
    static MACRO_ACTION = "Use";
    static DIALOG_LEVEL_NAME = 'rank';

    static create(name, skill, levels, callbackFunc) {
        if (!this.findActorItem(name)) {
            return false;
        }
        if (this.checkRankReqs(skill, levels) < 0) {
            return false;
        }
        return new TayiWPFeat(name, skill, levels, callbackFunc);
    }

    constructor(name, skill, levels, callbackFunc) {
        super(name, levels, callbackFunc);
        this.skill = skill;
        this.dialogLevelMax = this.checkRankReqs();
    }

    static findActorItem(name) {
        let x = TayiWP.findActorItem(name, this.ITEM_TYPE);
        if (!x) {
            x = TayiWP.findActorItem(name, "action");
        }
        if (x) {
            return x;
        }
        return false;
    }

    static checkRankReqs(skill, levels) {
        let rankMax = -1;
        for (let i in levels) {
            if (!levels.hasOwnProperty(i)) {
                continue;
            }
            if (i <= skill.rank) {
                rankMax = i;
            }
        }
        if (rankMax >= 0) {
            return rankMax;
        }
        return false;
    }

    checkRankReqs() {
        return this.getClass().checkRankReqs(this.skill, this.dialogLevels)
    }
}
