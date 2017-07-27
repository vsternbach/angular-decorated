import * as angular from 'angular';
import { PipeTransform, registerPipe } from './pipe';
import { registerProviders } from './injectable';
import { annotate, Declarations, getMetadata, metadataKeys } from './utils';
import { registerComponent } from './component';
import { registerDirective } from './directive';
import { Provider } from './provider';

export interface ModuleConfig {
  id?: string;
  /**
   * @deprecated
   */
  name?: string;
  declarations?: Function[];
  imports?: Array<string | NgModule>;
  exports?: Function[];
  providers?: Provider[];
}

export interface NgModule {
  module?: ng.IModule;
  config?(...args: any[]): void;
  run?(...args: any[]): void;
  [p: string]: any;
}

export function NgModule({ id, name, declarations = [], imports = [], providers = [] }: ModuleConfig) {
  return (Class: NgModule) => {
    // module registration
    const deps = imports.map(mod => typeof mod === 'string' ? mod : mod.module.name);
    if (name) {
      console.warn('"name" property in @NgModule is deprecated, please use "id" to align to angular 2+ syntax.');
      id = name;
    }
    if (!id) {
      console.warn('You are not providing ngModule id, be careful this code won\'t work when uglified.');
      id = (Class as any).name;
    }
    const module = angular.module(id, deps);

    // components, directives and filters registration
    declarations.forEach((declaration: any) => {
      const declarationType = getMetadata(metadataKeys.declaration, declaration);
      switch (declarationType) {
        case Declarations.component:
          registerComponent(module, declaration);
          break;
        case Declarations.directive:
          registerDirective(module, declaration);
          break;
        case Declarations.pipe:
          registerPipe(module, declaration);
          break;
        default:
          console.error(
            `Can't find type metadata on ${declaration.name} declaration, did you forget to decorate it?
            Decorate your declarations using @Component, @Directive or @Pipe decorator.`
          );
      }
    });

    // services registration
    if (providers) {
      registerProviders(module, providers);
    }
    // config and run blocks registration
    const { config, run } = Class;
    if (config) {
      config.$inject = annotate(config);
      module.config(config);
    }
    if (run) {
      run.$inject = annotate(run);
      module.run(run);
    }
    // expose angular module as static property
    Class.module = module;
  };
}
