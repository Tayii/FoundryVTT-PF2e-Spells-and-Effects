import TayiWPFlagsClass from "./clFlags.js";

export default class TayiWPDialogLevel extends TayiWPFlagsClass {
    level = 1;
    params = [];

    constructor(level) {
        super();
        this.level = level;
    }

    addParam(param) {
        this.params.push(param);
        return this;
    }

    setParam(pname, pvalue) {
        const param = this.params.find(p => p.name_orig === pname);
        param.base_value = pvalue;
        param.cur_value = pvalue;
        return this;
    }

    createTextInputs() {
        let params = '';
        for (const p of this.params)
            params += p.createTextInput();
        return params;
    }

    findInputParams(html) {
        for (let p of this.params) {
            this[p.name] = p.findInputParam(html);
        }
        return this;
    }

    spliceParams() {
        for (const p of this.params) {
            const spl = p.splice();
            this[spl[0]] = spl[1];
        }
        return this;
    }
}
