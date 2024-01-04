interface FormDataObject {
  [key: string]: string|FormDataEntryValue;
}

export function formData(form: HTMLFormElement): FormDataObject {
  const formData = new FormData(form);
  const data: FormDataObject = {};

  formData.forEach((value:FormDataEntryValue, key) => {
    data[key] = value;
  });

  return data;
}