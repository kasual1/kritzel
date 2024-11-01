import { NgModule } from '@angular/core';
import { DIRECTIVES } from './index';


@NgModule({
  declarations: [
    ...DIRECTIVES
  ],
  exports: [
    ...DIRECTIVES
  ]
})
export class LibModule { }
