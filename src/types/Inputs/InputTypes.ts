import { BaseInput } from "../../Interfaces/Inputs/BaseInput";
import { ISelectOption } from "../../Interfaces/Inputs/SelectOption";


type SelectInput = Omit<BaseInput, "type"> & {
	type: "select";
	options: string[] | ISelectOption[];
};

type TextInput = Omit<BaseInput, "options"> & {
	type: "text";
};
type DateInput = Omit<BaseInput, "options"> & {
	type: "date";
};
type TextAreaInput = Omit<BaseInput, "options"> & {
	type: "textarea";
};
type NumberInput = Omit<BaseInput, "options"> & {
	type: "number";
};

export type InputTypes = SelectInput | TextInput | TextAreaInput | DateInput | NumberInput;
