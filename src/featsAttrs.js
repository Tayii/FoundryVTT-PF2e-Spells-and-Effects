import TayiWPFeat from "./featsClass.js";
import TayiWPAttributes from "./baseAttrs.js";

export class TayiWPGradeAttributes {
}

export class TayiWPProfAttributes {
}

export class TayiWPFeatAttributes extends TayiWPAttributes {
    static CALLBACK_TYPE = 'FEAT';
    skillName = '';
    level = 1;
    grades = {};

    setGrade(gradeLevel) {
        return this.grades.hasOwnProperty(gradeLevel);
    }

    getMacroName() {
        return TayiWPFeat.MACRO_ACTION + ' ' + this.getClass().CALLBACK_NAME;
    }

    getFullName() {
        return this.getMacroName() + ' ( ' + this.skillName + ' )'
    }
}
