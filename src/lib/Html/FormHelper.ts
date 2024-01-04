export interface IFormDataObject {
  [key: string]: string|FormDataEntryValue;
}

export function formData(form: HTMLFormElement): IFormDataObject {
  const formData = new FormData(form);
  const data: IFormDataObject = {};

  formData.forEach((value:FormDataEntryValue, key) => {
    data[key] = value;
  });

  return data;
}