import { IHtmlEvents } from "./HtmlEvents";

export interface IElementAttributes {
  class?: string|string[];
  content?: string;
  events?: IHtmlEvents;
  [key: string]:string|string[]|IHtmlEvents;
}