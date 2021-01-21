import TayiWPDialogLevel from "../src/clDialogLevel.js";
import TayiWPConst from "../src/const.js";

export default class TayiWPSkillGrade extends TayiWPDialogLevel {
    addParam(param) {
        // const grade = TayiWPConst.GRADE_NAMES[this.level];
        const gr = TayiWPConst.GRADE_SH_NAMES[this.level];
        param.name += `-${gr}`;
        if (param.label !== ``)
            param.label += ` (${gr})`;
        this.params.push(param);
        return this;
    }
}
