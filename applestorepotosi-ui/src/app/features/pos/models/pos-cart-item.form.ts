import { FormControl, FormArray, FormGroup } from "@angular/forms";

export interface PosCartItemForm {
  productId: FormControl<string>;
  name: FormControl<string>;
  sku: FormControl<string>;
  quantity: FormControl<number>;
  unitPrice: FormControl<number>;
  discount: FormControl<number>;
  subtotal: FormControl<number>;
}

export type PosCartFormArray = FormArray<FormGroup<PosCartItemForm>>;