import TayiWPConst from "./const.js";

// export class TayiWPGrades {
//     constructor(grades) {
//         this.grades = grades;
//     }
//
//     createParams() {
//         const x = [];
//         for (let i in this.grades) {
//             if (!this.grades.hasOwnProperty(i)) {
//                 continue;
//             }
//             x.push(TayiWP.createParam('formula_' + i, TayiWPRefs.GRADE_SH_NAMES[i] + ': ' + this.grades[i].meaning,
//                 'text', this.grades[i].formula));
//         }
//     }
// }

export default class TayiWPRoll {
    constructor(formula) {
        this.formula = formula;
        this.result = null;
        this.DC = null;
        this.grade = null;
    }

    roll(data) {
        this.result = new Roll(this.formula, data).roll();
        return this;
    }

    vsDC(DC) {
        if (!this.result) {
            return;
        }
        this.DC = DC;
        const rollD20 = this.result.dice[0].total;
        const rollTotal = this.result.total;
        let grade = 1;
        if (rollTotal >= DC) {
            grade = 2;
        }
        if (rollD20 === 20 || rollTotal >= DC + 10) {
            grade += 1;
        }
        if (rollD20 === 1 || rollTotal <= DC - 10) {
            grade -= 1;
        }
        this.grade = grade;
        return this;
    }

    toString() {
        if (this.grade !== null) {
            return 'rolled <b>[[' + this.result.result + ']]</b> vs DC <b>[[' + this.DC
                + ']]</b> which is <b>' + TayiWPConst.GRADE_NAMES[this.grade] + '</b>';
        }
        if (this.result !== null) {
            return '<b>[[' + this.result.result + ']]</b>';
        }
        return this.formula;
    }
}
