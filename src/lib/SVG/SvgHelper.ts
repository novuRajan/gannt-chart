export class SvgHelper {
  /**
   * @param {string} svgNS
   */
  private readonly _svgNS: string;

  constructor() {
    this._svgNS = 'http://www.w3.org/2000/svg';
  }

  createSVGElement(tag: string, attributes = {}) {
    const element = document.createElementNS(this._svgNS, tag);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value as string);
    }
    return element;
  }
  createGroup(className = '') {
    const group = this.createSVGElement('g');
    if (className) {
      group.setAttribute('class', className);
    }
    return group;
  }

  createRectElement(x: number, y: number, width: number, height: number, fill: string, id: string) : SVGRectElement{
    const rect  = document.createElementNS(this._svgNS, 'rect') as SVGRectElement
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('fill', fill);
    rect.setAttribute('id', id);
    return rect;
  }

  createTextElement(x: number, y: number, text: string, fontSize: number = 0) : SVGTextElement{
    const textElement = document.createElementNS(this._svgNS, 'text') as SVGTextElement;
    textElement.setAttribute('x', String(x));
    textElement.setAttribute('y', String(y));
    if (fontSize) {
      textElement.setAttribute('font-size', `${fontSize}px`);
    }
    textElement.textContent = text;
    return textElement;
  }

  createSvgLine(x1: number, y1: number, x2: number, y2: number , className = '') : SVGLineElement{
    const line = document.createElementNS(this._svgNS, 'line') as SVGLineElement;
    line.setAttribute('x1', `${x1}`);
    line.setAttribute('y1', `${y1}`);
    line.setAttribute('x2', `${x2}`);
    line.setAttribute('y2', `${y2}`);
    if(className) {
      line.classList.add(className);
    }
    return line;
  }

  creatPolygon(x: number, y: number, size: number, arrowDirection: string , className = '') : SVGPolygonElement {
    const polygon = document.createElementNS(this._svgNS, 'polygon') as SVGPolygonElement;
    const points = arrowDirection === 'down'
      ? `${x},${y - size} ${x - size},${y - size} ${x},${y} ${x + size},${y - size}`
      : `${x - size},${y + size} ${x},${y} ${x + size},${y + size}`;
    polygon.setAttribute('points', points);
    if(className) {
      polygon.classList.add(className);
    }
    return polygon;
  }
}
