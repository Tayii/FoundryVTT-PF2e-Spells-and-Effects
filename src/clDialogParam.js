import TayiWPConst from "./const.js";

export default class TayiWPDialogParam {
    constructor(pname, plabel, ptype, pvalue = undefined) {
        this.name = pname;
        this.name_orig = pname;
        this.label = plabel;
        this.type = ptype;
        if (pvalue === undefined && this.type === "options")
            pvalue = [];
        this.base_value = pvalue;
        this.cur_value = pvalue;
        this.selected_val = 0;
    }

    addOptionValue(vname, vlabel, selected = false) {
        if (this.type !== "options")
            return;
        if (selected)
            this.selected_val = this.base_value.length;
        this.base_value.push([vname, vlabel]);
        return this;
    }

    createTextInput() {
        if (this.type !== "options")
            return TayiWPConst.createParam(this.name, this.label, this.type, this.base_value);
        return TayiWPConst.createOptionParam(this.name, this.label, this.base_value, this.selected_val);
    }

    findInputParam(html) {
        let value = html.find(`[name="${this.name}"]`)[0].value;
        if (this.type === "number")
            value = (parseInt(value) !== null) ? parseInt(value) : this.base_value;
        else if (this.type === "checkbox")
            value = html.find(`[name="${this.name}"]`)[0].checked;
        this.cur_value = value;
        return value;
    }

    splice() {
        const name = this.name_orig;
        let value = this.cur_value;
        if (this.type === "options" && typeof this.cur_value !== "string")
            value = value[this.selected_val][0];
        return [name, value];
    }
}
