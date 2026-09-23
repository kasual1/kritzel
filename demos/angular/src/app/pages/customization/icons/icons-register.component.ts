import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { KritzelEditor, KritzelWorkspace } from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { KritzelSvgIconMap } from '@kritzel/editor';

@Component({
  selector: 'app-icons-register',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="icons-register"
      [customSvgIcons]="customSvgIcons"
      [workspaces]="workspaces()"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
    ></kritzel-editor>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .toolbar-note {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f5f5f5;
        border-bottom: 1px solid #ebebeb;
        font:
          13px Roboto,
          sans-serif;
      }
      .toolbar-note strong {
        color: #dd0031;
      }
      .toolbar-note span {
        color: #555;
      }
      kritzel-editor {
        flex: 1;
        min-height: 0;
      }
    `,
  ],
})
export class IconsRegisterComponent {
  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  customSvgIcons: KritzelSvgIconMap = {
    cursor:
      '<svg fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 -960 960 960\"><path d=\"M516-120 402-402 120-516v-56l720-268-268 720zm26-148 162-436-436 162 196 78zm-78-196\"/></svg>',
    pen: '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="m490-527 37 37 217-217-37-37zM200-200h37l233-233-37-37-233 233zm355-205L405-555l167-167-29-29-219 219-56-56 218-219q24-24 56.5-24t56.5 24l29 29 50-50q12-12 28.5-12t28.5 12l93 93q12 12 12 28.5T828-678zM270-120H120v-150l285-285 150 150z"/></svg>',
    arrow:
      '<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"24px\" viewBox=\"0 -960 960 960\" width=\"24px\" fill=\"#1f1f1f\"><path d=\"m216-160-56-56 464-464H360v-80h400v400h-80v-264L216-160Z\"/></svg>',
    arrowUpFromDot:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M440-240v-368L296-464l-56-56 240-240 240 240-56 56-144-144v368z"/></svg>',
    arrowDownFromDot:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M480-240 240-480l56-56 144 144v-368h80v368l144-144 56 56z"/></svg>',
    highlighter:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M544-400 440-504 240-304l104 104zm-47-161 104 104 199-199-104-104zm-84-28 216 216-229 229q-24 24-56 24t-56-24l-2-2-26 26H60l126-126-2-2q-24-24-24-56t24-56zm0 0 227-227q24-24 56-24t56 24l104 104q24 24 24 56t-24 56L629-373z"/></svg>',
    eraser:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M690-240h190v80H610zm-500 80-85-85q-23-23-23.5-57t22.5-58l440-456q23-24 56.5-24t56.5 23l199 199q23 23 23 57t-23 57L520-160zm296-80 314-322-198-198-442 456 64 64zm-6-240"/></svg>',
    type: '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M280-160v-520H80v-120h520v120H400v520zm360 0v-320H520v-120h360v120H760v320z"/></svg>',
    shapes:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M320-242q10 1 19.5 1.5t20.5.5 20.5-.5T400-242v82h400v-400h-82q1-10 1.5-19.5t.5-20.5-.5-20.5T718-640h82q33 0 56.5 23.5T880-560v400q0 33-23.5 56.5T800-80H400q-33 0-56.5-23.5T320-160zM161.5-401.5Q80-483 80-600t81.5-198.5T360-880t198.5 81.5T640-600t-81.5 198.5T360-320t-198.5-81.5m340-57Q560-517 560-600t-58.5-141.5T360-800t-141.5 58.5T160-600t58.5 141.5T360-400t141.5-58.5M360-600"/></svg>',
    shapeRectangle:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M80-160v-640h800v640zm80-80h640v-480H160zm0 0v-480z"/></svg>',
    shapeEllipse:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M480-80q-83 0-156-31.5T197-197t-85.5-127T80-480t31.5-156T197-763t127-85.5T480-880t156 31.5T763-763t85.5 127T880-480t-31.5 156T763-197t-127 85.5T480-80m0-80q134 0 227-93t93-227-93-227-227-93-227 93-93 227 93 227 227 93m0-320"/></svg>',
    shapeTriangle:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="m80-160 400-640 400 640zm144-80h512L480-650zm256-205"/></svg>',
    image:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120zm0-80h560v-560H200zm40-80h480L570-480 450-320l-90-120zm-40 80v-560z"/></svg>',
    imageOff:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="m840-234-80-80v-446H314l-80-80h526q33 0 56.5 23.5T840-760zM792-56l-64-64H200q-33 0-56.5-23.5T120-200v-528l-64-64 56-56 736 736zM240-280l120-160 90 120 33-44-283-283v447h447l-80-80zm184-144"/></svg>',
    chevronDown:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M480-344 240-584l56-56 184 184 184-184 56 56z"/></svg>',
    chevronUp:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M480-528 296-344l-56-56 240-240 240 240-56 56z"/></svg>',
    chevronLeft:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M560-240 320-480l240-240 56 56-184 184 184 184z"/></svg>',
    chevronRight:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M504-480 320-664l56-56 240 240-240 240-56-56z"/></svg>',
    chevronsLeft:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M440-240 200-480l240-240 56 56-183 184 183 184zm264 0L464-480l240-240 56 56-183 184 183 184z"/></svg>',
    copy: '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240zm0-80h360v-480H360zM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80zm160-240v-480z"/></svg>',
    paste:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h167q11-35 43-57.5t70-22.5q40 0 71.5 22.5T594-840h166q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120zm0-80h560v-560h-80v120H280v-120h-80zm308.5-571.5Q520-783 520-800t-11.5-28.5T480-840t-28.5 11.5T440-800t11.5 28.5T480-760t28.5-11.5"/></svg>',
    cut: '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M760-120 480-400l-94 94q8 15 11 32t3 34q0 66-47 113T240-80t-113-47-47-113 47-113 113-47q17 0 34 3t32 11l94-94-94-94q-15 8-32 11t-34 3q-66 0-113-47T80-720t47-113 113-47 113 47 47 113q0 17-3 34t-11 32l494 494v40zM600-520l-80-80 240-240h120v40zM296.5-663.5Q320-687 320-720t-23.5-56.5T240-800t-56.5 23.5T160-720t23.5 56.5T240-640t56.5-23.5M494-466q6-6 6-14t-6-14-14-6-14 6-6 14 6 14 14 6 14-6M296.5-183.5Q320-207 320-240t-23.5-56.5T240-320t-56.5 23.5T160-240t23.5 56.5T240-160t56.5-23.5"/></svg>',
    delete:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120zm400-600H280v520h400zM360-280h80v-360h-80zm160 0h80v-360h-80zM280-720v520z"/></svg>',
    bringToFront:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M360-280q-33 0-56.5-23.5T280-360v-400q0-33 23.5-56.5T360-840h400q33 0 56.5 23.5T840-760v400q0 33-23.5 56.5T760-280zm0-80h400v-400H360zM200-200v80q-33 0-56.5-23.5T120-200zm-80-80v-80h80v80zm0-160v-80h80v80zm0-160v-80h80v80zm160 480v-80h80v80zm160 0v-80h80v80zm160 0v-80h80v80z"/></svg>',
    sendToBack:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-480h80v480h480v80zm160-240v80q-33 0-56.5-23.5T280-360zm-80-80v-80h80v80zm0-160v-80h80v80zm80-160h-80q0-33 23.5-56.5T360-840zm80 480v-80h80v80zm0-480v-80h80v80zm160 0v-80h80v80zm0 480v-80h80v80zm160-480v-80q33 0 56.5 23.5T840-760zm0 400h80q0 33-23.5 56.5T760-280zm0-80v-80h80v80zm0-160v-80h80v80z"/></svg>',
    selectAll:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M280-280v-400h400v400zm80-80h240v-240H360zM200-200v80q-33 0-56.5-23.5T120-200zm-80-80v-80h80v80zm0-160v-80h80v80zm0-160v-80h80v80zm80-160h-80q0-33 23.5-56.5T200-840zm80 640v-80h80v80zm0-640v-80h80v80zm160 640v-80h80v80zm0-640v-80h80v80zm160 640v-80h80v80zm0-640v-80h80v80zm160 640v-80h80q0 33-23.5 56.5T760-120m0-160v-80h80v80zm0-160v-80h80v80zm0-160v-80h80v80zm0-160v-80q33 0 56.5 23.5T840-760z"/></svg>',
    download:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58zM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160z"/></svg>',
    upload:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M440-320v-326L336-542l-56-58 200-200 200 200-56 58-104-104v326zM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160z"/></svg>',
    undo: '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M280-200v-80h284q63 0 109.5-40T720-420t-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420t-69.5 157T564-200z"/></svg>',
    redo: '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M396-200q-97 0-166.5-63T160-420t69.5-157T396-640h252L544-744l56-56 200 200-200 200-56-56 104-104H396q-63 0-109.5 40T240-420t46.5 100T396-280h284v80z"/></svg>',
    plus: '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80z"/></svg>',
    minus:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M200-440v-80h560v80z"/></svg>',
    ellipsisVertical:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M480-160q-33 0-56.5-23.5T400-240t23.5-56.5T480-320t56.5 23.5T560-240t-23.5 56.5T480-160m0-240q-33 0-56.5-23.5T400-480t23.5-56.5T480-560t56.5 23.5T560-480t-23.5 56.5T480-400m0-240q-33 0-56.5-23.5T400-720t23.5-56.5T480-800t56.5 23.5T560-720t-23.5 56.5T480-640"/></svg>',
    x: '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224z"/></svg>',
    check:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M382-240 154-468l57-57 171 171 367-367 57 57z"/></svg>',
    group:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M400-80q-33 0-56.5-23.5T320-160v-160H160q-33 0-56.5-23.5T80-400v-400q0-33 23.5-56.5T160-880h400q33 0 56.5 23.5T640-800v160h160q33 0 56.5 23.5T880-560v400q0 33-23.5 56.5T800-80zm0-80h400v-400H560v-240H160v400h240zm80-320"/></svg>',
    ungroup:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="m348-292-56-56 172-172H320v-80h280v280h-80v-144zm412-188v-280H480v-80h360v360zM200-120q-33 0-56.5-23.5T120-200v-640h80v640h640v80z"/></svg>',
    moveVertical:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M480-120 320-280l56-56 64 63v-414l-64 63-56-56 160-160 160 160-56 57-64-64v414l64-63 56 56z"/></svg>',
    settings:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5-2-31.5-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266zm42-180q58 0 99-41t41-99-41-99-99-41q-59 0-99.5 41T342-480t40.5 99 99.5 41m-2-140"/></svg>',
    share:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85 35-85 85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35 85 35 35 85-35 85-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85-35 85-85 35m0-80q17 0 28.5-11.5T720-200t-11.5-28.5T680-240t-28.5 11.5T640-200t11.5 28.5T680-160M200-440q17 0 28.5-11.5T240-480t-11.5-28.5T200-520t-28.5 11.5T160-480t11.5 28.5T200-440m508.5-291.5Q720-743 720-760t-11.5-28.5T680-800t-28.5 11.5T640-760t11.5 28.5T680-720t28.5-11.5M680-760"/></svg>',
    palette:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M480-80q-82 0-155-31.5t-127.5-86-86-127.5T80-480q0-83 32.5-156t88-127T330-848.5 488-880q80 0 151 27.5t124.5 76 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80M303-457q17-17 17-43t-17-43-43-17-43 17-17 43 17 43 43 17 43-17m120-160q17-17 17-43t-17-43-43-17-43 17-17 43 17 43 43 17 43-17m200 0q17-17 17-43t-17-43-43-17-43 17-17 43 17 43 43 17 43-17m120 160q17-17 17-43t-17-43-43-17-43 17-17 43 17 43 43 17 43-17M480-160q9 0 14.5-5t5.5-13q0-14-15-33t-15-57q0-42 29-67t71-25h70q66 0 113-38.5T800-518q0-121-92.5-201.5T488-800q-136 0-232 93t-96 227q0 133 93.5 226.5T480-160"/></svg>',
    command:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M260-120q-58 0-99-41t-41-99 41-99 99-41h60v-160h-60q-58 0-99-41t-41-99 41-99 99-41 99 41 41 99v60h160v-60q0-58 41-99t99-41 99 41 41 99-41 99-99 41h-60v160h60q58 0 99 41t41 99-41 99-99 41-99-41-41-99v-60H400v60q0 58-41 99t-99 41m0-80q25 0 42.5-17.5T320-260v-60h-60q-25 0-42.5 17.5T200-260t17.5 42.5T260-200m440 0q25 0 42.5-17.5T760-260t-17.5-42.5T700-320h-60v60q0 25 17.5 42.5T700-200M400-400h160v-160H400zM260-640h60v-60q0-25-17.5-42.5T260-760t-42.5 17.5T200-700t17.5 42.5T260-640m380 0h60q25 0 42.5-17.5T760-700t-17.5-42.5T700-760t-42.5 17.5T640-700z"/></svg>',
    info: '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M440-280h80v-240h-80zm68.5-331.5Q520-623 520-640t-11.5-28.5T480-680t-28.5 11.5T440-640t11.5 28.5T480-600t28.5-11.5M480-80q-83 0-156-31.5T197-197t-85.5-127T80-480t31.5-156T197-763t127-85.5T480-880t156 31.5T763-763t85.5 127T880-480t-31.5 156T763-197t-127 85.5T480-80m0-80q134 0 227-93t93-227-93-227-227-93-227 93-93 227 93 227 227 93m0-320"/></svg>',
    ordering:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M480-118 120-398l66-50 294 228 294-228 66 50zm0-202L120-600l360-280 360 280zm0-102 230-178-230-178-230 178z"/></svg>',
    layoutTemplate:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120zm0-80h240v-560H200zm320 0h240v-280H520zm0-360h240v-200H520z"/></svg>',
    align:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M440-80v-200H240v-120h200v-160H120v-120h320v-200h80v200h320v120H520v160h200v120H520v200z"/></svg>',
    alignStartHorizontal:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M280-80v-640h120v640zm280-240v-400h120v400zM80-800v-80h800v80z"/></svg>',
    alignCenterHorizontal:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M280-120v-320H80v-80h200v-320h120v320h160v-200h120v200h200v80H680v200H560v-200H400v320z"/></svg>',
    alignEndHorizontal:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M80-80v-80h800v80zm200-160v-640h120v640zm280 0v-400h120v400z"/></svg>',
    alignStartVertical:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M80-80v-800h80v800zm160-200v-120h400v120zm0-280v-120h640v120z"/></svg>',
    alignCenterVertical:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M440-80v-200H240v-120h200v-160H120v-120h320v-200h80v200h320v120H520v160h200v120H520v200z"/></svg>',
    alignEndVertical:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M800-80v-800h80v800zM320-280v-120h400v120zM80-560v-120h640v120z"/></svg>',
    viewport:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M800-600v-120H680v-80h120q33 0 56.5 23.5T880-720v120zm-720 0v-120q0-33 23.5-56.5T160-800h120v80H160v120zm600 440v-80h120v-120h80v120q0 33-23.5 56.5T800-160zm-520 0q-33 0-56.5-23.5T80-240v-120h80v120h120v80zm80-160v-320h480v320zm80-80h320v-160H320zm0 0v-160z"/></svg>',
    logOut:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200z"/></svg>',
    usersRound:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440t130 15.5T616-378q29 15 46.5 43.5T680-272v112zm720 0v-120q0-44-24.5-84.5T666-434q51 6 96 20.5t84 35.5q36 20 55 44.5t19 53.5v120zM247-527q-47-47-47-113t47-113 113-47 113 47 47 113-47 113-113 47-113-47m466 0q-47 47-113 47-11 0-28-2.5t-28-5.5q27-32 41.5-71t14.5-81-14.5-81-41.5-71q14-5 28-6.5t28-1.5q66 0 113 47t47 113-47 113M120-240h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360t-111 13.5T140-306q-9 5-14.5 14t-5.5 20zm296.5-343.5Q440-607 440-640t-23.5-56.5T360-720t-56.5 23.5T280-640t23.5 56.5T360-560t56.5-23.5M360-640"/></svg>',
    braces:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M560-160v-80h120q17 0 28.5-11.5T720-280v-80q0-38 22-69t58-44v-14q-36-13-58-44t-22-69v-80q0-17-11.5-28.5T680-720H560v-80h120q50 0 85 35t35 85v80q0 17 11.5 28.5T840-560h40v160h-40q-17 0-28.5 11.5T800-360v80q0 50-35 85t-85 35zm-280 0q-50 0-85-35t-35-85v-80q0-17-11.5-28.5T120-400H80v-160h40q17 0 28.5-11.5T160-600v-80q0-50 35-85t85-35h120v80H280q-17 0-28.5 11.5T240-680v80q0 38-22 69t-58 44v14q36 13 58 44t22 69v80q0 17 11.5 28.5T280-240h120v80z"/></svg>',
    heart:
      '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="m480-120-58-52q-101-91-167-157T150-447.5 95.5-544 80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5 705-329 538-172zm0-108q96-86 158-147.5t98-107 50-81 14-70.5q0-60-40-100t-100-40q-47 0-87 26.5T518-680h-76q-15-41-55-67.5T300-774q-60 0-100 40t-40 100q0 35 14 70.5t50 81 98 107T480-228m0-273"/></svg>',
  };

}
