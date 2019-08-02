import { defineMetadata, getMetadata, metadataKeys } from './utils';
import { Provider } from './provider';
import { IModule } from 'angular';

export function Injectable(name?: string) {
  return (Class: any) => {
    if (name) {
      defineMetadata(metadataKeys.name, name, Class);
    }
  };
}

export function Inject(name: string) {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    // if @Inject decorator is on target's method
    if (propertyKey && Array.isArray(target[propertyKey])) {
      target[propertyKey][parameterIndex] = name;
      return; // exit, don't change injection on target's constructor
    }
    // if @Inject decorator is on target's constructor
    if (target.$inject) {
      target.$inject[parameterIndex] = name;
    } else {
      console.error(`Annotations should be provided as static $inject property in order to use @Inject decorator`);
    }
  };
}

/** @internal */
export function registerProviders(module: IModule, providers: Provider[]) {
  providers.forEach((provider: any) => {
    // providers registered using { provide, useClass/useFactory/useValue } syntax
    if (provider.provide) {
      const name = provider.provide;
      if (provider.useClass) {
        module.service(name, provider.useClass);
      }
      else if (provider.useFactory) {
        if (provider.deps) {
          provider.useFactory = replaceDependencies(provider.useFactory, provider.deps);
        }

        module.factory(name, provider.useFactory);
      }
      else if (provider.useValue) {
        module.constant(name, provider.useValue);
      }
    }
    // providers registered as classes
    else {
      const name = getMetadata(metadataKeys.name, provider);
      if (!name) {
        console.error(`${provider.name} was not registered as angular service:
        Provide explicit name in @Injectable when using class syntax or register it using object provider syntax:
        { provide: '${provider.name}', useClass: ${provider.name} }`);
      } else {
        module.service(name, provider);
      }
    }
  });
}


function replaceDependencies(injectableFunction: any, deps: any[]) {
  if (Array.isArray(injectableFunction)) {
    injectableFunction = injectableFunction[injectableFunction.length - 1];
  }

  injectableFunction.$inject = deps;
  return injectableFunction;
}
