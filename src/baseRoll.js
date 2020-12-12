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
        this.grade = null;
    }

    roll() {
        this.result = new Roll(this.formula).roll();
        return this;
    }

    rollDC(data, DC) {
        const roll = new Roll(this.formula, data).roll();
        const rollD20 = roll.dice[0].total;
        const rollTotal = roll.total;
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
        this.result = roll;
        this.grade = grade;
        return this;
    }

    toString() {
        if (this.grade !== null) {
            return 'rolled <b>[[' + this.result.result + ']]</b> which is <b>'
                + TayiWPConst.GRADE_NAMES[this.grade] + '</b>';
        }
        if (this.result !== null) {
            return '<b>[[' + this.result.result + ']]</b>';
        }
        return this.formula;
    }
}
