import TayiWPDialogLevel from "../src/clDialogLevel.js";

export default class TayiWPSkillRank extends TayiWPDialogLevel {
    grades = {};

    createTextInputs() {
        let params = '';
        for (const p of this.params)
            params += p.createTextInput();
        for (let i = 3; i >= 0; i--) {
            if (this.grades.hasOwnProperty(i))
                params += this.grades[i].createTextInputs(i);
        }
        return params;
    }

    findInputParams(html) {
        super.findInputParams(html);
        for (let i = 3; i >= 0; i--) {
            if (this.grades.hasOwnProperty(i))
                this.grades[i].findInputParams(html);
        }
        return this;
    }

    spliceParams() {
        super.spliceParams();
        for (let i = 3; i >= 0; i--) {
            if (this.grades.hasOwnProperty(i))
                this.grades[i].spliceParams();
        }
        return this;
    }

    setGrade(grade) {
        this.spliceParams();
        while (grade >= 0 && !this.grades.hasOwnProperty(grade))
            grade--;
        if (this.grades.hasOwnProperty(grade)) {
            const grade_param = this.grades[grade];
            for (const p of grade_param.params) {
                const spl = p.splice();
                this[spl[0]] = spl[1];
            }
        }
        return this;
    }
}
