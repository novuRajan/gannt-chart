import { ISubTask } from "../../Interfaces/Task/SubTask";
import { ITask } from "../../Interfaces/Task/Task";
import { IErrors } from "../../Interfaces/validtions/Errors";
import { InputTypes } from "../../types/Inputs/InputTypes";

export class Validations {
	private readonly _errors: IErrors[] = [];
	private readonly task: ITask | ISubTask;
	constructor(task: ITask | ISubTask, inputs: InputTypes[]) {
		this.task = task;
		this._init(inputs);
	}

	public required(key: string): void {
		const value = this.task[key];
		if (!value) {
			this._addError(key, `the ${key} field is required`);
		}
	}

	public min(key: string, length: number): void {
		const value = this.task[key] as string;
		if (!value || value.length <= length) {
			this._addError(key, `the ${key} field must be at least ${length}`);
		}
	}

	public date(key: string, compare:string="",operator:string=""): void {
        const value = this.task[key];
        if (!value || !this._isValidDate(<string>value)) {
			this._addError(key, `the ${key} field must be valid date format`);
			return;
		}
		console.log(compare,value,operator)
		const compareDateString=this.task[compare]
		if (compareDateString && operator) {
			const inputDate = new Date(<string>value);
			const compareDate = new Date(<string>compareDateString);
		
		
			switch (operator) {
				case '<':
					if (!(inputDate< compareDate)) {
						this._addError(key,`the ${key} project date is less than`)
					}
					break;
				case '>':
					if (!(inputDate > compareDate)) {
						this._addError(key,`the ${key} project date is greater than`)
					}
					break;
				case '<=':
					if (!(inputDate <= compareDate)) {
						this._addError(key,`the ${key} project date is less than or equal to`)
					}
					break;
				case '>=':
					if (!(inputDate >= compareDate)) {
						this._addError(key,`the ${key} project date is greater than or equal to`)
					}
					break;
				case '===':
					if (!(inputDate === compareDate)) {
						this._addError(key,`the ${key} project date must exact`)
					}				
					break;
					
			}
		}
	
    }

	// public end(key: string, endDate: Date): void {
    //     const value = this.task[key];
    //     if (!value || value.length <= 0) {
    //         this._addError(key, `the ${key} field must have a value`);
    //     }
	// }


	public errors(): IErrors[] {
		return this._errors;
	}

	private _init(inputs: InputTypes[]) {
		Object.entries(inputs).forEach(([, inputType]) => {
			if (inputType.validations) {
				Object.entries(inputType.validations).forEach(([, value]) => {
					const methods: string[] = String(value).split(":");
					const args: string[] = methods[1] ? String(methods[1]).split(",") : [];
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/ban-ts-comment
					// @ts-ignore
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
					if (typeof this[methods[0]] === "function") {
						// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/ban-ts-comment
						// @ts-ignore
						// eslint-disable-next-line @typescript-eslint/no-unsafe-call
						this[methods[0]](inputType.name, ...args);
					}
				});
			}
		});
	}

	private _addError(key: string, message: string) {
		const errorIndex: number = this._errors.findIndex((err: IErrors) => err.field === key);
		if (errorIndex < 0) {
			const error: IErrors = {
				field: key,
				messages: [message],
			};
			this._errors.push(error);
		} else if (errorIndex >= 0) {
			this._errors[errorIndex].messages.push(message);
		}
	}
	private _isValidDate(dateString: string): boolean {
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // Regular expression for YYYY-MM-DD format
	
		if (!dateRegex.test(dateString)) {
			return false; // If the string doesn't match the expected format, return false
		}
	
		const date = new Date(dateString);
		const isValid = !isNaN(date.getTime()); // Check if the parsed date is valid
	
		return isValid;
	}
}
