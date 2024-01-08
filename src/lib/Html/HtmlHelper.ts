import { IElementAttributes } from "../../Interfaces/Html/ElementAttributes";

class HtmlHelper {
	private readonly _element: HTMLElement;
	private _attributes: IElementAttributes;
	constructor(_tag: string, _attributes: IElementAttributes) {
		this._attributes = _attributes;
		this._element = document.createElement(_tag);
		this.assignAttribute();
		this.assignClass();
		this.setContent();
	}

	public getElement(): HTMLElement {
		return this._element;
	}
	private assignAttribute(): this {
		const includedAttributes: string[] = ["class", "content"];
		Object.keys(this._attributes).forEach((key) => {
			if (!includedAttributes.includes(key) && this._element) {
				this._element.setAttribute(key, <string>this._attributes[key]);
			}
		});

		return this;
	}
	private setContent(): this {
		if (this._attributes.content) {
			this._element.innerHTML = this._attributes.content;
		}
		return this;
	}
	private assignClass(): this {
		if (this._attributes.class) {
			let classes: unknown;

			if (typeof this._attributes.class === "string") {
				classes = this._attributes.class.split(" ");
			} else {
				classes = this._attributes.class;
			}

			if (Array.isArray(classes)) {
				classes.forEach((className) => {
					if (this._element) {
						this._element.classList.add(<string>className);
					}
				});
			}
		}

		return this;
	}





}



export function createElement(tag: string, className: string, content?: string, id?: string, type?: string): HTMLElement {
	const el = document.createElement(tag);
	if (className) 
	{
		el.classList.add(className);
	}

	if (content) {
		el.textContent = content;
	}
	if (id) {
		el.id = id;
	}
	if (type) {
		el.setAttribute('type', type);
	}

	return el;
}



export function createElementFromObject(tag: string, attributes: IElementAttributes) {
	return new HtmlHelper(tag, attributes).getElement();
}


export function getElementFullWidth(element: HTMLElement): number {
	const computedStyle = window.getComputedStyle(element);

	return Math.max(
		element.scrollWidth,
		element.offsetWidth,
		element.clientWidth,
		parseFloat(computedStyle.width)
	);
}

export function removeElements(elements: NodeListOf<HTMLElement>): void {
	elements.forEach((element) => {
		element.remove();
	});
}

export function createButton(className?: string, text?: string, id?: string, clickHandler?: () => void): HTMLButtonElement {

	const button = createElement('button', className, text, id, 'button');
	if (clickHandler) {
		button.addEventListener('click', clickHandler);
	}
	return <HTMLButtonElement>button;

}
export function addEventListenerDynamic<K extends keyof HTMLElementEventMap>(
	element: HTMLElement | SVGElement | Document,
	event: K,
	handler: (event: HTMLElementEventMap[K]) => void
): void {
	element.addEventListener(event, handler);
}

export function appendChildToParent<T extends Node>(parent: T, child: Node): void {
	parent.appendChild(child);
}
