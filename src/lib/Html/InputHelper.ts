
import { InputTypes } from "../../types/Inputs/InputTypes";
import { createElement } from "./HtmlHelper";
import { isTaskDependent } from "../../saveEdit";
import { ISelectOption } from "../../Interfaces/Inputs/SelectOption";

export class InputHelper {
	private readonly input: InputTypes;
	private inputEl: HTMLElement | undefined;
	constructor(input: InputTypes) {
		this.input = input;
		this.inputEl = undefined;
	}

	public updateSelectOptions(): void {
		const selectEl = document.querySelector(
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			`select[name='${this.input.name}']`
		) as HTMLSelectElement | undefined;
		if (selectEl) {
			selectEl.innerHTML = "";
			this.addOptionsToSelect(selectEl);
		}
	}

	public createInputElement(): HTMLElement {
		let selectElement: HTMLSelectElement;
		switch (this.input.type) {
			case "textarea":
				this.inputEl = document.createElement("textarea");
				if (this.input.value) {
					this.inputEl.innerText = <string>this.input.value;
				}
				break;
			case "select":
				selectElement = document.createElement("select");

				this.inputEl = this.addOptionsToSelect(selectElement);
				break;
			default:
				this.inputEl = document.createElement("input");
				if (this.input.value) {
					this.inputEl.setAttribute("value", <string>this.input.value);
				}
				this.inputEl.setAttribute("type", this.input.type);
				break;
		}
		this.assignAttribute();
		this.assignClass();

		return this.inputEl;
	}


	private addOptionsToSelect(selectEL: HTMLSelectElement): HTMLSelectElement {
		if (this.input.type === "select") {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (!this.input.options.find((option) => option.label === "Please select")) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				this.input.options.unshift({ label: "Please select", value: "" });
			}
			this.input.options.forEach((option) => {
				const optionEL = document.createElement("option");
				if (typeof option === "string") {
					optionEL.setAttribute("value", option);
					optionEL.setAttribute("label", option);

				} else {
					optionEL.setAttribute("value", option.value);
					optionEL.setAttribute("label", option.label);
					if (option.disabled) {
						optionEL.setAttribute("disabled", option.disabled.toString());
					}
					if (!this.input.value)return;
					if (this.input.value) {
						if (typeof this.input.value === "string") {
							if (this.input.value === option.value) {
								optionEL.setAttribute("selected", "selected");
							}
						} else if (Array.isArray(this.input.value) && this.input.value.includes(option.value)) {

							optionEL.setAttribute("selected", "")
							optionEL.selected=true;
						}
					}
				}
				selectEL.appendChild(optionEL);
			});
		}

		return selectEL;
	}


	private assignAttribute(): this {
		const includedAttributes: string[] = ["class", "label", "type", "value"];
		Object.keys(this.input).forEach((key) => {
			if (!includedAttributes.includes(key) && this.inputEl) {
				this.inputEl.setAttribute(key, <string>this.input[key]);
			}
		});

		return this;
	}

	private assignClass(): this {
		if (this.input.class) {
			let classes: unknown;

			if (typeof this.input.class === "string") {
				classes = this.input.class.split(" ");
			} else {
				classes = this.input.class;
			}

			if (Array.isArray(classes)) {
				classes.forEach((className) => {
					if (this.inputEl) {
						this.inputEl.classList.add(<string>className);
					}
				});
			}
		}

		return this;
	}
}

export function createInputElement(input: InputTypes): HTMLElement {
	const inputHelper = new InputHelper(input);
	const wrap = createElement("div", "row");
	if (input.label) {
		wrap.appendChild(createElement("label", "label", <string>input.label));
	}

	wrap.appendChild(inputHelper.createInputElement());

	return wrap;
}
export function inputValue(name: string): string | null {
	const nameInput = document.querySelector(`[name='${name}']`) as HTMLInputElement | undefined;

	return nameInput ? nameInput.value : null;
}
export function multiSelectValue(name: string): string[] | null {
	const nameInput = document.querySelector(`[name='${name}']`) as HTMLSelectElement | undefined;
	if (nameInput) {
		const options = Array.from(nameInput.selectedOptions);

		return options.map((option) => option.value);
	}

	return null;
}

