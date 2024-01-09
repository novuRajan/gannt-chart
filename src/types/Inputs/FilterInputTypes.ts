import { BaseInput } from "../../Interfaces/Inputs/BaseInput";
import { ISelectOption } from "../../Interfaces/Inputs/SelectOption";
import { ITask } from "../../Interfaces/Task/Task";
import { IFormDataObject } from "../../lib/Html/FormHelper";


interface FilterInput extends BaseInput {
	filter?:(task:ITask,filterData:IFormDataObject)=>boolean;
}
type SelectInput = Omit<FilterInput, "type"> & {
	type: "select";
	options: string[] | ISelectOption[];
};

type TextInput = Omit<FilterInput, "options"> & {
	type: "text";
};
type DateInput = Omit<FilterInput, "options"> & {
	type: "date";
};
type TextAreaInput = Omit<FilterInput, "options"> & {
	type: "textarea";
};
type NumberInput = Omit<FilterInput, "options"> & {
	type: "number";
};

export type FilterInputTypes = SelectInput | TextInput | TextAreaInput | DateInput | NumberInput;
