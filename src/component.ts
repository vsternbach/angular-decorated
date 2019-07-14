import * as angular from 'angular';
import { ElementRef } from './element_ref';
import {
  camelToKebab,
  Declaration, defineMetadata, getAttributeName, getMetadata, getTypeDeclaration, getTypeName, isAttributeSelector,
  kebabToCamel,
  metadataKeys
} from './utils';
import { IHostListeners } from './hostListener';
import { IViewChildren } from './viewChild';
import { ngLifecycleHooksMap } from './lifecycle_hooks';
import { isFunction, IControllerConstructor, IDirective, IModule, IComponentController,
  IComponentOptions } from 'angular';

export interface ComponentOptionsDecorated extends IComponentOptions {
  selector: string;
  styles?: any[];
  restrict?: string;
  replace?: boolean;
}

export function Component({selector, ...options}: ComponentOptionsDecorated) {
  return (ctrl: IControllerConstructor) => {
    options.controller = ctrl;
    const isAttrSelector = isAttributeSelector(selector);
    const bindings = getMetadata(metadataKeys.bindings, ctrl);
    if (bindings) {
      if (isAttrSelector) {
        options['bindToController'] = bindings;
        options['controllerAs'] = options['controllerAs'] || '$ctrl';
      }
      else options['bindings'] = bindings;
    }

    const require = getMetadata(metadataKeys.require, ctrl);
    if (require) {
      options.require = require;
    }

    if (isAttrSelector) {
      (options as IDirective).restrict = 'A';
    }

    replaceLifecycleHooks(ctrl);

    const selectorName = isAttrSelector ? getAttributeName(selector) : selector;
    defineMetadata(metadataKeys.name, kebabToCamel(selectorName), ctrl);
    defineMetadata(metadataKeys.declaration, isAttrSelector ? Declaration.Directive : Declaration.Component, ctrl);
    defineMetadata(metadataKeys.options, options, ctrl);
  };
}

/** @internal */
export function registerComponent(module: IModule, component: IComponentController) {
  const name = getMetadata(metadataKeys.name, component);
  const options = getMetadata(metadataKeys.options, component);
  const listeners: IHostListeners = getMetadata(metadataKeys.listeners, options.controller);
  const viewChildren: IViewChildren = getMetadata(metadataKeys.viewChildren, component);
  if (listeners || viewChildren) {
    options.controller = extendWithHostListenersAndChildren(options.controller, listeners, viewChildren);
  }
  module.component(name, options);
}

/** @internal */
export function extendWithHostListenersAndChildren(ctrl: {new(...args: any[])},
                                                   listeners: IHostListeners = {},
                                                   viewChildren: IViewChildren = {}) {
  const handlers = Object.keys(listeners);
  const namespace = '.HostListener';
  const properties = Object.keys(viewChildren);

  class NewCtrl extends ctrl {
    constructor(private $element, ...args: any[]) {
      super(...args);
    }
    private _updateViewChildren() {
      properties.forEach(property => {
        const child = viewChildren[property];
        let selector: string;
        if (typeof child.selector !== 'string') {
          const type = getTypeDeclaration(child.selector);
          if (type !== Declaration.Component && type !== Declaration.Directive) {
            console.error(`No valid selector was provided for ViewChild${child.first ? '' :
              'ren'} decorator, it should be type or selector of component/directive`);
            return;
          }
          selector = camelToKebab(getTypeName(child.selector));
        } else selector = `#${child.selector}`;

        const viewChildEls = Array.prototype.slice.call(this.$element[0].querySelectorAll(selector))
          .map((viewChild: Element) => {
            // if ViewChild selector is type use selector derived from type
            // otherwise (i.e. id of the element), get it's element name (localName)
            const componentName = typeof child.selector === 'string' ? viewChild.localName : selector;
            const el = angular.element(viewChild);
            const $ctrl = el && el.controller(kebabToCamel(componentName));
            return child.read ? new ElementRef(el) : ($ctrl || new ElementRef(el));
          })
          .filter(el => !!el);

        if (viewChildEls.length) {
          this[property] = child.first ? viewChildEls[0] : viewChildEls;
        }
        else {
          this[property] = undefined;
        }
      });
    }
    $postLink() {
      this._updateViewChildren();
      if (super.$postLink) {
        super.$postLink();
      }
      handlers.forEach(handler => {
        const { eventName } = listeners[handler];
        this.$element.on(eventName + namespace, this[handler].bind(this));
      });
    }
    $onChanges(changes) {
      this._updateViewChildren();
      if (super.$onChanges) {
        super.$onChanges(changes);
      }
    }
    $onDestroy() {
      if (super.$onDestroy) {
        super.$onDestroy();
      }
      if (handlers.length) {
        this.$element.off(namespace);
      }
    }
  }
  NewCtrl.$inject = ['$element', ...ctrl.$inject || []];
  return NewCtrl;
}

/** @internal */
export function replaceLifecycleHooks(ctrl: IControllerConstructor) {
  const ctrlClass = ctrl.prototype;
  const ngHooksFound = getHooksOnCtrlClass(ctrlClass);

  ngHooksFound.forEach((ngHook: string) => {
    const angularJsHook: string = ngLifecycleHooksMap[ngHook];
    ctrlClass[angularJsHook] = ctrlClass[ngHook];
  });
}

/** @internal */
function getHooksOnCtrlClass(ctrlClass: any): string[] {
  return Object.keys(ngLifecycleHooksMap)
    .filter((hook: string) => isFunction(ctrlClass[hook]));
}
