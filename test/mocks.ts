import { Injectable } from '../src/injectable';
import { Directive } from '../src/directive';
import { Component } from '../src/component';
import { NgModule } from '../src/module';
import { Input, Output } from '../src/input';
export const serviceName = 'TestService';

@Injectable(serviceName)
export class TestService {
  private someProp = 'This is private property';

  static someStaticMethod() {
    return 'This is static method';
  }

  constructor(private $http: any) {}

  someMethod(): string {
    return this.someProp;
  }
}

export function directive(selector: string) {
  @Directive({
    selector,
    scope: true
  })
  class MyDirective {
    @Input() testInput;
    @Output() testOutput;

    constructor(private $log: ng.ILogService,
                private $parse: ng.IParseService) { }
    $onInit() {
      console.log(this.$log, this.$parse);
    }
  }
  return MyDirective;
}

export function component(selector: string) {
  @Component({
    selector
  })
  class MyComponent {
    @Input() testInput;
    @Output() testOutput;

    constructor(private $log: ng.ILogService,
                private $parse: ng.IParseService) { }
    $onInit() {
      console.log(this.$log, this.$parse);
    }
  }
  return MyComponent;
}

export const registerNgModule = (name: string = '',
                                 imports: any[] = [],
                                 declarations: any[] = [],
                                 providers: any[] = []): any => {

  @NgModule({
    id,
    imports,
    declarations,
    providers,
  })
  class TestModule {

    static config($httpProvider: ng.IHttpProvider) {}

    static run($rootScope: ng.IRootScopeService) {}
  }

  return TestModule;
};
