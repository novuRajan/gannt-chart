export function createElement(tag: string, className: string, content?: string , id?: string , type?: string): HTMLElement {
	const el = document.createElement(tag);
	if(className)
	{
		el.classList.add(className);
	}

	if (content) {
		el.textContent = content;
	}
	if(id) {
		el.id = id;
	}
	if(type) {
		el.setAttribute('type', type);
	}

	return el;
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
